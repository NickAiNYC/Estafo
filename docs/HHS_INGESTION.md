# HHS HCPCS pilot ingestion and research dossiers

As of October 27, 2026, the official [HHS Medicaid Provider Spending by HCPCS](https://opendata.hhs.gov/datasets/medicaid-provider-spending/) release covers **January 2018 through December 2024**. The earlier `seed_hhs_aggregates.py` script creates fictional 2025 examples. They are now labeled `DEMO_SYNTHETIC_2025`; they are not official rows or real provider findings.

The official file contains billing NPI, servicing NPI, HCPCS, month, unique beneficiaries, claim lines, and total paid. It does **not** contain city or state. To create a NYC cohort, independently verify each billing NPI with an authoritative registry such as NPPES and load the corresponding `Provider` rows with names and NYC locations. A spending row's NPI alone does not prove where service occurred.

## Import one official release

1. The importer discovers the latest ZIP URL, release date, and SHA-256 from the official HHS page. Review the source page when its structure changes; discovery stops rather than guessing. Do not use a 2025 date for the February 2026 release of 2018–2024 data.
2. Create a private file with one **vetted, 10-digit NYC billing NPI** per line. All NPIs must already exist in the `providers` table. Do not use the fictional demo NPIs. The file's SHA-256 is recorded with the import.
3. Apply database migrations and run the import:

```sh
cd backend
alembic upgrade head
python scripts/import_hhs_aggregates.py \
  --discover \
  --npi-file /secure/path/nyc-t2024-npis.txt \
  --hcpcs-code T2024
```

For an already downloaded official file, use `--file /path/to/download.csv.zip --release-id 2026-02-09` instead of `--discover`; optionally add the published checksum with `--sha256`. The importer reads the full file as a stream, validates the seven source columns, retains the selected HCPCS/allowlist slice, computes the file hash, and records an import manifest. Discovery skips the download when the page's checksum and NPI list were already imported. If the NPI allowlist changes, reconcile the cohort and existing reviews before importing it.

The source's small-cell suppression is applied **upstream by HHS**. The importer does not fabricate missing rows or infer patient-level records. Published rows are marked as published; a missing cell cannot be interpreted as zero.

## Quarterly check

`.github/workflows/hhs-quarterly-import.yml` checks on January, April, July, and October 1 and can be run manually. HHS has **not** promised quarterly releases; the schedule checks the official page for a changed ZIP checksum. The workflow needs:

| GitHub setting | Value |
| --- | --- |
| Secret `MEDIFRAUDY_DATABASE_URL` | Database connection string with migration and insert permission |
| Secret `NYC_T2024_NPI_ALLOWLIST` | Newline-separated vetted billing NPIs |

Configuration is intentionally absent from the repository. Until both secrets and the vetted provider registry are supplied, the scheduled workflow fails without importing data. Review the first manual run and its database row counts before relying on the quarterly schedule. A new official release may change the page structure or column names; the importer stops rather than guessing a mapping.

## PDF dossier

On `/verified-leads`, select a provider and choose **Export research dossier PDF**. The PDF includes source release URL and SHA-256 when imported, cohort comparison, monthly source row IDs, checklist statuses, assumptions, review outcome, and page identifiers. If the selected rows are synthetic or lack an import manifest, the PDF warns that they are unverified. It is a research aid, **not a complaint, subpoena, proof of fraud, or legal filing**. Keep exported files in approved case storage; the API sends `Cache-Control: no-store` but cannot control browser downloads.
