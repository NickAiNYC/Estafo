"""Retire the synthetic demonstration cohort - operator runbook script.

Usage:
    python scripts/retire_synthetic_cohort.py --dry-run     # report only (default)
    python scripts/retire_synthetic_cohort.py --execute     # delete synthetic rows
    python scripts/retire_synthetic_cohort.py --audit       # JSON data-source audit

After execution the platform serves only release-pinned HHS imports against
the NPPES-verified provider registry. Re-seeding is blocked by
SYNTHETIC_DATA_ALLOWED=false unless explicitly overridden in dev.
"""

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import SessionLocal
from services.data_audit import audit_data_sources, retire_synthetic_data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true", default=True)
    group.add_argument("--execute", action="store_true")
    parser.add_argument("--audit", action="store_true")
    args = parser.parse_args()

    with SessionLocal() as db:
        if args.audit:
            print(json.dumps(audit_data_sources(db), indent=2))
            return 0
        result = retire_synthetic_data(db, dry_run=not args.execute)
        print(json.dumps(result, indent=2))
        if args.execute:
            print("\nPost-retirement audit:")
            print(json.dumps(audit_data_sources(db)["aggregate_rows"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
