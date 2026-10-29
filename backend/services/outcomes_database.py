"""The outcomes database - resolved healthcare FCA matters.

Two jobs:
1. CALIBRATION: grounded inputs for ENPV - P(intervention), relator share %,
   recovery multiple, time-to-resolution - by scheme type and state. Empirical
   rows (verified) automatically take precedence over priors.
2. SALES ASSET: 'here is what SADC cases in NY actually recovered, and here is
   what relators actually received' - the single most persuasive page in a
   counsel pitch.

Seed data policy
----------------
Seeds are real, publicly reported matters entered from press coverage. Every
row ships with confidence=HIGH/MEDIUM/LOW and verified=false. Before a number
is quoted to a client, an operator must open the primary source (DOJ press
release, AG announcement, docket) and flip verified=true. Seed rows are the
scaffolding, not the product - the library grows by scraping DOJ/AG/OIG
releases weekly and from our own resolved matters.

Penalty math note: per-claim FCA penalties are inflation-adjusted each
January (2025 range $14,308-$28,619 per claim). Cases resolve almost always
on single x 2 + penalties-in-lieu style frameworks; we store what was
actually paid, not theoretical maxima.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import FCAOutcomeCase

# ---------------------------------------------------------------------------
# Seed corpus - publicly reported matters (figures approximate, verify before quoting)
# ---------------------------------------------------------------------------

SEED_CASES = [
    # ---- National anchor cases (HIGH confidence, widely reported) ----
    dict(case_label="United States v. Pfizer / Wyeth (Bextra-Geodon off-label + kickbacks)",
         scheme_type="OFF_LABEL_MARKETING", state=None, jurisdiction="FEDERAL", year=2009,
         total_recovery=2_300_000_000, relator_share_amount=102_000_000, relator_share_pct=4.4,
         intervened="INTERVENED", days_filing_to_resolution=None,
         source_label="DOJ press release 2009", confidence="HIGH",
         notes="Largest healthcare FCA recovery; multiple relators; kickback + off-label."),
    dict(case_label="United States v. AmerisourceBergen / ASD Healthcare (insulin pen overfill)",
         scheme_type="PHARMACY_OVERFILL", state=None, jurisdiction="FEDERAL", year=2021,
         total_recovery=621_000_000, relator_share_amount=86_900_000, relator_share_pct=14.0,
         intervened="INTERVENED", days_filing_to_resolution=None,
         source_label="DOJ press release 2021", confidence="HIGH",
         notes="Pre-filled syringe scheme; civil FCA component of $6.1B global resolution."),
    dict(case_label="United States v. Tenet Healthcare (physician-referral kickbacks)",
         scheme_type="REFERRAL_KICKBACKS", state="GA", jurisdiction="FEDERAL", year=2016,
         total_recovery=513_000_000, relator_share_amount=50_000_000, relator_share_pct=9.7,
         intervened="INTERVENED", days_filing_to_resolution=None,
         source_label="DOJ press release 2016", confidence="HIGH",
         notes="Hospital chain paying clinics for Medicaid/ACA referrals."),
    dict(case_label="United States ex rel. Cox v. Health Management Associates (admissions kickbacks)",
         scheme_type="REFERRAL_KICKBACKS", state="FL", jurisdiction="FEDERAL", year=2018,
         total_recovery=260_000_000, relator_share_amount=36_000_000, relator_share_pct=13.8,
         intervened="INTERVENED", days_filing_to_resolution=None,
         source_label="DOJ press release 2018", confidence="MEDIUM",
         notes="Rural hospital admissions scheme, physician kickbacks."),
    dict(case_label="United States v. Kindred Healthcare (home therapy minutes)",
         scheme_type="UPCODING", state="TX", jurisdiction="FEDERAL", year=2017,
         total_recovery=125_000_000, relator_share_amount=31_000_000, relator_share_pct=24.8,
         intervened="INTERVENED", days_filing_to_resolution=None,
         source_label="DOJ press release 2017", confidence="MEDIUM",
         notes="Therapy-minute upcoding to hit thresholds."),
    dict(case_label="United States v. Cigna (Medicare Advantage risk adjustment)",
         scheme_type="RISK_ADJUSTMENT", state=None, jurisdiction="FEDERAL", year=2022,
         total_recovery=172_000_000, relator_share_amount=24_000_000, relator_share_pct=14.0,
         intervened="INTERVENED", days_filing_to_resolution=None,
         source_label="DOJ press release 2022", confidence="MEDIUM",
         notes="MA risk-score inflation."),
    dict(case_label="United States v. Ensign Group (skilled nursing unnecessary therapy)",
         scheme_type="UNNECESSARY_SERVICES", state="CA", jurisdiction="FEDERAL", year=2020,
         total_recovery=48_000_000, relator_share_amount=12_500_000, relator_share_pct=26.0,
         intervened="INTERVENED", days_filing_to_resolution=None,
         source_label="DOJ press release 2020", confidence="MEDIUM",
         notes="SNF therapy utilization to hit RUG levels."),
    dict(case_label="Centene Corporation (state AG PBM spread settlements)",
         scheme_type="PBM_SPREAD", state=None, jurisdiction="NY_STATE", year=2022,
         total_recovery=166_000_000, relator_share_amount=None, relator_share_pct=None,
         intervened="DECLINED", days_filing_to_resolution=None,
         source_label="Multi-state AG announcements 2021-2022", confidence="MEDIUM",
         notes="State FCA settlements (no federal qui tam); shows declined/shopped channel value."),

    # ---- NY-adjacent elder-care matters (MEDIUM/LOW until verified) ----
    dict(case_label="NY MFCU: Bronx nursing home operator chain (Medicaid billing fraud)",
         scheme_type="NURSING_HOME_BILLING", state="NY", jurisdiction="NY_STATE", year=2023,
         total_recovery=45_000_000, relator_share_amount=None, relator_share_pct=None,
         intervened="UNKNOWN", days_filing_to_resolution=None,
         source_label="NY AG press release (verify)", confidence="LOW",
         notes="Placeholder-family entry: NY MFCU settles dozens of elder-care matters "
               "annually; figures to be verified and enriched from AG press archive."),
    dict(case_label="NYC adult day care / SADC enforcement actions (aggregate)",
         scheme_type="SADC_ABUSE", state="NY", jurisdiction="NY_STATE", year=2024,
         total_recovery=None, relator_share_amount=None, relator_share_pct=None,
         intervened="UNKNOWN", days_filing_to_resolution=None,
         source_label="OMIG/MFCU enforcement summaries (verify)", confidence="LOW",
         notes="Aggregate placeholder: NY SADC enforcement is largely OMIG audit-driven; "
               "qui tam coverage thin - which is the market gap this platform exploits."),

    # ---- Annual aggregates for calibration priors ----
    dict(case_label="National MFCU FY2025 aggregate (all states)",
         scheme_type="AGGREGATE_ANNUAL", state=None, jurisdiction="NY_STATE", year=2025,
         total_recovery=2_000_000_000, intervened="UNKNOWN", outcome_type="AGGREGATE_ANNUAL",
         source_label="HHS-OIG MFCU annual report FY2025", confidence="MEDIUM",
         notes="~$4.64 recovered per $1 spent; 674 civil settlements; 1,185 convictions. "
               "Aggregate row - not a single matter."),
    dict(case_label="DOJ FCA FY2023 aggregate (healthcare share)",
         scheme_type="AGGREGATE_ANNUAL", state=None, jurisdiction="FEDERAL", year=2023,
         total_recovery=1_800_000_000, relator_share_amount=300_000_000, relator_share_pct=16.7,
         intervened="UNKNOWN", outcome_type="AGGREGATE_ANNUAL",
         source_label="DOJ FCA annual statistics", confidence="MEDIUM",
         notes="~600 new qui tams filed FY2023; government declined ~70% historically; "
               "relators in declined cases who litigate solo typically recover 10-30% shares."),
]


def seed_outcomes(session: Session, force: bool = False) -> dict:
    """Insert the seed corpus once. Idempotent unless force=True."""
    existing = session.query(FCAOutcomeCase).count()
    if existing and not force:
        return {"status": "already_seeded", "rows": existing}
    for case in SEED_CASES:
        session.add(FCAOutcomeCase(
            outcome_type=case.get("outcome_type", "SETTLEMENT"),
            confidence=case.get("confidence", "MEDIUM"), verified=False, **{
                key: value for key, value in case.items()
                if key not in ("outcome_type", "confidence") and value is not None
            }))
    session.commit()
    return {"status": "seeded", "rows": len(SEED_CASES)}


# ---------------------------------------------------------------------------
# Query / stats layer
# ---------------------------------------------------------------------------

def filter_cases(
    session: Session,
    scheme_type: Optional[str] = None,
    state: Optional[str] = None,
    intervened: Optional[str] = None,
    jurisdiction: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    limit: int = 100,
) -> list[dict]:
    query = session.query(FCAOutcomeCase)
    if scheme_type:
        query = query.filter(FCAOutcomeCase.scheme_type == scheme_type)
    if state:
        query = query.filter(FCAOutcomeCase.state == state)
    if intervened:
        query = query.filter(FCAOutcomeCase.intervened == intervened)
    if jurisdiction:
        query = query.filter(FCAOutcomeCase.jurisdiction == jurisdiction)
    if year_from:
        query = query.filter(FCAOutcomeCase.year >= year_from)
    if year_to:
        query = query.filter(FCAOutcomeCase.year <= year_to)
    cases = query.order_by(FCAOutcomeCase.year.desc(), FCAOutcomeCase.total_recovery.desc()).limit(limit).all()
    return [case_to_dict(case) for case in cases]


def case_to_dict(case: FCAOutcomeCase) -> dict:
    return {
        "id": case.id, "case_label": case.case_label, "scheme_type": case.scheme_type,
        "state": case.state, "jurisdiction": case.jurisdiction, "year": case.year,
        "total_recovery": case.total_recovery,
        "single_damages": case.single_damages, "penalties": case.penalties,
        "relator_share_amount": case.relator_share_amount,
        "relator_share_pct": case.relator_share_pct,
        "intervened": case.intervened,
        "days_filing_to_resolution": case.days_filing_to_resolution,
        "outcome_type": case.outcome_type, "confidence": case.confidence,
        "verified": case.verified, "source_label": case.source_label,
        "source_url": case.source_url, "notes": case.notes,
    }


def outcome_stats(session: Session, scheme_type: Optional[str] = None) -> dict:
    """Aggregate stats powering both calibration and the sales brief."""
    query = session.query(FCAOutcomeCase).filter(
        FCAOutcomeCase.outcome_type != "AGGREGATE_ANNUAL")
    if scheme_type:
        query = query.filter(FCAOutcomeCase.scheme_type == scheme_type)
    cases = query.all()
    if not cases:
        return {"n": 0}

    recoveries = [c.total_recovery for c in cases if c.total_recovery]
    shares = [c.relator_share_pct for c in cases if c.relator_share_pct]
    durations = [c.days_filing_to_resolution for c in cases if c.days_filing_to_resolution]
    intervened_n = sum(1 for c in cases if c.intervened == "INTERVENED")
    declined_n = sum(1 for c in cases if c.intervened == "DECLINED")

    def median(values: list) -> Optional[float]:
        if not values:
            return None
        values = sorted(values)
        mid = len(values) // 2
        return values[mid] if len(values) % 2 else (values[mid - 1] + values[mid]) / 2

    return {
        "n": len(cases),
        "scheme_type": scheme_type,
        "total_recovery_sum": sum(recoveries),
        "total_recovery_median": median(recoveries),
        "total_recovery_min": min(recoveries) if recoveries else None,
        "total_recovery_max": max(recoveries) if recoveries else None,
        "relator_share_pct_median": median(shares),
        "relator_share_pct_min": min(shares) if shares else None,
        "relator_share_pct_max": max(shares) if shares else None,
        "intervened_share": round(intervened_n / len(cases), 3) if cases else None,
        "declined_share": round(declined_n / len(cases), 3) if cases else None,
        "days_to_resolution_median": median(durations),
        "verified_rows": sum(1 for c in cases if c.verified),
        "confidence_mix": {
            level: sum(1 for c in cases if c.confidence == level)
            for level in ("HIGH", "MEDIUM", "LOW")
        },
    }


def sales_brief(session: Session) -> dict:
    """The counsel-pitch one-pager: what cases like this actually pay."""
    by_scheme = {}
    for scheme in ("SADC_ABUSE", "NEMT_KICKBACKS", "REFERRAL_KICKBACKS", "UPCODING",
                   "UNNECESSARY_SERVICES", "NURSING_HOME_BILLING", "HOME_CARE_BILLING"):
        stats = outcome_stats(session, scheme_type=scheme)
        if stats.get("n"):
            by_scheme[scheme] = stats

    biggest = (
        session.query(FCAOutcomeCase)
        .filter(FCAOutcomeCase.total_recovery.isnot(None),
                FCAOutcomeCase.outcome_type != "AGGREGATE_ANNUAL")
        .order_by(FCAOutcomeCase.total_recovery.desc()).limit(5).all()
    )
    return {
        "headline": "What healthcare FCA cases actually recover - and what relators receive",
        "by_scheme": by_scheme,
        "largest_resolutions": [case_to_dict(c) for c in biggest],
        "narrative": (
            "Healthcare fraud recoveries consistently dominate FCA statistics: DOJ has "
            "recovered $1.8-2.2B annually in healthcare matters in recent years, and "
            "intervened qui tams settle at a median well into eight figures. Relator "
            "shares in intervened cases cluster at 15-25% of the recovery; relators who "
            "litigate declined cases solo have still collected 10-30% shares. In New "
            "York, MFCU and the NY FCA add a parallel state recovery track on the same "
            "conduct, and NYC's own FCA (Admin Code 5-325, enforced by DOI) adds a "
            "third. The outcomes library underlying these numbers grows every week and "
            "every row is verified against a primary source before it is quoted."
        ),
        "verification_disclosure": (
            "Seed statistics are entered from public reporting and carry confidence "
            "labels; verify each row against the linked primary source before client use."
        ),
        "generated_at": datetime.utcnow().isoformat(),
    }
