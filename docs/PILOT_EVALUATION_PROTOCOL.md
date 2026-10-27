# NYC Pilot Evaluation & Buyer Testing Protocol

## Objective & Executive Summary
This protocol defines the empirical methodology for running a live enterprise pilot of MediFraudy with healthcare compliance counsel, qui tam relator attorneys, and managed care Special Investigation Units (SIUs).

Rather than pitching an unverified "fraud score" or generic claims dashboard, this pilot tests one narrow, defensible research workflow:
1. **Defensible NYC Cohort**: Ingesting official HHS aggregate spending rows filtered strictly by an independently vetted NPI allowlist physically located in NYC.
2. **Normalized Risk Signal**: Benchmarking providers on **monthly spending intensity** ($/active month) and **rate per unit/claim** rather than multi-year raw spending volume.
3. **Forensic Evidence Trail**: Recording investigator determinations, primary document hashes, and cryptographic signatures into an immutable append-only ledger (`lead_decision_audits`).
4. **Empirical Value Proof**: Measuring actual analyst triage minutes saved, verified actionable lead yield (positive predictive value), and enterprise willingness to pay.

---

## 1. Defensible NYC Cohort & Location Methodology

### Source Limitations
The official [HHS Medicaid Provider Spending by HCPCS](https://opendata.hhs.gov/datasets/medicaid-provider-spending/) dataset contains billing NPI, servicing NPI, HCPCS code, month, paid amount, claim count, and beneficiary count. **It contains no city, state, or address fields.**

### Verification Methodology
To ensure legal defensibility and prevent geographic hallucination:
- Each billing NPI must be verified through the authoritative **CMS NPPES Registry**.
- Physical practice location must reside in the five boroughs of New York City:
  - Manhattan (New York County): Zips `10001`–`10282`
  - Brooklyn (Kings County): Zips `11201`–`11256`
  - Queens (Queens County): Zips `11004`–`11109`, `11351`–`11436`, `11691`–`11697`
  - Bronx (Bronx County): Zips `10451`–`10475`
  - Staten Island (Richmond County): Zips `10301`–`10314`
- Taxonomy must correspond to Adult Day Care (`261QA0600X`), Nursing Care (`251J00000X`), or Community Residential (`320800000X`).
- The allowlist file is versioned with its SHA-256 digest (`backend/data/vetted_nyc_t2024_npis.sha256`).

---

## 2. Validated Signal: Normalized Benchmarking

### The Volume Conflation Problem
Ranking providers by multi-year raw total spending generates false positives by conflating legitimate large-capacity facilities (e.g. 12 active months, 2,000 patients) with high-intensity surge outliers (e.g. 2 active months, 30 patients, $600K).

### Normalized Metrics
The research workflow calculates:
1. **Monthly Spending Intensity**:
   $$\text{Monthly Intensity} = \frac{\text{Total Paid Amount}}{\text{Active Reporting Months}}$$
2. **Paid Per Claim (Encounter Unit Rate)**:
   $$\text{Unit Rate} = \frac{\text{Total Paid Amount}}{\text{Total Claims}}$$
3. **Paid Per Beneficiary (Monthly Acuity Rate)**:
   $$\text{Acuity Rate} = \frac{\text{Total Paid Amount}}{\text{Total Beneficiaries}}$$ (when unsuppressed)
4. **Normalized Intensity Z-Score**:
   Descriptive deviation from the peer cohort's active monthly mean.

---

## 3. Forensic Evidence Trail & Chain of Custody

A dossier used in support of legal inquiry requires strict evidentiary provenance:
- **Authenticated Sign-off**: Every review is tied to an authenticated investigator identity (`User.username`, `User.role`, client IP address, and timestamp).
- **Document Hashes**: For each primary record examined (e.g. attendance rosters, EHR logs, transportation manifests), investigators record the SHA-256 cryptographic hash of the source file.
- **Source Evaluation Hash**: The exact HHS monthly rows reviewed are canonically sorted and hashed (`source_records_hash`).
- **Cryptographic Decision Signature**: A SHA-256 signature is generated over the tuple of `(npi, outcome, utility, reviewer, timestamp, source_hash, doc_hashes)`.
- **Immutable Append-Only Audit**: Every status change or note revision appends a new version row to `lead_decision_audits`, preserving a complete audit trail for discovery and compliance audits.

---

## 4. Live Pilot Time-Motion Study Instrument

### Protocol Setup
- **Sample Cohort**: Select a sample of $N=20$ flagged NYC providers under HCPCS `T2024`.
- **Participants**: 2–3 compliance analysts, SIU investigators, or healthcare litigation counsel.
- **Task**: Review the verification package, evaluate the empirical peer benchmarks, verify or reject using the evidentiary checklist, and record an outcome.

### Measured Metrics
| Metric | Measurement Method | Benchmark Target |
| --- | --- | --- |
| **Guided Review Duration** | Built-in timer on `/verified-leads` | $< 25$ minutes per provider |
| **Manual Audit Baseline** | Historical self-reported baseline across CMS/DOH portals | $\sim 14$ hours per provider |
| **Net Hours Saved** | $(14.0 \text{ hrs} - \text{Guided Hours}) \times N$ | $> 250$ hours across $N=20$ sample |
| **Actionable Lead Yield (PPV)** | $\frac{\text{Confirmed Anomalies + Referred to Counsel}}{\text{Total Sample Reviewed}}$ | $> 60\%$ actionable lead rate |
| **Explainable Scale Proportion** | $\frac{\text{Explainable Variances}}{\text{Total Sample Reviewed}}$ | Measured false-lead dismissal rate |

---

## 5. Buyer Interview & Willingness-To-Pay (WTP) Protocol

At the conclusion of the pilot review session, conduct a structured 20-minute debrief:

### Qualitative Diagnostic
1. *“When looking at the normalized monthly intensity versus the HHS source rows, did you have sufficient traceability to explain the lead to a managing partner or client?”*
2. *“Did the primary records checklist (attendance rosters, EHR progress notes, NEMT manifests) correctly reflect the records you would request via subpoena or audit demand?”*
3. *“How does the Bates-stamped PDF dossier compare to the memos currently prepared by your junior associates or compliance analysts?”*

### Quantitative Economic Value & WTP Test
1. **Headcount Displacement / Capacity Expansion**:
   - *“If an analyst conducts 40 reviews a month, this workflow saves approximately 500 analyst-hours monthly. Does this enable you to take on additional matters without hiring?”*
2. **Pricing Structure Testing**:
   - **Model A (Pilot Engagement)**: \$15,000 for a 60-day specialty audit covering 50 NYC providers, including Bates-stamped dossiers.
   - **Model B (Annual License)**: \$35,000 / seat / year for continuous quarterly HHS updates, vetted NPI registry matching, and unlimited dossier exports.
3. **Closing Question**:
   - *“If we activate this workflow for two additional NYC specialties (e.g. CDPAP Home Care `T1019` and SADC `S5102`), would your firm sponsor a paid pilot next month?”*
