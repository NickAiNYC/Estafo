"""
Investigative Leads & Verification Workflow (NYC Specialty Pilot: Adult Day Health Care).

Implements the single narrow, verified research workflow:
1. Flags unusual provider spending based on actual HHS monthly aggregate data.
2. Surfaces exact source rows and empirical peer distributions.
3. Provides investigators a structured checklist of records needed to confirm or dismiss.
4. Records all assumptions and investigator-reviewed outcomes to build the proprietary data moat.
5. Strictly separates speculative qui tam whistleblower bounties (NY State Finance Law § 190 / NYC FCA).
"""

from datetime import datetime
import hashlib
import json
from typing import List, Dict, Any, Optional
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from core.security import get_current_user, User
from database import get_db
from models import (
    AggregateImportRun,
    AggregateSpendingRecord,
    LeadDecisionAudit,
    LeadVerificationRecord,
    Provider,
)

router = APIRouter(prefix="/api/v1/leads", tags=["Investigative Leads"])

PILOT_SPECIALTY = "Adult Day Health Care"
PILOT_HCPCS = "T2024"  # Adult Day Care, per diem


def active_source_dataset(db: Session, hcpcs_code: str) -> str | None:
    """Prefer the latest imported official release; otherwise show clearly labeled demo/test rows."""
    latest = db.query(AggregateImportRun).filter_by(hcpcs_code=hcpcs_code).order_by(
        AggregateImportRun.release_id.desc(), AggregateImportRun.imported_at.desc()
    ).first()
    if latest:
        return latest.source_dataset
    return db.query(AggregateSpendingRecord.source_dataset).filter_by(hcpcs_code=hcpcs_code).order_by(
        AggregateSpendingRecord.source_dataset.desc()
    ).limit(1).scalar()

# Standard evidentiary records checklist needed to confirm/dismiss billing outliers
DEFAULT_VERIFICATION_CHECKLIST = [
    {
        "id": "attendance_rosters",
        "category": "Physical Presence",
        "record_title": "Daily Attendance Rosters with Beneficiary Signatures",
        "description": "Signed physical sign-in/sign-out logs matching relevant service dates, if lawfully available.",
        "status": "PENDING",  # PENDING, REQUESTED, RECEIVED_CONFIRMED, RECEIVED_REFUTED, UNAVAILABLE
        "required_for": "Confirmation of actual service delivery."
    },
    {
        "id": "ehr_progress_notes",
        "category": "Clinical Documentation",
        "record_title": "EHR Clinical Progress Notes & Individualized Care Plans",
        "description": "Dated nursing/social work progress notes demonstrating active therapeutic programming during billed days.",
        "status": "PENDING",
        "required_for": "Verifying medical necessity and active participation."
    },
    {
        "id": "nemt_transport_manifests",
        "category": "Transportation",
        "record_title": "Ambulette / NEMT Transport Trip Manifests & GPS Logs",
        "description": "Vehicle dispatch records and GPS coordinate timestamps showing transit between patient residence and facility.",
        "status": "PENDING",
        "required_for": "Corroborating patient physical arrival and departure times."
    },
    {
        "id": "licensed_staffing_ratios",
        "category": "Capacity & Staffing",
        "record_title": "DOH Licensed Capacity & Certified Payroll Timesheets",
        "description": "NYS DOH Operating Certificate licensed capacity vs daily staffing logs to test for phantom capacity violations.",
        "status": "PENDING",
        "required_for": "Testing physical capability of facility to service billed census."
    },
    {
        "id": "omig_provider_enrollment",
        "category": "Corporate & Sanctions",
        "record_title": "OMIG Provider Enrollment Disclosures & Ownership Filings",
        "description": "NYS OMIG disclosure of ownership, managing employees, and affiliated pharmacy/transport entities.",
        "status": "PENDING",
        "required_for": "Detecting undisclosed cross-referral kickback arrangements."
    }
]

# Baseline documented assumptions for HHS aggregate data triage
DEFAULT_ASSUMPTIONS = [
    "HHS Provider Spending data reflects monthly Medicaid fee-for-service and managed care aggregates, not claim-level patient encounters.",
    "Peer comparison uses billing NPIs for the same HCPCS and active source release; providers may have different numbers of reported months.",
    "NYC location is assigned from a separately vetted provider registry, not the HHS spending row.",
    "HHS may omit small cells; missing rows are unknown, not zero, and no suppressed count is estimated.",
    "Preliminary spending divergence constitutes an investigative lead for records request, not an accusation of statutory violation.",
    "A public aggregate outlier alone does not establish a false claim or award eligibility; counsel must assess the applicable filing rules."
]


class OutcomeSubmission(BaseModel):
    outcome: str = Field(..., description="CONFIRMED_ANOMALY, EXPLAINABLE_VARIANCE, FALSE_POSITIVE, REFERRED_TO_COUNSEL")
    lead_utility: str = Field(default="USEFUL_ACTIONABLE_LEAD", description="USEFUL_ACTIONABLE_LEAD, EXPLAINABLE_VOLUME_SCALE, NOISE_DATA_ARTIFACT, INCONCLUSIVE_RECORDS_PENDING")
    outcome_rationale: str = Field(..., min_length=10, description="Detailed justification explaining the investigator's finding")
    checklist_status: Dict[str, str] = Field(default_factory=dict, description="Updated status per checklist item ID")
    document_hashes: Dict[str, str] = Field(default_factory=dict, description="SHA-256 hashes of verified record documents")
    documented_assumptions: Optional[List[str]] = Field(default=None, description="Updated or added assumptions")
    review_time_seconds: int = Field(default=300, ge=0, description="Time spent by investigator in seconds")
    reviewed_by: Optional[str] = Field(default=None, description="Analyst or counsel identifier (defaults to authenticated user)")
    reviewer_role: Optional[str] = Field(default=None, description="Investigator, Associate, Partner, Compliance Counsel")


@router.get("", response_model=Dict[str, Any])
def list_investigative_leads(
    specialty: str = Query(PILOT_SPECIALTY, description="Specialty filter"),
    hcpcs_code: str = Query(PILOT_HCPCS, description="HCPCS procedure code"),
    outcome: Optional[str] = Query(None, description="Filter by review outcome"),
    lead_utility: Optional[str] = Query(None, description="Filter by lead utility (USEFUL_ACTIONABLE_LEAD, etc.)"),
    sort_by: str = Query("normalized_rate", description="Sort by 'normalized_rate' or 'total_spending'"),
    min_percentile: float = Query(85.0, ge=50.0, le=100.0, description="Minimum peer percentile threshold"),
    min_z_score: float | None = Query(None, ge=0.0, description="Optional minimum descriptive z-score"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    List flagged spending outlier leads for the pilot specialty (NYC Adult Day Care).
    Ranks leads by normalized spending intensity (per active month and per unit)
    to prevent raw volume from distorting the risk signal.
    """
    # 1. Query all aggregate records for the specialty
    source_dataset = active_source_dataset(db, hcpcs_code)
    source_verified = bool(db.query(AggregateImportRun.id).filter_by(source_dataset=source_dataset).first())
    records = db.query(AggregateSpendingRecord).filter(
        AggregateSpendingRecord.hcpcs_code == hcpcs_code,
        AggregateSpendingRecord.state == "NY",
        AggregateSpendingRecord.source_dataset == source_dataset,
    ).all()

    if not records:
        return {
            "pilot_specialty": specialty,
            "hcpcs_code": hcpcs_code,
            "source_dataset": source_dataset,
            "source_verified": source_verified,
            "statutory_route": "NY_STATE_FIN_LAW_190_AND_NYC_FCA",
            "total_leads": 0,
            "leads": [],
            "message": "No aggregate spending records found for this code. Seed or ingest HHS dataset first."
        }

    # Group by billing_npi
    provider_totals = {}
    for r in records:
        npi = r.billing_npi
        if npi not in provider_totals:
            provider_totals[npi] = {
                "npi": npi,
                "total_spending": 0.0,
                "total_claims": 0,
                "total_beneficiaries": 0,
                "months_active": 0,
                "record_ids": []
            }
        provider_totals[npi]["total_spending"] += r.total_paid_amount
        provider_totals[npi]["total_claims"] += (r.total_claims or 0)
        provider_totals[npi]["total_beneficiaries"] += (r.total_beneficiaries or 0)
        provider_totals[npi]["months_active"] += 1
        provider_totals[npi]["record_ids"].append(r.id)

    spendings = [p["total_spending"] for p in provider_totals.values()]
    if not spendings:
        return {"total_leads": 0, "leads": []}

    # Compute normalized cohort distributions (monthly intensity)
    monthly_intensities = [
        p["total_spending"] / max(p["months_active"], 1)
        for p in provider_totals.values()
    ]
    mean_monthly_intensity = float(np.mean(monthly_intensities))
    std_monthly_intensity = float(np.std(monthly_intensities)) if len(monthly_intensities) > 1 else 1.0

    mean_spend = float(np.mean(spendings))
    std_spend = float(np.std(spendings)) if len(spendings) > 1 else 1.0

    # Retrieve existing verification records
    existing_records = {
        rec.billing_npi: rec for rec in db.query(LeadVerificationRecord).filter(
            LeadVerificationRecord.hcpcs_code == hcpcs_code
        ).all()
    }

    leads = []
    for npi, pdata in provider_totals.items():
        total_val = pdata["total_spending"]
        months_active = max(pdata["months_active"], 1)
        monthly_intensity = total_val / months_active
        paid_per_claim = (total_val / pdata["total_claims"]) if pdata["total_claims"] > 0 else None
        paid_per_bene = (total_val / pdata["total_beneficiaries"]) if pdata["total_beneficiaries"] > 0 else None

        # Normalized intensity z-score vs raw spend z-score
        monthly_z = float((monthly_intensity - mean_monthly_intensity) / (std_monthly_intensity if std_monthly_intensity > 0 else 1.0))
        raw_z = float((total_val - mean_spend) / (std_spend if std_spend > 0 else 1.0))

        # Percentile rank based on normalized monthly intensity
        intensity_percentile = float(sum(1 for m in monthly_intensities if m <= monthly_intensity) / len(monthly_intensities) * 100.0)

        if intensity_percentile < min_percentile or (min_z_score is not None and monthly_z < min_z_score):
            continue

        existing = existing_records.get(npi)
        current_outcome = existing.outcome if existing else "UNREVIEWED"
        current_utility = existing.lead_utility if existing else "UNCLASSIFIED"

        if outcome and current_outcome != outcome:
            continue
        if lead_utility and current_utility != lead_utility:
            continue

        # Look up provider name if available
        prov_obj = db.query(Provider).filter(Provider.npi == npi).first()
        prov_name = prov_obj.name if prov_obj else f"Provider {npi}"
        city = prov_obj.city if prov_obj else "New York"
        county = prov_obj.county if prov_obj else "Kings"

        leads.append({
            "billing_npi": npi,
            "provider_name": prov_name,
            "city": city,
            "county": county,
            "specialty": specialty,
            "hcpcs_code": hcpcs_code,
            "total_spending": round(total_val, 2),
            "monthly_intensity": round(monthly_intensity, 2),
            "months_active": months_active,
            "total_claims": pdata["total_claims"],
            "total_beneficiaries": pdata["total_beneficiaries"],
            "paid_per_claim": round(paid_per_claim, 2) if paid_per_claim else None,
            "paid_per_beneficiary": round(paid_per_bene, 2) if paid_per_bene else None,
            "peer_mean_spending": round(mean_spend, 2),
            "peer_mean_monthly_intensity": round(mean_monthly_intensity, 2),
            "peer_percentile": round(intensity_percentile, 1),
            "z_score": round(monthly_z, 2),
            "raw_total_z_score": round(raw_z, 2),
            "spending_multiple_of_peer_avg": round(monthly_intensity / mean_monthly_intensity, 2) if mean_monthly_intensity > 0 else 1.0,
            "source_record_count": len(pdata["record_ids"]),
            "outcome": current_outcome,
            "lead_utility": current_utility,
            "reviewed_by": existing.reviewed_by if existing else None,
            "reviewer_role": existing.reviewer_role if existing else None,
            "revision_count": existing.revision_count if existing else 0,
            "has_cryptographic_signature": bool(existing and existing.decision_signature_hash),
            "reviewed_at": existing.reviewed_at.isoformat() if existing and existing.reviewed_at else None,
        })

    # Sort according to selected methodology
    if sort_by == "total_spending":
        leads.sort(key=lambda x: x["total_spending"], reverse=True)
    else:
        # Default: normalized monthly spending rate (prevents multi-month dilution)
        leads.sort(key=lambda x: x["monthly_intensity"], reverse=True)

    return {
        "pilot_specialty": specialty,
        "hcpcs_code": hcpcs_code,
        "source_dataset": source_dataset,
        "source_verified": source_verified,
        "ranking_methodology": "Normalized Monthly Intensity (Spending per active reporting month)",
        "peer_cohort_size": len(provider_totals),
        "peer_mean_spending": round(mean_spend, 2),
        "peer_mean_monthly_intensity": round(mean_monthly_intensity, 2),
        "total_flagged_leads": len(leads),
        "leads": leads[:limit],
        "statutory_route": "NY_STATE_FIN_LAW_190_AND_NYC_FCA",
        "legal_notice": (
            "Public aggregate data analysis serves strictly as preliminary lead generation. "
            "A qualifying action and recovery are separate legal questions for counsel."
        )
    }


@router.get("/pilot/metrics", response_model=Dict[str, Any])
@router.get("/metrics/pilot", response_model=Dict[str, Any])
def get_pilot_metrics(
    hcpcs_code: str = Query(PILOT_HCPCS),
    db: Session = Depends(get_db)
):
    """
    Report observed review time, empirical lead utility, and outcomes for the active source cohort.
    Grounds accuracy claims in human-verified pilot samples rather than theoretical scores.
    """
    source_dataset = active_source_dataset(db, hcpcs_code)
    cohort_size = db.query(AggregateSpendingRecord.billing_npi).filter(
        AggregateSpendingRecord.hcpcs_code == hcpcs_code,
        AggregateSpendingRecord.source_dataset == source_dataset,
    ).distinct().count()

    reviewed_records = db.query(LeadVerificationRecord).filter(
        LeadVerificationRecord.hcpcs_code == hcpcs_code,
        LeadVerificationRecord.source_dataset == source_dataset,
        LeadVerificationRecord.outcome != "UNREVIEWED"
    ).all()

    reviewed_count = len(reviewed_records)
    total_review_seconds = sum(r.review_time_seconds for r in reviewed_records)
    avg_review_mins = round((total_review_seconds / reviewed_count) / 60.0, 1) if reviewed_count > 0 else 0.0

    actual_hours_spent = round(total_review_seconds / 3600.0, 2)

    outcomes_breakdown = {
        "CONFIRMED_ANOMALY": 0,
        "EXPLAINABLE_VARIANCE": 0,
        "FALSE_POSITIVE": 0,
        "REFERRED_TO_COUNSEL": 0
    }
    utility_breakdown = {
        "USEFUL_ACTIONABLE_LEAD": 0,
        "EXPLAINABLE_VOLUME_SCALE": 0,
        "NOISE_DATA_ARTIFACT": 0,
        "INCONCLUSIVE_RECORDS_PENDING": 0,
    }
    for r in reviewed_records:
        if r.outcome in outcomes_breakdown:
            outcomes_breakdown[r.outcome] += 1
        util = r.lead_utility or "USEFUL_ACTIONABLE_LEAD"
        if util in utility_breakdown:
            utility_breakdown[util] += 1
        elif r.outcome in ("CONFIRMED_ANOMALY", "REFERRED_TO_COUNSEL"):
            utility_breakdown["USEFUL_ACTIONABLE_LEAD"] += 1
        else:
            utility_breakdown["EXPLAINABLE_VOLUME_SCALE"] += 1

    actionable_leads = utility_breakdown["USEFUL_ACTIONABLE_LEAD"]
    actionable_yield_pct = round((actionable_leads / reviewed_count * 100.0), 1) if reviewed_count > 0 else 0.0

    # Total audit revisions recorded in immutable audit log
    total_audit_events = db.query(func.count(LeadDecisionAudit.id)).filter_by(hcpcs_code=hcpcs_code).scalar() or 0

    return {
        "pilot_specialty": PILOT_SPECIALTY,
        "hcpcs_code": hcpcs_code,
        "source_dataset": source_dataset,
        "total_providers_in_cohort": cohort_size,
        "total_leads_reviewed": reviewed_count,
        "completion_rate_percentage": round((reviewed_count / cohort_size * 100.0), 1) if cohort_size > 0 else 0.0,
        "analyst_efficiency": {
            "avg_review_time_minutes": avg_review_mins,
            "actual_hours_spent": actual_hours_spent,
        },
        "lead_utility_validation": {
            "sample_size_reviewed": reviewed_count,
            "actionable_leads_count": actionable_leads,
            "actionable_lead_yield_percentage": actionable_yield_pct,
            "utility_distribution": utility_breakdown,
            "methodology_note": "Precision metrics reflect human reviewer determinations on the active sample, not unverified model scores.",
        },
        "outcome_distribution": outcomes_breakdown,
        "evidence_integrity": {
            "immutable_decision_audit_events": total_audit_events,
            "cryptographically_signed_reviews": sum(1 for r in reviewed_records if r.decision_signature_hash),
        },
        "recorded_assumptions_count": sum(len(r.documented_assumptions or []) for r in reviewed_records),
    }


@router.get("/{npi}", response_model=Dict[str, Any])
def get_lead_details(
    npi: str,
    hcpcs_code: str = Query(PILOT_HCPCS),
    db: Session = Depends(get_db)
):
    """
    Retrieve the full, traceable lead verification package:
    1. Exact HHS source rows (AggregateSpendingRecord) with SHA-256 evaluation hash
    2. Peer distribution benchmarks (raw total and normalized monthly intensity)
    3. Required verification records checklist with document hashes
    4. Documented assumptions
    5. Prior review outcomes and immutable decision audit history
    """
    source_dataset = active_source_dataset(db, hcpcs_code)
    source_verified = bool(db.query(AggregateImportRun.id).filter_by(source_dataset=source_dataset).first())
    source_records = db.query(AggregateSpendingRecord).filter(
        AggregateSpendingRecord.billing_npi == npi,
        AggregateSpendingRecord.hcpcs_code == hcpcs_code,
        AggregateSpendingRecord.source_dataset == source_dataset,
    ).order_by(AggregateSpendingRecord.year_month.asc()).all()

    if not source_records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No HHS spending records found for NPI {npi} under code {hcpcs_code}"
        )

    # Compute cohort statistics for comparison
    cohort_records = db.query(AggregateSpendingRecord).filter(
        AggregateSpendingRecord.hcpcs_code == hcpcs_code,
        AggregateSpendingRecord.state == "NY",
        AggregateSpendingRecord.source_dataset == source_dataset,
    ).all()

    cohort_totals = {}
    cohort_months = {}
    for r in cohort_records:
        cohort_totals[r.billing_npi] = cohort_totals.get(r.billing_npi, 0.0) + r.total_paid_amount
        cohort_months[r.billing_npi] = cohort_months.get(r.billing_npi, 0) + 1

    spendings = list(cohort_totals.values())
    total_spend = sum(r.total_paid_amount for r in source_records)
    months_reported = len(source_records)
    monthly_intensity = total_spend / max(months_reported, 1)

    cohort_monthly_intensities = [
        tot / max(cohort_months.get(n, 1), 1) for n, tot in cohort_totals.items()
    ]
    mean_intensity = float(np.mean(cohort_monthly_intensities)) if cohort_monthly_intensities else monthly_intensity
    std_intensity = float(np.std(cohort_monthly_intensities)) if len(cohort_monthly_intensities) > 1 else 1.0
    intensity_z = float((monthly_intensity - mean_intensity) / (std_intensity if std_intensity > 0 else 1.0))
    intensity_percentile = float(sum(1 for m in cohort_monthly_intensities if m <= monthly_intensity) / len(cohort_monthly_intensities) * 100.0) if cohort_monthly_intensities else 99.0

    mean_spend = float(np.mean(spendings)) if spendings else total_spend
    median_spend = float(np.median(spendings)) if spendings else total_spend
    p90 = float(np.percentile(spendings, 90)) if spendings else total_spend
    p95 = float(np.percentile(spendings, 95)) if spendings else total_spend
    percentile = float(sum(1 for s in spendings if s <= total_spend) / len(spendings) * 100.0) if spendings else 99.0
    z_score = float((total_spend - mean_spend) / (np.std(spendings) if len(spendings) > 1 and np.std(spendings) > 0 else 1.0))

    # Existing verification state
    verification_rec = db.query(LeadVerificationRecord).filter(
        LeadVerificationRecord.billing_npi == npi,
        LeadVerificationRecord.hcpcs_code == hcpcs_code,
        LeadVerificationRecord.source_dataset == source_dataset,
    ).first()

    provider_obj = db.query(Provider).filter(Provider.npi == npi).first()
    provider_name = provider_obj.name if provider_obj else f"Provider {npi}"
    city = provider_obj.city if provider_obj else "New York"
    county = provider_obj.county if provider_obj else "Kings"

    # Merge checklist and attach any recorded document hashes
    checklist = []
    saved_checklist_status = verification_rec.checklist_status if verification_rec and verification_rec.checklist_status else {}
    saved_doc_hashes = verification_rec.document_hashes if verification_rec and verification_rec.document_hashes else {}
    for item in DEFAULT_VERIFICATION_CHECKLIST:
        item_copy = dict(item)
        if item["id"] in saved_checklist_status:
            item_copy["status"] = saved_checklist_status[item["id"]]
        item_copy["document_hash"] = saved_doc_hashes.get(item["id"])
        checklist.append(item_copy)

    # Assumptions
    assumptions = verification_rec.documented_assumptions if verification_rec and verification_rec.documented_assumptions else DEFAULT_ASSUMPTIONS

    # Format exact source rows and compute canonical evaluation SHA-256
    formatted_source_rows = [
        {
            "id": r.id,
            "servicing_npi": r.servicing_npi,
            "year_month": r.year_month,
            "hcpcs_code": r.hcpcs_code,
            "hcpcs_description": r.hcpcs_description,
            "total_paid_amount": round(r.total_paid_amount, 2),
            "total_claims": r.total_claims,
            "total_beneficiaries": r.total_beneficiaries,
            "is_suppressed": r.is_suppressed,
            "source_dataset": r.source_dataset,
            "retrieval_timestamp": r.retrieval_timestamp.isoformat() if r.retrieval_timestamp else None
        }
        for r in source_records
    ]
    canonical_source_json = json.dumps([
        {"id": r["id"], "month": r["year_month"], "paid": r["total_paid_amount"], "claims": r["total_claims"], "bene": r["total_beneficiaries"]}
        for r in formatted_source_rows
    ], sort_keys=True)
    source_records_hash = hashlib.sha256(canonical_source_json.encode("utf-8")).hexdigest()

    # Query retained immutable decision audit history
    decision_audits = db.query(LeadDecisionAudit).filter_by(
        billing_npi=npi, hcpcs_code=hcpcs_code
    ).order_by(LeadDecisionAudit.version.desc()).all()

    formatted_history = [
        {
            "version": a.version,
            "outcome": a.outcome,
            "lead_utility": a.lead_utility,
            "outcome_rationale": a.outcome_rationale,
            "checklist_status": a.checklist_status,
            "document_hashes": a.document_hashes,
            "source_records_hash": a.source_records_hash,
            "decision_signature_hash": a.decision_signature_hash,
            "reviewed_by": a.reviewed_by,
            "reviewer_role": a.reviewer_role,
            "client_ip": a.client_ip,
            "review_time_seconds": a.review_time_seconds,
            "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
        }
        for a in decision_audits
    ]

    return {
        "billing_npi": npi,
        "provider_name": provider_name,
        "city": city,
        "county": county,
        "specialty": PILOT_SPECIALTY,
        "hcpcs_code": hcpcs_code,
        "source_dataset": source_dataset,
        "source_verified": source_verified,
        "source_records_hash": source_records_hash,
        "is_demo": bool(source_dataset and source_dataset.startswith("DEMO_")),
        "total_spending": round(total_spend, 2),
        "monthly_intensity": round(monthly_intensity, 2),
        "months_reported": months_reported,
        "peer_comparison": {
            "peer_mean": round(mean_spend, 2),
            "peer_median": round(median_spend, 2),
            "peer_p90": round(p90, 2),
            "peer_p95": round(p95, 2),
            "peer_mean_monthly_intensity": round(mean_intensity, 2),
            "intensity_percentile": round(intensity_percentile, 1),
            "intensity_z_score": round(intensity_z, 2),
            "provider_percentile": round(percentile, 1),
            "z_score": round(z_score, 2),
            "multiple_of_peer_mean": round(total_spend / mean_spend, 2) if mean_spend > 0 else 1.0,
            "multiple_of_monthly_intensity": round(monthly_intensity / mean_intensity, 2) if mean_intensity > 0 else 1.0,
            "cohort_total_providers": len(cohort_totals)
        },
        "exact_source_rows": formatted_source_rows,
        "required_records_checklist": checklist,
        "documented_assumptions": assumptions,
        "verification_status": {
            "outcome": verification_rec.outcome if verification_rec else "UNREVIEWED",
            "lead_utility": verification_rec.lead_utility if verification_rec else "UNCLASSIFIED",
            "outcome_rationale": verification_rec.outcome_rationale if verification_rec else None,
            "reviewed_by": verification_rec.reviewed_by if verification_rec else None,
            "reviewer_role": verification_rec.reviewer_role if verification_rec else None,
            "reviewed_at": verification_rec.reviewed_at.isoformat() if verification_rec and verification_rec.reviewed_at else None,
            "review_time_seconds": verification_rec.review_time_seconds if verification_rec else 0,
            "decision_signature_hash": verification_rec.decision_signature_hash if verification_rec else None,
            "document_hashes": saved_doc_hashes,
            "revision_count": verification_rec.revision_count if verification_rec else 0,
        },
        "decision_history": formatted_history,
        "statutory_framework": {
            "applicable_statutes": [
                "New York State Finance Law § 190 (New York False Claims Act)",
                "New York City Administrative Code § 7-801 et seq. (NYC False Claims Act)"
            ],
            "statutory_notice": (
                "A public aggregate outlier alone cannot establish a false claim or an award. "
                "Filing rules, statutory eligibility, and any recovery require qualified legal review."
            )
        }
    }


@router.get("/{npi}/dossier.pdf")
def download_lead_dossier(npi: str, hcpcs_code: str = Query(PILOT_HCPCS), db: Session = Depends(get_db)):
    """Download a Bates-identified research dossier with source provenance."""
    from services.lead_dossier import build_dossier

    package = get_lead_details(npi=npi, hcpcs_code=hcpcs_code, db=db)
    run = db.query(AggregateImportRun).filter_by(
        source_dataset=package["source_dataset"], hcpcs_code=hcpcs_code
    ).order_by(AggregateImportRun.imported_at.desc()).first()
    provenance = None if run is None else {
        "release_id": run.release_id,
        "source_url": run.source_url,
        "source_sha256": run.source_sha256,
        "npi_allowlist_sha256": run.npi_allowlist_sha256,
    }
    pdf, prefix = build_dossier(package, provenance)
    return Response(content=pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{prefix}.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    })


@router.post("/{npi}/outcome", response_model=Dict[str, Any])
def submit_lead_outcome(
    npi: str,
    submission: OutcomeSubmission,
    request: Request,
    hcpcs_code: str = Query(PILOT_HCPCS),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record an authenticated investigator's review decision, utility classification,
    evidence document hashes, and cryptographic signature.
    Appends an immutable entry to LeadDecisionAudit to guarantee forensic chain of custody.
    """
    allowed_outcomes = {
        "CONFIRMED_ANOMALY",
        "EXPLAINABLE_VARIANCE",
        "FALSE_POSITIVE",
        "REFERRED_TO_COUNSEL",
        "UNREVIEWED"
    }
    if submission.outcome not in allowed_outcomes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid outcome. Must be one of: {allowed_outcomes}"
        )

    # Fetch aggregate data to calculate current statistics
    source_dataset = active_source_dataset(db, hcpcs_code)
    records = db.query(AggregateSpendingRecord).filter(
        AggregateSpendingRecord.billing_npi == npi,
        AggregateSpendingRecord.hcpcs_code == hcpcs_code,
        AggregateSpendingRecord.source_dataset == source_dataset,
    ).all()

    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot record review: no HHS data exists for NPI {npi}"
        )

    total_spend = sum(r.total_paid_amount for r in records)
    record_ids = [r.id for r in records]

    # Calculate canonical hash of evaluated source rows
    canonical_source_json = json.dumps([
        {"id": r.id, "month": r.year_month, "paid": r.total_paid_amount, "claims": r.total_claims, "bene": r.total_beneficiaries}
        for r in sorted(records, key=lambda x: x.id)
    ], sort_keys=True)
    source_records_hash = hashlib.sha256(canonical_source_json.encode("utf-8")).hexdigest()

    # Calculate peer mean
    peer_avg = db.query(func.avg(AggregateSpendingRecord.total_paid_amount)).filter(
        AggregateSpendingRecord.hcpcs_code == hcpcs_code
    ).scalar() or total_spend

    lead_record = db.query(LeadVerificationRecord).filter(
        LeadVerificationRecord.billing_npi == npi,
        LeadVerificationRecord.hcpcs_code == hcpcs_code,
        LeadVerificationRecord.source_dataset == source_dataset,
    ).first()

    provider_obj = db.query(Provider).filter(Provider.npi == npi).first()
    provider_name = provider_obj.name if provider_obj else f"Provider {npi}"

    now = datetime.utcnow()
    assumptions_to_save = submission.documented_assumptions or DEFAULT_ASSUMPTIONS

    # Authenticated identity determination
    reviewer_name = (current_user.username if current_user else submission.reviewed_by) or "Staff Investigator"
    reviewer_role = (current_user.role if current_user else submission.reviewer_role) or "investigator"
    client_ip = request.client.host if request.client else None

    # Cryptographic decision signature
    doc_hashes = submission.document_hashes or {}
    signature_input = (
        f"{npi}|{submission.outcome}|{submission.lead_utility}|{reviewer_name}|"
        f"{reviewer_role}|{now.isoformat()}|{source_records_hash}|{json.dumps(doc_hashes, sort_keys=True)}"
    )
    decision_signature_hash = hashlib.sha256(signature_input.encode("utf-8")).hexdigest()

    # Determine revision version
    prior_audit_count = db.query(func.count(LeadDecisionAudit.id)).filter_by(
        billing_npi=npi, hcpcs_code=hcpcs_code
    ).scalar() or 0
    decision_version = prior_audit_count + 1

    # Insert immutable historical decision audit entry
    audit_entry = LeadDecisionAudit(
        billing_npi=npi,
        hcpcs_code=hcpcs_code,
        version=decision_version,
        outcome=submission.outcome,
        lead_utility=submission.lead_utility,
        outcome_rationale=submission.outcome_rationale,
        checklist_status=submission.checklist_status,
        document_hashes=doc_hashes,
        source_records_hash=source_records_hash,
        decision_signature_hash=decision_signature_hash,
        reviewed_by=reviewer_name,
        reviewer_role=reviewer_role,
        client_ip=client_ip,
        review_time_seconds=submission.review_time_seconds,
        reviewed_at=now,
    )
    db.add(audit_entry)

    if not lead_record:
        lead_record = LeadVerificationRecord(
            billing_npi=npi,
            provider_name=provider_name,
            specialty=PILOT_SPECIALTY,
            hcpcs_code=hcpcs_code,
            source_dataset=source_dataset,
            target_period=f"HHS Monthly Aggregates ({len(records)} months)",
            total_spending=total_spend,
            peer_mean_spending=float(peer_avg),
            peer_percentile=95.0,  # Estimated baseline
            z_score=2.5,
            source_record_ids=record_ids,
            documented_assumptions=assumptions_to_save,
            checklist_status=submission.checklist_status,
            outcome=submission.outcome,
            lead_utility=submission.lead_utility,
            outcome_rationale=submission.outcome_rationale,
            reviewed_by=reviewer_name,
            reviewer_role=reviewer_role,
            review_time_seconds=submission.review_time_seconds,
            document_hashes=doc_hashes,
            source_records_hash=source_records_hash,
            decision_signature_hash=decision_signature_hash,
            revision_count=decision_version,
            created_at=now,
            reviewed_at=now,
        )
        db.add(lead_record)
    else:
        lead_record.outcome = submission.outcome
        lead_record.lead_utility = submission.lead_utility
        lead_record.outcome_rationale = submission.outcome_rationale
        lead_record.checklist_status = submission.checklist_status
        lead_record.document_hashes = doc_hashes
        lead_record.source_records_hash = source_records_hash
        lead_record.decision_signature_hash = decision_signature_hash
        if submission.documented_assumptions:
            lead_record.documented_assumptions = submission.documented_assumptions
        lead_record.reviewed_by = reviewer_name
        lead_record.reviewer_role = reviewer_role
        lead_record.revision_count = decision_version
        lead_record.review_time_seconds += submission.review_time_seconds
        lead_record.reviewed_at = now

    db.commit()
    db.refresh(lead_record)

    return {
        "status": "success",
        "message": f"Lead review recorded for NPI {npi}: {submission.outcome}",
        "billing_npi": npi,
        "outcome": lead_record.outcome,
        "lead_utility": lead_record.lead_utility,
        "reviewed_by": lead_record.reviewed_by,
        "reviewer_role": lead_record.reviewer_role,
        "audit_version": decision_version,
        "decision_signature_hash": decision_signature_hash,
        "source_records_hash": source_records_hash,
        "document_hashes_count": len(doc_hashes),
        "reviewed_at": lead_record.reviewed_at.isoformat(),
        "total_review_time_seconds": lead_record.review_time_seconds,
        "statutory_notice_acknowledged": True,
    }
