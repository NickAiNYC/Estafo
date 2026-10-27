# ESTAFO // System API Documentation & Ingestion Specifications

This document defines the complete API surface of **ESTAFO**, covering live Socrata SODA data pipelines, Medicaid provider intelligence feeds, the cryptographic attorney feedback ledger, and the Python backend scoring engine.

---

## 1. Next.js App Router Ingestion & SODA Endpoints

### 1.1 Medicaid Intelligence Feeds (`/api/sources/medicaid-leads`)
* **Method**: `GET`
* **Purpose**: Serves vetted NYC Medicaid provider leads joined with live attorney feedback and cryptographic signatures.
* **Methodology**: Eliminates raw volume bias by ranking providers according to normalized monthly spending intensity ($\text{total\_spend} / \text{months\_active}$) and $z$-scores against peer specialties (HCPCS T2024 Adult Day Health Care).
* **Sample Response**:
```json
{
  "status": "SUCCESS",
  "provenance": {
    "source": "HHS_MEDICAID_PROVIDER_SPENDING_AND_CMS_NPPES",
    "hcpcs_code": "T2024",
    "specialty": "Adult Day Health Care",
    "location_scope": "New York City (5 Boroughs)",
    "cohort_size": 10,
    "allowlist_checksum_sha256": "13f3ef5c5460d27858767429ab1662ebf88e8f36a9c6ae7436879494b01ed0d2",
    "normalized_mean_monthly_intensity": 312958,
    "std_dev": 314465,
    "methodology": "Normalized spending intensity per active reported month (eliminates raw volume bias)"
  },
  "data": [
    {
      "id": "MED-NYC-T2024-001",
      "npi": "1184920143",
      "name": "FLUSHING GOLDEN AGE ADULT DAY CARE CENTER INC",
      "facility_type": "SADC Adult Day Care",
      "borough": "Queens",
      "address": "136-20 38th Ave, Flushing, NY 11354",
      "lat": 40.7602,
      "lon": -73.8315,
      "risk_score": 81,
      "exposure_amount": 12960000,
      "monthly_intensity": 1080000,
      "months_active": 12,
      "z_score": 2.44,
      "is_nyc_verified": true,
      "verification_source": "CMS_NPPES_API_AND_NYC_ZIP_REGISTRY",
      "estimated_bounty": 3240000,
      "anomaly_types": ["Phantom SADC Attendance", "Per-Diem Rate Spike (+3.8σ)", "Kickback Envelopes"],
      "status": "INVESTIGATING",
      "ring_id": "RING-01",
      "cross_vector_link": "Cross-referenced transport vans registered to Maspeth logistics shell",
      "lead_utility": "USEFUL_ACTIONABLE_LEAD"
    }
  ]
}
```

---

### 1.2 Attorney Feedback & Audit Ledger (`/api/feedback`)
* **Methods**: `GET`, `POST`
* **Storage**: Native zero-dependency SQLite (`node:sqlite`). Stores records in `db/estafo_feedback.db` (local dev) or `/tmp/estafo_feedback.db` (serverless cloud runtime).

#### `GET /api/feedback`
Returns the historical ledger of attorney dispositions and empirical time-motion utility validation statistics.
```json
{
  "status": "SUCCESS",
  "empirical_utility_validation": {
    "totalFeedbackRecords": 3,
    "actionableLeadsCount": 2,
    "actionableLeadYieldPct": 66.7,
    "acceptanceRatePct": 66.7,
    "avgObservedReviewMinutes": 18.3,
    "totalAnalystHoursSaved": 27.3,
    "manualAuditBenchmarkHours": 14.0,
    "methodology": "Observed screen duration vs. verified 14.0-hour manual audit baseline. Exculpatory leads log 0 hours saved."
  },
  "data": [ ... ]
}
```

#### `POST /api/feedback`
Persists a formal attorney review disposition with cryptographic provenance.
* **Payload**:
```json
{
  "leadId": "MED-NYC-T2024-001",
  "providerNPI": "1184920143",
  "targetName": "FLUSHING GOLDEN AGE ADULT DAY CARE CENTER INC",
  "lawFirmName": "Kramer & Goldberg LLP (EDNY Health Fraud Group)",
  "disposition": "ACCEPTED_FOR_INVESTIGATION",
  "leadUtility": "USEFUL_ACTIONABLE_LEAD",
  "attorneyNotes": "Substantiated by preliminary roster discrepancy (+3.8σ rate). Merits pre-filing subpoena.",
  "observedReviewSeconds": 1320,
  "primarySignal": "PEER_DEVIATION",
  "documentHashes": {
    "sadc_attendance_roster": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```
* **Response**:
```json
{
  "status": "SUCCESS",
  "message": "Evidentiary disposition cryptographically recorded and persisted to audit ledger.",
  "data": {
    "id": "FB-2026-c26db4fe",
    "decisionSignatureHash": "ca3cb18b7a87a9303855665ae959ad150896077c3c872b0913979a2252f15a18",
    "analystHoursSaved": 13.6
  }
}
```

---

### 1.3 Municipal Socrata SODA Feeds
* **`GET /api/sources/311-stream`**: Queries NYC 311 Service Requests (`erm2-nwe9`) for live idling, illegal dumping, and environmental infractions.
* **`GET /api/sources/dob-complaints`**: Queries NYC Department of Buildings Complaints Received (`eabe-havv`).
* **`GET /api/sources/dob-violations`**: Queries NYC Department of Buildings Violations (`3h2n-5cm9`).

---

## 2. Evidence Dossier Protocol (`ESTAFO_RELATOR_DISCLOSURE_DOSSIER_V1`)

Exported directly from [`components/EvidenceDossier.tsx`](file:///Users/nick/Desktop/Vanguard/vanguard-console/components/EvidenceDossier.tsx), this immutable JSON artifact enables relator counsel to attach verified multi-signal records directly to initial pre-disclosure memos under the New York False Claims Act (State Finance Law § 190) and NYC Admin Code § 7-801.

### Schema:
```json
{
  "protocol": "ESTAFO_RELATOR_DISCLOSURE_DOSSIER_V1",
  "timestamp": "2026-10-27T17:15:00.000Z",
  "provider": {
    "leadId": "MED-NYC-T2024-001",
    "npi": "1184920143",
    "providerName": "FLUSHING GOLDEN AGE ADULT DAY CARE CENTER INC"
  },
  "auditMetrics": {
    "disposition": "USEFUL_ACTIONABLE_LEAD",
    "observedReviewMinutes": "18.30",
    "empiricalHoursSaved": "13.69"
  },
  "provenance": {
    "cmsNppesAllowlistChecksum": "13f3ef5c5460d27858767429ab1662ebf88e8f36a9c6ae7436879494b01ed0d2",
    "documentHashesSha256": [
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    ],
    "cryptographicDecisionSignature": "7d8f9a2b4c6e1a3f5b7d9e1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e"
  }
}
```

---

## 3. Python Backend Engine (`/backend`)

The Python engine handles deep multi-signal ingestion, entity graph resolution, and batch verification:
* **`POST /api/v1/providers/ingest`**: Streams raw CMS NPPES and HHS provider spending aggregates into the relational SQLite/PostgreSQL store.
* **`GET /api/v1/scoring/multi-signal`**: Evaluates the 4 independent detection vectors:
  1. Peer deviation ($\sigma \ge +3.5$)
  2. Temporal velocity ($>200\%$ in 60 days)
  3. Physical impossibility (Overlapping shifts $>24\text{h/day}$)
  4. Network cluster risk (Shared BBL/officers with sanctioned entities)
* **`python backend/scripts/verify_pilot_readiness.py`**: Runs pre-flight verification against database schema and scoring thresholds.
