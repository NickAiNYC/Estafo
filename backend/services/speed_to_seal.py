"""Speed-to-seal metrics - the operating KPI of the whole engine.

A qui tam complaint can only be filed after the allegation is documented,
counsel is engaged, and the disclosure statement (reliance + investigation
report, 31 U.S.C. 3730(b)(2)) is ready - then it sits under seal, often for
years. The part this platform controls is **tip -> filing-ready**. That
interval is the metric the whole pipeline optimizes, because:

  * The relator who documents first wins first-to-file (3730(b)(5)).
  * Original-source posture decays with every day the tipster waits.
  * Counsel chooses leads that arrive filing-ready - speed IS the sales pitch.

Stage ladder:
    TIP -> DOSSIER -> COUNSEL_REVIEW -> FILING_READY -> FILED_SEALED
    -> INTERVENTION_DECISION -> RESOLVED
    (a declined case branches DECLINED -> SHOPPED -> RESOLVED elsewhere)
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import PipelineStageEvent

STAGE_LADDER = [
    "TIP", "DOSSIER", "COUNSEL_REVIEW", "FILING_READY",
    "FILED_SEALED", "INTERVENTION_DECISION", "RESOLVED",
    "DECLINED", "SHOPPED",
]


def record_stage(
    session: Session,
    npi: str,
    stage: str,
    actor: str = "system",
    occurred_at: Optional[datetime] = None,
    notes: Optional[str] = None,
) -> dict:
    """Append a stage event; computes days since the previous stage."""
    stage = stage.upper()
    if stage not in STAGE_LADDER:
        raise ValueError(f"Unknown stage {stage}; ladder: {STAGE_LADDER}")
    occurred_at = occurred_at or datetime.utcnow()

    previous = (
        session.query(PipelineStageEvent)
        .filter(PipelineStageEvent.npi == npi)
        .order_by(PipelineStageEvent.occurred_at.desc())
        .first()
    )
    days_since = (
        max(0, (occurred_at - previous.occurred_at).days)
        if previous else None
    )
    event = PipelineStageEvent(
        npi=npi, stage=stage, occurred_at=occurred_at, actor=actor,
        days_since_previous_stage=days_since, notes=notes,
    )
    session.add(event)
    session.commit()

    return {
        "npi": npi, "stage": stage, "occurred_at": occurred_at.isoformat(),
        "days_since_previous_stage": days_since,
        "actor": actor,
    }


def speed_metrics(session: Session) -> dict:
    """Portfolio-wide stage-transition statistics + bottleneck detection."""
    events = (
        session.query(PipelineStageEvent)
        .order_by(PipelineStageEvent.npi, PipelineStageEvent.occurred_at)
        .all()
    )

    per_npi: dict[str, list[PipelineStageEvent]] = {}
    for event in events:
        per_npi.setdefault(event.npi, []).append(event)

    transitions: dict[tuple[str, str], list[int]] = {}
    funnel: dict[str, int] = {}
    filing_ready_speeds: list[int] = []
    tip_to_seal_speeds: list[int] = []

    for npi, stages in per_npi.items():
        funnel[stages[-1].stage] = funnel.get(stages[-1].stage, 0) + 1
        tip = stages[0]
        for previous, current in zip(stages, stages[1:]):
            days = (current.occurred_at - previous.occurred_at).days
            transitions.setdefault((previous.stage, current.stage), []).append(max(0, days))
        if any(s.stage == "FILING_READY" for s in stages):
            ready = next(s for s in stages if s.stage == "FILING_READY")
            filing_ready_speeds.append(max(0, (ready.occurred_at - tip.occurred_at).days))
        if any(s.stage == "FILED_SEALED" for s in stages):
            sealed = next(s for s in stages if s.stage == "FILED_SEALED")
            tip_to_seal_speeds.append(max(0, (sealed.occurred_at - tip.occurred_at).days))

    def summarize(values: list[int]) -> dict:
        if not values:
            return {"n": 0}
        ordered = sorted(values)
        return {
            "n": len(values),
            "median_days": ordered[len(ordered) // 2],
            "p25_days": ordered[len(ordered) // 4],
            "p75_days": ordered[(3 * len(ordered)) // 4],
            "max_days": ordered[-1],
        }

    transition_stats = {
        f"{a} -> {b}": summarize(values)
        for (a, b), values in sorted(transitions.items())
    }

    # Bottleneck: the transition with the worst median (n >= 3)
    bottleneck = None
    for name, stats in transition_stats.items():
        if stats.get("n", 0) >= 3 and (bottleneck is None or
                                       stats["median_days"] > transition_stats[bottleneck]["median_days"]):
            bottleneck = name

    return {
        "stage_ladder": STAGE_LADDER,
        "current_stage_counts": funnel,
        "transition_stats": transition_stats,
        "tip_to_filing_ready": summarize(filing_ready_speeds),
        "tip_to_seal": summarize(tip_to_seal_speeds),
        "bottleneck": bottleneck,
        "target": {
            "tip_to_filing_ready_days": 30,
            "note": "Target: tip -> filing-ready in 30 days. Every week saved is original-"
                    "source strength preserved and first-to-file risk reduced.",
        },
    }


def leaderboard(session: Session, limit: int = 10) -> list[dict]:
    """Fastest TIP -> FILING_READY cases (the internal competitive metric)."""
    events = (
        session.query(PipelineStageEvent)
        .filter(PipelineStageEvent.stage.in_(["TIP", "FILING_READY"]))
        .order_by(PipelineStageEvent.npi, PipelineStageEvent.occurred_at)
        .all()
    )
    per_npi: dict[str, dict[str, datetime]] = {}
    for event in events:
        per_npi.setdefault(event.npi, {})[event.stage] = event.occurred_at

    rows = []
    for npi, stages in per_npi.items():
        if "TIP" in stages and "FILING_READY" in stages:
            days = (stages["FILING_READY"] - stages["TIP"]).days
            rows.append({"npi": npi, "tip_to_filing_ready_days": max(0, days)})
    return sorted(rows, key=lambda r: r["tip_to_filing_ready_days"])[:limit]
