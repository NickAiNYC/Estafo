"""Small official-schema fixture for streaming and provenance, with no network use."""

import gzip
import importlib.util
import json
from pathlib import Path

import pytest
from sqlalchemy.orm import sessionmaker

from models import AggregateImportRun, AggregateSpendingRecord, Provider
script_path = Path(__file__).parents[1] / "scripts" / "import_hhs_aggregates.py"
spec = importlib.util.spec_from_file_location("hhs_import_script", script_path)
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


def write_fixture(tmp_path: Path, paid: str = "125.50") -> tuple[Path, Path]:
    csv_path = tmp_path / "hhs.csv.gz"
    source = (
        "BILLING_PROVIDER_NPI_NUM,SERVICING_PROVIDER_NPI_NUM,HCPCS_CODE,CLAIM_FROM_MONTH,"
        "TOTAL_UNIQUE_BENEFICIARIES,TOTAL_CLAIMS,TOTAL_PAID\n"
        f"1234567890,1234567890,T2024,2024-01,15,23,{paid}\n"
        "9999999999,9999999999,T2024,2024-01,30,45,900.00\n"
        "1234567890,1234567890,99213,2024-01,20,30,50.00\n"
    )
    with gzip.open(csv_path, "wt") as stream:
        stream.write(source)
    allowlist = tmp_path / "nyc-npis.txt"
    allowlist.write_text("1234567890\n")
    return csv_path, allowlist


def test_imports_only_vetted_npi_and_records_provenance(tmp_path, db_session, monkeypatch):
    db_session.add(Provider(npi="1234567890", name="Test Registry Provider", city="Brooklyn", state="NY"))
    db_session.commit()
    monkeypatch.setattr(importer, "engine", db_session.bind)
    monkeypatch.setattr(importer, "SessionLocal", sessionmaker(bind=db_session.bind))
    path, allowlist = write_fixture(tmp_path)
    result = importer.import_slice(path, "https://opendata.hhs.gov/official.csv.gz", "2026-02-09", allowlist, "T2024")
    assert result["status"] == "imported"
    assert result["imported_rows"] == 1
    row = db_session.query(AggregateSpendingRecord).one()
    assert row.year_month == "2024-01"
    assert row.total_paid_amount == 125.5
    assert row.source_dataset.startswith("HHS_HCPCS_2026-02-09_")
    manifest = db_session.query(AggregateImportRun).one()
    assert manifest.source_sha256 == result["source_sha256"]
    assert importer.import_slice(path, "https://opendata.hhs.gov/official.csv.gz", "2026-02-09", allowlist, "T2024")["status"] == "unchanged"
    assert db_session.query(AggregateSpendingRecord).count() == 1


def test_rejects_bad_checksum_without_writing(tmp_path, db_session, monkeypatch):
    monkeypatch.setattr(importer, "engine", db_session.bind)
    monkeypatch.setattr(importer, "SessionLocal", sessionmaker(bind=db_session.bind))
    path, allowlist = write_fixture(tmp_path)
    with pytest.raises(ValueError, match="SHA-256"):
        importer.import_slice(path, "https://opendata.hhs.gov/official.csv.gz", "2026-02-09", allowlist, "T2024", "0" * 64)
    assert db_session.query(AggregateSpendingRecord).count() == 0


def test_discovers_official_zip_metadata_without_download():
    checksum = "a" * 64
    versions = [{"version": "2026-02-09", "artifacts": [{
        "name": "medicaid-provider-spending.csv.zip", "format": "zip",
        "url": "https://official.example/dataset.csv.zip", "checksum": f"sha256:{checksum}",
    }]}]
    payload = 'segment:{"versions":' + json.dumps(versions) + '}end'
    html = '<script>self.__next_f.push(' + json.dumps([1, payload]) + ')</script>'
    assert importer.discover_release(html) == ("https://official.example/dataset.csv.zip", "2026-02-09", checksum)
    with pytest.raises(ValueError, match="valid ZIP release"):
        importer.discover_release("<html>No release metadata</html>")
