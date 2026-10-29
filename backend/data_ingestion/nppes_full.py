"""NPPES full monthly dissemination file importer.

Replaces the registry-API sample approach with the authoritative full file:

    https://download.nppesdata.com/NPPES_Data_Dissemination_<Month>_<Year>.zip
    (~600 MB zipped, ~8M active+deactivated NPI records)

Design notes
------------
* Chunked CSV streaming - the file never fits in memory.
* Column names shift between vintages; every column is resolved by fuzzy
  header matching (exact NPI key columns first, then prefix search).
* Every NPI is Luhn-validated before it can enter the Provider registry.
* NYC scope is decided ONLY by practice-location ZIP prefix (the same rule
  the vetted cohort builder uses). The HHS spending file has no geography -
  NPPES is the geographic source of truth.
* Deactivation dates are captured: a deactivated NPI that still shows
  Medicaid billing is a lead in itself.

Usage (manual):
    python -m data_ingestion.nppes_full --discover            # find + download latest
    python -m data_ingestion.nppes_full --file nppes.zip      # import a local file
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import re
import sys
import zipfile
from datetime import datetime, date
from pathlib import Path
from typing import Iterable, Iterator, Optional
from urllib.parse import urlparse
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import SessionLocal
from models import Provider, ProviderLocation, NPPESImportRun

USER_AGENT = "Estafo-Research-Import/1.0"

# NYC borough ZIP prefixes (same rule as scripts/build_vetted_nyc_cohort.py)
NYC_ZIP_PREFIXES = ("100", "101", "102", "103", "104", "111", "112", "113", "114", "116")

# Taxonomy codes we track for the Medicaid elderly-care universe.
TARGET_TAXONOMIES = {
    "385h00000n": "Adult Day Care",            # NPPES level-III taxonomy (case-insensitive)
    "385hr2000n": "Adult Day Care (Respite)",
    "251s00000n": "Home / Community Based Care",
    "3416l0300n": "Ambulance (NEMT)",
    "343800000n": "Ambulance Service Supplier",
}

ZIP_TO_BOROUGH = {
    "100": "Manhattan", "101": "Manhattan", "102": "Manhattan",
    "103": "Staten Island", "104": "Bronx",
    "111": "Queens", "112": "Brooklyn", "113": "Queens", "114": "Queens", "116": "Queens",
}


def verify_luhn(npi: str) -> bool:
    """NPI check-digit validation (ANSI/ISO Luhn on 80840 + NPI)."""
    if not re.fullmatch(r"\d{10}", npi):
        return False
    total = 0
    for i, ch in enumerate(reversed("80840" + npi)):
        digit = int(ch)
        if i % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return total % 10 == 0


def borough_for_zip(zip_code: str) -> Optional[str]:
    prefix = (zip_code or "")[:3]
    return ZIP_TO_BOROUGH.get(prefix)


def is_nyc_zip(zip_code: str) -> bool:
    return (zip_code or "")[:3] in NYC_ZIP_PREFIXES


# ---------------------------------------------------------------------------
# Column resolution - headers drift between dissemination vintages
# ---------------------------------------------------------------------------

def resolve_columns(header: list[str]) -> dict[str, Optional[str]]:
    """Map logical fields to actual CSV header names."""

    def find(*candidates: str, prefix: bool = False) -> Optional[str]:
        lowered = [h.lower() for h in header]
        for candidate in candidates:
            for h, hl in zip(header, lowered):
                if hl == candidate:
                    return h
        for candidate in candidates:
            for h, hl in zip(header, lowered):
                if prefix and hl.startswith(candidate):
                    return h
        return None

    mapping = {
        "npi": find("npi"),
        "entity_type": find("entity type code"),
        "org_name": find("provider organization name (legal business name)"),
        "last_name": find("provider last name (legal name)"),
        "first_name": find("provider first name"),
        "practice_address_1": find("provider first line business practice location address"),
        "practice_city": find("provider business practice location address city name"),
        "practice_state": find("provider business practice location address state name"),
        "practice_zip": find("provider business practice location address postal code"),
        "enumeration_date": find("provider enumeration date"),
        "deactivation_date": find("npi deactivation date"),
        "taxonomy_1": find("healthcare provider taxonomy code_1"),
    }
    # taxonomy columns beyond the first
    taxonomy_cols = [h for h in header if h.lower().startswith("healthcare provider taxonomy code")]
    mapping["taxonomy_all"] = taxonomy_cols  # type: ignore[assignment]
    if not mapping["npi"]:
        raise ValueError(f"NPI column not found in header: {header[:12]}...")
    return mapping


def parse_date(value: str) -> Optional[date]:
    value = (value or "").strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# File access
# ---------------------------------------------------------------------------

def discover_latest_nppes_url(page_url: str = "https://download.nppesdata.com/") -> tuple[str, str]:
    """Scrape the dissemination page for the newest monthly ZIP link.

    Returns (url, label) where label is e.g. 'NPPES_Data_Dissemination_October_2026'.
    """
    request = Request(page_url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=60) as response:
        html = response.read().decode("utf-8", errors="replace")
    links = sorted(set(re.findall(r'href="([^"]*NPPES_Data_Dissemination_[A-Za-z]+_\d{4}\.zip)"', html)))
    if not links:
        raise ValueError("No NPPES_Data_Dissemination_*.zip link found on the page - review manually")
    url = links[-1]
    if url.startswith("/"):
        parsed = urlparse(page_url)
        url = f"{parsed.scheme}://{parsed.netloc}{url}"
    return url, url.rsplit("/", 1)[-1].removesuffix(".zip")


def digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download(url: str, destination: Path) -> None:
    if urlparse(url).scheme != "https":
        raise ValueError("Refusing non-HTTPS download")
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=300) as response, destination.open("wb") as output:
        for block in iter(lambda: response.read(1024 * 1024), b""):
            output.write(block)


def iter_nppes_rows(path: Path, chunk_size: int = 50_000) -> Iterator[list[dict]]:
    """Yield the full file as lists of dict rows, streaming from inside the ZIP."""
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            members = [n for n in archive.namelist() if n.lower().endswith(".csv")]
            if not members:
                raise ValueError("No CSV member inside NPPES ZIP")
            with archive.open(members[0]) as raw:
                text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
                yield from _chunked(text, chunk_size)
    else:
        with path.open("r", encoding="utf-8-sig", newline="") as text:
            yield from _chunked(text, chunk_size)


def _chunked(text: io.TextIOBase, size: int) -> Iterator[list[dict]]:
    reader = csv.DictReader(text)
    buffer: list[dict] = []
    for row in reader:
        buffer.append(row)
        if len(buffer) >= size:
            yield buffer
            buffer = []
    if buffer:
        yield buffer


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------

def provider_name(row: dict, cols: dict) -> str:
    org = (row.get(cols["org_name"]) or "").strip() if cols.get("org_name") else ""
    if org:
        return org[:255]
    parts = []
    for key in ("last_name", "first_name"):
        if cols.get(key):
            value = (row.get(cols[key]) or "").strip()
            if value:
                parts.append(value)
    return (", ".join(parts) or "UNKNOWN")[:255]


def has_target_taxonomy(row: dict, cols: dict) -> bool:
    columns = cols.get("taxonomy_all") or ([cols["taxonomy_1"]] if cols.get("taxonomy_1") else [])
    for column in columns:
        code = (row.get(column) or "").strip().lower()
        if code in TARGET_TAXONOMIES:
            return True
    return False


def import_nppes_full(
    path: Path,
    source_url: str | None = None,
    file_label: str | None = None,
    nyc_only: bool = True,
    require_target_taxonomy: bool = True,
) -> dict:
    """Import the full NPPES file: upsert Providers + ProviderLocations.

    Returns a summary dict. Idempotent per file SHA-256 (re-importing the same
    file is a no-op).
    """
    file_sha = digest_file(path)
    file_label = file_label or path.name

    with SessionLocal() as db:
        if db.query(NPPESImportRun).filter_by(source_sha256=file_sha).first():
            return {"status": "unchanged", "source_sha256": file_sha}

    stats = {
        "rows_total": 0, "rows_luhn_valid": 0, "rows_nyc": 0,
        "rows_deactivated": 0, "providers_upserted": 0, "locations_upserted": 0,
    }
    header_cols: Optional[dict] = None

    with SessionLocal() as db:
        for chunk in iter_nppes_rows(path):
            if header_cols is None:
                header_cols = resolve_columns(list(chunk[0].keys()))
            providers, locations = [], []
            for row in chunk:
                stats["rows_total"] += 1
                npi = (row.get(header_cols["npi"]) or "").strip()
                if not npi or not verify_luhn(npi):
                    continue
                stats["rows_luhn_valid"] += 1

                zip_code = (row.get(header_cols["practice_zip"]) or "").strip()
                if nyc_only and not is_nyc_zip(zip_code):
                    continue
                if require_target_taxonomy and not has_target_taxonomy(row, header_cols):
                    continue
                stats["rows_nyc"] += 1

                deactivation = parse_date(row.get(header_cols["deactivation_date"]) or "") if header_cols.get("deactivation_date") else None
                if deactivation:
                    stats["rows_deactivated"] += 1

                providers.append({
                    "npi": npi,
                    "name": provider_name(row, header_cols),
                    "address": (row.get(header_cols["practice_address_1"]) or "").strip()[:500],
                    "city": (row.get(header_cols["practice_city"]) or "").strip()[:100],
                    "state": (row.get(header_cols["practice_state"]) or "").strip()[:2],
                    "zip_code": zip_code[:10],
                    "is_nyc_verified": True,
                    "verification_source": f"NPPES_FULL:{file_label}",
                    "specialty": "Adult Day Care" if has_target_taxonomy(row, header_cols) else None,
                })
                locations.append({
                    "npi": npi,
                    "practice_address": (row.get(header_cols["practice_address_1"]) or "").strip()[:500],
                    "city": (row.get(header_cols["practice_city"]) or "").strip()[:100],
                    "state": (row.get(header_cols["practice_state"]) or "").strip()[:2],
                    "zip_code": zip_code[:10],
                    "borough": borough_for_zip(zip_code),
                    "geocode_source": "NPPES_PRACTICE_ADDRESS",
                    "geocode_quality": "ZIP",
                })

            stats["providers_upserted"] += _upsert_providers(db, providers)
            stats["locations_upserted"] += _upsert_locations(db, locations)
            db.commit()

        db.add(NPPESImportRun(
            file_label=file_label, source_url=source_url, source_sha256=file_sha,
            rows_total=stats["rows_total"], rows_luhn_valid=stats["rows_luhn_valid"],
            rows_nyc=stats["rows_nyc"], rows_deactivated=stats["rows_deactivated"],
            providers_upserted=stats["providers_upserted"],
            locations_upserted=stats["locations_upserted"],
        ))
        db.commit()

    return {"status": "imported", "source_sha256": file_sha, **stats}


def _upsert_providers(db, rows: list[dict]) -> int:
    count = 0
    existing = {p.npi: p for p in db.query(Provider).filter(
        Provider.npi.in_([r["npi"] for r in rows])).all()} if rows else {}
    for row in rows:
        provider = existing.get(row["npi"])
        if provider:
            provider.name = row["name"] or provider.name
            provider.address = row["address"] or provider.address
            provider.city = row["city"] or provider.city
            provider.state = row["state"] or provider.state
            provider.zip_code = row["zip_code"] or provider.zip_code
            provider.is_nyc_verified = True
            provider.verification_source = row["verification_source"]
            if row["specialty"]:
                provider.specialty = row["specialty"]
        else:
            db.add(Provider(**row))
        count += 1
    return count


def _upsert_locations(db, rows: list[dict]) -> int:
    count = 0
    existing = {loc.npi: loc for loc in db.query(ProviderLocation).filter(
        ProviderLocation.npi.in_([r["npi"] for r in rows])).all()} if rows else {}
    for row in rows:
        location = existing.get(row["npi"])
        if location:
            for field in ("practice_address", "city", "state", "zip_code", "borough",
                          "geocode_source", "geocode_quality"):
                setattr(location, field, row[field] or getattr(location, field))
        else:
            db.add(ProviderLocation(**row))
        count += 1
    return count


def geocode_missing_locations(limit: int = 500) -> dict:
    """Fill lat/lon for ProviderLocations that lack coordinates.

    Strategy: ZIP-centroid backfill (labeled ZIP quality - map display and
    borough baselines only). Rooftop coordinates come later from a geocoding
    pass with the NYC Planning GeoSearch API; radius-based 311 matching
    requires rooftop precision and refuses ZIP-quality points.
    """
    from analytics.geospatial_cross_signal import backfill_zip_centroids

    with SessionLocal() as db:
        return backfill_zip_centroids(db)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--discover", action="store_true", help="Discover and download the latest monthly file")
    source.add_argument("--file", type=Path, help="Import a local NPPES ZIP or CSV")
    parser.add_argument("--url", help="Direct HTTPS URL of a dissemination ZIP")
    parser.add_argument("--cache-dir", type=Path, default=Path("backend/data"))
    args = parser.parse_args()

    if args.discover:
        url, label = discover_latest_nppes_url()
        cache = args.cache_dir / f"{label}.zip"
        if not cache.exists():
            print(f"Downloading {url} ...")
            download(url, cache)
        result = import_nppes_full(cache, source_url=url, file_label=label)
    elif args.url:
        cache = args.cache_dir / Path(urlparse(args.url).path).name
        if not cache.exists():
            download(args.url, cache)
        result = import_nppes_full(cache, source_url=args.url)
    else:
        result = import_nppes_full(args.file)
    print(result)


if __name__ == "__main__":
    main()
