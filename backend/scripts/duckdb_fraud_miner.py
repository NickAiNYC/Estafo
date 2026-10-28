#!/usr/bin/env python3
"""
DuckDB Healthcare Lead Miner & Co-Location Screener (Rigorous 2026 Edition)
Cross-references public CMS NPPES, HHS Aggregate Spending, and OIG LEIE.

Methodological Discipline:
1. Address co-location in commercial buildings is a preliminary research lead, NOT proof of common ownership or shell companies.
2. Suite / floor identifiers are address clues, NOT verified square footage or fire capacity measurements.
3. Monthly acceleration requires calendar-month matching for the same billing NPI and HCPCS code.
4. LEIE exclusion matches require strict date comparison against effective exclusion dates (YYYYMMDD).
5. Unimported datasets are surfaced with explicit INCOMPLETE status, never silently masked.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

try:
    import duckdb
except ImportError:
    print("Error: duckdb not installed. Run '.venv/bin/pip install duckdb' to install.")
    sys.exit(1)

# SQL Pattern 1: Address Suite Screening Clue (Unverified Physical Footprint)
# Note: Suite or floor notation indicates a subdivided commercial unit.
# It does NOT establish square footage or fire capacity without municipal building records.
SQL_SUITE_SCREENING_CLUES = """
WITH provider_spending AS (
    SELECT 
        p.npi,
        p.name,
        p.address,
        p.borough,
        p.taxonomy_code,
        p.facility_type,
        COALESCE(SUM(s.total_paid_amount), 0.0) AS db_matched_spend,
        COUNT(DISTINCT s.year_month) AS db_months_active,
        COALESCE(MAX(s.total_beneficiaries), 0) AS db_peak_patients,
        CASE 
            WHEN regexp_matches(p.address, '(?i)\\b(STE|SUITE|FL|FLOOR|APT|UNIT|#)\\b') THEN 1 
            ELSE 0 
        END AS has_suite_floor_indicator
    FROM providers p
    LEFT JOIN aggregate_spending s ON p.npi = s.billing_npi
    GROUP BY p.npi, p.name, p.address, p.borough, p.taxonomy_code, p.facility_type
)
SELECT 
    npi,
    name,
    address,
    borough,
    taxonomy_code,
    facility_type,
    db_matched_spend,
    db_months_active,
    db_peak_patients,
    has_suite_floor_indicator
FROM provider_spending
WHERE has_suite_floor_indicator = 1
ORDER BY db_matched_spend DESC, name ASC;
"""

# SQL Pattern 2: NPPES Co-Located Practice Clusters
# Note: Co-location in a multi-tenant commercial property indicates a shared physical site,
# NOT proof of common ownership, shared control, or joint billing without corporate registry documentation.
SQL_COLOCATED_CLUSTERS = """
WITH address_cleaning AS (
    SELECT 
        npi,
        name,
        address,
        borough,
        taxonomy_code,
        regexp_replace(upper(trim(split_part(address, ',', 1))), '[^A-Z0-9 ]', '', 'g') AS clean_street
    FROM providers
),
clustered AS (
    SELECT 
        clean_street,
        COUNT(DISTINCT npi) AS distinct_npi_count,
        list(DISTINCT name) AS entity_names,
        list(DISTINCT npi) AS npi_list
    FROM address_cleaning
    GROUP BY clean_street
    HAVING COUNT(DISTINCT npi) >= 2
)
SELECT 
    c.clean_street,
    c.distinct_npi_count,
    c.entity_names,
    c.npi_list,
    COALESCE(SUM(s.total_paid_amount), 0.0) AS db_matched_cluster_spend
FROM clustered c
LEFT JOIN aggregate_spending s ON list_contains(c.npi_list, s.billing_npi)
GROUP BY c.clean_street, c.distinct_npi_count, c.entity_names, c.npi_list
ORDER BY c.distinct_npi_count DESC, c.clean_street ASC;
"""

# SQL Pattern 3: OIG LEIE Excluded Provider Billing Intercept
# LEIE dates are stored as YYYYMMDD strings. Spending dates are stored as YYYY-MM.
# Compares service month start against exclusion date and reinstatement date.
SQL_LEIE_INTERCEPT = """
WITH formatted_spending AS (
    SELECT 
        billing_npi,
        hcpcs_code,
        year_month,
        -- Convert YYYY-MM to YYYYMM01 integer for precise comparison with LEIE YYYYMMDD
        CAST(replace(year_month, '-', '') || '01' AS INTEGER) AS service_date_int,
        total_paid_amount
    FROM aggregate_spending
)
SELECT 
    s.billing_npi,
    p.name AS provider_name,
    p.address,
    e.npi AS leie_npi,
    e.lastname,
    e.firstname,
    e.excltype,
    e.excldate,
    e.reindate,
    SUM(s.total_paid_amount) AS post_exclusion_spend,
    COUNT(DISTINCT s.year_month) AS post_exclusion_billing_months
FROM formatted_spending s
JOIN providers p ON s.billing_npi = p.npi
JOIN leie_exclusions e ON s.billing_npi = e.npi
WHERE e.npi IS NOT NULL 
  AND e.npi != '0000000000'
  AND CAST(e.excldate AS INTEGER) <= s.service_date_int
  AND (
      e.reindate IS NULL 
      OR e.reindate = '' 
      OR e.reindate = '00000000'
      OR CAST(e.reindate AS INTEGER) > s.service_date_int
  )
GROUP BY s.billing_npi, p.name, p.address, e.npi, e.lastname, e.firstname, e.excltype, e.excldate, e.reindate
ORDER BY post_exclusion_spend DESC;
"""

# SQL Pattern 4: Calendar-Month Velocity Surge
# Partitions by billing_npi AND hcpcs_code, joining on exact 3-calendar-month offset.
SQL_VELOCITY_SURGE = """
WITH monthly_series AS (
    SELECT 
        billing_npi,
        hcpcs_code,
        CAST(year_month || '-01' AS DATE) AS service_month,
        total_paid_amount
    FROM aggregate_spending
),
calendar_lag AS (
    SELECT 
        curr.billing_npi,
        curr.hcpcs_code,
        curr.service_month AS current_month,
        curr.total_paid_amount AS current_spend,
        prior.service_month AS prior_month,
        prior.total_paid_amount AS spend_3mo_prior,
        ROUND(curr.total_paid_amount / GREATEST(1.0, prior.total_paid_amount), 2) AS acceleration_multiple
    FROM monthly_series curr
    JOIN monthly_series prior 
      ON curr.billing_npi = prior.billing_npi 
     AND curr.hcpcs_code = prior.hcpcs_code 
     AND prior.service_month = (curr.service_month - INTERVAL 3 MONTH)
    WHERE prior.total_paid_amount >= 5000.0
      AND (curr.total_paid_amount / prior.total_paid_amount) >= 3.0
)
SELECT 
    l.billing_npi,
    p.name,
    p.address,
    l.hcpcs_code,
    CAST(l.current_month AS VARCHAR) AS current_month,
    l.current_spend,
    CAST(l.prior_month AS VARCHAR) AS prior_month,
    l.spend_3mo_prior,
    l.acceleration_multiple
FROM calendar_lag l
JOIN providers p ON l.billing_npi = p.npi
ORDER BY l.acceleration_multiple DESC;
"""

def run_miner(db_path: str = "test.db", export_dir: str = "exports"):
    print("==========================================================================")
    print("  ESTAFOTIR NPPES CO-LOCATION & PUBLIC SPENDING SCREENER (2026)")
    print("  Status: Unverified Research Screening // Strict Evidentiary Standards")
    print("==========================================================================\n")
    
    con = duckdb.connect()
    Path(export_dir).mkdir(parents=True, exist_ok=True)

    # 1. Inspect local SQLite database
    print(f"[*] Attaching local database: {db_path}")
    db_file = Path(db_path)
    if not db_file.exists():
        print(f"[-] Database file not found at {db_path}.")
        return

    con.execute("INSTALL sqlite; LOAD sqlite;")
    con.execute(f"ATTACH '{db_path}' AS local_db (TYPE SQLITE);")

    # Mirror spending table into columnar memory
    con.execute("""
        CREATE TEMPORARY TABLE aggregate_spending AS 
        SELECT 
            billing_npi,
            hcpcs_code,
            year_month,
            total_paid_amount,
            COALESCE(total_claims, 0) AS total_claims,
            COALESCE(total_beneficiaries, 0) AS total_beneficiaries
        FROM local_db.aggregate_spending_records;
    """)

    db_spending_count = con.execute("SELECT COUNT(*) FROM aggregate_spending;").fetchone()[0]
    db_distinct_npis = con.execute("SELECT COUNT(DISTINCT billing_npi) FROM aggregate_spending;").fetchone()[0]
    print(f"    Loaded {db_spending_count} spending rows across {db_distinct_npis} distinct billing NPI(s) from local DB.")
    if db_distinct_npis <= 1:
        print("    [!] NOTICE: Local database holds limited HHS rows (Dragon Home Care T2024 only).")
        print("        Unimported providers will show $0.00 matched spend pending full HHS dataset ingestion.")

    # 2. Ingest Provider Registry Cohort
    vetted_json = Path("public/data/medicaid_providers.json")
    if not vetted_json.exists():
        vetted_json = Path("backend/data/vetted_nyc_adhc_cohort.json")

    if vetted_json.exists():
        print(f"[*] Ingesting vetted provider cohort from: {vetted_json}")
        con.execute(f"""
            CREATE TEMPORARY TABLE providers AS 
            SELECT 
                npi,
                name,
                address,
                COALESCE(borough, 'NYC') AS borough,
                taxonomy_code,
                facility_type
            FROM read_json_auto('{vetted_json}');
        """)
        provider_count = con.execute("SELECT COUNT(*) FROM providers;").fetchone()[0]
        print(f"    Ingested {provider_count} vetted provider records.")
    else:
        print("[-] Provider cohort file not found. Creating empty provider table.")
        con.execute("CREATE TEMPORARY TABLE providers (npi VARCHAR, name VARCHAR, address VARCHAR, borough VARCHAR, taxonomy_code VARCHAR, facility_type VARCHAR);")
        provider_count = 0

    # 3. Ingest OIG LEIE Exclusions (Explicit Status Handling)
    leie_csv = Path("backend/data/LEIE.csv")
    has_leie = leie_csv.exists()
    if has_leie:
        print(f"[*] Ingesting HHS OIG LEIE exclusions from: {leie_csv}")
        con.execute(f"""
            CREATE TEMPORARY TABLE leie_exclusions AS 
            SELECT 
                CAST(NPI AS VARCHAR) AS npi, 
                LASTNAME AS lastname, 
                FIRSTNAME AS firstname, 
                EXCLTYPE AS excltype, 
                CAST(EXCLDATE AS VARCHAR) AS excldate, 
                CAST(COALESCE(REINDATE, '00000000') AS VARCHAR) AS reindate
            FROM read_csv_auto('{leie_csv}');
        """)
        leie_count = con.execute("SELECT COUNT(*) FROM leie_exclusions;").fetchone()[0]
        print(f"    Ingested {leie_count} exclusion records.")
    else:
        print("[!] NOTICE: backend/data/LEIE.csv is absent.")
        print("    Exclusion intercept screening marked as INCOMPLETE (data file not present).")
        con.execute("CREATE TEMPORARY TABLE leie_exclusions (npi VARCHAR, lastname VARCHAR, firstname VARCHAR, excltype VARCHAR, excldate VARCHAR, reindate VARCHAR);")

    # 4. Execute Screenings
    print("\n[+] Screening 1: Address Suite Indicators (Physical Footprint Clues)...")
    suite_results = con.execute(SQL_SUITE_SCREENING_CLUES).fetchall()
    print(f"    Identified {len(suite_results)} providers located in subdivided suites/floors.")

    print("\n[+] Screening 2: NPPES Co-Located Practice Clusters...")
    cluster_results = con.execute(SQL_COLOCATED_CLUSTERS).fetchall()
    print(f"    Identified {len(cluster_results)} multi-tenant commercial addresses hosting 2+ NPIs.")

    print("\n[+] Screening 3: OIG LEIE Exclusion Cross-Reference...")
    if has_leie:
        leie_results = con.execute(SQL_LEIE_INTERCEPT).fetchall()
        print(f"    Identified {len(leie_results)} potential post-exclusion billing matches.")
    else:
        leie_results = []
        print("    Status: SKIPPED (LEIE.csv missing).")

    print("\n[+] Screening 4: Calendar-Month Velocity Surge (HCPCS-Specific)...")
    surge_results = con.execute(SQL_VELOCITY_SURGE).fetchall()
    print(f"    Identified {len(surge_results)} calendar-month acceleration leads (3x surge).")

    # 5. Export Structured Research Leads
    leads_export_path = Path(export_dir) / "nppes_colocation_research_leads.json"
    shirley_legacy_path = Path(export_dir) / "shirley_triage_leads.json"

    export_payload = {
        "metadata": {
            "title": "NPPES Co-Location & Public Spending Research Leads",
            "classification": "UNVERIFIED_PRELIMINARY_RESEARCH_LEADS",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "hhs_spending_status": f"Local database holds {db_spending_count} rows across {db_distinct_npis} NPI(s). All other NPI spend is unimported ($0.00 matched).",
            "leie_status": "VERIFIED_FILE_INGESTED" if has_leie else "INCOMPLETE_MISSING_LEIE_CSV",
            "disclaimer": "Co-location at a commercial address does NOT establish common ownership, shell companies, or shared billing. Suite notation indicates an address format clue, NOT a physical square footage or fire capacity measurement. Street observations alone do not establish billing fraud and do not guarantee whistleblower rewards under WHIP or FCA."
        },
        "colocated_address_clusters": [
            {
                "clean_street": r[0],
                "distinct_npis_count": int(r[1]),
                "entity_names": r[2],
                "npi_list": r[3],
                "db_matched_spend": float(r[4]),
                "evidentiary_note": "Shared address requires corporate registry / officer cross-reference before inferring common control."
            }
            for r in cluster_results
        ],
        "suite_footprint_screening_clues": [
            {
                "npi": r[0],
                "name": r[1],
                "address": r[2],
                "borough": r[3],
                "taxonomy_code": r[4],
                "facility_type": r[5],
                "db_matched_spend": float(r[6]),
                "db_months_active": int(r[7]),
                "db_peak_patients": int(r[8]),
                "evidentiary_note": "Subdivided address notation. Square footage and capacity require municipal DOB records or physical inspection."
            }
            for r in suite_results[:50]
        ],
        "leie_exclusion_matches": [
            {
                "billing_npi": r[0],
                "provider_name": r[1],
                "address": r[2],
                "leie_npi": r[3],
                "name": f"{r[5]} {r[4]}",
                "excltype": r[6],
                "excldate": r[7],
                "reindate": r[8],
                "post_exclusion_spend": float(r[9]),
                "billing_months": int(r[10])
            }
            for r in leie_results
        ],
        "calendar_velocity_surges": [
            {
                "billing_npi": r[0],
                "name": r[1],
                "address": r[2],
                "hcpcs_code": r[3],
                "current_month": r[4],
                "current_spend": float(r[5]),
                "prior_month": r[6],
                "prior_spend": float(r[7]),
                "acceleration_multiple": float(r[8])
            }
            for r in surge_results
        ]
    }

    with open(leads_export_path, "w") as f:
        json.dump(export_payload, f, indent=2)

    with open(shirley_legacy_path, "w") as f:
        json.dump(export_payload, f, indent=2)

    print(f"\n[✓] Exported complete research leads to: {leads_export_path}")
    print(f"[✓] Mirrored to legacy path: {shirley_legacy_path}")
    print("\n--------------------------------------------------------------------------")
    print("  SUMMARY AUDIT REPORT:")
    print(f"  - Ingested Providers: {provider_count}")
    print(f"  - Database Spending Rows: {db_spending_count} ({db_distinct_npis} NPI)")
    print(f"  - Co-Located Address Clusters: {len(cluster_results)}")
    print(f"  - Suite Footprint Clues: {len(suite_results)}")
    print(f"  - LEIE File Present: {'YES' if has_leie else 'NO (INCOMPLETE)'}")
    print(f"  - LEIE Exclusion Matches: {len(leie_results)}")
    print(f"  - Calendar Velocity Surges: {len(surge_results)}")
    print("  - Legal Finding: 0 (All items are exploratory screening leads)")
    print("--------------------------------------------------------------------------")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DuckDB Healthcare Lead Miner")
    parser.add_argument("--db", default="test.db", help="Path to SQLite database")
    parser.add_argument("--export-dir", default="exports", help="Directory for output leads")
    args = parser.parse_args()
    run_miner(args.db, args.export_dir)
