"""Declination library - the asset class every competitor throws away.

DOJ declines roughly 70% of qui tams. The industry treats a declination as a
death sentence; this platform treats it as an ASSET:

  * A declination is a federal decision, not a global one. The same conduct
    can proceed under the NY State FCA (State Finance Law Art. 5-B, NY AG
    Medicaid Fraud Control Unit) and the NYC FCA (Admin Code 5-325, DOI) -
    forums with smaller dockets and their own relator-share economics.
  * Declined cases litigated solo still pay: relators who push declined
    cases to settlement historically recover 10-30% shares.
  * A library of WHY cases were declined (reason codes) is the sharpest
    possible training data for case selection - it directly re-tunes the
    ENPV calibrator's priors.

Library rules:
  * Every declination gets a reason_code (PRIORITY / MERITS / DUP_CASE /
    PUBLIC_BAR / OTHER) - the code is what makes the library queryable.
  * Every entry is routed (or explicitly parked) via the shop-to matrix.
  * Outcomes flow back: resolved_amounts on declined+shopped cases are the
    proof the channel works.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import DeclinationRecord

SHOP_TO_MATRIX = [
    {
        "forum": "NY AG Medicaid Fraud Control Unit (NY State FCA)",
        "route": "State Finance Law Art. 5-B qui tam; relator shares mirror federal bands",
        "fit": ["SADC_ABUSE", "NURSING_HOME_BILLING", "EXCLUDED_PROVIDER_BILLING",
                "HOME_CARE_BILLING", "NEMT_KICKBACKS"],
    },
    {
        "forum": "NYC Department of Investigation (NYC FCA)",
        "route": "NYC Admin Code 5-325; strong for HRA/HHS-dollar claims in NYC",
        "fit": ["SADC_ABUSE", "NEMT_KICKBACKS", "HOME_CARE_BILLING"],
    },
    {
        "forum": "Other-state AGs (where the target operates nationally)",
        "route": "State FCAs with Medicaid-fraud units; package as multi-state brief",
        "fit": ["UPCODING", "RISK_ADJUSTMENT", "REFERRAL_KICKBACKS"],
    },
    {
        "forum": "Relator-litigated federal case (solo litigation)",
        "route": "31 U.S.C. 3730(c)(3): relator may proceed on decline; counsel decides",
        "fit": ["EXCLUDED_PROVIDER_BILLING", "GHOST_BILLING"],  # objectively provable schemes
    },
]


def record_declination(
    session: Session,
    declined_by: str,
    npi: Optional[str] = None,
    case_label: Optional[str] = None,
    scheme_type: Optional[str] = None,
    declined_at: Optional[date] = None,
    reason_code: Optional[str] = None,
    reason_note: Optional[str] = None,
    estimated_single_damages: Optional[float] = None,
) -> dict:
    """Log a declination into the library."""
    declined_by = declined_by.upper()
    if declined_by not in ("DOJ", "NY_AGMFCU", "NYC_DOI"):
        raise ValueError("declined_by must be DOJ / NY_AGMFCU / NYC_DOI")
    if reason_code and reason_code.upper() not in ("PRIORITY", "MERITS", "DUP_CASE", "PUBLIC_BAR", "OTHER"):
        raise ValueError("invalid reason_code")

    record = DeclinationRecord(
        npi=npi, case_label=case_label, scheme_type=scheme_type.upper() if scheme_type else None,
        declined_by=declined_by, declined_at=declined_at or date.today(),
        reason_code=reason_code.upper() if reason_code else None,
        reason_note=reason_note, estimated_single_damages=estimated_single_damages,
    )
    session.add(record)
    session.commit()
    return {
        "id": record.id, "npi": record.npi, "declined_by": record.declined_by,
        "reason_code": record.reason_code,
        "routing_recommendation": route_declined_case(session, scheme_type),
    }


def route_declined_case(session: Session, scheme_type: Optional[str]) -> list[dict]:
    """Where can this declined case still live?"""
    scheme = (scheme_type or "").upper()
    routes = []
    for entry in SHOP_TO_MATRIX:
        if not scheme or not entry["fit"] or scheme in entry["fit"]:
            routes.append({k: entry[k] for k in ("forum", "route")})
    return routes or [{k: entry[k] for k in ("forum", "route")} for entry in SHOP_TO_MATRIX[:1]]


def mark_shopped(
    session: Session,
    declination_id: int,
    forum: str,
    submitted_on: Optional[date] = None,
    status: str = "PENDING",
) -> dict:
    """Append a routing attempt to a declination's shopped_to ledger."""
    record = session.query(DeclinationRecord).filter_by(id=declination_id).first()
    if not record:
        raise ValueError(f"No declination {declination_id}")
    ledger = list(record.shopped_to or [])
    ledger.append({
        "forum": forum,
        "submitted": (submitted_on or date.today()).isoformat(),
        "status": status,
    })
    record.shopped_to = ledger
    record.outcome = "REFILED" if any(e["status"] == "ACCEPTED" for e in ledger) else record.outcome
    session.commit()
    return {"id": record.id, "shopped_to": record.shopped_to, "outcome": record.outcome}


def resolve_declination(
    session: Session, declination_id: int, outcome: str, resolved_amount: Optional[float] = None,
) -> dict:
    if outcome.upper() not in ("REFILED", "SETTLED", "DISMISSED", "ABANDONED"):
        raise ValueError("invalid outcome")
    record = session.query(DeclinationRecord).filter_by(id=declination_id).first()
    if not record:
        raise ValueError(f"No declination {declination_id}")
    record.outcome = outcome.upper()
    record.resolved_amount = resolved_amount
    session.commit()
    return {"id": record.id, "outcome": record.outcome, "resolved_amount": record.resolved_amount}


def library_stats(session: Session) -> dict:
    """Aggregate view: what got declined, why, and what the second life paid."""
    records = session.query(DeclinationRecord).all()
    if not records:
        return {"n": 0, "message": "No declinations recorded yet."}

    by_reason: dict[str, int] = {}
    by_outcome: dict[str, int] = {}
    shopped_total = settled_amount = 0.0
    for record in records:
        by_reason[record.reason_code or "UNSPECIFIED"] = by_reason.get(record.reason_code or "UNSPECIFIED", 0) + 1
        by_outcome[record.outcome or "PENDING"] = by_outcome.get(record.outcome or "PENDING", 0) + 1
        shopped_total += len(record.shopped_to or [])
        if record.outcome == "SETTLED" and record.resolved_amount:
            settled_amount += record.resolved_amount

    n_settled = by_outcome.get("SETTLED", 0)
    return {
        "n": len(records),
        "by_reason": by_reason,
        "by_outcome": by_outcome,
        "shopping_attempts": shopped_total,
        "settled_count": n_settled,
        "settled_total_amount": round(settled_amount, 2),
        "settled_avg_amount": round(settled_amount / n_settled, 2) if n_settled else None,
        "channel_thesis": (
            "Declinations are routing decisions, not verdicts. NY AG MFCU and NYC DOI give "
            "the same conduct a second forum; relator-litigated federal declines still "
            "settle. Reason codes re-tune case selection: PUBLIC_BAR and DUP_CASE feed "
            "back into bar-check aggressiveness and first-to-file speed."
        ),
    }


def list_declinations(session: Session, limit: int = 100) -> list[dict]:
    records = (
        session.query(DeclinationRecord)
        .order_by(DeclinationRecord.declined_at.desc()).limit(limit).all()
    )
    return [
        {
            "id": r.id, "npi": r.npi, "case_label": r.case_label,
            "scheme_type": r.scheme_type, "declined_by": r.declined_by,
            "declined_at": r.declined_at.isoformat() if r.declined_at else None,
            "reason_code": r.reason_code, "reason_note": r.reason_note,
            "estimated_single_damages": r.estimated_single_damages,
            "shopped_to": r.shopped_to, "outcome": r.outcome,
            "resolved_amount": r.resolved_amount,
        }
        for r in records
    ]
