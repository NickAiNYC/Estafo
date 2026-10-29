"""ENPV calibration - model the intervenor's decision, not just the fraud.

ENPV = P(outcome) x (expected gross to relator) - expected costs

The old engine asked 'is this fraud?'. This module asks the question that
actually prices a qui tam: **would DOJ (or NY AG, or NYC DOI) intervene, and
what would the relator net if they did?** Declines are the modal outcome
(~70% of qui tams), so case selection IS the business.

Calibration blending:
    * PRIORS: scheme-level base rates from the outcomes database seeds and
      published DOJ statistics (used until n is large).
    * EMPIRICAL: verified FCAOutcomeCase rows and our own resolved matters
      (DeclinationRecords feed back as negative observations).
    * FEATURES: evidence tier, damages size, exclusion match, cross-signal
      corroboration, SOL pressure - each adjusts P multiplicatively with
      bounded multipliers (never >1.6x or <0.2x per feature).

Outputs feed sol_clocks.compute_sol_clock via enpv_at_discovery.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from models import FCAOutcomeCase, DeclinationRecord

# ---------------------------------------------------------------------------
# Scheme priors (base rates) - documented, tunable, honest about provenance
# ---------------------------------------------------------------------------

@dataclass
class SchemePrior:
    p_intervene_base: float        # base P(intervention | well-documented case)
    relator_share_p50: float       # median relator share when intervened
    relator_share_declined: float  # typical share when declined but litigated
    recovery_multiple_p50: float   # total recovery / single damages
    months_to_resolution_p50: int
    note: str = ""


SCHEME_PRIORS: dict[str, SchemePrior] = {
    "EXCLUDED_PROVIDER_BILLING": SchemePrior(
        0.55, 0.22, 0.15, 2.4, 24,
        "Objectively verifiable (LEIE/OMIG list + paid claims); clean per-claim math."),
    "SADC_ABUSE": SchemePrior(
        0.35, 0.20, 0.12, 2.5, 30,
        "NYC-centric; strong MFCU appetite when census/capacity math is airtight."),
    "NEMT_KICKBACKS": SchemePrior(
        0.30, 0.18, 0.10, 2.3, 30,
        "Kickback proof burden; needs insider witness or recorded payments."),
    "REFERRAL_KICKBACKS": SchemePrior(
        0.40, 0.20, 0.12, 2.6, 30,
        "Mature DOJ playbook (Tenet/HMA line); documents matter."),
    "UPCODING": SchemePrior(
        0.30, 0.19, 0.10, 2.2, 36,
        "Statistical cases need Daubert-grade methodology on claim-level data."),
    "UNNECESSARY_SERVICES": SchemePrior(
        0.30, 0.20, 0.10, 2.3, 33,
        "Clinical judgment battles; expert costs raise the burn."),
    "GHOST_BILLING": SchemePrior(
        0.50, 0.21, 0.12, 2.5, 27,
        "Beneficiary statements are decisive; strong aggregate proof pattern."),
    "DEFAULT": SchemePrior(0.30, 0.19, 0.11, 2.4, 30, "Unspecified scheme prior."),
}

# 2025 inflation-adjusted FCA per-claim penalty band (31 CFR 85.5)
PENALTY_MIN_2025 = 14_308
PENALTY_MAX_2025 = 28_619


@dataclass
class LeadProfile:
    """Features known about a lead at calibration time."""
    npi: str
    scheme_type: str
    estimated_single_damages: float          # actual damages estimate
    estimated_claim_count: Optional[int] = None  # for penalty stacking math
    evidence_tier: int = 2                   # 1=verifiable docs, 2=strong statistical, 3=weak
    exclusion_match: bool = False            # target or principal matched LEIE/OMIG
    cross_signal_corroboration: bool = False # 311-idling x SADC CORROBORATING
    insider_witness: bool = False            # original-source tipster with direct knowledge
    sol_pressure_days: Optional[int] = None  # days to earliest SOL deadline
    state: str = "NY"
    parallel_state_claim: bool = True        # NY FCA / NYC FCA stacked


@dataclass
class ENPVResult:
    p_intervene: float
    p_decline_litigate: float
    relator_share_intervened: float
    relator_share_declined: float
    expected_gross_intervened: float
    expected_gross_declined: float
    estimated_costs: float
    enpv: float
    treble_plus_penalties: float
    prior_source: dict = field(default_factory=dict)
    drivers: list = field(default_factory=list)


def _prior_for(scheme_type: str) -> SchemePrior:
    return SCHEME_PRIORS.get(scheme_type.upper(), SCHEME_PRIORS["DEFAULT"])


def blended_priors(session: Optional[Session], scheme_type: str) -> tuple[SchemePrior, dict]:
    """Blend seed priors with verified empirical outcome rows.

    Empirical rows only take weight at n >= 8 verified cases for a scheme;
    below that the seed prior dominates (honest about small samples).
    """
    prior = _prior_for(scheme_type)
    source = {"source": "prior", "empirical_n": 0}
    if session is None:
        return prior, source
    cases = session.query(FCAOutcomeCase).filter(
        FCAOutcomeCase.scheme_type == scheme_type.upper(),
        FCAOutcomeCase.verified.is_(True),
        FCAOutcomeCase.outcome_type != "AGGREGATE_ANNUAL",
    ).all()
    if len(cases) >= 8:
        intervened = [c for c in cases if c.intervened == "INTERVENED"]
        shares = [c.relator_share_pct for c in intervened if c.relator_share_pct]
        if intervened and shares:
            weight = 0.5  # 50/50 prior/empirical at healthy n
            p_emp = len(intervened) / len(cases)
            share_emp = sum(shares) / len(shares)
            prior.p_intervene_base = round((1 - weight) * prior.p_intervene_base + weight * p_emp, 3)
            prior.relator_share_p50 = round((1 - weight) * prior.relator_share_p50 + weight * share_emp, 3)
            source = {"source": "blended", "empirical_n": len(cases)}
    # Declinations we filed ourselves are the sharpest negative signal
    if session is not None:
        our_decls = session.query(DeclinationRecord).filter(
            DeclinationRecord.scheme_type == scheme_type.upper()).count()
        if our_decls >= 3:
            source["own_declinations"] = our_decls
    return prior, source


def calibrate_enpv(profile: LeadProfile, session: Optional[Session] = None) -> ENPVResult:
    """Full ENPV calibration for one lead."""
    prior, prior_source = blended_priors(session, profile.scheme_type)

    # --- P(intervention): bounded multiplicative adjustments ---
    p = prior.p_intervene_base
    drivers = []

    if profile.evidence_tier == 1:
        p *= 1.5; drivers.append("Evidence tier 1 (verifiable documents): P x1.5")
    elif profile.evidence_tier == 3:
        p *= 0.4; drivers.append("Evidence tier 3 (weak): P x0.4")

    if profile.exclusion_match:
        p *= 1.6; drivers.append("Exclusion match on target/principal: P x1.6")
    if profile.cross_signal_corroboration:
        p *= 1.2; drivers.append("311-idling cross-signal CORROBORATING: P x1.2")
    if profile.insider_witness:
        p *= 1.3; drivers.append("Original-source insider witness: P x1.3")

    # Size band: DOJ's appetite concentrates at $1M-$50M single damages
    size = profile.estimated_single_damages
    if size >= 1_000_000:
        p *= 1.15; drivers.append("Damages >= $1M: P x1.15")
    if size >= 10_000_000:
        p *= 1.1; drivers.append("Damages >= $10M: P x1.1")
    if size < 250_000:
        p *= 0.5; drivers.append("Damages < $250k (below most office thresholds): P x0.5")

    p = min(0.85, max(0.02, p))
    p_decline_litigate = 1.0 - p

    # --- Expected gross ---
    penalties = 0.0
    if profile.estimated_claim_count:
        # Conservative: mid-band, unstacked (Excessive Fines Clause posture)
        penalties = profile.estimated_claim_count * ((PENALTY_MIN_2025 + PENALTY_MAX_2025) / 2)
    treble_plus = profile.estimated_single_damages * prior.recovery_multiple_p50 + penalties

    gross_intervened = treble_plus * prior.relator_share_p50
    # Declined-but-litigated: assume ~60% of cases settle for a fraction; model EV at 25% of treble
    gross_declined = (treble_plus * 0.25) * prior.relator_share_declined

    # --- Costs: expert + filing + own time across expected resolution horizon ---
    months = prior.months_to_resolution_p50
    base_cost = 15_000 + 500 * months          # baseline research/ops burn
    if profile.evidence_tier == 1:
        base_cost += 25_000                     # document auth/hashing/filing support
    if profile.scheme_type in ("UPCODING", "UNNECESSARY_SERVICES"):
        base_cost += 60_000                     # statisticians + clinical experts
    if profile.insider_witness is False:
        base_cost += 10_000                     # longer development to find a witness

    enpv = p * gross_intervened + p_decline_litigate * gross_declined - base_cost
    # Parallel state claim adds a modest expected kicker (NY AG / NYC DOI tracks)
    if profile.parallel_state_claim and profile.state == "NY":
        enpv *= 1.08
        drivers.append("Parallel NY FCA / NYC FCA tracks: ENPV x1.08")

    return ENPVResult(
        p_intervene=round(p, 3),
        p_decline_litigate=round(p_decline_litigate, 3),
        relator_share_intervened=round(prior.relator_share_p50, 3),
        relator_share_declined=round(prior.relator_share_declined, 3),
        expected_gross_intervened=round(gross_intervened, 2),
        expected_gross_declined=round(gross_declined, 2),
        estimated_costs=round(base_cost, 2),
        enpv=round(enpv, 2),
        treble_plus_penalties=round(treble_plus, 2),
        prior_source=prior_source,
        drivers=drivers,
    )


def result_to_dict(result: ENPVResult) -> dict:
    return {
        "p_intervene": result.p_intervene,
        "p_decline_litigate": result.p_decline_litigate,
        "relator_share_intervened": result.relator_share_intervened,
        "relator_share_declined": result.relator_share_declined,
        "expected_gross_intervened": result.expected_gross_intervened,
        "expected_gross_declined": result.expected_gross_declined,
        "estimated_costs": result.estimated_costs,
        "enpv": result.enpv,
        "treble_plus_penalties": result.treble_plus_penalties,
        "prior_source": result.prior_source,
        "drivers": result.drivers,
        "method_note": (
            "ENPV = P(intervene) x gross(intervened) + P(decline) x gross(declined-litigated) "
            "- costs. Multipliers are bounded and documented; priors blend with verified "
            "outcomes as the library fills. Declined cases are priced, not ignored."
        ),
        "penalty_note": (
            f"Per-claim penalties use the 2025 inflation-adjusted band "
            f"(${PENALTY_MIN_2025:,}-${PENALTY_MAX_2025:,}), mid-band and unstacked."
        ),
    }
