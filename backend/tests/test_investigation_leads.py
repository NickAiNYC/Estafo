"""
Unit & Integration Tests for Verified Investigative Leads Workflow.
Validates:
1. Grounding in actual HHS monthly AggregateSpendingRecord rows.
2. Specialty-scoped peer distribution comparison.
3. Investigator checklist and assumption audit trail.
4. Strict separation of whistleblower qui tam awards (NY State Finance Law § 190 / NYC FCA).
5. Pilot metrics measuring compliance/counsel time saved.
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from main import app
from database import get_db
from models import Base, AggregateSpendingRecord, LeadVerificationRecord, Provider
from routes.investigation_leads import DEFAULT_VERIFICATION_CHECKLIST, DEFAULT_ASSUMPTIONS

client = TestClient(app)

SAMPLE_NPI_OUTLIER = "1497823410"
SAMPLE_NPI_NORMAL = "1932456781"


@pytest.fixture(autouse=True)
def setup_lead_data(db_session):
    """Seed test cohort for Adult Day Care (T2024)."""
    # Override get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Create outlier provider
    p_outlier = Provider(
        npi=SAMPLE_NPI_OUTLIER,
        name="Flushing Senior Social Center",
        city="Flushing",
        state="NY",
        facility_type="adult_day_care",
        specialty="Adult Day Health Care"
    )
    # Create normal peer provider
    p_normal = Provider(
        npi=SAMPLE_NPI_NORMAL,
        name="Chinatown Elders Services",
        city="New York",
        state="NY",
        facility_type="adult_day_care",
        specialty="Adult Day Health Care"
    )
    db_session.add_all([p_outlier, p_normal])
    db_session.commit()

    # Add monthly aggregate rows for outlier (~$1M/mo)
    for m in range(1, 7):
        month_str = f"2025-0{m}"
        rec = AggregateSpendingRecord(
            billing_npi=SAMPLE_NPI_OUTLIER,
            servicing_npi=SAMPLE_NPI_OUTLIER,
            hcpcs_code="T2024",
            hcpcs_description="Adult Day Health Care, per diem",
            year_month=month_str,
            total_paid_amount=950000.0,
            total_claims=7600,
            total_beneficiaries=380,
            is_suppressed=False,
            state="NY"
        )
        db_session.add(rec)

    # Add monthly aggregate rows for normal peer (~$120k/mo)
    for m in range(1, 7):
        month_str = f"2025-0{m}"
        rec = AggregateSpendingRecord(
            billing_npi=SAMPLE_NPI_NORMAL,
            servicing_npi=SAMPLE_NPI_NORMAL,
            hcpcs_code="T2024",
            hcpcs_description="Adult Day Health Care, per diem",
            year_month=month_str,
            total_paid_amount=120000.0,
            total_claims=960,
            total_beneficiaries=65,
            is_suppressed=False,
            state="NY"
        )
        db_session.add(rec)

    db_session.commit()

    yield

    app.dependency_overrides.clear()


class TestInvestigativeLeadsWorkflow:
    """Test suite for the single verified investigator research workflow."""

    def test_list_leads_returns_peer_benchmarked_outliers(self):
        """Ensure outlier provider is identified by peer percentile and multiple."""
        resp = client.get("/api/v1/leads?min_percentile=50.0")
        assert resp.status_code == 200
        data = resp.json()

        assert data["pilot_specialty"] == "Adult Day Health Care"
        assert data["hcpcs_code"] == "T2024"
        assert data["total_flagged_leads"] >= 1
        assert "NY_STATE_FIN_LAW_190_AND_NYC_FCA" in data["statutory_route"]

        # First lead should be the outlier
        top_lead = data["leads"][0]
        assert top_lead["billing_npi"] == SAMPLE_NPI_OUTLIER
        assert top_lead["total_spending"] > 5000000.0
        assert top_lead["spending_multiple_of_peer_avg"] > 1.0
        assert top_lead["outcome"] == "UNREVIEWED"

    def test_get_lead_package_traceability_and_evidence_checklist(self):
        """Verify full package: exact HHS source rows, checklist, assumptions, and legal separation."""
        resp = client.get(f"/api/v1/leads/{SAMPLE_NPI_OUTLIER}")
        assert resp.status_code == 200
        pkg = resp.json()

        # 1. Exact HHS source rows
        assert len(pkg["exact_source_rows"]) == 6
        assert pkg["exact_source_rows"][0]["hcpcs_code"] == "T2024"
        assert pkg["exact_source_rows"][0]["total_paid_amount"] == 950000.0

        # 2. Peer comparison
        assert pkg["peer_comparison"]["provider_percentile"] >= 90.0
        assert pkg["peer_comparison"]["multiple_of_peer_mean"] > 1.0

        # 3. Required records checklist
        checklist = pkg["required_records_checklist"]
        assert len(checklist) >= 4
        checklist_titles = [c["record_title"] for c in checklist]
        assert any("Attendance Rosters" in title for title in checklist_titles)
        assert any("Progress Notes" in title for title in checklist_titles)
        assert any("NEMT" in title or "Transport" in title for title in checklist_titles)
        assert any("Capacity" in title or "Staffing" in title for title in checklist_titles)

        # 4. Documented assumptions
        assert len(pkg["documented_assumptions"]) >= 3

        # 5. Statutory framework notice
        framework = pkg["statutory_framework"]
        assert any("190" in statute for statute in framework["applicable_statutes"])
        assert "cannot establish a false claim" in framework["statutory_notice"]

    def test_submit_lead_review_outcome_builds_data_moat(self):
        """Ensure investigator can mark outcome, update checklist, and record review time."""
        payload = {
            "outcome": "CONFIRMED_ANOMALY",
            "outcome_rationale": "Attendance sheets show 350 patients billed daily on a licensed capacity of 75.",
            "checklist_status": {
                "attendance_rosters": "RECEIVED_CONFIRMED",
                "licensed_staffing_ratios": "RECEIVED_CONFIRMED"
            },
            "review_time_seconds": 1200,  # 20 minutes
            "reviewed_by": "Senior Compliance Analyst"
        }

        resp = client.post(f"/api/v1/leads/{SAMPLE_NPI_OUTLIER}/outcome", json=payload)
        assert resp.status_code == 200
        result = resp.json()

        assert result["status"] == "success"
        assert result["outcome"] == "CONFIRMED_ANOMALY"
        assert result["reviewed_by"] == "Senior Compliance Analyst"

        # Verify state persisted in GET detail
        get_resp = client.get(f"/api/v1/leads/{SAMPLE_NPI_OUTLIER}")
        updated_pkg = get_resp.json()
        assert updated_pkg["verification_status"]["outcome"] == "CONFIRMED_ANOMALY"
        assert updated_pkg["verification_status"]["review_time_seconds"] == 1200

    def test_pilot_metrics_report_observed_review_time(self):
        """Report observed review time without inventing a manual comparison."""
        # Submit a review first
        client.post(
            f"/api/v1/leads/{SAMPLE_NPI_OUTLIER}/outcome",
            json={
                "outcome": "CONFIRMED_ANOMALY",
                "outcome_rationale": "Confirmed unprovided services and excess capacity.",
                "review_time_seconds": 1800,  # 30 minutes
                "reviewed_by": "Special Counsel"
            }
        )

        resp = client.get("/api/v1/leads/pilot/metrics")
        assert resp.status_code == 200
        metrics = resp.json()

        assert metrics["total_leads_reviewed"] >= 1
        efficiency = metrics["analyst_efficiency"]
        assert efficiency["avg_review_time_minutes"] > 0
        assert efficiency["actual_hours_spent"] == 0.5
        assert "net_time_saved_hours" not in efficiency
        assert "efficiency_multiplier" not in efficiency
        assert metrics["outcome_distribution"]["CONFIRMED_ANOMALY"] >= 1
        assert "lead_precision_percentage" not in metrics

    def test_dossier_is_a_pdf_with_no_store_header(self):
        response = client.get(f"/api/v1/leads/{SAMPLE_NPI_OUTLIER}/dossier.pdf")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert response.headers["cache-control"] == "no-store"
        assert response.content.startswith(b"%PDF-")

    def test_normalized_signals_measure_monthly_intensity_and_rate(self):
        """Ensure ranking computes normalized monthly intensity and unit rates rather than raw spend."""
        resp = client.get("/api/v1/leads?min_percentile=50.0&sort_by=normalized_rate")
        assert resp.status_code == 200
        data = resp.json()

        assert "ranking_methodology" in data
        assert "Normalized Monthly Intensity" in data["ranking_methodology"]

        lead = data["leads"][0]
        assert "monthly_intensity" in lead
        assert "paid_per_claim" in lead
        assert "paid_per_beneficiary" in lead
        assert lead["monthly_intensity"] > 0
        assert lead["paid_per_claim"] > 0

    def test_evidence_trail_signed_outcome_and_decision_history(self):
        """Ensure review outcome stores document hashes, cryptographic signature, and audit history."""
        doc_hashes = {
            "attendance_rosters": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "ehr_progress_notes": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"
        }
        submit_resp = client.post(
            f"/api/v1/leads/{SAMPLE_NPI_OUTLIER}/outcome",
            json={
                "outcome": "CONFIRMED_ANOMALY",
                "lead_utility": "USEFUL_ACTIONABLE_LEAD",
                "outcome_rationale": "Forensic audit confirmed missing attendance rosters for billed dates.",
                "document_hashes": doc_hashes,
                "review_time_seconds": 900,
                "reviewed_by": "Lead SIU Investigator",
                "reviewer_role": "partner"
            }
        )
        assert submit_resp.status_code == 200
        res = submit_resp.json()
        assert res["decision_signature_hash"] is not None
        assert res["source_records_hash"] is not None
        assert res["document_hashes_count"] == 2
        assert res["audit_version"] >= 1

        # Check detail endpoint returns decision history
        detail_resp = client.get(f"/api/v1/leads/{SAMPLE_NPI_OUTLIER}")
        assert detail_resp.status_code == 200
        pkg = detail_resp.json()

        assert "decision_history" in pkg
        assert len(pkg["decision_history"]) >= 1
        audit_event = pkg["decision_history"][0]
        assert audit_event["decision_signature_hash"] == res["decision_signature_hash"]
        assert audit_event["document_hashes"]["attendance_rosters"] == doc_hashes["attendance_rosters"]
        assert pkg["verification_status"]["lead_utility"] == "USEFUL_ACTIONABLE_LEAD"
