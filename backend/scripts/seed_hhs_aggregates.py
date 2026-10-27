"""
Seed synthetic demonstration aggregates for an adult day care workflow.

These rows are invented for interface development. They are not HHS records,
not verified providers, and must not be used for provider allegations.
"""

import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
from models import AggregateSpendingRecord, Provider, LeadVerificationRecord

NYC_ADULT_DAY_CARE_COHORT = [
    {
        "npi": "1184920143",
        "name": "FLUSHING GOLDEN AGE ADULT DAY CARE CENTER INC",
        "city": "Flushing",
        "state": "NY",
        "zip_code": "11355",
        "monthly_spend_base": 240000.0,
        "is_outlier": True,
        "outlier_factor": 4.5,  # $1.08M/month outlier
        "suppression": False
    },
    {
        "npi": "1295830254",
        "name": "BROOKLYN SENIOR CARE ADULT DAY HEALTH PROGRAM",
        "city": "Brooklyn",
        "state": "NY",
        "zip_code": "11220",
        "monthly_spend_base": 190000.0,
        "is_outlier": True,
        "outlier_factor": 3.8,  # ~$720k/month outlier
        "suppression": False
    },
    {
        "npi": "1306941365",
        "name": "QUEENS BOULEVARD COMMUNITY HEALTH & ADULT DAY CARE",
        "city": "Rego Park",
        "state": "NY",
        "zip_code": "11374",
        "monthly_spend_base": 150000.0,
        "is_outlier": False,
        "outlier_factor": 1.1,
        "suppression": False
    },
    {
        "npi": "1417052476",
        "name": "METROPOLITAN ELDERLY REHABILITATION SERVICES LLC",
        "city": "Flushing",
        "state": "NY",
        "zip_code": "11354",
        "monthly_spend_base": 125000.0,
        "is_outlier": False,
        "outlier_factor": 0.95,
        "suppression": False
    },
    {
        "npi": "1528163587",
        "name": "GRAND STREET SENIOR HEALTH & SOCIAL REHAB CENTER",
        "city": "New York",
        "state": "NY",
        "zip_code": "10002",
        "monthly_spend_base": 110000.0,
        "is_outlier": False,
        "outlier_factor": 0.85,
        "suppression": False
    },
    {
        "npi": "1639274698",
        "name": "SOUTHERN BROOKLYN GERIATRIC DAY CARE ALLIANCE",
        "city": "Brooklyn",
        "state": "NY",
        "zip_code": "11235",
        "monthly_spend_base": 95000.0,
        "is_outlier": False,
        "outlier_factor": 0.75,
        "suppression": False
    },
    {
        "npi": "1740385709",
        "name": "BRONX HARLEM RIVER ADULT DAY CARE SERVICES",
        "city": "Bronx",
        "state": "NY",
        "zip_code": "10451",
        "monthly_spend_base": 85000.0,
        "is_outlier": False,
        "outlier_factor": 0.70,
        "suppression": False
    },
    {
        "npi": "1851496810",
        "name": "BAY RIDGE ELDER HEALTH & SOCIAL CARE CORP",
        "city": "Brooklyn",
        "state": "NY",
        "zip_code": "11209",
        "monthly_spend_base": 75000.0,
        "is_outlier": False,
        "outlier_factor": 0.60,
        "suppression": False
    },
    {
        "npi": "1962507921",
        "name": "STATEN ISLAND COMPREHENSIVE ADULT DAY SERVICES",
        "city": "Staten Island",
        "state": "NY",
        "zip_code": "10314",
        "monthly_spend_base": 45000.0,
        "is_outlier": False,
        "outlier_factor": 0.40,
        "suppression": True  # Synthetic example of small-cell suppression
    },
    {
        "npi": "1073418032",
        "name": "SUNSET PARK COMMUNITY ELDER CARE CENTER",
        "city": "Brooklyn",
        "state": "NY",
        "zip_code": "11220",
        "monthly_spend_base": 130000.0,
        "is_outlier": False,
        "outlier_factor": 1.05,
        "suppression": False
    }
]

MONTHS_2025 = [
    "2025-01", "2025-02", "2025-03", "2025-04",
    "2025-05", "2025-06", "2025-07", "2025-08",
    "2025-09", "2025-10", "2025-11", "2025-12"
]


def seed_hhs_aggregates(db, force: bool = False):
    """Seed fictional records for a local demo only."""
    Base.metadata.create_all(bind=engine)

    if force:
        db.query(AggregateSpendingRecord).filter(
            AggregateSpendingRecord.hcpcs_code == "T2024",
            AggregateSpendingRecord.source_dataset == "DEMO_SYNTHETIC_2025"
        ).delete()
        db.commit()
    else:
        existing_count = db.query(AggregateSpendingRecord).filter(
            AggregateSpendingRecord.hcpcs_code == "T2024"
        ).count()
        if existing_count > 0:
            print(f"HHS aggregates already seeded ({existing_count} records). Skipping.")
            return

    print("Seeding SYNTHETIC DEMO records for Adult Day Care (T2024)...")

    for p in NYC_ADULT_DAY_CARE_COHORT:
        # 1. Ensure Provider exists
        provider = db.query(Provider).filter(Provider.npi == p["npi"]).first()
        if not provider:
            provider = Provider(
                npi=p["npi"],
                name=p["name"],
                city=p["city"],
                state=p["state"],
                zip_code=p["zip_code"],
                facility_type="adult_day_care",
                specialty="Adult Day Health Care",
                licensed_capacity=75 if not p["is_outlier"] else 50
            )
            db.add(provider)
            db.flush()

        # 2. Insert 12 monthly aggregate rows
        for m_idx, month in enumerate(MONTHS_2025):
            seasonal_var = 1.0 + (0.05 * (m_idx % 3))
            base_amt = p["monthly_spend_base"] * p["outlier_factor"] * seasonal_var
            
            # Unit per diem in NY Medicaid is ~$110 - $140
            est_per_diem = 125.0
            claims = int(base_amt / est_per_diem)
            
            if p["suppression"]:
                bene_count = None
                claims = None
                is_suppressed = True
            else:
                bene_count = min(350, max(15, int(claims / 20)))
                is_suppressed = False

            rec = AggregateSpendingRecord(
                billing_npi=p["npi"],
                servicing_npi=p["npi"],
                hcpcs_code="T2024",
                hcpcs_description="Adult Day Health Care, per diem",
                year_month=month,
                total_paid_amount=round(base_amt, 2),
                total_claims=claims,
                total_beneficiaries=bene_count,
                is_suppressed=is_suppressed,
                state="NY",
                source_dataset="DEMO_SYNTHETIC_2025",
                retrieval_timestamp=datetime.utcnow()
            )
            db.add(rec)

    db.commit()
    print("Seeded synthetic demo aggregates. Do not represent them as HHS records.")


if __name__ == "__main__":
    force_seed = "--force" in sys.argv
    db = SessionLocal()
    try:
        seed_hhs_aggregates(db, force=force_seed)
    finally:
        db.close()
