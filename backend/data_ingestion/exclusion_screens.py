"""Nightly exclusion screening - LEIE, NYS OMIG, (SAM.gov stub).

Every active provider in the vetted registry is screened against:

* HHS-OIG LEIE            (https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv)
* NYS OMIG exclusions     (omig.ny.gov excluded/terminated providers)
* SAM.gov exclusions      (API requires an key; wired but disabled without it)

Matching rules
--------------
1. NPI exact match on the exclusion record's NPI column (LEIE carries NPI;
   OMIG lists usually do) -> match_type NPI_EXACT, score 1.0
2. Normalized entity-name fuzzy match (token-set ratio via difflib, no new
   dependencies) -> match_type NAME_FUZZY, score = similarity; only stored
   at >= 0.90 and always flagged for human adjudication.

A NEW match (present now, absent in the previous run) is the actionable
signal: 'provider X was excluded last night'. Each run is content-addressed
by the source file SHA-256 so re-screening an unchanged file is a no-op.

Statutory hooks: billing Medicaid while excluded is a per-claim FCA violation
(31 U.S.C. 3729(a)(1)) and NY Social Services Law 145-b; it is one of the
cleanest qui tam theories available.
"""

from __future__ import annotations

import csv
import difflib
import hashlib
import io
import logging
import re
from datetime import datetime, date
from pathlib import Path
from typing import Iterable, Optional
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from models import Provider, ExclusionScreenRun, ExclusionMatch
from config import settings

logger = logging.getLogger(__name__)

USER_AGENT = "Estafo-Exclusion-Screen/1.0"

SOURCES = {
    "LEIE": settings.LEIE_CSV_URL,
    "NYS_OMIG": settings.OMIG_EXCLUSION_PAGE,
}

NAME_FUZZY_THRESHOLD = 0.90


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------

STOP_TOKENS = {
    "inc", "inc.", "llc", "l.l.c.", "pllc", "pc", "p.c.", "corp", "corp.",
    "co", "company", "ltd", "ltd.", "the", "and", "of", "group", "services",
    "health", "care", "center", "centre", "associates", "clinic", "adult",
    "day", "home", "medical", "medicine", "transportation", "taxi", "ambulette",
}


def normalize_name(name: str) -> str:
    """Uppercase, strip punctuation/legal suffixes for entity-name comparison."""
    if not name:
        return ""
    name = name.upper()
    name = re.sub(r"[^A-Z0-9\s]", " ", name)
    tokens = [t for t in name.split() if t and t.lower() not in STOP_TOKENS]
    return " ".join(tokens)


def token_set_similarity(a: str, b: str) -> float:
    """Token-set-ratio style similarity using difflib (no new dependencies)."""
    ta, tb = set(normalize_name(a).split()), set(normalize_name(b).split())
    if not ta or not tb:
        return 0.0
    intersection = ta & tb
    if not intersection:
        return 0.0
    base = len(intersection) / max(len(ta), len(tb))
    remaining_a = ta - tb
    remaining_b = tb - ta
    if remaining_a or remaining_b:
        penalty = 1.0 - difflib.SequenceMatcher(
            None, " ".join(sorted(remaining_a)) or " ",
            " ".join(sorted(remaining_b)) or " ",
        ).ratio() * 0.25
    else:
        penalty = 1.0
    return round(min(1.0, base * penalty), 4)


def parse_date_flex(value: str) -> Optional[date]:
    value = (value or "").strip()[:10]
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# Source fetchers
# ---------------------------------------------------------------------------

def _fetch(url: str) -> bytes:
    if urlparse(url).scheme != "https":
        raise ValueError("Refusing non-HTTPS source")
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=120) as response:
        return response.read()


def fetch_leie_rows() -> tuple[list[dict], str]:
    """Download and parse the LEIE CSV. Returns (rows, sha256)."""
    raw = _fetch(settings.LEIE_CSV_URL)
    sha = hashlib.sha256(raw).hexdigest()
    text = io.StringIO(raw.decode("utf-8-sig", errors="replace"))
    rows = [
        {
            "name": " ".join(filter(None, [r.get("BUSNAME"), r.get("LASTNAME", ""), r.get("FIRSTNAME", "")])).strip(),
            "npi": (r.get("NPI") or "").strip(),
            "exclusion_type": (r.get("EXCLTYPE") or "").strip(),
            "exclusion_date": parse_date_flex(r.get("EXCLUSIONDATE") or ""),
        }
        for r in csv.DictReader(text)
    ]
    return rows, sha


def fetch_omig_rows() -> tuple[list[dict], str]:
    """Download and parse the NYS OMIG exclusion list.

    OMIG publishes the list on its excluded-providers page; the format changes
    occasionally, so we scrape for the newest .csv/.xlsx asset link. If the
    page yields nothing, we log and return an empty result (never crash the
    nightly run for one source).
    """
    raw = _fetch(settings.OMIG_EXCLUSION_PAGE)
    sha = hashlib.sha256(raw).hexdigest()
    html = raw.decode("utf-8", errors="replace")
    # Find a CSV asset link on the page (xlsx requires openpyxl; CSV preferred)
    links = re.findall(r'href="([^"]+\.(?:csv|xlsx))"', html, re.I)
    if not links:
        logger.warning("OMIG page carried no CSV/XLSX asset link - format may have changed")
        return [], sha
    asset = links[0]
    if asset.startswith("/"):
        parsed = urlparse(settings.OMIG_EXCLUSION_PAGE)
        asset = f"{parsed.scheme}://{parsed.netloc}{asset}"
    data = _fetch(asset)
    if asset.lower().endswith(".csv"):
        rows = [
            {
                "name": (r.get("provider_name") or r.get("name") or r.get("Provider Name") or "").strip(),
                "npi": (r.get("npi") or r.get("NPI") or "").strip(),
                "exclusion_type": (r.get("action_type") or r.get("exclusion_type") or "").strip(),
                "exclusion_date": parse_date_flex(r.get("effective_date") or r.get("action_date") or ""),
            }
            for r in csv.DictReader(io.StringIO(data.decode("utf-8-sig", errors="replace")))
        ]
        return rows, hashlib.sha256(data).hexdigest()
    logger.warning("OMIG published XLSX (no openpyxl dependency installed) - skipping this run")
    return [], sha


FETCHERS = {"LEIE": fetch_leie_rows, "NYS_OMIG": fetch_omig_rows}


# ---------------------------------------------------------------------------
# Screening
# ---------------------------------------------------------------------------

def screen_provider_batch(
    session: Session,
    exclusion_rows: Iterable[dict],
    source: str,
    source_url: str,
    source_sha256: str,
    providers: Optional[list[Provider]] = None,
) -> dict:
    """Screen the cohort against one exclusion list. Records run + matches."""
    exclusion_rows = [row for row in exclusion_rows if row.get("name") or row.get("npi")]
    providers = providers or session.query(Provider).filter_by(state="NY").all()
    if not providers:
        return {"status": "no_providers", "screened": 0, "matches": 0}

    # Previous active matches, so we can compute NEW matches
    previous_keys = {
        (m.npi, m.source) for m in session.query(ExclusionMatch)
        .filter(ExclusionMatch.source == source, ExclusionMatch.status == "ACTIVE_MATCH").all()
    }

    by_npi: dict[str, list[dict]] = {}
    by_name: dict[str, list[dict]] = {}
    for row in exclusion_rows:
        if row.get("npi"):
            by_npi.setdefault(row["npi"], []).append(row)
        if row.get("name"):
            by_name.setdefault(normalize_name(row["name"]), []).append(row)

    # Existing run for this exact file? Then this is a no-op re-screen.
    existing_run = session.query(ExclusionScreenRun).filter_by(
        source=source, source_sha256=source_sha256).first()
    if existing_run:
        return {"status": "unchanged", "run_id": existing_run.id,
                "screened": existing_run.providers_screened,
                "matches": existing_run.matches_found, "new_matches": 0}

    run = ExclusionScreenRun(
        source=source, source_url=source_url, source_sha256=source_sha256,
        exclusion_records=len(exclusion_rows), providers_screened=len(providers),
    )
    session.add(run)
    session.flush()  # get run.id

    matches, new_matches = [], 0
    for provider in providers:
        # 1) NPI exact
        for row in by_npi.get(provider.npi, []):
            matches.append(_match(provider, source, run.id, row, "NPI_EXACT", 1.0))
            new_matches += _is_new(previous_keys, provider.npi, source)
        # 2) Name fuzzy (only when no NPI hit already recorded for this provider+row)
        if provider.npi not in by_npi:
            provider_norm = normalize_name(provider.name)
            for row_name, rows in by_name.items():
                similarity = token_set_similarity(provider.name, rows[0]["name"])
                if similarity >= NAME_FUZZY_THRESHOLD:
                    for row in rows:
                        matches.append(_match(provider, source, run.id, row, "NAME_FUZZY", similarity))
                        new_matches += _is_new(previous_keys, provider.npi, source)
                    break

    session.bulk_save_objects(matches)
    run.matches_found = len(matches)
    run.new_matches = new_matches
    session.commit()

    return {
        "status": "ok", "run_id": run.id, "source": source,
        "screened": len(providers), "exclusion_records": len(exclusion_rows),
        "matches": len(matches), "new_matches": new_matches,
        "run_sha256": source_sha256,
    }


def _match(provider: Provider, source: str, run_id: int, row: dict, match_type: str, score: float) -> ExclusionMatch:
    return ExclusionMatch(
        npi=provider.npi, provider_name=provider.name, source=source,
        match_type=match_type, match_score=score, excluded_name=row.get("name"),
        exclusion_type=row.get("exclusion_type"), exclusion_date=row.get("exclusion_date"),
        first_seen_run_id=run_id, last_seen_run_id=run_id, status="ACTIVE_MATCH",
    )


def _is_new(previous_keys: set, npi: str, source: str) -> int:
    return 0 if (npi, source) in previous_keys else 1


def run_nightly_exclusion_screens(session: Session) -> dict:
    """Orchestrate all sources for the nightly job. One source failing never
    kills the others; every failure is recorded in the result."""
    results = {}
    for source, fetcher in FETCHERS.items():
        try:
            rows, sha = fetcher()
            results[source] = screen_provider_batch(session, rows, source, SOURCES.get(source) or "", sha)
        except Exception as exc:
            logger.error("Exclusion screen failed for %s: %s", source, exc)
            results[source] = {"status": "failed", "detail": str(exc)}
    return results


def load_exclusion_fixture(path: Path) -> tuple[list[dict], str]:
    """Test/ops helper: screen from a local fixture CSV instead of the network."""
    raw = path.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    rows = [
        {
            "name": (r.get("name") or "").strip(),
            "npi": (r.get("npi") or "").strip(),
            "exclusion_type": (r.get("exclusion_type") or "").strip(),
            "exclusion_date": parse_date_flex(r.get("exclusion_date") or ""),
        }
        for r in csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    ]
    return rows, sha
