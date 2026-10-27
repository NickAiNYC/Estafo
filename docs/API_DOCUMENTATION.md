# ESTAFO // System API Documentation & Ingestion Specifications

This document defines the API surface of **ESTAFO**, covering live Socrata SODA data pipelines, the prototype Medicaid provider screening feed, the audit review ledger, and the Python backend engine.

---

## 1. Next.js App Router Ingestion & SODA Endpoints

### 1.1 Medicaid Screening Prototype (`/api/sources/medicaid-leads`)
* **Method**: `GET`
* **Purpose**: Serves an illustrative prototype cohort for evaluating the normalized spending rate screening interface.
* **Operational Scope**: Synthetic demonstration rows. Not connected to live CMS claims or verified NPPES queries. No provider fraud or legal violations asserted.
* **Methodology**: Evaluates provider spending using normalized monthly spending intensity ($\text{total\_spend} / \text{months\_active}$) and peer $z$-scores to eliminate raw volume bias.
* **Sample Response**:
```json
{
  "status": "SUCCESS",
  "provenance": {
    "mode": "DEMO_SYNTHETIC_WORKFLOW_PREVIEW",
    "status": "UNVERIFIED_PROTOTYPE",
    "disclaimer": "ILLUSTRATIVE WORKFLOW PREVIEW ONLY. Not sourced from live CMS claims or verified NPPES queries. Synthetic records for interface and workflow validation. No real provider fraud or legal violations asserted.",
    "hcpcs_code": "T2024",
    "specialty": "Adult Day Health Care",
    "location_scope": "New York City (Demonstration Corridors)",
    "cohort_size": 10,
    "retrievalLatencyMs": 2,
    "normalized_mean_monthly_intensity": 502167,
    "std_dev": 307997,
    "methodology": "Normalized spending intensity per active reported month (statistical screening model prototype)"
  },
  "data": [
    {
      "id": "DEMO-SADC-001",
      "npi": "DEMO-NPI-001",
      "name": "Sample Adult Day Care Facility Alpha [Workflow Demo]",
      "facility_type": "SADC Adult Day Care",
      "borough": "Queens",
      "address": "Flushing Corridor, Queens, NY",
      "lat": 40.7602,
      "lon": -73.8315,
      "risk_score": 81,
      "exposure_amount": 12960000,
      "monthly_intensity": 1080000,
      "months_active": 12,
      "z_score": 2.44,
      "estimated_bounty": 0,
      "anomaly_types": [
        "Spending Intensity Outlier (+2.4σ)",
        "High Volume per Active Month"
      ],
      "status": "INVESTIGATING",
      "lead_utility": "STATISTICAL_OUTLIER"
    }
  ]
}
```

---

### 1.2 Review Feedback Ledger (`/api/feedback`)
* **Methods**: `GET`, `POST`
* **Storage**: Native zero-dependency SQLite (`node:sqlite`). Stores records in `db/estafo_feedback.db` (local dev) or `/tmp/estafo_feedback.db` (ephemeral serverless cloud runtime).

#### `GET /api/feedback`
Returns the review ledger and active screen duration metrics.
```json
{
  "status": "SUCCESS",
  "review_summary": {
    "totalReviewsLogged": 0,
    "avgObservedReviewMinutes": 0,
    "storageMode": "LOCAL_SQLITE",
    "disclaimer": "Reviews reflect active session screen time in this prototype interface. Not measured manual audit savings. Serverless /tmp storage is ephemeral."
  },
  "data": []
}
```

#### `POST /api/feedback`
Records a review disposition with elapsed session screen time and content SHA-256 digest.
* **Payload**:
```json
{
  "leadId": "DEMO-SADC-001",
  "providerNPI": "DEMO-NPI-001",
  "targetName": "Sample Adult Day Care Facility Alpha [Workflow Demo]",
  "reviewerOrganization": "Internal Compliance Analyst",
  "disposition": "FLAGGED_FOR_INVESTIGATION",
  "leadUtility": "STATISTICAL_OUTLIER",
  "reviewerNotes": "High monthly rate warrants checking licensed attendance census.",
  "observedReviewSeconds": 480,
  "documentHashes": {
    "sample_attendance_log": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```

---

### 1.3 Municipal Socrata SODA Feeds (Live)
* **`GET /api/sources/311-stream`**: Live stream from NYC 311 Service Requests (`erm2-nwe9`) for idling and commercial dumping events.
* **`GET /api/sources/dob-complaints`**: Live queries against NYC Department of Buildings Complaints Received (`eabe-havv`).
* **`GET /api/sources/dob-violations`**: Live queries against NYC Department of Buildings Violations (`3h2n-5cm9`).

---

## 2. Research Dossier Preview Protocol (`ESTAFO_RESEARCH_DOSSIER_PREVIEW_V1`)

Exported from [`components/EvidenceDossier.tsx`](file:///Users/nick/Desktop/Vanguard/vanguard-console/components/EvidenceDossier.tsx) as an internal JSON research aid.

### Schema:
```json
{
  "protocol": "ESTAFO_RESEARCH_DOSSIER_PREVIEW_V1",
  "status": "UNVERIFIED_RESEARCH_PREVIEW",
  "notice": "RESEARCH AID ONLY. This export is an unauthenticated research summary and does not constitute a signed legal complaint, subpoena, proof of fraud, or official relator disclosure. All assertions require independent evidentiary verification.",
  "timestamp": "2026-10-27T17:45:00.000Z",
  "provider": {
    "leadId": "DEMO-SADC-001",
    "npi": "DEMO-NPI-001",
    "providerName": "Sample Adult Day Care Facility Alpha [Workflow Demo]"
  },
  "reviewSession": {
    "disposition": "STATISTICAL_OUTLIER",
    "observedSessionMinutes": "8.00",
    "elapsedSeconds": 480
  },
  "provenance": {
    "documentHashesSha256": [
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    ],
    "contentIntegrityDigestSha256": "44322f18a9d2aba4..."
  }
}
```

---

## 3. Python Backend Engine (`/backend`)

The Python engine handles multi-signal evaluation and batch ingestion:
* **HHS Importer Dependency**: Official HHS provider spending files must be ingested using `python scripts/import_hhs_aggregates.py` along with a vetted NYC NPI registry.
* **Multi-Signal Evaluation**: Evaluates peer deviation, temporal billing velocity, and cluster risk before presenting leads for review.
