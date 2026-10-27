# ESTAFO / Vanguard — Production Gaps & Remediation Plan

This document establishes the verified delta between the initial static-prototype state of Vanguard/MediFraudy and the target production operating model required for an evidence-grounded intelligence and profit execution system.

---

## 1. Verified Gaps Inventory

| Area | Current State | Target State | Severity | Remediation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Data Ingestion** | Static JSON fixtures in `/public/data/*.json` | Live server-side Socrata SODA adapters fetching directly from NYC Open Data | **HIGH** | Build Next.js serverless route handlers (`/api/sources/*`) with timeouts, retries, caching headers, and stable SODA `$select`/`$where` filters. |
| **Truth & Provenance** | Footer stated `TRUTH SOURCE: static JSON · ZERO BACKEND` | Source-linked records with official portal URLs, agency dataset IDs, query timestamps, and HTTP ETags | **HIGH** | Expose provenance metadata (`source_id`, `retrieval_timestamp`, `socrata_url`, `raw_record_id`) on every API payload. |
| **Medicaid Claims Claims** | README claimed 77.3M claims; files contained synthetic/aggregate fixtures | Honest labeling as HHS Open Payments / CMS Aggregated Provider Screening only | **CRITICAL** | Enforce Gate G1: Restrict claims-level claims to authenticated/authorized datasets. Label public data strictly as "Screening & Peer Deviations". |
| **Financial Ledger** | Hardcoded `$9.6M BOUNTY` metric counting uncollected statutory claims as earned money | Double-entry commercial ledger tracking real law firm research retainer cash vs. pipeline exposure | **HIGH** | Create `/api/ledger` separating Cash Collected, Billed Invoices, Contracted Retainers, and Speculative Pipeline. |
| **Task / Field Queue** | Unpopulated visual table rows | Actionable task queue connected to live anomalies with status toggles (`TODO`, `INVESTIGATING`, `FILED`, `RESOLVED`) | **MEDIUM** | Build `/api/tasks` endpoint with in-memory/persisted task store, due dates, priority weighting, and exportable dossiers. |
| **Security & Secrets** | Tracked `.env.production` and `.env.railway` in MediFraudy repository | Removed from Git tracking, rotated credentials, and replaced with sanitized `.env.example` | **RESOLVED** | Already resolved via Gate G0 containment commit (`33f4084`). Enforce `.gitignore` everywhere. |

---

## 2. API Schema Discrepancy & Mitigation

NYC Open Data uses the Socrata Open Data API (SODA 2.0). Different datasets have distinct field casing and naming schemas:

### A. NYC 311 Service Requests (`erm2-nwe9`)
- Endpoint: `https://data.cityofnewyork.us/resource/erm2-nwe9.json`
- Spatial Coordinates: `latitude`, `longitude` (string format, requires `parseFloat`), plus GeoJSON `location` object.
- Key Fields: `unique_key`, `created_date`, `complaint_type`, `descriptor`, `incident_address`, `incident_zip`, `borough`, `status`.
- Mitigation: Query specifically for verified commercially actionable enforcement types (`complaint_type in ('Idling', 'Illegal Dumping')`).

### B. NYC DOB Complaints (`eabe-havv`)
- Endpoint: `https://data.cityofnewyork.us/resource/eabe-havv.json`
- Key Fields: `complaint_number`, `date_entered`, `house_number`, `house_street`, `zip_code`, `borough`, `bin`, `complaint_category`, `disposition_code`.
- Spatial Coordinates: Must map `bin` (Building Identification Number) or geocode address if explicit lat/lng are null.

### C. NYC DOB Violations (`3h2n-5cm9`)
- Endpoint: `https://data.cityofnewyork.us/resource/3h2n-5cm9.json`
- Key Fields: `isns_violation_number`, `issue_date`, `house_number`, `street`, `boro`, `bin`, `violation_type_code`, `violation_category`, `disposition_comments`.

---

## 3. Freshness & Ingestion SLOs

- **Real-Time Stream (`/api/sources/311-stream`)**: Freshness window < 4 hours. Cache TTL = 300 seconds (5 min) at edge.
- **DOB Complaints & Violations (`/api/sources/dob-*`)**: Freshness window < 24 hours. Cache TTL = 3600 seconds (1 hour).
- **Graceful Degradation**: If Socrata returns 429/503 or network drops, serverless endpoints serve the last verified cached response with header `X-Estafo-Stale: true` and display an explicit badge in the UI rather than crashing.

---

## 4. Verification Checkpoints (Gate G6)

1. [x] Zero secrets in tracked git files.
2. [x] Socrata live endpoints queried and returning HTTP 200 with non-empty JSON arrays.
3. [x] Production build passes without TypeScript or ESLint errors.
4. [ ] Live API route handlers integrated into Next.js App Router.
5. [ ] UI displays real Socrata record counts and live timestamps.
