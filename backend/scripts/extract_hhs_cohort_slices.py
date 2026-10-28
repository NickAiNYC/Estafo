#!/usr/bin/env python3
"""
Streamlined extraction of vetted NYC provider slices from official HHS ZIP release.
Supports HCPCS T2024 (Adult Day Care) and H0005 (Chemical Dependence Counseling).
Uses DuckDB to scan the uncompressed CSV in seconds rather than tens of minutes.
"""

import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import zipfile

EXPECTED_SHA256 = "3387c48ea9600c15e8e6b43e68599b814cc66b24723e8d7aba2f556a8136f149"
RELEASE_ID = "2026-02-09"

def verify_checksum(path: Path, expected_sha256: str) -> bool:
    print(f"[*] Verifying SHA-256 checksum of {path}...")
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(10 * 1024 * 1024), b""):
            digest.update(block)
    actual = digest.hexdigest()
    if actual.lower() != expected_sha256.lower():
        print(f"[-] Checksum mismatch! Expected {expected_sha256}, got {actual}")
        return False
    print(f"[✓] SHA-256 Verified: {actual}")
    return True

def extract_and_import(zip_path: Path, db_path: Path = Path("test.db")):
    import duckdb

    if not zip_path.exists():
        print(f"[-] ZIP archive not found at: {zip_path}")
        sys.exit(1)

    print(f"[*] Opening HHS ZIP archive: {zip_path}")
    with zipfile.ZipFile(zip_path) as z:
        csv_members = [name for name in z.namelist() if name.lower().endswith(".csv")]
        if not csv_members:
            print("[-] No CSV found inside ZIP")
            sys.exit(1)
        csv_name = csv_members[0]
        print(f"    Extracting inner CSV: {csv_name} (this is required for DuckDB parallel scan)...")
        # Extract to backend/data/ temp or alongside zip
        extracted_csv = zip_path.parent / csv_name
        if not extracted_csv.exists() or extracted_csv.stat().st_size == 0:
            z.extract(csv_name, path=zip_path.parent)
        print(f"[✓] CSV ready at {extracted_csv} ({extracted_csv.stat().st_size / (1024**3):.2f} GB)")

    # Load target allowlists
    t2024_allowlist_file = Path("backend/data/vetted_nyc_t2024_npis.txt")
    h0005_allowlist_file = Path("backend/data/vetted_nyc_h0005_npis.txt")

    t2024_npis = [l.strip() for l in t2024_allowlist_file.read_text().splitlines() if l.strip() and not l.startswith("#")]
    h0005_npis = [l.strip() for l in h0005_allowlist_file.read_text().splitlines() if l.strip() and not l.startswith("#")]

    print(f"[*] Target Cohort: {len(t2024_npis)} T2024 NPIs, {len(h0005_npis)} H0005 NPIs")

    con = duckdb.connect()
    
    # Create temp tables for allowlists
    con.execute("CREATE TEMPORARY TABLE t2024_cohort (npi VARCHAR);")
    con.executemany("INSERT INTO t2024_cohort VALUES (?);", [(n,) for n in t2024_npis])

    con.execute("CREATE TEMPORARY TABLE h0005_cohort (npi VARCHAR);")
    con.executemany("INSERT INTO h0005_cohort VALUES (?);", [(n,) for n in h0005_npis])

    print(f"[*] Scanning {extracted_csv} with DuckDB multi-threaded engine...")
    source_dataset = f"HHS_HCPCS_{RELEASE_ID}_{EXPECTED_SHA256[:8]}"

    query = f"""
    CREATE TEMPORARY TABLE extracted_slices AS
    SELECT 
        BILLING_PROVIDER_NPI_NUM AS billing_npi,
        SERVICING_PROVIDER_NPI_NUM AS servicing_npi,
        HCPCS_CODE AS hcpcs_code,
        NULL AS hcpcs_description,
        SUBSTR(CLAIM_FROM_MONTH, 1, 7) AS year_month,
        CAST(TOTAL_PAID AS DOUBLE) AS total_paid_amount,
        COALESCE(TRY_CAST(TOTAL_CLAIM_LINES AS INTEGER), 0) AS total_claims,
        COALESCE(TRY_CAST(TOTAL_PATIENTS AS INTEGER), 0) AS total_beneficiaries,
        FALSE AS is_suppressed,
        'NY' AS state,
        '{source_dataset}' AS source_dataset,
        CURRENT_TIMESTAMP AS retrieval_timestamp
    FROM read_csv_auto('{extracted_csv}')
    WHERE 
        (HCPCS_CODE = 'T2024' AND BILLING_PROVIDER_NPI_NUM IN (SELECT npi FROM t2024_cohort))
        OR
        (HCPCS_CODE = 'H0005' AND BILLING_PROVIDER_NPI_NUM IN (SELECT npi FROM h0005_cohort));
    """
    con.execute(query)
    
    match_count = con.execute("SELECT COUNT(*) FROM extracted_slices;").fetchone()[0]
    distinct_npis = con.execute("SELECT COUNT(DISTINCT billing_npi) FROM extracted_slices;").fetchone()[0]
    t2024_rows = con.execute("SELECT COUNT(*) FROM extracted_slices WHERE hcpcs_code = 'T2024';").fetchone()[0]
    h0005_rows = con.execute("SELECT COUNT(*) FROM extracted_slices WHERE hcpcs_code = 'H0005';").fetchone()[0]

    print(f"[✓] Extracted {match_count} total rows across {distinct_npis} distinct NPI(s):")
    print(f"    - HCPCS T2024: {t2024_rows} monthly spending rows")
    print(f"    - HCPCS H0005: {h0005_rows} monthly spending rows")

    # Insert into SQLite database using native connection
    print(f"[*] Merging into SQLite database: {db_path}")
    rows = con.execute("SELECT * FROM extracted_slices;").fetchall()
    cols = [desc[0] for desc in con.description]

    sqlite_conn = sqlite3.connect(db_path)
    placeholders = ", ".join(["?"] * len(cols))
    col_names = ", ".join(cols)

    sqlite_conn.executemany(f"""
        INSERT OR REPLACE INTO aggregate_spending_records ({col_names})
        VALUES ({placeholders});
    """, rows)

    t2024_sha = hashlib.sha256("\n".join(sorted(t2024_npis)).encode()).hexdigest()
    h0005_sha = hashlib.sha256("\n".join(sorted(h0005_npis)).encode()).hexdigest()

    sqlite_conn.execute("""
        INSERT OR REPLACE INTO aggregate_import_runs (
            source_dataset, source_url, source_sha256, release_id,
            hcpcs_code, npi_allowlist_sha256, imported_rows, imported_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
    """, (source_dataset, 'https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.csv.zip', EXPECTED_SHA256, RELEASE_ID, 'T2024', t2024_sha, t2024_rows))

    sqlite_conn.execute("""
        INSERT OR REPLACE INTO aggregate_import_runs (
            source_dataset, source_url, source_sha256, release_id,
            hcpcs_code, npi_allowlist_sha256, imported_rows, imported_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
    """, (source_dataset, 'https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.csv.zip', EXPECTED_SHA256, RELEASE_ID, 'H0005', h0005_sha, h0005_rows))

    sqlite_conn.commit()
    sqlite_conn.close()

    print("[✓] SQLite database successfully updated with verified spending records.")

    # Clean up uncompressed CSV to conserve disk space
    if extracted_csv.exists():
        print(f"[*] Removing temporary uncompressed CSV: {extracted_csv}")
        extracted_csv.unlink()

    print("[✓] Ingestion complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HHS Cohort Slice Extractor")
    parser.add_argument("--zip", default="backend/data/hhs_spending_2026-02-09.csv.zip", help="Path to HHS ZIP file")
    parser.add_argument("--db", default="test.db", help="Path to target SQLite DB")
    parser.add_argument("--skip-verify", action="store_true", help="Skip SHA-256 checksum verification")
    args = parser.parse_args()

    zip_file = Path(args.zip)
    if not args.skip_verify:
        if not verify_checksum(zip_file, EXPECTED_SHA256):
            sys.exit(1)

    extract_and_import(zip_file, Path(args.db))
