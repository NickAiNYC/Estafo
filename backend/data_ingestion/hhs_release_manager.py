"""HHS Medicaid provider spending release manager.

Automates what scripts/import_hhs_aggregates.py did manually:

1. Poll the official dataset page (weekly) for a new release.
2. Register it in HHSReleaseRegistry the moment it is discovered.
3. Import ALL target HCPCS slices (T2024, T2025, S510x, T1020, H0005, S9088)
   against the vetted NYC NPI allowlist.
4. Hand release pairs to analytics.release_diff_intelligence.

The release registry also gives us the point-in-time vault: every
AggregateSpendingRecord carries its release in source_dataset, so any lead can
be replayed against the exact data that generated it (SOL evidence hygiene).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from models import HHSReleaseRegistry, AggregateImportRun
from config import settings

logger = logging.getLogger(__name__)

# HCPCS universe for the NYC elderly-care Medicaid book of business.
DEFAULT_HHPCS_CODES = [
    "T2024",  # Adult day health care, per member per month
    "T2025",  # Adult day health care, hourly
    "S5100",  # Adult day care, per diem
    "S5101",  # Adult day care, half day
    "S5102",  # Adult day care, respite
    "T1020",  # SADC services
    "H0005",  # Adult day care services (NY Medicaid)
    "S9088",  # Home visit add-on (NY append)
]

DEFAULT_NPI_ALLOWLIST = Path(__file__).resolve().parents[1] / "data" / "vetted_nyc_t2024_npis.txt"


def check_for_new_release(session: Session) -> Optional[dict]:
    """Poll the official page; register any release we have not seen before.

    Returns the new release dict, or None when nothing new. Never raises on
    network failure - logs and returns None (the poller runs weekly).
    """
    try:
        from scripts.import_hhs_aggregates import discovered_release
        url, release_id, checksum = discovered_release()
    except Exception as exc:  # network down, page format changed
        logger.warning("HHS release discovery failed: %s", exc)
        return None

    existing = session.query(HHSReleaseRegistry).filter_by(release_id=release_id).first()
    if existing:
        return None

    release = HHSReleaseRegistry(
        release_id=release_id, zip_url=url, expected_sha256=checksum,
        status="DISCOVERED",
        notes="Auto-discovered by weekly poller",
    )
    session.add(release)
    # Mark any older imported release as superseded
    for older in session.query(HHSReleaseRegistry).filter(
            HHSReleaseRegistry.release_id != release_id,
            HHSReleaseRegistry.status == "IMPORTED").all():
        older.status = "SUPERSEDED"
    session.commit()
    logger.info("New HHS release discovered: %s", release_id)
    return {"release_id": release_id, "zip_url": url, "expected_sha256": checksum}


def import_release(
    session: Session,
    release_id: str,
    hcpcs_codes: Optional[list[str]] = None,
    npi_allowlist: Optional[Path] = None,
) -> dict:
    """Import every target HCPCS slice for a discovered release.

    Returns per-code import results. Delegates the actual slice import to the
    provenance-verified scripts/import_hhs_aggregates.py logic.
    """
    from scripts.import_hhs_aggregates import import_slice

    codes = hcpcs_codes or DEFAULT_HHPCS_CODES
    allowlist = npi_allowlist or DEFAULT_NPI_ALLOWLIST
    registry = session.query(HHSReleaseRegistry).filter_by(release_id=release_id).first()
    if not registry:
        raise ValueError(f"Release {release_id} is not in the registry - discover it first")

    cache_dir = Path(__file__).resolve().parents[1] / "data"
    cache_dir.mkdir(parents=True, exist_ok=True)
    cached_zip = cache_dir / f"hhs_spending_{release_id}.csv.zip"

    results, total_rows = {}, 0
    for code in codes:
        try:
            result = import_slice(
                cached_zip, registry.zip_url or "", release_id, allowlist, code,
                expected_sha256=registry.expected_sha256,
            )
            results[code] = result
            total_rows += result.get("imported_rows", 0)
        except ValueError as exc:
            # 'No matching rows' is expected for codes the cohort never bills
            results[code] = {"status": "no_rows", "detail": str(exc)}
        except Exception as exc:
            results[code] = {"status": "failed", "detail": str(exc)}

    registry.status = "IMPORTED"
    registry.imported_rows = total_rows
    registry.hcpcs_imported = [c for c, r in results.items() if r.get("status") in ("imported", "unchanged")]
    registry.imported_at = __import__("datetime").datetime.utcnow()
    session.commit()

    return {"release_id": release_id, "total_rows": total_rows, "codes": results}


def release_status(session: Session) -> list[dict]:
    """Registry listing for the data-audit endpoint."""
    return [
        {
            "release_id": r.release_id, "status": r.status,
            "zip_url": r.zip_url, "imported_rows": r.imported_rows,
            "hcpcs_imported": r.hcpcs_imported,
            "discovered_at": r.discovered_at.isoformat() if r.discovered_at else None,
            "imported_at": r.imported_at.isoformat() if r.imported_at else None,
        }
        for r in session.query(HHSReleaseRegistry).order_by(HHSReleaseRegistry.release_id.desc()).all()
    ]


def latest_two_releases(session: Session) -> Optional[tuple[str, str]]:
    """The two most recent IMPORTED releases - input to release-diff analysis."""
    imported = [r.release_id for r in session.query(HHSReleaseRegistry)
                .filter_by(status="IMPORTED")
                .order_by(HHSReleaseRegistry.release_id.desc()).limit(2).all()]
    if len(imported) < 2:
        return None
    return imported[1], imported[0]  # (older, newer)
