"""Statute-of-limitations clocks and time-decayed ENPV for every lead.

Law applied (verify current text before relying on a filing deadline):

  * Federal FCA, 31 U.S.C. 3731(b):
      (b)(1) 6 years from the date of the violation; or
      (b)(2) 3 years from the date the material facts are known or reasonably
              should have been known by the official charged with acting,
              BUT no action more than 10 years after the violation.
  * NY State Finance Law Art. 5-B (NY FCA) mirrors 3731(b): 6 / 3 / 10.
  * NYC Admin Code Sec. 5-325 (NYC FCA, enforced via DOI) mirrors the state
    limitations period.

Two distinct decay mechanisms are modeled:

  1. STALENESS: an unengaged lead decays in evidentiary value - witnesses
     disperse, documents vanish, the tipster's original-source story weakens.
     Modeled as exponential half-life (default 180 days, ENPV halves ~6 mo).

  2. PROGRESSIVE TIME-BAR: the oldest claims fall out of the 6-year window
     first. With month-level billing data, the damages pool that is still
     actionable shrinks continuously. claims_time_barred_pct is the share of
     the lead's estimated damages already outside the window.

Together: enpv_current = enpv_at_discovery
                        x 0.5 ** (stale_days / half_life)
                        x (1 - claims_time_barred_pct)
                        x exculpatory_adjustment (from the exculpatory engine)
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from models import AggregateSpendingRecord, LeadVerificationRecord, LeadSOLClock, Provider
from config import settings

logger = logging.getLogger(__name__)

URGENCY_TIERS = (
    ("EXPIRED", 0),            # deadline passed
    ("FILE_NOW", 90),          # < 90 days to earliest deadline
    ("HIGH", 180),             # < 6 months
    ("MODERATE", 365),         # < 1 year
    ("MONITOR", 10_000),       # everything else
)


def add_years(anchor: date, years: int) -> date:
    """Add calendar years the way statutes count them (Feb 29 clamps to Feb 28)."""
    try:
        return anchor.replace(year=anchor.year + years)
    except ValueError:  # Feb 29 in a non-leap target year
        return anchor.replace(year=anchor.year + years, day=28)


def federal_deadline(
    first_violation: date,
    government_knowledge: Optional[date],
    as_of: Optional[date] = None,
) -> date:
    """Earliest applicable 31 U.S.C. 3731(b) deadline.

    violation + 6y, versus knowledge + 3y, whichever is LATER (the later
    deadline is the one the government would actually use), capped at
    violation + 10y. Calendar-year arithmetic throughout.
    """
    six_year = add_years(first_violation, 6)
    three_year = add_years(government_knowledge, 3) if government_knowledge else None
    deadline = max(d for d in (six_year, three_year) if d)
    ten_year_cap = add_years(first_violation, 10)
    return min(deadline, ten_year_cap)


def time_barred_share(
    monthly_paid: dict[str, float],
    first_violation: date,
    as_of: date,
) -> float:
    """Share of billed dollars already outside the 6-year window.

    monthly_paid: {'YYYY-MM': dollars} for the lead's flagged billing.
    """
    cutoff = add_years(as_of, -6)
    total = barred = 0.0
    for year_month, dollars in monthly_paid.items():
        try:
            month_date = datetime.strptime(year_month, "%Y-%m").date()
        except ValueError:
            continue
        total += dollars
        if month_date < cutoff:
            barred += dollars
    return round(barred / total, 4) if total > 0 else 0.0


def staleness_factor(stale_days: int, half_life_days: int) -> float:
    """Exponential decay: 1.0 at discovery, 0.5 at half_life_days."""
    if stale_days <= 0:
        return 1.0
    return 0.5 ** (stale_days / max(1, half_life_days))


def urgency_tier(days_remaining: Optional[int]) -> str:
    if days_remaining is None:
        return "UNRANKED"
    if days_remaining < 0:
        return "EXPIRED"
    for tier, ceiling in URGENCY_TIERS:
        if days_remaining <= ceiling:
            return tier
    return "MONITOR"


def lead_monthly_paid(session: Session, npi: str, hcpcs_code: str) -> dict[str, float]:
    """Month -> paid dollars for one lead from the stored aggregates."""
    rows = (
        session.query(AggregateSpendingRecord.year_month, AggregateSpendingRecord.total_paid_amount)
        .filter(
            AggregateSpendingRecord.billing_npi == npi,
            AggregateSpendingRecord.hcpcs_code == hcpcs_code,
        )
        .order_by(AggregateSpendingRecord.year_month)
        .all()
    )
    monthly: dict[str, float] = {}
    for year_month, paid in rows:
        monthly[year_month] = monthly.get(year_month, 0.0) + (paid or 0.0)
    return monthly


def compute_sol_clock(
    session: Session,
    npi: str,
    hcpcs_code: str = "T2024",
    as_of: Optional[date] = None,
    enpv_at_discovery: Optional[float] = None,
    government_knowledge: Optional[date] = None,
    exculpatory_factor: float = 1.0,
) -> dict:
    """Compute (and upsert) the SOL clock + decayed ENPV for one lead."""
    as_of = as_of or date.today()
    monthly = lead_monthly_paid(session, npi, hcpcs_code)

    if monthly:
        first_month, last_month = min(monthly), max(monthly)
        first_violation = datetime.strptime(first_month, "%Y-%m").date()
        latest_violation = datetime.strptime(last_month, "%Y-%m").date()
    else:
        lead = (
            session.query(LeadVerificationRecord)
            .filter(LeadVerificationRecord.billing_npi == npi)
            .order_by(LeadVerificationRecord.created_at.desc())
            .first()
        )
        if not lead:
            raise ValueError(f"No billing months or lead record for NPI {npi}")
        first_violation = latest_violation = (lead.created_at or datetime.utcnow()).date()

    gov_knowledge = government_knowledge
    if gov_knowledge is None:
        # Conservative default: assume knowledge from the first flagged month
        # until an investigator anchors a real disclosure date.
        gov_knowledge = first_violation

    f_deadline = federal_deadline(first_violation, gov_knowledge, as_of)
    ny_deadline = federal_deadline(first_violation, gov_knowledge, as_of)  # mirrors federal
    nyc_deadline = ny_deadline
    bar_date = add_years(first_violation, 10)

    days_remaining = (f_deadline - as_of).days
    barred_pct = time_barred_share(monthly, first_violation, as_of)

    clock = session.query(LeadSOLClock).filter_by(npi=npi).first()
    if clock is None:
        clock = LeadSOLClock(npi=npi, hcpcs_code=hcpcs_code)
        session.add(clock)

    clock.hcpcs_code = hcpcs_code
    clock.first_violation_date = first_violation
    clock.latest_violation_date = latest_violation
    clock.government_knowledge_date = gov_knowledge
    clock.federal_deadline = f_deadline
    clock.federal_bar_date = bar_date
    clock.ny_state_deadline = ny_deadline
    clock.nyc_deadline = nyc_deadline
    clock.days_remaining = days_remaining
    clock.urgency_tier = urgency_tier(days_remaining)
    clock.claims_time_barred_pct = barred_pct
    clock.decay_half_life_days = settings.ENPV_STALE_HALF_LIFE_DAYS

    # ENPV decay
    if clock.enpv_at_discovery is None:
        clock.enpv_at_discovery = enpv_at_discovery or 0.0
        clock.last_computed_at = datetime.utcnow()
        discovery = clock.last_computed_at
    else:
        discovery = clock.last_computed_at or datetime.utcnow()
    clock.stale_days = max(0, (datetime.utcnow() - discovery).days)
    if enpv_at_discovery is not None:
        clock.enpv_at_discovery = enpv_at_discovery  # allow recalibration

    clock.enpv_current = round(
        (clock.enpv_at_discovery or 0.0)
        * staleness_factor(clock.stale_days, clock.decay_half_life_days)
        * max(0.0, 1.0 - barred_pct)
        * max(0.0, min(1.0, exculpatory_factor)),
        2,
    )
    clock.last_computed_at = datetime.utcnow()
    session.commit()

    return {
        "npi": npi,
        "first_violation": first_violation.isoformat(),
        "latest_violation": latest_violation.isoformat(),
        "government_knowledge": gov_knowledge.isoformat(),
        "federal_deadline": f_deadline.isoformat(),
        "ny_state_deadline": ny_deadline.isoformat(),
        "nyc_deadline": nyc_deadline.isoformat(),
        "federal_bar_date": bar_date.isoformat(),
        "days_remaining": days_remaining,
        "urgency_tier": clock.urgency_tier,
        "claims_time_barred_pct": barred_pct,
        "enpv_at_discovery": clock.enpv_at_discovery,
        "enpv_current": clock.enpv_current,
        "stale_days": clock.stale_days,
        "decay_half_life_days": clock.decay_half_life_days,
        "statutory_note": (
            "31 U.S.C. 3731(b): 6yr from violation / 3yr from government knowledge, "
            "10yr cap; NY St. Fin. Law Art. 5-B and NYC Admin Code 5-325 mirror. "
            "Verify current statutory text and tolling facts with counsel before filing."
        ),
    }


def refresh_all_clocks(session: Session, as_of: Optional[date] = None) -> dict:
    """Daily job: recompute every stored clock. Returns a portfolio summary."""
    clocks = session.query(LeadSOLClock).all()
    for clock in clocks:
        try:
            compute_sol_clock(
                session, clock.npi, clock.hcpcs_code, as_of=as_of,
                government_knowledge=clock.government_knowledge_date,
            )
        except ValueError:
            continue
    return portfolio_aging_report(session)


def portfolio_aging_report(session: Session) -> dict:
    """Aging portfolio report: value decay by urgency tier."""
    clocks = session.query(LeadSOLClock).all()
    tiers: dict[str, dict] = {}
    for clock in clocks:
        bucket = tiers.setdefault(clock.urgency_tier, {
            "leads": 0, "enpv_at_discovery": 0.0, "enpv_current": 0.0,
            "avg_days_remaining": [], "avg_time_barred_pct": [],
        })
        bucket["leads"] += 1
        bucket["enpv_at_discovery"] += clock.enpv_at_discovery or 0.0
        bucket["enpv_current"] += clock.enpv_current or 0.0
        if clock.days_remaining is not None:
            bucket["avg_days_remaining"].append(clock.days_remaining)
        bucket["avg_time_barred_pct"].append(clock.claims_time_barred_pct or 0.0)

    for bucket in tiers.values():
        n = bucket.pop("leads")
        days = bucket.pop("avg_days_remaining") or [0]
        barred = bucket.pop("avg_time_barred_pct") or [0.0]
        bucket["leads"] = n
        bucket["avg_days_remaining"] = round(sum(days) / len(days))
        bucket["avg_time_barred_pct"] = round(sum(barred) / len(barred), 4)
        bucket["value_retention_pct"] = round(
            100.0 * bucket["enpv_current"] / bucket["enpv_at_discovery"], 1
        ) if bucket["enpv_at_discovery"] else None

    total_discovery = sum(b["enpv_at_discovery"] for b in tiers.values())
    total_current = sum(b["enpv_current"] for b in tiers.values())
    return {
        "tiers": tiers,
        "portfolio": {
            "leads": sum(b["leads"] for b in tiers.values()),
            "enpv_at_discovery": round(total_discovery, 2),
            "enpv_current": round(total_current, 2),
            "value_retention_pct": round(100.0 * total_current / total_discovery, 1)
            if total_discovery else None,
            "action_rule": (
                "FILE_NOW tier: counsel packet within 14 days. "
                "HIGH tier: dossier refresh + bar-check within 30 days. "
                "Anything older than two half-lives without counsel engagement is archived."
            ),
        },
    }
