"""Synthetic-data retirement and real-data audit.

The synthetic demonstration cohort (scripts/seed_hhs_aggregates.py) served its
purpose building the interface. In production it is a liability: a synthetic
row leaking into a dossier is a case-killer and an ethics complaint.

This module answers one question continuously: **what share of the active data
is real, source-verified, and release-pinned?**

Synthetic sources are recognized by label:
    UNVERIFIED_LEGACY, SYNTHETIC_*, DEMO_*, and the seed script's labels.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import AggregateSpendingRecord, Provider, NPPESImportRun, HHSReleaseRegistry
from config import settings

SYNTHETIC_PREFIXES = ("SYNTHETIC", "DEMO", "UNVERIFIED_LEGACY")


def is_synthetic_source(source_dataset: str | None) -> bool:
    if not source_dataset:
        return True  # unlabeled data is not real data
    label = source_dataset.upper()
    return any(label.startswith(prefix) for prefix in SYNTHETIC_PREFIXES)


def audit_data_sources(session: Session) -> dict:
    """Counts and dollar volume by source class - powers /api/v1/intel/data-audit."""
    rows = (
        session.query(
            AggregateSpendingRecord.source_dataset,
            func.count(AggregateSpendingRecord.id),
            func.sum(AggregateSpendingRecord.total_paid_amount),
        )
        .group_by(AggregateSpendingRecord.source_dataset)
        .all()
    )

    real_rows = real_paid = synthetic_rows = synthetic_paid = 0
    sources = []
    for source_dataset, count, paid in rows:
        synthetic = is_synthetic_source(source_dataset)
        sources.append({
            "source_dataset": source_dataset,
            "rows": count,
            "total_paid": round(paid or 0.0, 2),
            "class": "SYNTHETIC" if synthetic else "REAL",
        })
        if synthetic:
            synthetic_rows += count
            synthetic_paid += paid or 0.0
        else:
            real_rows += count
            real_paid += paid or 0.0

    total_rows = real_rows + synthetic_rows
    providers = session.query(Provider).count()
    nppes_runs = session.query(NPPESImportRun).order_by(NPPESImportRun.imported_at.desc()).all()
    releases = session.query(HHSReleaseRegistry).order_by(HHSReleaseRegistry.release_id.desc()).all()

    real_pct = round(100.0 * real_rows / total_rows, 2) if total_rows else 0.0
    verdict = "CLEAN" if (synthetic_rows == 0 and total_rows > 0) else (
        "NO_DATA" if total_rows == 0 else (
            "CONTAMINATED" if settings.REAL_DATA_STRICT else "CONTAMINATED_LENIENT"
        )
    )

    return {
        "verdict": verdict,
        "strict_mode": settings.REAL_DATA_STRICT,
        "aggregate_rows": {
            "real": real_rows, "synthetic": synthetic_rows, "total": total_rows,
            "real_pct": real_pct,
        },
        "dollar_volume": {
            "real": round(real_paid, 2), "synthetic": round(synthetic_paid, 2),
        },
        "sources": sorted(sources, key=lambda s: -s["rows"]),
        "provider_registry": {
            "providers": providers,
            "nppes_last_import": {
                "file_label": nppes_runs[0].file_label,
                "imported_at": nppes_runs[0].imported_at.isoformat() if nppes_runs[0].imported_at else None,
                "rows_nyc": nppes_runs[0].rows_nyc,
                "source_sha256": nppes_runs[0].source_sha256,
            } if nppes_runs else None,
        },
        "hhs_releases": [
            {"release_id": r.release_id, "status": r.status, "imported_rows": r.imported_rows}
            for r in releases[:5]
        ],
        "policy": (
            "Synthetic demonstration data is quarantined in production. "
            "Only release-pinned HHS imports and NPPES-verified providers feed live leads."
        ),
    }


def retire_synthetic_data(session: Session, dry_run: bool = True) -> dict:
    """Delete every synthetic aggregate row (and optionally their demo providers).

    Always run with dry_run=True first: the report shows exactly what would be
    removed. Providers created by the seed script are recognized by
    verification_source IS NULL while carrying no NPPES verification.
    """
    synthetic_sources = [
        source for (source,) in session.query(AggregateSpendingRecord.source_dataset)
        .distinct().all() if is_synthetic_source(source)
    ]
    row_count = 0
    detail = []
    for source in synthetic_sources:
        count = session.query(AggregateSpendingRecord).filter(
            AggregateSpendingRecord.source_dataset == source).count()
        row_count += count
        detail.append({"source_dataset": source, "rows": count})

    unverified_providers = session.query(Provider).filter(
        Provider.is_nyc_verified.is_(False), Provider.verification_source.is_(None)).count()

    if not dry_run and row_count:
        for source in synthetic_sources:
            session.query(AggregateSpendingRecord).filter(
                AggregateSpendingRecord.source_dataset == source).delete()
        session.commit()

    return {
        "mode": "dry_run" if dry_run else "executed",
        "synthetic_sources": detail,
        "synthetic_rows": row_count,
        "unverified_providers": unverified_providers,
        "message": (
            f"{row_count} synthetic aggregate rows {'would be' if dry_run else 'were'} removed. "
            f"{unverified_providers} seed-demo providers remain unverified and excluded from strict lead serving."
        ),
    }
