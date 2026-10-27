# DATA PROVENANCE & AUTHORITATIVE SOURCE REGISTRY
**Project:** Vanguard Console / Estafo  
**Standard:** Open Data Provenance & Legal Licensing Framework  

---

## 1. Verified Official Data Sources

### Source 1: NYC 311 Service Requests
- **Publisher:** NYC Department of Information Technology and Telecommunications (DoITT) / NYC Open Data
- **Official URL:** [https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9)
- **API Endpoint:** `https://data.cityofnewyork.us/resource/erm2-nwe9.json`
- **Update Frequency:** Real-time / Daily batch
- **Key Fields:** `unique_key`, `created_date`, `agency`, `complaint_type`, `descriptor`, `incident_address`, `latitude`, `longitude`, `status`, `bbl`
- **Deduplication Key:** `unique_key`
- **Permitted Use:** NYC Open Data Terms of Use (Public domain for civic and commercial research; attribution recommended).

### Source 2: NYC DOB Complaints Received
- **Publisher:** NYC Department of Buildings (DOB)
- **Official URL:** [https://data.cityofnewyork.us/Housing-Development/DOB-Complaints-Received/eabe-havv](https://data.cityofnewyork.us/Housing-Development/DOB-Complaints-Received/eabe-havv)
- **API Endpoint:** `https://data.cityofnewyork.us/resource/eabe-havv.json`
- **Update Frequency:** Daily
- **Key Fields:** `complaint_number`, `status`, `date_entered`, `house_number`, `house_street`, `zip_code`, `bin`, `community_board`, `disposition_code`, `dobrundate`
- **Deduplication Key:** `complaint_number`
- **Permitted Use:** NYC Open Data Policy.

### Source 3: NYC DOB Violations
- **Publisher:** NYC Department of Buildings (DOB)
- **Official URL:** [https://data.cityofnewyork.us/Housing-Development/DOB-Violations/3h2n-5cm9](https://data.cityofnewyork.us/Housing-Development/DOB-Violations/3h2n-5cm9)
- **API Endpoint:** `https://data.cityofnewyork.us/resource/3h2n-5cm9.json`
- **Update Frequency:** Daily
- **Key Fields:** `isn_dob_bis_viol`, `boro`, `bin`, `block`, `lot`, `issue_date`, `violation_type_code`, `violation_category`, `description`
- **Deduplication Key:** `isn_dob_bis_viol`
- **Permitted Use:** NYC Open Data Policy.

### Source 4: HHS Medicaid Provider Spending by HCPCS
- **Publisher:** U.S. Department of Health and Human Services (HHS)
- **Official URL:** [https://opendata.hhs.gov/datasets/medicaid-provider-spending/](https://opendata.hhs.gov/datasets/medicaid-provider-spending/)
- **Data Granularity:** Monthly aggregates of Provider NPI × HCPCS procedure codes.
- **Critical Limitation (Gate G1):** This dataset **does not contain individual beneficiary claims, patient identifiers, or timestamps**. It cannot prove an individual false claim on its own.
- **Classification:** Unvalidated research screening for peer comparison only.

---

## 2. Ingestion Resilience & Error Handling Rules

1. **No Silent Mock Substitution:** If a Socrata query fails due to network outage or rate limit (HTTP 429/500), the system must preserve the last successful snapshot, display a `STALE DATA` warning banner with timestamp, and record the HTTP error. It must **never** silently substitute simulated records.
2. **Exponential Backoff:** Retries are bounded to 3 attempts with exponential backoff: 500ms, 1,500ms, 4,500ms.
3. **Traceability:** Every record displayed in the console carries an immutable `source_url`, `source_id`, and `ingested_at` timestamp.
