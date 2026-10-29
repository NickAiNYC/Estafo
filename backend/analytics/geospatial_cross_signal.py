"""311-idling x SADC geospatial cross-signal - the uniquely NYC corroboration layer.

Theory of the signal
--------------------
Social Adult Day Care (SADC) fraud in NYC runs on ambulette volume: recruited
"members" are picked up daily, often by ambulettes that stage near the site.
While staged, drivers idle - sometimes for hours - and neighbors call 311
(Idling complaints, complaint_type='Idling'). A SADC site billing implausible
daily census AND sitting inside a morning idling-complaint cluster has an
independent, non-Medicaid, civilian-generated corroboration signal. That is
exactly the kind of cross-domain evidence that survives a decline decision
and impresses an AG investigator.

Method
------
1. Pull 311 'Idling' complaints with coordinates (Socrata SODA, erm2-nwe9).
2. Filter to the morning drop-off window (default 05:00-11:00).
3. For each geocoded SADC site: count complaints within R meters (haversine).
4. Compare against a Poisson baseline built from the borough-wide morning
   idling-complaint density (per km^2) x the site's catchment disc area.
5. Score = 1 - P(X >= observed). Sites with p < 0.05 and >= 3 in-window
   complaints receive a corroboration score.

Honesty rules
-------------
* Complaints cite vehicles near an address - they do NOT identify ambulettes
  or providers. The signal corroborates ambulatory traffic, not fraud.
* Score labels reflect that: CORROBORATING / NEUTRAL / NO_SIGNAL.
* Zip-quality geocodes are excluded from radius matching (150m at ZIP
  precision is meaningless).
"""

from __future__ import annotations

import logging
import math
from datetime import datetime
from typing import Iterable, Optional
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json as _json

from sqlalchemy.orm import Session

from models import ProviderLocation, AggregateSpendingRecord
from config import settings

logger = logging.getLogger(__name__)

USER_AGENT = "Estafo-CrossSignal/1.0"

# NYC borough land areas in km^2 (for the Poisson baseline)
BOROUGH_AREA_KM2 = {
    "Manhattan": 59.1, "Bronx": 109.0, "Brooklyn": 179.7,
    "Queens": 281.5, "Staten Island": 151.2,
}


# ---------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in meters."""
    radius = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def poisson_tail_pmf(lam: float, observed: int) -> float:
    """P(X >= observed) for X ~ Poisson(lam), computed in a numerically stable way."""
    if observed <= 0:
        return 1.0
    if lam <= 0:
        return 0.0
    # Survival = 1 - CDF(observed-1); log-space PMF accumulation
    log_k_factorial = 0.0
    cdf = 0.0
    for k in range(observed):
        if k > 0:
            log_k_factorial += math.log(k)
        cdf += math.exp(-lam + k * math.log(lam) - log_k_factorial)
    return max(0.0, min(1.0, 1.0 - cdf))


# ---------------------------------------------------------------------------
# 311 fetch
# ---------------------------------------------------------------------------

def fetch_311_idling(
    limit: int = 5000,
    days_back: int = 365,
    endpoint: Optional[str] = None,
) -> list[dict]:
    """Pull idling complaints with coordinates from NYC Open Data (SODA).

    Returns [{'lat': float, 'lon': float, 'created': datetime, 'descriptor': str,
              'borough': str, 'unique_key': str}]
    """
    endpoint = endpoint or settings.NYC_311_SODA_ENDPOINT
    where = (
        f"complaint_type='Idling' and latitude is not null "
        f"and created_date > '${{date}}'".replace("${date}", (datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")))
    )
    params = urlencode({
        "$select": "unique_key,created_date,descriptor,borough,latitude,longitude",
        "$where": where,
        "$order": "created_date DESC",
        "$limit": str(limit),
    })
    url = f"{endpoint}?{params}"
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=30) as response:
        raw = _json.loads(response.read().decode("utf-8"))

    complaints = []
    for row in raw:
        try:
            complaints.append({
                "unique_key": str(row.get("unique_key", "")),
                "lat": float(row["latitude"]),
                "lon": float(row["longitude"]),
                "created": datetime.fromisoformat(
                    (row.get("created_date") or "").replace("T", " ").split(".")[0]),
                "descriptor": row.get("descriptor") or "",
                "borough": (row.get("borough") or "").title(),
            })
        except (KeyError, ValueError):
            continue
    return complaints


def in_morning_window(complaint: dict, start_hour: Optional[int] = None,
                      end_hour: Optional[int] = None) -> bool:
    start = start_hour if start_hour is not None else settings.CROSS_SIGNAL_MORNING_START_HOUR
    end = end_hour if end_hour is not None else settings.CROSS_SIGNAL_MORNING_END_HOUR
    return start <= complaint["created"].hour < end


# ---------------------------------------------------------------------------
# Cross-signal scoring
# ---------------------------------------------------------------------------

def cross_signal_score(
    site: dict,
    complaints: Iterable[dict],
    radius_m: Optional[float] = None,
    baseline_density: Optional[dict[str, float]] = None,
) -> dict:
    """Score one site against the complaint cloud.

    site: {'npi', 'name', 'lat', 'lon', 'borough'}
    baseline_density: borough -> complaints per km^2 per year in the morning
        window. Computed from the same complaint cloud when not provided.
    """
    radius = radius_m or settings.CROSS_SIGNAL_RADIUS_M
    if site.get("lat") is None or site.get("lon") is None:
        return {"npi": site.get("npi"), "label": "NO_SIGNAL",
                "reason": "site_not_geocoded_to_rooftop",
                "corroboration_score": 0.0}

    near = [c for c in complaints
            if haversine_m(site["lat"], site["lon"], c["lat"], c["lon"]) <= radius]
    morning_near = [c for c in near if in_morning_window(c)]

    if baseline_density is None:
        baseline_density = borough_baseline_density(complaints)

    borough = site.get("borough") or "Queens"
    density = baseline_density.get(borough, 0.0)  # complaints per km^2/yr in-window
    disc_area_km2 = math.pi * (radius / 1000.0) ** 2
    expected = density * disc_area_km2

    observed = len(morning_near)
    p_value = poisson_tail_pmf(expected, observed) if observed else 1.0

    if observed >= settings.CROSS_SIGNAL_MIN_COMPLAINTS and p_value < settings.CROSS_SIGNAL_P_VALUE:
        label = "CORROBORATING"
    elif observed >= settings.CROSS_SIGNAL_MIN_COMPLAINTS:
        label = "NEUTRAL"
    else:
        label = "NO_SIGNAL"

    hour_histogram = [0] * 24
    for complaint in near:
        hour_histogram[complaint["created"].hour] += 1

    return {
        "npi": site.get("npi"),
        "provider_name": site.get("name"),
        "borough": borough,
        "complaints_within_radius": len(near),
        "morning_window_complaints": observed,
        "expected_morning_complaints": round(expected, 2),
        "poisson_p_value": round(p_value, 5),
        "corroboration_score": round(1.0 - p_value, 4) if observed else 0.0,
        "label": label,
        "hour_histogram": hour_histogram,
        "radius_m": radius,
        "evidence_note": (
            "311 idling complaints corroborate commercial-vehicle staging near the site "
            "during morning hours. They do not identify vehicles or providers. Use as "
            "corroboration for ambulette-traffic theories (SADC census plausibility), "
            "never as standalone evidence."
        ) if label == "CORROBORATING" else (
            "No statistically unusual morning idling pattern detected near this site."
        ),
    }


def borough_baseline_density(complaints: list[dict]) -> dict[str, float]:
    """Morning-window idling complaint density per km^2 per year, by borough."""
    totals: dict[str, list] = {}
    for complaint in complaints:
        if not in_morning_window(complaint):
            continue
        bucket = totals.setdefault(complaint.get("borough", "Unknown"), [0, set()])
        bucket[0] += 1
        bucket[1].add(complaint["created"].date())
    density = {}
    for borough, (count, days) in totals.items():
        area = BOROUGH_AREA_KM2.get(borough)
        if not area or not days:
            continue
        years = max(len(days) / 365.0, 1 / 365.0)
        density[borough] = (count / years) / area
    return density


def sadc_sites(session: Session, require_rooftop: bool = True) -> list[dict]:
    """SADC/ADHC sites with usable geocodes, joined to T2024/S510x billing."""
    query = (
        session.query(ProviderLocation, AggregateSpendingRecord.hcpcs_code)
        .join(AggregateSpendingRecord,
              AggregateSpendingRecord.billing_npi == ProviderLocation.npi)
        .filter(ProviderLocation.latitude.isnot(None))
    )
    if require_rooftop:
        query = query.filter(ProviderLocation.geocode_quality == "ROOFTOP")
    sites, seen = [], set()
    for location, hcpcs in query.distinct().all():
        if location.npi in seen:
            continue
        seen.add(location.npi)
        sites.append({
            "npi": location.npi, "name": location.city, "lat": location.latitude,
            "lon": location.longitude, "borough": location.borough,
        })
    return sites


def score_all_sites(session: Session, complaints: Optional[list[dict]] = None) -> list[dict]:
    """Bulk scoring pass for the map view and lead enrichment."""
    complaints = complaints if complaints is not None else fetch_311_idling()
    sites = sadc_sites(session)
    baseline = borough_baseline_density(complaints)
    scored = [cross_signal_score(site, complaints, baseline_density=baseline) for site in sites]
    return sorted(scored, key=lambda s: -s.get("corroboration_score", 0.0))


def score_lead(session: Session, npi: str, complaints: Optional[list[dict]] = None) -> dict:
    """Single-lead enrichment for the dossier route."""
    location = session.query(ProviderLocation).filter_by(npi=npi).first()
    if not location:
        return {"npi": npi, "label": "NO_SIGNAL", "reason": "no_location_on_file",
                "corroboration_score": 0.0}
    complaints = complaints if complaints is not None else fetch_311_idling()
    return cross_signal_score(
        {"npi": npi, "name": location.city, "lat": location.latitude,
         "lon": location.longitude, "borough": location.borough},
        complaints,
    )


# ---------------------------------------------------------------------------
# Geocoding support
# ---------------------------------------------------------------------------

# Approximate centroids for SADC-heavy NYC ZIP codes (public knowledge,
# deliberately labeled ZIP-quality: fine for borough baselines and maps,
# EXCLUDED from 150m radius matching, which requires rooftop precision).
NYC_ZIP_CENTROIDS = {
    "11355": (40.7596, -73.8303),  # Flushing
    "11354": (40.7652, -73.8317),  # Flushing (north)
    "11358": (40.7637, -73.7935),  # Flushing (Murray Hill)
    "11374": (40.7218, -73.8602),  # Rego Park
    "11373": (40.7295, -73.8728),  # Elmhurst
    "11372": (40.7514, -73.8876),  # Jackson Heights
    "11368": (40.7446, -73.8501),  # Corona
    "11367": (40.7380, -73.8249),  # Pomonok/Flushing
    "11220": (40.6460, -74.0040),  # Sunset Park
    "11219": (40.6340, -73.9950),  # Borough Park
    "11223": (40.5980, -73.9700),  # Gravesend
    "11230": (40.6220, -73.9650),  # Midwood
    "11204": (40.6180, -73.9720),  # Bensonhurst
    "11210": (40.6300, -73.9450),  # Flatbush
    "11212": (40.6600, -73.9100),  # Brownsville
    "10457": (40.8490, -73.8930),  # Bronx (Tremont)
    "10458": (40.8560, -73.8870),  # Bronx (Fordham)
    "10467": (40.8710, -73.8670),  # Bronx (Norwood)
    "10453": (40.8430, -73.9000),  # Bronx (Morris Heights)
    "10029": (40.7930, -73.9430),  # East Harlem
    "10002": (40.7150, -73.9840),  # Lower East Side
    "10031": (40.8240, -73.9470),  # Hamilton Heights
    "10304": (40.5990, -74.0900),  # Staten Island (Todt Hill)
    "10306": (40.5730, -74.1130),  # Staten Island (New Dorp)
}


def geocode_zip_centroid(zip_code: str) -> Optional[tuple[float, float]]:
    """ZIP-quality centroid for a known NYC ZIP, else None.

    Used only for map display and borough-level baselines. Radius-based
    311 matching requires rooftop coordinates (geocode_quality == 'ROOFTOP'),
    which this never claims to provide.
    """
    return NYC_ZIP_CENTROIDS.get((zip_code or "").strip()[:5])


def backfill_zip_centroids(session: Session) -> dict:
    """Fill missing coordinates with ZIP centroids (labeled ZIP quality)."""
    updated = 0
    pending = session.query(ProviderLocation).filter(
        ProviderLocation.latitude.is_(None)).all()
    for location in pending:
        centroid = geocode_zip_centroid(location.zip_code or "")
        if centroid:
            location.latitude, location.longitude = centroid
            location.geocode_quality = "ZIP"
            location.geocode_source = "ZIP_CENTROID"
            updated += 1
    session.commit()
    return {"zip_quality_geocoded": updated, "still_missing": len(pending) - updated}

