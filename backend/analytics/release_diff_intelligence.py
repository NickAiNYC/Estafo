"""Release-diff intelligence - what changed BETWEEN HHS releases.

The quarterly HHS Medicaid provider spending releases do not just add months;
they RESTATE the past. Diffing release N against release N-1 surfaces three
classes of finding no static detector can see:

  NEW_BILLER           - an NPI absent (or $0) in release A that bills hard in
                         release B. Combined with a recent NPPES enumeration
                         date and shared principals, this is the
                         clone-facility playbook detector (the Fresh Meadows
                         pattern: enumerated 2025-12-01, same CEO as the Rego
                         Park target, $0 today, opens billing next release).

  VELOCITY_REGIME      - an established biller whose month-over-month growth
                         regime shifts abruptly (e.g. steady 3%/mo for two
                         years, then 40%/mo for three consecutive months).
                         Changepoint-flavored, computed on the month series.

  RETROACTIVE_RESTATEMENT - the SAME month row changed between releases
                         (downward restatements often track OMIG audit
                         recoupments or MCO takebacks - a live-enforcement
                         breadcrumb, and it also marks the government-
                         knowledge clock for SOL purposes).

Every finding is severity-graded and stored; the watchlist endpoint powers
the weekly ops review.
"""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import AggregateSpendingRecord, ReleaseDiffFinding, Provider

logger = logging.getLogger(__name__)

# Thresholds (documented, tunable)
NEW_BILLER_MIN_PAID_B = 50_000.0      # release B total that makes a new biller interesting
VELOCITY_MIN_MONTHLY_PAID = 10_000.0  # ignore small billers for regime detection
VELOCITY_RATIO = 4.0                  # post/pre growth-rate ratio
RESTATEMENT_MIN_DELTA = 5_000.0       # dollar change on same month to count


def _release_prefix(release_id: str) -> str:
    """AggregateSpendingRecord.source_dataset embeds the release: HHS_HCPCS_<release>_<sha8>."""
    return f"HHS_HCPCS_{release_id}_"


def release_totals(session: Session, release_id: str) -> dict[tuple[str, str], float]:
    """(npi, hcpcs) -> total paid within one release's import."""
    prefix = _release_prefix(release_id)
    rows = (
        session.query(
            AggregateSpendingRecord.billing_npi,
            AggregateSpendingRecord.hcpcs_code,
            func.sum(AggregateSpendingRecord.total_paid_amount),
        )
        .filter(AggregateSpendingRecord.source_dataset.like(f"{prefix}%"))
        .group_by(AggregateSpendingRecord.billing_npi, AggregateSpendingRecord.hcpcs_code)
        .all()
    )
    return {(npi, hcpcs): total or 0.0 for npi, hcpcs, total in rows}


def release_monthly(session: Session, release_id: str) -> dict[tuple[str, str, str], float]:
    """(npi, hcpcs, month) -> paid, within one release."""
    prefix = _release_prefix(release_id)
    rows = (
        session.query(
            AggregateSpendingRecord.billing_npi,
            AggregateSpendingRecord.hcpcs_code,
            AggregateSpendingRecord.year_month,
            func.sum(AggregateSpendingRecord.total_paid_amount),
        )
        .filter(AggregateSpendingRecord.source_dataset.like(f"{prefix}%"))
        .group_by(AggregateSpendingRecord.billing_npi, AggregateSpendingRecord.hcpcs_code,
                  AggregateSpendingRecord.year_month)
        .all()
    )
    return {(npi, hcpcs, month): total or 0.0 for npi, hcpcs, month, total in rows}


def detect_new_billers(session: Session, release_a: str, release_b: str) -> list[dict]:
    totals_a, totals_b = release_totals(session, release_a), release_totals(session, release_b)
    findings = []
    for (npi, hcpcs), total_b in totals_b.items():
        if (npi, hcpcs) not in totals_a and total_b >= NEW_BILLER_MIN_PAID_B:
            provider = session.query(Provider).filter_by(npi=npi).first()
            findings.append({
                "finding_type": "NEW_BILLER", "npi": npi, "hcpcs_code": hcpcs,
                "severity": "HIGH",
                "details": {
                    "release_a_total": 0.0, "release_b_total": round(total_b, 2),
                    "provider_name": provider.name if provider else None,
                    "follow_up": (
                        "Pull NPPES enumeration date and principals. If enumerated within "
                        "18 months and shares officers/addresses with an existing target, "
                        "open a linked-entity dossier (clone-facility pattern)."
                    ),
                },
            })
    return findings


def detect_velocity_regimes(session: Session, release_a: str, release_b: str) -> list[dict]:
    """Growth-regime shifts for established billers, on release B's month series."""
    monthly_b = release_monthly(session, release_b)
    series: dict[tuple[str, str], dict[str, float]] = {}
    for (npi, hcpcs, month), paid in monthly_b.items():
        series.setdefault((npi, hcpcs), {})[month] = paid

    findings = []
    for (npi, hcpcs), months in series.items():
        ordered = sorted(months.items())
        if len(ordered) < 12:
            continue
        values = [paid for _, paid in ordered]
        if any(v < VELOCITY_MIN_MONTHLY_PAID for v in values):
            continue
        growth = [values[i] / values[i - 1] - 1.0 for i in range(1, len(values))
                  if values[i - 1] > 0]
        if len(growth) < 6:
            continue
        early, late = growth[:len(growth) // 2], growth[len(growth) // 2:]
        early_rate = sum(early) / len(early)
        late_rate = sum(late) / len(late)
        if late_rate - early_rate >= VELOCITY_RATIO * max(0.02, abs(early_rate) + 0.02):
            findings.append({
                "finding_type": "VELOCITY_REGIME", "npi": npi, "hcpcs_code": hcpcs,
                "severity": "WATCH",
                "details": {
                    "early_growth_rate_pct": round(early_rate * 100, 1),
                    "late_growth_rate_pct": round(late_rate * 100, 1),
                    "months": [m for m, _ in ordered],
                    "note": "Growth regime shift sustained across months - check capacity, "
                            "enrollment, and site count before treating as fraud signal.",
                },
            })
    return findings


def detect_restatements(session: Session, release_a: str, release_b: str) -> list[dict]:
    """Same (npi, hcpcs, month) cell with different totals across releases."""
    monthly_a, monthly_b = release_monthly(session, release_a), release_monthly(session, release_b)
    findings = []
    for key, paid_b in monthly_b.items():
        paid_a = monthly_a.get(key)
        if paid_a is None:
            continue
        delta = paid_b - paid_a
        if abs(delta) >= RESTATEMENT_MIN_DELTA:
            npi, hcpcs, month = key
            findings.append({
                "finding_type": "RETROACTIVE_RESTATEMENT", "npi": npi, "hcpcs_code": hcpcs,
                "severity": "WATCH" if delta < 0 else "INFO",
                "details": {
                    "month": month,
                    "release_a_paid": round(paid_a, 2),
                    "release_b_paid": round(paid_b, 2),
                    "delta": round(delta, 2),
                    "note": (
                        "Downward restatement may reflect OMIG audit recoupment or MCO takeback "
                        "- cross-check OMIG final-audit index; it may also start the "
                        "government-knowledge clock (31 U.S.C. 3731(b)(2)) for SOL purposes."
                    ) if delta < 0 else "Upward restatement (late claim inclusion).",
                },
            })
    return findings


def diff_releases(session: Session, release_a: str, release_b: str, persist: bool = True) -> dict:
    """Full diff pass: new billers + velocity regimes + restatements."""
    all_findings = []
    all_findings.extend(detect_new_billers(session, release_a, release_b))
    all_findings.extend(detect_velocity_regimes(session, release_a, release_b))
    all_findings.extend(detect_restatements(session, release_a, release_b))

    persisted = 0
    if persist:
        for finding in all_findings:
            exists = session.query(ReleaseDiffFinding).filter_by(
                release_a=release_a, release_b=release_b,
                npi=finding["npi"], hcpcs_code=finding["hcpcs_code"],
                finding_type=finding["finding_type"]).first()
            if exists:
                continue
            session.add(ReleaseDiffFinding(
                release_a=release_a, release_b=release_b,
                finding_type=finding["finding_type"], npi=finding["npi"],
                hcpcs_code=finding["hcpcs_code"], severity=finding["severity"],
                details=finding["details"],
            ))
            persisted += 1
        session.commit()

    return {
        "release_a": release_a, "release_b": release_b,
        "findings": len(all_findings), "persisted": persisted,
        "by_type": {
            finding_type: sum(1 for f in all_findings if f["finding_type"] == finding_type)
            for finding_type in ("NEW_BILLER", "VELOCITY_REGIME", "RETROACTIVE_RESTATEMENT")
        },
        "detail": all_findings[:50],
    }


def watchlist(session: Session, unreviewed_only: bool = True) -> list[dict]:
    """The weekly ops-review queue."""
    query = session.query(ReleaseDiffFinding)
    if unreviewed_only:
        query = query.filter_by(reviewed=False)
    findings = query.order_by(ReleaseDiffFinding.severity.desc(),
                              ReleaseDiffFinding.detected_at.desc()).limit(200).all()
    return [
        {
            "id": f.id, "release_a": f.release_a, "release_b": f.release_b,
            "finding_type": f.finding_type, "npi": f.npi, "hcpcs_code": f.hcpcs_code,
            "severity": f.severity, "details": f.details,
            "detected_at": f.detected_at.isoformat() if f.detected_at else None,
            "reviewed": f.reviewed,
        }
        for f in findings
    ]
