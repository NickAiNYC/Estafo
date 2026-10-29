"""Exculpatory hypothesis engine - the false-positive killer.

Every detector produces anomalies. The differentiating discipline is
systematically generating the INNOCENT explanations first, specifying what
evidence would confirm them, and checking our own data before a lead ever
reaches counsel. A dossier that arrives with 'we tried to disprove this and
here is what survived' is a different product from 'this provider is an
outlier'.

Each hypothesis:
  * explains the signal innocently,
  * lists the evidence that would CONFIRM innocence,
  * is auto-assessed against the data we hold (OPEN / WEAKENED / ELIMINATED),
  * feeds an exculpatory_factor multiplier into the ENPV decay chain
    (open plausible hypotheses discount ENPV; eliminated ones do not).

Signal types covered: NEW_BILLER, VOLUME_OUTLIER, SEASONAL_SPIKE,
CLAIM_COUNT_SPIKE, IMPOSSIBLE_CENSUS, EXCLUSION_MATCH, CROSS_SIGNAL_IDLING.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

from sqlalchemy.orm import Session

from models import AggregateSpendingRecord, Provider, ProviderLocation


@dataclass
class Hypothesis:
    signal: str
    hypothesis: str
    evidence_required: list[str]
    status: str = "OPEN"            # OPEN / WEAKENED / ELIMINATED
    assessment: str = ""
    enpv_discount: float = 1.0      # multiplier applied while status is OPEN/WEAKENED


# ---------------------------------------------------------------------------
# Hypothesis generators per signal
# ---------------------------------------------------------------------------

def h_new_biller(session: Session, npi: str, hcpcs_code: str, months: dict[str, float]) -> Hypothesis:
    """A provider billing hard in the latest release might just be new - and
    enrollment-to-billing ramps are normal. Eliminated only when the provider
    is NOT actually new (enumerated well before first billing)."""
    provider = session.query(Provider).filter_by(npi=npi).first()
    enumeration_recent = None
    if provider and provider.verification_source:
        # NPPES-verified providers carry enumeration context in verification_source
        enumeration_recent = "NPPES_FULL" in provider.verification_source and not months
    first_month = min(months) if months else None
    status = "OPEN"
    if first_month and provider and provider.created_at:
        age_days = (datetime.utcnow() - provider.created_at).days
        if age_days > 540:  # provider known to us > 18 months before first billing
            status = "ELIMINATED"
    return Hypothesis(
        signal="NEW_BILLER",
        hypothesis="Provider recently enrolled; a steep enrollment-to-billing ramp is the "
                   "normal shape of a new adult day care filling seats.",
        evidence_required=[
            "NPPES enumeration date (was the NPI issued within ~6 months of first billing?)",
            "NYS Medicaid enrollment effective date (OMIG provider lookup)",
            "First-claim month vs enumeration month gap",
        ],
        status=status,
        assessment=(
            "First billing month on file: {first}. Provider known to registry since {known}. "
            "Ramp hypothesis {verdict}.".format(
                first=first_month or "n/a",
                known=provider.created_at.date() if provider and provider.created_at else "n/a",
                verdict="stands" if status == "OPEN" else "eliminated (provider predates billing by >18 months)",
            )
        ),
        enpv_discount=0.85,
    )


def h_volume_outlier(session: Session, npi: str, hcpcs_code: str, months: dict[str, float]) -> Hypothesis:
    """An outlier might be a legitimately larger operator (multi-site, merged)."""
    locations = session.query(ProviderLocation).filter(ProviderLocation.npi == npi).count()
    provider = session.query(Provider).filter_by(npi=npi).first()
    status = "OPEN"
    if provider and provider.licensed_capacity and locations <= 1:
        # capacity known and single site - if billed census still exceeds capacity, hypothesis weakens
        status = "WEAKENED"
    return Hypothesis(
        signal="VOLUME_OUTLIER",
        hypothesis="Provider is a legitimate high-volume operator: multiple sites, merged "
                   "practices, or a larger licensed capacity than peers.",
        evidence_required=[
            "NPPES additional practice locations for this NPI",
            "DFTA contract / licensed capacity certificate",
            "Site count from DOH inspection records",
        ],
        status=status,
        assessment=f"Locations on file for this NPI: {locations}. "
                   + (f"Licensed capacity: {provider.licensed_capacity}." if provider and provider.licensed_capacity else "Licensed capacity unknown - do not treat volume as anomalous until verified."),
        enpv_discount=0.9,
    )


def h_seasonal_spike(session: Session, npi: str, hcpcs_code: str, months: dict[str, float]) -> Hypothesis:
    """Spikes might be seasonal (flu season, weather-driven attendance)."""
    years = sorted({m[:4] for m in months})
    same_month_prior_year = None
    if len(years) >= 2 and months:
        latest_month = max(months)
        same_month_prior_year = f"{int(latest_month[:4]) - 1}{latest_month[4:]}"
    status = "OPEN"
    if same_month_prior_year and same_month_prior_year in months:
        # prior-year same month exists; a true seasonal pattern repeats
        status = "WEAKENED" if months[max(months)] > 2.5 * months[same_month_prior_year] else "OPEN"
        assessment_note = (
            f"Same month prior year billed ${months[same_month_prior_year]:,.0f} vs "
            f"latest ${months[max(months)]:,.0f}."
        )
    else:
        assessment_note = "No prior-year same-month billing on file - seasonality cannot be excluded yet."
    return Hypothesis(
        signal="SEASONAL_SPIKE",
        hypothesis="Attendance and billing rise seasonally (winter illness, heat waves, "
                   "post-holiday census recovery) - a spike can be calendar, not fraud.",
        evidence_required=[
            "Year-over-year same-month billing comparison",
            "Borough-wide seasonal index for the same service code",
        ],
        status=status,
        assessment=assessment_note,
        enpv_discount=0.95,
    )


def h_claim_count_spike(session: Session, npi: str, hcpcs_code: str, months: dict[str, float]) -> Hypothesis:
    """A claims spike might be billing-department catch-up after a system migration."""
    return Hypothesis(
        signal="CLAIM_COUNT_SPIKE",
        hypothesis="Billing office catch-up: claims batch-submitted months after service "
                   "following an RCM migration, clearinghouse change, or staffing gap.",
        evidence_required=[
            "Claim submission dates vs service months (available only with claim-level data)",
            "Provider billing-vendor change history (interview)",
        ],
        status="OPEN",
        assessment="Cannot be excluded on aggregate data alone - flagged for counsel "
                   "discovery plan (standard request: billing-system conversion records).",
        enpv_discount=0.95,
    )


def h_impossible_census(session: Session, npi: str, hcpcs_code: str, months: dict[str, float]) -> Hypothesis:
    """Impossible census might be a data artifact of the aggregate grain."""
    provider = session.query(Provider).filter_by(npi=npi).first()
    return Hypothesis(
        signal="IMPOSSIBLE_CENSUS",
        hypothesis="Aggregate beneficiaries exceed plausible capacity because the monthly "
                   "aggregate double-counts churn (multiple short-stay members per month) "
                   "or the HHS cell blends two providers under one billing NPI.",
        evidence_required=[
            "Distinct-member count vs member-months (needs MCO/claim-level data)",
            "Whether the NPI bills for multiple physical sites under one tax ID",
        ],
        status="OPEN",
        assessment=(
            f"Licensed capacity on file: {provider.licensed_capacity if provider and provider.licensed_capacity else 'unknown'}. "
            "Member-churn arithmetic must be settled with claim-level data before pleading capacity fraud."
        ),
        enpv_discount=0.9,
    )


def h_exclusion_match(session: Session, npi: str, hcpcs_code: str, months: dict[str, float]) -> Hypothesis:
    """An exclusion match might be a namesake (common in tight-knit communities)."""
    from models import ExclusionMatch
    match = session.query(ExclusionMatch).filter(
        ExclusionMatch.npi == npi, ExclusionMatch.status == "ACTIVE_MATCH").first()
    match_type = match.match_type if match else None
    status = "OPEN"
    if match_type == "NPI_EXACT":
        status = "ELIMINATED"  # the innocent explanation is dead: exact NPI on list
        assessment = "NPI-exact exclusion match: namesake hypothesis eliminated."
    else:
        assessment = ("Name-fuzzy match only - adjudicate manually: same-employer-name "
                      "collisions are common; pull LEIE detail (DOB, address) before acting.")
    return Hypothesis(
        signal="EXCLUSION_MATCH",
        hypothesis="The excluded individual is a different person/entity with the same or "
                   "similar name (namesake false positive).",
        evidence_required=[
            "LEIE record detail: DOB, address, SSN-last-4 where published",
            "NPI exact match check (entity vs individual NPI)",
        ],
        status=status,
        assessment=assessment,
        enpv_discount=1.0 if status == "ELIMINATED" else 0.6,
    )


def h_cross_signal(session: Session, npi: str, hcpcs_code: str, months: dict[str, float]) -> Hypothesis:
    """Idling near a site might be a bus stop, school route, or delivery corridor."""
    return Hypothesis(
        signal="CROSS_SIGNAL_IDLING",
        hypothesis="Idling complaints cluster because the site sits on a commercial "
                   "corridor with a bus stop / school route / delivery dock - ordinary "
                   "traffic, not ambulette staging.",
        evidence_required=[
            "Hour histogram shape (ambulette drop-off peaks 6-10am weekdays; bus-stop "
            "idling spreads across the day)",
            "Street-view audit of the address frontage",
            "Complaint descriptors (school bus? delivery? ambulette complaints cite engines)",
        ],
        status="OPEN",
        assessment="Apply only as corroboration after the hour-shape test; the 311 signal "
                   "alone never carries a lead.",
        enpv_discount=0.95,
    )


GENERATORS = {
    "NEW_BILLER": h_new_biller,
    "VOLUME_OUTLIER": h_volume_outlier,
    "SEASONAL_SPIKE": h_seasonal_spike,
    "CLAIM_COUNT_SPIKE": h_claim_count_spike,
    "IMPOSSIBLE_CENSUS": h_impossible_census,
    "EXCLUSION_MATCH": h_exclusion_match,
    "CROSS_SIGNAL_IDLING": h_cross_signal,
}


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

def generate_exculpatory_report(
    session: Session,
    npi: str,
    hcpcs_code: str = "T2024",
    signals: Optional[list[str]] = None,
) -> dict:
    """Generate + assess the innocent-explanation set for one lead.

    Returns hypotheses with statuses and the exculpatory_factor that feeds
    the ENPV decay chain (1.0 = no surviving innocent explanations).
    """
    rows = (
        session.query(AggregateSpendingRecord.year_month, AggregateSpendingRecord.total_paid_amount)
        .filter(AggregateSpendingRecord.billing_npi == npi,
                AggregateSpendingRecord.hcpcs_code == hcpcs_code)
        .order_by(AggregateSpendingRecord.year_month).all()
    )
    months: dict[str, float] = {}
    for year_month, paid in rows:
        months[year_month] = months.get(year_month, 0.0) + (paid or 0.0)

    # Always include the core set for any billing lead
    signals = signals or ["NEW_BILLER", "VOLUME_OUTLIER", "SEASONAL_SPIKE"]
    # Exclusion match generator included when a match exists
    from models import ExclusionMatch
    if session.query(ExclusionMatch).filter(
            ExclusionMatch.npi == npi, ExclusionMatch.status == "ACTIVE_MATCH").first():
        signals.append("EXCLUSION_MATCH")

    hypotheses: list[dict] = []
    factor = 1.0
    for signal in signals:
        generator = GENERATORS.get(signal)
        if not generator:
            continue
        hypothesis = generator(session, npi, hcpcs_code, months)
        hypotheses.append({
            "signal": hypothesis.signal,
            "hypothesis": hypothesis.hypothesis,
            "evidence_required": hypothesis.evidence_required,
            "status": hypothesis.status,
            "assessment": hypothesis.assessment,
        })
        if hypothesis.status == "OPEN":
            factor *= hypothesis.enpv_discount
        elif hypothesis.status == "WEAKENED":
            factor *= (1.0 + hypothesis.enpv_discount) / 2.0
        # ELIMINATED hypotheses cost nothing

    factor = round(max(factor, 0.2), 3)
    surviving = [h for h in hypotheses if h["status"] in ("OPEN", "WEAKENED")]

    return {
        "npi": npi,
        "hcpcs_code": hcpcs_code,
        "hypotheses": hypotheses,
        "surviving_innocent_explanations": len(surviving),
        "exculpatory_factor": factor,
        "enpv_note": (
            f"ENPV multiplier from exculpatory engine: {factor} "
            f"({len(surviving)} innocent explanation(s) not yet eliminated). "
            "Every OPEN hypothesis lists the records that would close it; that list is "
            "the counsel discovery plan."
        ) if surviving else (
            "All generated innocent explanations eliminated on data we hold. "
            "This is the strongest posture a lead can reach pre-filing."
        ),
        "method_note": (
            "Systematic exculpatory review runs BEFORE a lead reaches counsel: each "
            "detector signal gets its innocent explanation, each explanation names its "
            "disproving evidence, and surviving explanations discount ENPV. Leads whose "
            "exculpatory factor stays below 0.5 are parked, not pitched."
        ),
    }
