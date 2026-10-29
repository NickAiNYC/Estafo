"""Engine V3 API routes - real-data pipeline, outcomes, SOL, cross-signal, case-selection intel.

All routes follow the house rules:
  * research aids, never legal advice; no provider allegations from aggregates
  * no contact with targets; nothing here is sent to any government
  * zero-knowledge intake for tips (no identity, ever)
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from config import settings

from services.data_audit import audit_data_sources, retire_synthetic_data
from services.outcomes_database import seed_outcomes, filter_cases, outcome_stats, sales_brief
from services.enpv_calibrator import calibrate_enpv, result_to_dict, LeadProfile
from analytics.sol_clocks import compute_sol_clock, refresh_all_clocks, portfolio_aging_report
from services.bar_check_service import run_bar_check
from services.original_source_intake import (
    intake_tip, verify_tip, engage_counsel, generate_declaration, tip_status,
)
from services.speed_to_seal import record_stage, speed_metrics, leaderboard
from services.declination_library import (
    record_declination, route_declined_case, mark_shopped, resolve_declination,
    library_stats, list_declinations,
)
from analytics.geospatial_cross_signal import score_lead, score_all_sites
from analytics.exculpatory_engine import generate_exculpatory_report
from analytics.release_diff_intelligence import diff_releases, watchlist

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/intel", tags=["Engine V3 - Intelligence"])


# ---------------------------------------------------------------------------
# Move 1: real data pipeline
# ---------------------------------------------------------------------------

@router.get("/data-audit")
def data_audit(db: Session = Depends(get_db)):
    """What share of active data is real, release-pinned, and verified?"""
    return audit_data_sources(db)


@router.post("/data-audit/retire-synthetic")
def retire_synthetic(dry_run: bool = True, db: Session = Depends(get_db)):
    """Quarantine the synthetic demonstration cohort."""
    return retire_synthetic_data(db, dry_run=dry_run)


@router.get("/exclusion-screens")
def exclusion_screen_status(db: Session = Depends(get_db)):
    """Latest exclusion-screen runs + active matches."""
    from models import ExclusionScreenRun, ExclusionMatch
    runs = db.query(ExclusionScreenRun).order_by(ExclusionScreenRun.ran_at.desc()).limit(10).all()
    matches = db.query(ExclusionMatch).filter_by(status="ACTIVE_MATCH").order_by(
        ExclusionMatch.detected_at.desc()).limit(100).all()
    return {
        "runs": [
            {
                "id": r.id, "source": r.source, "status": r.status,
                "providers_screened": r.providers_screened,
                "matches": r.matches_found, "new_matches": r.new_matches,
                "ran_at": r.ran_at.isoformat(), "source_sha256": r.source_sha256[:16] + "...",
            } for r in runs
        ],
        "active_matches": [
            {
                "npi": m.npi, "provider_name": m.provider_name, "source": m.source,
                "match_type": m.match_type, "match_score": m.match_score,
                "exclusion_type": m.exclusion_type,
                "exclusion_date": m.exclusion_date.isoformat() if m.exclusion_date else None,
                "detected_at": m.detected_at.isoformat(),
            } for m in matches
        ],
        "legal_note": "Billing Medicaid while excluded is a per-claim FCA violation "
                      "(31 U.S.C. 3729(a)(1)) and NY Soc. Serv. Law 145-b - the cleanest qui tam theory.",
    }


@router.post("/exclusion-screens/run")
def run_exclusion_screens_now(db: Session = Depends(get_db)):
    """Manual trigger of the nightly screen (network required)."""
    from data_ingestion.exclusion_screens import run_nightly_exclusion_screens
    return run_nightly_exclusion_screens(db)


@router.post("/hhs-release/check")
def check_hhs_release(db: Session = Depends(get_db)):
    """Poll the official HHS page for a new release; registers it if found."""
    from data_ingestion.hhs_release_manager import check_for_new_release, release_status
    new = check_for_new_release(db)
    return {"new_release": new, "registry": release_status(db)}


@router.get("/hhs-release/registry")
def hhs_registry(db: Session = Depends(get_db)):
    from data_ingestion.hhs_release_manager import release_status
    return {"releases": release_status(db)}


@router.post("/release-diff/run")
def run_release_diff(
    release_a: Optional[str] = None,
    release_b: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Diff the two most recent imported releases (or explicit pair)."""
    from data_ingestion.hhs_release_manager import latest_two_releases
    pair = (release_a, release_b)
    if not all(pair):
        pair = latest_two_releases(db) or (None, None)
    if not all(pair):
        raise HTTPException(400, "Need two imported releases (or pass release_a/release_b)")
    return diff_releases(db, pair[0], pair[1])


@router.get("/release-diff/watchlist")
def release_diff_watchlist(db: Session = Depends(get_db)):
    return {"findings": watchlist(db)}


# ---------------------------------------------------------------------------
# Move 2: outcomes database
# ---------------------------------------------------------------------------

@router.get("/outcomes")
def list_outcomes(
    scheme_type: Optional[str] = None, state: Optional[str] = None,
    intervened: Optional[str] = None, year_from: Optional[int] = None,
    year_to: Optional[int] = None, limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    return {"cases": filter_cases(db, scheme_type, state, intervened, None, year_from, year_to, limit)}


@router.post("/outcomes/seed")
def seed_outcome_cases(force: bool = False, db: Session = Depends(get_db)):
    return seed_outcomes(db, force=force)


@router.get("/outcomes/stats")
def outcomes_stats(scheme_type: Optional[str] = None, db: Session = Depends(get_db)):
    return outcome_stats(db, scheme_type=scheme_type)


@router.get("/outcomes/sales-brief")
def outcomes_sales_brief(db: Session = Depends(get_db)):
    """The counsel-pitch one-pager."""
    return sales_brief(db)


# ---------------------------------------------------------------------------
# ENPV calibration
# ---------------------------------------------------------------------------

@router.post("/enpv/calibrate")
def enpv_calibrate(
    npi: str, scheme_type: str, estimated_single_damages: float,
    estimated_claim_count: Optional[int] = None, evidence_tier: int = 2,
    exclusion_match: bool = False, cross_signal_corroboration: bool = False,
    insider_witness: bool = False, sol_pressure_days: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Model the intervenor's decision and price the lead."""
    profile = LeadProfile(
        npi=npi, scheme_type=scheme_type,
        estimated_single_damages=estimated_single_damages,
        estimated_claim_count=estimated_claim_count,
        evidence_tier=evidence_tier, exclusion_match=exclusion_match,
        cross_signal_corroboration=cross_signal_corroboration,
        insider_witness=insider_witness, sol_pressure_days=sol_pressure_days,
    )
    return result_to_dict(calibrate_enpv(profile, session=db))


# ---------------------------------------------------------------------------
# Move 3: SOL clocks + ENPV decay
# ---------------------------------------------------------------------------

@router.get("/leads/{npi}/sol")
def lead_sol_clock(npi: str, hcpcs_code: str = "T2024", db: Session = Depends(get_db)):
    try:
        return compute_sol_clock(db, npi, hcpcs_code)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.get("/sol/portfolio")
def sol_portfolio(db: Session = Depends(get_db)):
    return portfolio_aging_report(db)


@router.post("/sol/refresh")
def sol_refresh(db: Session = Depends(get_db)):
    """Daily job - recompute every clock."""
    return refresh_all_clocks(db)


# ---------------------------------------------------------------------------
# Move 4: 311 x SADC cross-signal
# ---------------------------------------------------------------------------

@router.get("/leads/{npi}/cross-signal")
def lead_cross_signal(npi: str, db: Session = Depends(get_db)):
    """311-idling corroboration for one lead (network: NYC Open Data)."""
    try:
        return score_lead(db, npi)
    except Exception as exc:
        logger.warning("cross-signal fetch failed: %s", exc)
        raise HTTPException(503, f"311 data unavailable: {exc}")


@router.get("/cross-signal/sites")
def cross_signal_sites(db: Session = Depends(get_db)):
    try:
        return {"sites": score_all_sites(db)}
    except Exception as exc:
        logger.warning("cross-signal bulk fetch failed: %s", exc)
        raise HTTPException(503, f"311 data unavailable: {exc}")


# ---------------------------------------------------------------------------
# Secret sauce: exculpatory engine
# ---------------------------------------------------------------------------

@router.get("/leads/{npi}/exculpatory")
def lead_exculpatory(npi: str, hcpcs_code: str = "T2024", db: Session = Depends(get_db)):
    return generate_exculpatory_report(db, npi, hcpcs_code)


# ---------------------------------------------------------------------------
# Secret sauce: bar check
# ---------------------------------------------------------------------------

@router.post("/bar-check")
def bar_check(
    target: str, npi: Optional[str] = None, tip_ref: Optional[str] = None,
    use_network: bool = True, db: Session = Depends(get_db),
):
    """31 U.S.C. 3730(e)(4) public-disclosure sweep for a target."""
    try:
        report = run_bar_check(db, target, npi=npi, tip_ref=tip_ref, use_network=use_network)
        return report.to_dict()
    except Exception as exc:
        logger.warning("bar-check failed: %s", exc)
        raise HTTPException(503, f"bar-check sources unavailable: {exc}")


# ---------------------------------------------------------------------------
# Secret sauce: original-source intake
# ---------------------------------------------------------------------------

@router.post("/tips")
def submit_tip(
    narrative: str, allegation_scheme: Optional[str] = None,
    target_state: str = "NY", db: Session = Depends(get_db),
):
    """Hash-locked, zero-knowledge tip intake. Narrative is hashed and discarded."""
    try:
        return intake_tip(db, narrative, allegation_scheme, target_state)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/tips/{tip_ref}/verify")
def verify_tip_hash(tip_ref: str, narrative: str, db: Session = Depends(get_db)):
    """Counsel-side hash verification of a tipster's narrative."""
    return verify_tip(db, tip_ref, narrative)


@router.get("/tips/{tip_ref}")
def get_tip_status(tip_ref: str, db: Session = Depends(get_db)):
    try:
        return tip_status(db, tip_ref)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.post("/tips/{tip_ref}/engage-counsel")
def tip_engage_counsel(tip_ref: str, db: Session = Depends(get_db)):
    try:
        return engage_counsel(db, tip_ref)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.get("/tips/{tip_ref}/declaration")
def tip_declaration(tip_ref: str, db: Session = Depends(get_db)):
    """28 U.S.C. 1746 declaration skeleton (counsel + tipster complete it)."""
    try:
        return generate_declaration(db, tip_ref)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


# ---------------------------------------------------------------------------
# Secret sauce: speed-to-seal
# ---------------------------------------------------------------------------

@router.post("/pipeline/stage")
def pipeline_record_stage(
    npi: str, stage: str, actor: str = "system", db: Session = Depends(get_db),
):
    try:
        return record_stage(db, npi, stage, actor=actor)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.get("/pipeline/speed-metrics")
def pipeline_speed(db: Session = Depends(get_db)):
    return speed_metrics(db)


@router.get("/pipeline/leaderboard")
def pipeline_leaderboard(db: Session = Depends(get_db)):
    return {"fastest_tip_to_filing_ready": leaderboard(db)}


# ---------------------------------------------------------------------------
# Secret sauce: declination library
# ---------------------------------------------------------------------------

@router.post("/declinations")
def create_declination(
    declined_by: str, npi: Optional[str] = None, case_label: Optional[str] = None,
    scheme_type: Optional[str] = None, reason_code: Optional[str] = None,
    reason_note: Optional[str] = None,
    estimated_single_damages: Optional[float] = None,
    db: Session = Depends(get_db),
):
    try:
        return record_declination(
            db, declined_by, npi=npi, case_label=case_label, scheme_type=scheme_type,
            reason_code=reason_code, reason_note=reason_note,
            estimated_single_damages=estimated_single_damages,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.get("/declinations")
def get_declinations(db: Session = Depends(get_db)):
    return {"declinations": list_declinations(db), "stats": library_stats(db)}


@router.get("/declinations/routing")
def declination_routing(scheme_type: Optional[str] = None, db: Session = Depends(get_db)):
    return {"routes": route_declined_case(db, scheme_type)}


@router.post("/declinations/{declination_id}/shop")
def shop_declination(
    declination_id: int, forum: str, submitted_on: Optional[date] = None,
    status: str = "PENDING", db: Session = Depends(get_db),
):
    try:
        return mark_shopped(db, declination_id, forum, submitted_on, status)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.post("/declinations/{declination_id}/resolve")
def resolve_declined_case(
    declination_id: int, outcome: str, resolved_amount: Optional[float] = None,
    db: Session = Depends(get_db),
):
    try:
        return resolve_declination(db, declination_id, outcome, resolved_amount)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
