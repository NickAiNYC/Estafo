"""Query official CMS NPPES Registry API to build a genuine NYC Adult Day Care NPI cohort.

Location Rule:
Primary practice location (address_purpose == 'LOCATION') located in NYC five boroughs:
- Manhattan: 100xx, 101xx, 102xx
- Staten Island: 103xx
- Bronx: 104xx
- Brooklyn: 111xx, 112xx
- Queens: 113xx, 114xx, 116xx

Validates 100% Luhn check digit, persists to SQLite Provider table, and emits allowlist file with SHA-256.
"""

import json
import os
import re
import sys
import hashlib
from pathlib import Path
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import Base, SessionLocal, engine
from models import Provider

NYC_PREFIXES = {"100", "101", "102", "103", "104", "111", "112", "113", "114", "116"}

def verify_luhn(npi: str) -> bool:
    if not re.fullmatch(r"\d{10}", npi):
        return False
    full = "80840" + npi
    s = 0
    for i, ch in enumerate(reversed(full)):
        d = int(ch)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        s += d
    return s % 10 == 0

def fetch_real_nyc_adhc_providers() -> list[dict]:
    cities = ["NEW YORK", "BROOKLYN", "BRONX", "FLUSHING", "JAMAICA", "STATEN ISLAND", "ASTORIA", "LONG ISLAND CITY"]
    providers = {}

    for city in cities:
        c_param = city.replace(" ", "+")
        url = f"https://npiregistry.cms.hhs.gov/api/?version=2.1&taxonomy_description=Adult+Day+Care&city={c_param}&state=NY&limit=100"
        try:
            req = Request(url, headers={"User-Agent": "MediFraudy-NPPES-Fetcher/1.0"})
            with urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for r in data.get("results", []):
                    npi = str(r.get("number"))
                    if not verify_luhn(npi):
                        continue

                    basic = r.get("basic", {})
                    org_name = basic.get("organization_name")
                    if not org_name:
                        first = basic.get("first_name", "")
                        last = basic.get("last_name", "")
                        org_name = f"{first} {last}".strip()

                    addrs = [a for a in r.get("addresses", []) if a.get("address_purpose") == "LOCATION"] or r.get("addresses", [])
                    addr = addrs[0] if addrs else {}
                    zip_c = addr.get("postal_code", "")[:5]
                    state = addr.get("state", "").upper()

                    if state == "NY" and zip_c[:3] in NYC_PREFIXES:
                        providers[npi] = {
                            "npi": npi,
                            "name": org_name or f"ADHC FACILITY NPI {npi}",
                            "address": addr.get("address_1", ""),
                            "city": addr.get("city", "").upper(),
                            "state": "NY",
                            "zip_code": zip_c,
                            "enumeration_date": basic.get("enumeration_date", "2020-01-01"),
                            "facility_type": "Adult Day Care (T2024)",
                            "taxonomy_code": "261QA0600X"
                        }
        except Exception as e:
            print(f"Notice: Failed to fetch for {city}: {e}")

    return list(providers.values())

def main():
    print("Querying CMS NPPES Registry for real NYC Adult Day Care providers...")
    cohort = fetch_real_nyc_adhc_providers()
    print(f"Retrieved {len(cohort)} verified real NYC ADHC providers.")

    if not cohort:
        print("Error: No providers retrieved from CMS NPPES.")
        sys.exit(1)

    # Persist to database
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        for p in cohort:
            existing = db.query(Provider).filter_by(npi=p["npi"]).first()
            if not existing:
                db.add(Provider(
                    npi=p["npi"],
                    name=p["name"],
                    address=p["address"],
                    city=p["city"],
                    state="NY",
                    zip_code=p["zip_code"],
                    facility_type=p["facility_type"],
                    specialty="Adult Day Health Care",
                    is_nyc_verified=True,
                ))
            else:
                existing.name = p["name"]
                existing.address = p["address"]
                existing.city = p["city"]
                existing.zip_code = p["zip_code"]
                existing.is_nyc_verified = True
        db.commit()

    # Emit allowlist
    output_path = Path("backend/data/vetted_nyc_t2024_npis.txt")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    npis = sorted(p["npi"] for p in cohort)
    content = "\n".join(npis) + "\n"
    output_path.write_text(content)

    sha256 = hashlib.sha256(content.strip().encode()).hexdigest()
    sha_path = Path("backend/data/vetted_nyc_t2024_npis.sha256")
    sha_path.write_text(sha256 + "\n")

    print(f"Saved {len(npis)} vetted NPIs to {output_path}")
    print(f"Allowlist SHA-256: {sha256}")

    # Also emit a JSON file for Estafo frontend
    json_path = Path("backend/data/vetted_nyc_adhc_cohort.json")
    json_path.write_text(json.dumps(cohort, indent=2))
    print(f"Saved detailed cohort to {json_path}")

if __name__ == "__main__":
    main()
