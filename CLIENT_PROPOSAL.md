# Institutional Healthcare Compliance & Case Workflow Pilot
## Scoped Research Pilot Proposal for Specialized Relator Counsel & Compliance Teams

**Document Ref:** MEDI-PILOT-2026-V1  
**Target Focus:** Case Workflow, Evidence Provenance, and Prioritized Provider Screening  
**Domain Scope:** NYS Adult Day Care (HCPCS T2024) Regional Spending Cohort  
**Platform URL:** `https://estafotir.vercel.app`

---

## 1. Executive Summary & Problem Framing

Institutional healthcare compliance officers and False Claims Act relator counsel face an overwhelming volume of public data and whistleblower tips. Traditional screening tools rely on speculative "AI fraud scoring," ungrounded financial multipliers, and black-box algorithms that fail judicial scrutiny and waste expensive investigative hours.

This scoped research pilot demonstrates a defensible, source-traceable intelligence workflow. Rather than asserting liability or predicting unprovable outcomes, the system:
1. Normalizes public CMS and HHS provider spending across standardized peer cohorts.
2. Isolates statistical deviations across claim frequency, beneficiary census, and spending intensity.
3. Structures evidence trails, corporate link analysis, and exculpatory hypotheses into standardized research dossiers.
4. Directly measures and reduces the billable investigative hours required to triage a lead.

---

## 2. Methodology & Four Core Defensibility Standards

To ensure institutional compliance and judicial rigor, the pilot adheres to four explicit technical principles:

### Standard A: Explicit Selection Rule & Geographic Limitations
- **The HHS Dataset Grain:** The official HHS Medicaid Provider Spending dataset publishes billing and servicing NPI aggregates, procedure codes, claim counts, beneficiary counts, and paid amounts. It does **not** record physical service delivery addresses or patient residences.
- **The Operational Proxy:** Cohort membership is defined by an authoritative selection rule: **Billing NPIs whose primary practice location in the CMS National Provider Identifier (NPPES) registry falls within NYC five-borough ZIP code prefixes (100–104, 111–114, 116)**.
- **Evidentiary Boundary:** An NPPES practice address is a documented proxy, not definitive proof of where individual services occurred. Every dossier explicitly notes this distinction.

### Standard B: Statistical Normalization & Multi-Dimensional Volume Bias Removal
- **Avoiding Single-Metric Volume Bias:** Evaluating gross annual spending or simple spend-per-month introduces severe volume bias toward large, legitimately scaled facilities.
- **Multi-Dimensional Metrics:** The screener evaluates providers across:
  1. **Claim Intensity:** Total paid claims relative to active service months.
  2. **Beneficiary Census:** Claims per unique beneficiary and spending per beneficiary.
  3. **Peer Comparison:** Comparisons strictly constrained to identical HCPCS procedure codes (e.g., T2024 Adult Day Health Care) within the regional peer cohort.
  4. **Data Grain & Suppression:** Accounting for CMS's suppression of small cell counts (<11 beneficiaries) to avoid statistical distortion.
- **Screening Signals vs. Liability:** All metrics and standard deviations (+Zσ) are presented as descriptive screening signals to guide human inquiry, never as findings of regulatory non-compliance.

### Standard C: Blinded Evaluation & Grounded Validation (No Top-K Fluff)
- **The Confirmation Bias Hazard:** Unblinded investigators reviewing high-scoring leads naturally seek confirming facts.
- **Positive vs. Negative Calibration:** Public regulatory actions (DOJ, HHS-OIG, NYS OMIG) provide valuable positive calibration examples. However, unflagged providers are **unconfirmed negatives**, not validated non-violators.
- **Blinded Review Mode:** The pilot interface features a native **Blinded Evaluation Mode** that conceals outlier tags, risk scores, and narrative hypotheses. Investigators independently review anonymized, raw distribution metrics to establish genuine baseline triage accuracy.
- **Value Metric:** The pilot measures operational ROI in **investigative triage hours saved** and evidence dossier completeness, avoiding speculative top-K precision percentages.

### Standard D: Case-Specific Legal Framework & Zero-PHI Security Posture
- **Qui Tam Viability:** Relator viability under False Claims statutes cannot be automated. Federal law (31 U.S.C. § 3730(e)(4)) and New York law (NYS Finance Law § 190(9)) each enforce strict public disclosure bars and nuanced original-source exceptions. Qualified legal counsel must evaluate the specific fact pattern, source chain, and independent knowledge base of every case.
- **Zero-PHI Architecture:** The platform operates exclusively on public, aggregate CMS/HHS data. No Protected Health Information (PHI) is ingested, processed, or stored. Consequently, a HIPAA Business Associate Agreement (BAA) is not required as a matter of law.
- **Enterprise Security Controls:** Access to institutional screening endpoints is restricted via authenticated API keys and session-bound tokens. SOC 2 Type II alignment is treated as an enterprise institutional requirement for access control and data security.

---

## 3. Scoped Pilot Structure & Milestones

The engagement is structured into three clear, verifiable milestones designed to validate the workflow before any broad licensing commitment:

```
[ Milestone 1: Traceable Cohort ]
  └── Vetted NYC Adult Day Care (T2024) cohort cross-referenced with CMS NPPES
  └── Luhn check-digit verification & SHA-256 allowlist checksum verification

[ Milestone 2: Blinded Review Pilot ]
  └── 5 structured, blinded reviews conducted by institutional investigators
  └── Time-to-triage benchmark: Logging review duration & evidence utility

[ Milestone 3: Paid Pilot Evaluation ]
  └── Finalized research dossiers with cryptographic content digests
  └── Delivery of pilot results and proposal for continuous institutional monitoring
```

### Milestone Deliverables

| Deliverable | Description | Verification Method |
|:---|:---|:---|
| **Vetted NPI Allowlist** | 10–50 verified NYC ADHC providers meeting the NPPES proxy selection rule | SHA-256 manifest check & CMS NPPES query |
| **Blinded Triage Console** | Dedicated investigator interface with session stopwatch and blinded mode | Interactive web console (`estafotir.vercel.app`) |
| **Research Dossiers** | Structured memoranda containing 4-tier evidentiary classification & disclaimers | Exportable text / print dossier with SHA-256 digest |
| **Pilot Findings Report** | Analysis of investigator time savings, false positive filters, and evidence utility | Comprehensive evaluation summary |

---

## 4. Technical Specifications & Architecture

- **Frontend Interface:** Next.js 14, Tailwind CSS, MapLibre GL, Lucide Icons.
- **Security Posture:** Header-based bearer authentication, fail-closed endpoints, timing-safe credential verification, zero client-baked credentials.
- **Data Integrity:** SHA-256 content digests for all generated research dossiers; strict segregation of verified facts, statistical signals, allegations, and unknown data gaps.

---

## 5. Contact & Institutional Engagement

**Organization:** Estafotir / MediFraudy Research Group  
**Live Pilot Console:** `https://estafotir.vercel.app`  
**Security & Access Inquiries:** Investigator pilot keys provisioned upon signed pilot engagement.
