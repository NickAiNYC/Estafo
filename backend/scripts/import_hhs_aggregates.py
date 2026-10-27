"""Download and import a vetted-NPI slice of the official HHS HCPCS release.

The HHS file has no city or state column. The caller must provide an independently
verified NYC NPI allowlist; this script never infers NYC from the spending file.
Run quarterly to check for a new release, not to imply quarterly source updates.
"""

import argparse
import csv
import gzip
import hashlib
from html.parser import HTMLParser
import io
import itertools
import json
import math
import os
from pathlib import Path
import re
import sys
import tempfile
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import Base, SessionLocal, engine
from models import AggregateImportRun, AggregateSpendingRecord, Provider

REQUIRED_COLUMNS = {
    "BILLING_PROVIDER_NPI_NUM", "SERVICING_PROVIDER_NPI_NUM", "HCPCS_CODE",
    "CLAIM_FROM_MONTH", "TOTAL_UNIQUE_BENEFICIARIES", "TOTAL_CLAIMS", "TOTAL_PAID",
}
HHS_DATASET_PAGE = "https://opendata.hhs.gov/datasets/medicaid-provider-spending/"


class ScriptCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside_script = False
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.inside_script = True

    def handle_endtag(self, tag):
        if tag == "script":
            self.inside_script = False

    def handle_data(self, data):
        if self.inside_script:
            self.scripts.append(data)


def discover_release(page_html: str) -> tuple[str, str, str]:
    """Read the ZIP URL, date, and checksum embedded by the official HHS page."""
    parser = ScriptCollector()
    parser.feed(page_html)
    versions = []
    for script in parser.scripts:
        if "medicaid-provider-spending.csv.zip" not in script:
            continue
        match = re.search(r"self\.__next_f\.push\((\[.*\])\)$", script, re.S)
        if not match:
            continue
        try:
            payload = json.loads(match.group(1))[1]
            marker = '"versions":'
            position = payload.find(marker)
            if position >= 0:
                versions.extend(json.JSONDecoder().raw_decode(payload[position + len(marker):])[0])
        except (json.JSONDecodeError, ValueError, IndexError, TypeError):
            continue
    for version in sorted(versions, key=lambda item: item.get("version", ""), reverse=True):
        release_id = version.get("version", "")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", release_id):
            continue
        for artifact in version.get("artifacts", []):
            if artifact.get("format") != "zip" or not artifact.get("name", "").endswith(".csv.zip"):
                continue
            url = artifact.get("url", "")
            checksum = artifact.get("checksum", "")
            if urlparse(url).scheme == "https" and re.fullmatch(r"sha256:[0-9a-fA-F]{64}", checksum):
                return url, release_id, checksum.split(":", 1)[1]
    raise ValueError("Official HHS page did not expose a valid ZIP release and SHA-256; stop and review the page format")


def discovered_release() -> tuple[str, str, str]:
    request = Request(HHS_DATASET_PAGE, headers={"User-Agent": "MediFraudy-research-import/1.0"})
    with urlopen(request, timeout=60) as response:
        return discover_release(response.read().decode("utf-8"))


def previously_imported(checksum: str, hcpcs_code: str, npi_file: Path) -> AggregateImportRun | None:
    _, allowlist_sha = read_allowlist(npi_file)
    with SessionLocal() as db:
        return db.query(AggregateImportRun).filter_by(
            source_sha256=checksum, hcpcs_code=hcpcs_code, npi_allowlist_sha256=allowlist_sha
        ).first()


def digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download(url: str, destination: Path) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("The source URL must be an official HTTPS download URL")
    request = Request(url, headers={"User-Agent": "MediFraudy-research-import/1.0"})
    with urlopen(request, timeout=120) as response, destination.open("wb") as output:
        for block in iter(lambda: response.read(1024 * 1024), b""):
            output.write(block)


def read_allowlist(path: Path) -> tuple[set[str], str]:
    npis = {line.strip() for line in path.read_text().splitlines() if line.strip() and not line.startswith("#")}
    if not npis or any(not re.fullmatch(r"\d{10}", npi) for npi in npis):
        raise ValueError("NPI allowlist must contain one 10-digit NPI per line")
    digest = hashlib.sha256("\n".join(sorted(npis)).encode()).hexdigest()
    return npis, digest


def csv_rows(path: Path):
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            members = [name for name in archive.namelist() if name.lower().endswith(".csv")]
            if len(members) != 1:
                raise ValueError("Expected exactly one CSV member in HHS ZIP")
            with archive.open(members[0]) as raw, io.TextIOWrapper(raw, encoding="utf-8-sig", newline="") as text:
                yield from csv.DictReader(text)
    elif is_gzip(path):
        with gzip.open(path, "rt", encoding="utf-8-sig", newline="") as text:
            yield from csv.DictReader(text)
    else:
        with path.open("r", encoding="utf-8-sig", newline="") as text:
            yield from csv.DictReader(text)


def is_gzip(path: Path) -> bool:
    with path.open("rb") as stream:
        return stream.read(2) == b"\x1f\x8b"


def parse_optional_count(value: str | None) -> int | None:
    if value is None or not value.strip():
        return None
    count = int(value)
    if count < 0:
        raise ValueError("Negative count in HHS row")
    return count


def import_slice(path: Path, source_url: str, release_id: str, npi_file: Path, hcpcs_code: str,
                 expected_sha256: str | None = None) -> dict:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", release_id):
        raise ValueError("Release ID must be the official publication date: YYYY-MM-DD")
    if not re.fullmatch(r"[A-Z0-9]{5}", hcpcs_code):
        raise ValueError("HCPCS code must have five uppercase letters or digits")
    npis, allowlist_sha = read_allowlist(npi_file)
    file_sha = digest_file(path)
    if expected_sha256 and file_sha.lower() != expected_sha256.lower():
        raise ValueError("Source SHA-256 does not match the expected checksum")
    source_dataset = f"HHS_HCPCS_{release_id}_{file_sha[:8]}"

    rows = csv_rows(path)
    first_row = next(rows, None)
    if first_row is None or not REQUIRED_COLUMNS.issubset(first_row):
        raise ValueError(f"HHS CSV is empty or missing required columns: {sorted(REQUIRED_COLUMNS - set(first_row or {}))}")

    # Parse and validate the full slice before touching the database.
    selected = []
    keys = set()
    for raw in itertools.chain((first_row,), rows):
        if raw["HCPCS_CODE"] != hcpcs_code or raw["BILLING_PROVIDER_NPI_NUM"] not in npis:
            continue
        billing_npi = raw["BILLING_PROVIDER_NPI_NUM"]
        servicing_npi = raw["SERVICING_PROVIDER_NPI_NUM"] or None
        month = raw["CLAIM_FROM_MONTH"][:7]
        if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
            raise ValueError(f"Invalid month in HHS row: {month!r}")
        amount = float(raw["TOTAL_PAID"])
        if not math.isfinite(amount):
            raise ValueError("Non-finite paid amount in HHS row")
        key = (billing_npi, servicing_npi, hcpcs_code, month)
        if key in keys:
            raise ValueError(f"Duplicate HHS aggregate key: {key}")
        keys.add(key)
        selected.append(dict(
            billing_npi=billing_npi, servicing_npi=servicing_npi, hcpcs_code=hcpcs_code,
            year_month=month, total_paid_amount=amount,
            total_claims=parse_optional_count(raw["TOTAL_CLAIMS"]),
            total_beneficiaries=parse_optional_count(raw["TOTAL_UNIQUE_BENEFICIARIES"]),
            is_suppressed=False, state="NY", source_dataset=source_dataset,
        ))

    if not selected:
        raise ValueError("No matching rows. Check the release, HCPCS code, and verified NPI allowlist")

    Base.metadata.create_all(bind=engine) if engine.dialect.name == "sqlite" else None
    with SessionLocal() as db:
        existing = db.query(AggregateImportRun).filter_by(
            source_sha256=file_sha, hcpcs_code=hcpcs_code, npi_allowlist_sha256=allowlist_sha
        ).first()
        if existing:
            return {"status": "unchanged", "source_sha256": file_sha, "imported_rows": existing.imported_rows}
        previous_scope = db.query(AggregateImportRun).filter_by(hcpcs_code=hcpcs_code).first()
        if previous_scope and previous_scope.npi_allowlist_sha256 != allowlist_sha:
            raise ValueError("NYC NPI allowlist changed; reconcile prior imports before changing the cohort")
        known_npis = {p.npi for p in db.query(Provider).filter(Provider.npi.in_(npis)).all()}
        unknown = npis - known_npis
        if unknown:
            raise ValueError(f"NPI allowlist has {len(unknown)} NPIs absent from the vetted Provider registry")
        db.bulk_insert_mappings(AggregateSpendingRecord, selected)
        db.add(AggregateImportRun(
            source_dataset=source_dataset, source_url=source_url, source_sha256=file_sha,
            release_id=release_id, hcpcs_code=hcpcs_code,
            npi_allowlist_sha256=allowlist_sha, imported_rows=len(selected),
        ))
        db.commit()
    return {"status": "imported", "source_sha256": file_sha, "imported_rows": len(selected)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--discover", action="store_true", help="Discover the latest ZIP release and checksum from the official HHS page")
    source.add_argument("--url", help="Direct HTTPS URL copied from the official HHS dataset page")
    source.add_argument("--file", type=Path, help="Previously downloaded official CSV, CSV.GZ, or ZIP")
    parser.add_argument("--release-id", help="Official release date, YYYY-MM-DD; inferred with --discover")
    parser.add_argument("--npi-file", type=Path, required=True, help="Independently verified NYC NPI allowlist")
    parser.add_argument("--hcpcs-code", default="T2024")
    parser.add_argument("--sha256", help="Expected official file SHA-256, when available")
    args = parser.parse_args()
    if args.discover:
        url, release_id, checksum = discovered_release()
        existing = previously_imported(checksum, args.hcpcs_code, args.npi_file)
        if existing:
            print({"status": "unchanged", "source_sha256": checksum, "imported_rows": existing.imported_rows})
            return
        with tempfile.TemporaryDirectory(prefix="hhs-import-") as temp_dir:
            path = Path(temp_dir) / "source.download"
            download(url, path)
            result = import_slice(path, url, release_id, args.npi_file, args.hcpcs_code, checksum)
    elif args.url:
        if not args.release_id:
            parser.error("--release-id is required with --url")
        with tempfile.TemporaryDirectory(prefix="hhs-import-") as temp_dir:
            path = Path(temp_dir) / "source.download"
            download(args.url, path)
            result = import_slice(path, args.url, args.release_id, args.npi_file, args.hcpcs_code, args.sha256)
    else:
        if not args.release_id:
            parser.error("--release-id is required with --file")
        result = import_slice(args.file, args.file.resolve().as_uri(), args.release_id,
                              args.npi_file, args.hcpcs_code, args.sha256)
    print(result)


if __name__ == "__main__":
    main()
