"""Integration smoke test: NPPES full-file importer against a realistic fixture.

Builds a miniature NPPES dissemination CSV (current header vintage), imports
it through import_nppes_full(), and asserts the whole path: header resolution,
Luhn gate, NYC ZIP filter, taxonomy filter, deactivation capture, provider +
location upserts, and idempotent re-import.
"""

import os
import sys
import csv
import io
import tempfile
import zipfile
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///nppes_smoke.db"
if Path("nppes_smoke.db").exists():
    Path("nppes_smoke.db").unlink()
for stale in ("nppes_smoke.db-wal", "nppes_smoke.db-shm"):
    if Path(stale).exists():
        stale.unlink()

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import Base, engine, SessionLocal
from models import Provider, ProviderLocation, NPPESImportRun

# Luhn-valid test NPIs (validated against the repo's verify_luhn)
NPI_NYC_SADC = "1234567893"
NPI_NYC_OTHER = "1730293846"    # nursing taxonomy (filtered by default)
NPI_NJ = "1932552817"           # NJ ZIP -> filtered
NPI_BAD_LUHN = "1234567890"     # invalid check digit -> filtered

HEADER = [
    "NPI", "Entity Type Code", "Replacement NPI",
    "Employer Identification Number (EIN)",
    "Provider Organization Name (Legal Business Name)",
    "Provider Last Name (Legal Name)", "Provider First Name", "Provider Middle Name",
    "Provider Name Prefix Text", "Provider Name Suffix Text",
    "Provider Credential Text",
    "Provider First Line Business Mailing Address",
    "Provider Business Mailing Address City Name",
    "Provider Business Mailing Address State Name",
    "Provider Business Mailing Address Postal Code",
    "Provider First Line Business Practice Location Address",
    "Provider Second Line Business Practice Location Address",
    "Provider Business Practice Location Address City Name",
    "Provider Business Practice Location Address State Name",
    "Provider Business Practice Location Address Postal Code",
    "Provider Business Practice Location Address Country Code (If outside U.S.)",
    "Provider Business Practice Location Address Telephone Number",
    "Provider Enumeration Date", "Date Last Changed",
    "NPI Deactivation Reason Code", "NPI Deactivation Date", "NPI Reactivation Date",
    "Provider Gender Code",
    "Healthcare Provider Taxonomy Code_1",
    "Provider License Number_1", "Provider License Number State Code_1",
    "Healthcare Provider Primary Taxonomy Switch_1",
    "Healthcare Provider Taxonomy Code_2",
    "Is Sole Proprietor", "Is Organization Subpart", "Parent Organization LBN",
]

ROWS = [
    # NYC SADC org in Flushing - should import
    [NPI_NYC_SADC, "2", "", "12-3456789", "SUNRISE ADULT DAY CARE INC", "", "", "", "", "", "",
     "", "", "", "", "136-20 38TH AVE", "STE 2", "FLUSHING", "NY", "11355", "US",
     "718-555-0100", "2019-04-01", "2026-01-05", "", "", "", "",
     "385H00000N", "123456", "NY", "Y", "", "N", "N", ""],
    # NYC but nursing taxonomy - filtered out by default (target taxonomy only)
    [NPI_NYC_OTHER, "2", "", "98-7654321", "ELMHURST NURSING HOME LLC", "", "", "", "", "", "",
     "", "", "", "", "79-01 BROADWAY", "", "ELMHURST", "NY", "11373", "US",
     "718-555-0200", "2005-06-15", "2026-02-10", "", "", "", "",
     "314000000N", "654321", "NY", "Y", "", "N", "N", ""],
    # NJ ZIP - filtered out
    [NPI_NJ, "2", "", "11-1111111", "HACKENSACK ADULT CARE INC", "", "", "", "", "", "",
     "", "", "", "", "200 MAIN ST", "", "HACKENSACK", "NJ", "07601", "US",
     "201-555-0300", "2020-01-01", "2026-03-01", "", "", "", "",
     "385H00000N", "777777", "NJ", "Y", "", "N", "N", ""],
    # NYC SADC but invalid Luhn - filtered out
    [NPI_BAD_LUHN, "2", "", "22-2222222", "FAKE CHECK DIGIT INC", "", "", "", "", "", "",
     "", "", "", "", "100 FAKE ST", "", "BROOKLYN", "NY", "11201", "US",
     "718-555-0400", "2021-01-01", "2026-04-01", "", "", "", "",
     "385H00000N", "888888", "NY", "Y", "", "N", "N", ""],
    # NYC SADC, deactivated NPI - still imported (deactivation captured)
    ["1659652410", "2", "", "33-3333333", "CORONA SUNSET ADULT DAY CARE INC", "", "", "", "", "", "",
     "", "", "", "", "104-05 CORONA AVE", "", "CORONA", "NY", "11368", "US",
     "718-555-0500", "2015-08-01", "2026-05-01", "AT", "2026-04-15", "", "",
     "385H00000N", "999999", "NY", "Y", "", "N", "N", ""],
]


def build_fixture(path: Path) -> Path:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(HEADER)
    writer.writerows(ROWS)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("npidata_pfile_fixture.csv", buffer.getvalue())
    return path


def main() -> int:
    Base.metadata.create_all(bind=engine)

    with tempfile.TemporaryDirectory() as temp_dir:
        fixture = build_fixture(Path(temp_dir) / "NPPES_Data_Dissemination_October_2026.zip")
        from data_ingestion.nppes_full import import_nppes_full
        result = import_nppes_full(fixture, source_url="https://fixture.test/x.zip",
                                   file_label="NPPES_Data_Dissemination_October_2026")
        print("import result:", result)
        assert result["status"] == "imported"
        assert result["rows_total"] == 5
        assert result["rows_luhn_valid"] == 4
        assert result["rows_nyc"] == 2          # NJ, bad-Luhn, and non-target taxonomy filtered
        assert result["rows_deactivated"] == 1
        assert result["providers_upserted"] == 2
        assert result["locations_upserted"] == 2

        with SessionLocal() as db:
            providers = {p.npi: p for p in db.query(Provider).all()}
            assert NPI_NYC_SADC in providers
            provider = providers[NPI_NYC_SADC]
            assert provider.city == "FLUSHING"
            assert provider.is_nyc_verified is True
            assert "NPPES_FULL" in provider.verification_source
            assert NPI_NYC_OTHER not in providers   # wrong taxonomy filtered
            assert NPI_NJ not in providers           # NJ filtered
            assert NPI_BAD_LUHN not in providers     # Luhn gate

            location = db.query(ProviderLocation).filter_by(npi=NPI_NYC_SADC).one()
            assert location.borough == "Queens"
            assert location.zip_code == "11355"

            run = db.query(NPPESImportRun).one()
            assert run.rows_nyc == 2
            assert run.rows_luhn_valid == 4
            assert run.file_label == "NPPES_Data_Dissemination_October_2026"

        # Idempotency: same file re-import is a no-op
        again = import_nppes_full(fixture)
        assert again["status"] == "unchanged", again
        print("re-import:", again)

        with SessionLocal() as db:
            assert db.query(Provider).count() == 2

    print("\nNPPES full-importer smoke test PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
