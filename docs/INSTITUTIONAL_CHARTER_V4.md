# VANGUARD INTELLIGENCE GROUP // INSTITUTIONAL OPERATING CHARTER (REVISED)
**Document Classification:** Privileged & Confidential // Board of Directors & Strategic Counsel  
**Version:** 4.0.0-Enterprise (Post-Stress Test Audit)  
**Effective Date:** Fiscal Year 2026–2027  
**Jurisdiction:** State of New York / Tri-State / Federal Second Circuit (National Expansion Phase)  
**Executive Mandate:** Scaled Transition to $10M ARR / $100M Enterprise Value via Defensible Diligence Infrastructure  

---

## 1. Executive Summary & Strategic Reset

Vanguard Intelligence Group (“Vanguard”) operates as an **institutional diligence and evidentiary corroboration platform**. We do not sell raw data, conclusory "fraud findings," automated eligibility determinations, or qui tam litigation packets. 

Following a rigorous institutional audit, this charter eliminates four fatal legal and commercial assumptions:
1. **The FCA Public Disclosure Bar Reset**: Vanguard does **not** "clear" the False Claims Act public disclosure bar (31 U.S.C. § 3730(e)(4) / NY Finance Law § 190(9)). Compilations of public administrative databases cannot satisfy original-source standing (Third Circuit, Dec. 2024). Vanguard serves strictly as **corroboration and diligence infrastructure**, documenting what public data shows so counsel can independently verify whether their client possesses non-public, first-hand evidence *before* drafting a complaint.
2. **Affirmative NY S9088 Compliance**: We abandon any unproven "B2B exemption." Because National Provider Identifier (NPI) records contain sole proprietors who are natural persons, Vanguard treats S9088 Data Broker Registration and the implementation of a centralized consumer deletion endpoint (`DELETE /api/v1/compliance/deletion-request`) as mandatory **pre-revenue requirements**.
3. **Institutional Compliance Budget Realism**: Year 1 legal, regulatory, insurance, and SOC 2 compliance budgets are increased from $180,000 to **$520,000**, shifting Year 1 EBITDA to **($811,000)** and establishing a realistic 18-month capital runway funded by a **$1.5M Seed round**.
4. **TAM Expansion Beyond NYC**: Acknowledging that the realistic NYC-only addressable market is capped at 40–73 enterprise accounts, our path to $10M ARR incorporates a phased **Tri-State and National Corridor expansion** (New York, California, Texas, Florida) starting in Month 14.

---

## 2. Product Definition: Corroboration & Diligence Infrastructure

### 2.1 The Core Value Proposition: What We Actually License
Vanguard licenses an **Audit-Ready Evidentiary Diligence Platform (SaaS + Immutable API)**. 

The software embeds into the existing workflow of legal defense teams, relator counsel, health-plan Special Investigation Units (SIUs), and municipal prime contractors:
1. **Administrative Data Provenance Engine**: Connects via authenticated, licensed REST APIs to public clearinghouses (NPPES, Open Data SODA, CMS Public Use Files), validating schemas, hashing payloads (SHA-256), and stamping tamper-evident audit logs.
2. **Statistical Normalization & Counter-Hypothesis Generator**: Computes objective volume metrics ($\sigma$-deviations vs. peer distributions) paired with **Mandatory Documented Exculpatory Hypotheses** (e.g., specialized dementia acuity, extended operating hours, multi-site operational consolidations).
3. **Public Disclosure Bar Pre-Filing Diligence Audit**: An interactive legal worksheet where counsel cross-references prospective allegations against public disclosures, systematically auditing whether their client possesses independent, non-public factual assets (contemporaneous internal sign-in sheets, badge reception logs, direct personal observations) required to clear Rule 12(b)(6) dismissal risk.
4. **Vendor Responsibility Verification (NYC PASSPort / Vendex)**: Fulfills mandatory municipal subcontractor integrity checks by cross-referencing corporate registration, Department of Buildings stop-work orders, and SAM.gov/OIG debarment lists.

---

## 3. Data Strategy & Regulatory Posture

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                  VANGUARD LICENSED & PUBLIC PROVENANCE TABLE                                                     |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Source Identifier   | Legal Provenance & License| Refresh  | Personal / Health Data  | Retention Limit | 2026 Regulatory Status | Kill Trigger   |
|                     | Terms                     | Cadence  | Minimization Strategy   |                 | & Registration Duty    | Protocol       |
+=====================+===========================+==========+=========================+=================+========================+================+
| NYC Open Data       | NYC DOITT Open Data Terms | Daily    | Operational records only| 7 Years rolling | Public municipal       | API transition |
| SODA API (311,      | (Local Law 11 of 2012).   | Polling  | Complainant personal    | contract audit  | record. Business entity| to commercial  |
| DOB Complaints,     | Permissible for commercial| (15-min  | names and phone numbers | standard.       | data. Exempt from      | paywall > $10k |
| DOB Violations)     | analytics.                | jitter)  | excluded at API gateway.|                 | NYC SHIELD medical debt| per month.     |
+---------------------+---------------------------+----------+-------------------------+-----------------+------------------------+----------------+
| CMS NPPES National  | CMS FOIA Clearinghouse;   | Weekly   | Entity NPI, business    | Permanent       | S9088 Covered Data:    | Imposition of  |
| Provider Identifier | HHS Public Machine-       | Batch    | taxonomy, business site | public record   | Sole proprietors       | restrictive    |
| Registry (NPI)      | Readable Directory.       | Pull     | address. SSNs / personal| archive; monthly| treated as natural     | commercial     |
|                     | Public Domain Commons.    |          | DOBs never ingested.    | sync overwrite. | persons. AG registered.| licensing fees.|
+---------------------+---------------------------+----------+-------------------------+-----------------+------------------------+----------------+
| CMS Aggregate       | Federal Open Data Policy  | Monthly  | Zero-PHI Boundary:      | Permanent       | Sanitized aggregate    | Suppression    |
| Provider Utilization| (M-13-13); Medicare/      | Batch    | Upstream federal cell   | public record   | PUF files. Fully       | threshold      |
| & Spending (PUF)    | Medicaid Public Use Files.| Process  | suppression (<11 claims)| statistical     | compliant with NYC     | lowered below  |
|                     | Aggregated totals only.   |          | verified at perimeter.  | baseline archive| SHIELD medical debt.   | 11 records.    |
+---------------------+---------------------------+----------+-------------------------+-----------------+------------------------+----------------+
| HHS OIG LEIE &      | Statutory Mandate         | Weekly   | Excluded entity legal   | Permanent       | Mandatory statutory    | Access         |
| SAM.gov Debarment   | (42 U.S.C. § 1320a-7).    | Stream   | names, NPIs, corporate  | debarment       | exclusion list. Zero   | restricted to  |
| Clearinghouse       | Public Domain Commons.    | Sync     | officer business names. | compliance      | consumer reporting     | non-public     |
|                     |                           |          | Zero consumer credit.   | archive.        | liability.             | agency portals.|
+---------------------+---------------------------+----------+-------------------------+-----------------+------------------------+----------------+
| NYS Department of   | NY DOS Division of Corp-  | Monthly  | Entity legal name, DOS  | Active life + 5 | Public corporate       | Introduction   |
| State Division of   | orations Bulk Database    | Open NY  | ID, registered agent,   | years post-     | filing registry.       | of automated   |
| Corporations Feed   | License. Commercial use.  | Batch    | service of process.     | dissolution.    | Commercial rights.     | CAPTCHA blocks.|
+---------------------+---------------------------+----------+-------------------------+-----------------+------------------------+----------------+
```

### 3.1 Affirmative NY S9088 Data Broker Registration & Deletion Engine
- **Legal Determination**: Sole proprietors in the NPPES registry are natural persons under New York law. Vanguard does **not** rely on an unadjudicated B2B exemption.
- **Compliance Architecture**:
  1. Vanguard registers annually with the New York Attorney General Data Broker Registry prior to commercial billing.
  2. A dedicated consumer deletion endpoint (`DELETE /api/v1/compliance/deletion-request`) connects directly to Vanguard's data stores, executing cryptographic purge cycles across all active databases and read replicas within 72 hours of an AG centralized deletion signal.
  3. External regulatory counsel is retained on an ongoing retainer to review data broker rules across emerging jurisdictions (California DELETE Act, Texas Data Broker Law, Florida Digital Bill of Rights).

### 3.2 The Zero-PHI Architectural Perimeter
Vanguard strictly consumes **upstream-sanitized Public Use Files (PUF)**. 
- No raw Electronic Remittance Advice (ERA), 835/837 transaction feeds, or individual patient encounter files ever enter Vanguard's perimeter.
- Perimeter ingestion daemons validate that all incoming CMS metadata records carry official federal cell-suppression attestations (all cohorts $< 11$ beneficiaries omitted upstream). Any payload failing this check is dropped at the edge and never touches persistence.

---

## 4. Institutional Compliance Matrix & Banned Terminology Firewall

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                  2026 STATUTORY COMPLIANCE CONTROL MATRIX                                                        |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Regulatory Framework| Core Statutory Duty & Risk    | Vanguard Engineering & Legal Control                   | Evidence Artifact & Owner |
+=====================+===============================+========================================================+===========================+
| NYC SHIELD Rule     | Bans furnishing medical debt  | Ingestion restricted to institutional aggregate billing| MSA Section 4.2 Warranty; |
| (Medical Debt)      | to consumer reporting agencies| totals. No patient bills or individual debt handled.   | CPO / Privacy Counsel.    |
+---------------------+-------------------------------+--------------------------------------------------------+---------------------------+
| NYC Local Law 144   | Mandatory bias audits and     | Software evaluates corporate entities and commercial   | Non-AEDT Legal Opinion;   |
| (AEDT Regulations)  | candidate notice for hiring.  | fleets. Zero personnel scoring or candidate filtering. | General Counsel.          |
+---------------------+-------------------------------+--------------------------------------------------------+---------------------------+
| NY Algorithmic      | AG enforcement on automated   | Flat-rate annual enterprise B2B licensing tiers only.   | Published Pricing Sched;  |
| Pricing Act         | consumer dynamic pricing.     | Zero dynamic or algorithmic consumer pricing tools.    | VP of Finance.            |
+---------------------+-------------------------------+--------------------------------------------------------+---------------------------+
| NY Data Broker Bill | Mandatory registry filing and | Full AG registration; live centralized consumer        | AG Registration Filing;   |
| (Senate Bill S9088) | centralized deletion compliance deletion endpoint (`/api/v1/compliance/deletion`).    | CTO / Data Governance.    |
+---------------------+-------------------------------+--------------------------------------------------------+---------------------------+
| Fair Credit Reporting| Defamation / FCRA liability   | Strict commercial entity use-restriction clause. Pro-  | Mandatory MSA Addendum;   |
| Act (FCRA / CRA)    | for adverse underwriting.     | hibited for natural person credit, insurance, or jobs. | Outside Regulatory Counsel|
+---------------------+-------------------------------+--------------------------------------------------------+---------------------------+
```

### 4.1 The Banned Terminology Codebase Firewall
To insulate subscribers and the Company from commercial defamation, tortious interference, and libel claims, the following terms are banned in Vanguard's source code, API payloads, and UI layers:
- **Strictly Banned**: `"fraud"`, `"fraudulent"`, `"scam"`, `"guilty"`, `"enforcement target"`, `"kickback ring"`.
- **Pre-Litigation Banned (Soft Conclusory Terms)**: `"suspect"`, `"likely"`, `"probable"`, `"bad actor"`.
- **Approved Institutional Descriptors**: `"observed variance"`, `"statistical outlier"`, `"peer deviation (+X.Xσ)"`, `"administrative discrepancy"`, `"uninspected data gap"`.

---

## 5. Ideal Customer Profile (ICP) & Multi-Phase GTM Plan

### 5.1 Realistic TAM Analysis: The Geographic Expansion Mandate

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                 REALISTIC REGIONAL TO NATIONAL TAM SCALING                                                       |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Market Segment              | Realistic NYC Metro TAM   | NYS Statewide + Tri-State | National Tri-Corridor (NY, CA, TX, FL)                     |
+=============================+===========================+===========================+============================================================+
| FCA / Healthcare Diligence  | 15 – 25 Practices         | 35 – 50 Practices         | 120 – 160 Practices                                        |
| Health Plan SIUs / Integrity| 5 – 8 Regional Plans      | 12 – 18 Plans             | 45 – 65 National / Regional Plans                          |
| Municipal General Con./ JVs | 20 – 40 Prime Contractors | 45 – 70 Contractors       | 150 – 220 Infrastructure Consortia                         |
+-----------------------------+---------------------------+---------------------------+------------------------------------------------------------+
| Total Addressable Accounts  | 40 – 73 Accounts          | 92 – 138 Accounts         | 315 – 445 Accounts                                         |
| Target Account Penetration  | 20 Accounts (Year 1)      | 45 Accounts (Year 2)      | 85 Accounts (Year 3–4 Target)                              |
| Target Revenue Under Model  | $1,500,000 ARR            | $4,275,000 ARR            | $10,200,000 ARR                                            |
+-----------------------------+---------------------------+---------------------------+------------------------------------------------------------+
```

### 5.2 The Champion-Enablement Diligence Pack
Enterprise legal and risk committees average 13 stakeholders. Vanguard provides a pre-cleared **Champion Diligence Pack** on day 1 to bypass procurement friction:
1. **The Data Provenance & Licensing Schedule**: Line-by-line documentation of every API endpoint, license terms, and update timestamp.
2. **The Non-AEDT & Non-CRA Legal Memos**: Executed opinions from outside counsel establishing that Vanguard does not trigger NYC Local Law 144 or FCRA obligations.
3. **The Public Disclosure Bar Risk Advisory**: Explaining how the platform's corroboration worksheets protect relators from Rule 12(b)(6) dismissals.
4. **Third-Party SOC 2 Type II Compliance Report**: Verified encryption (TLS 1.3 / AES-256), strict RBAC, and immutable audit trails.

---

## 6. The Honest Moat: Workflow Lock-In & Regulatory Trust

We acknowledge an unvarnished commercial truth: **Public data aggregation, entity matching, SHA-256 hashing, and statistical heuristics can be replicated by a well-capitalized competitor.** 

Vanguard’s defensible moat is not raw infrastructure; it is **Workflow Lock-In and Regulatory Trust**, which requires 18–24 months of consistent operational history to build:
1. **Institutional Review Hierarchies**: Once a law firm or health plan establishes its internal sign-off protocols, blinded investigator workflows, and client attestation records inside Vanguard, migrating to an unformatted feed introduces internal compliance friction and operational switching costs.
2. **Judicial & Procurement Evidentiary Credibility**: Regulators and corporate compliance committees become accustomed to the Vanguard dossier layout (Four-Tier Evidentiary Classification, Mandatory Exculpatory Counter-Hypotheses, and Upstream Provenance Hashes). This standardization creates procurement defensibility that unvetted scrapers cannot match.
3. **Pre-Cleared Procurement Status**: Gaining security, privacy, and legal vendor approval across 40+ AmLaw 100 firms and managed care organizations takes 12–18 months. Once pre-cleared on institutional vendor panels, Vanguard holds an institutional barrier to entry against later entrants.

---

## 7. Financial Model: Ruthless P&L Rebuild (Path to $10M ARR)

### 7.1 Five-Year P&L with Realistic Compliance & Insurance Budgets

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                  REVISED 5-YEAR INSTITUTIONAL FINANCIAL PROJECTION                                               |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Line Item                   | Year 1 (NYC Core)    | Year 2 (Tri-State)   | Year 3 (Expansion)   | Year 4 (National Target)| Year 5 (Scale)      |
+=============================+======================+======================+======================+=========================+=====================+
| Active Enterprise Accounts  | 20 Accounts          | 45 Accounts          | 65 Accounts          | 85 Accounts             | 120 Accounts        |
| Average Contract Value (ACV)| $75,000              | $95,000              | $110,000             | $120,000                | $125,000            |
| Annual Recurring Rev (ARR)  | $1,500,000           | $4,275,000           | $7,150,000           | $10,200,000             | $15,000,000         |
+-----------------------------+----------------------+----------------------+----------------------+-------------------------+---------------------+
| Cost of Goods Sold (COGS):  |                      |                      |                      |                         |                     |
| - Commercial Feeds & API Lic| $65,000              | $180,000             | $340,000             | $480,000                | $650,000            |
| - Cloud Infrastructure (AWS)| $55,000              | $140,000             | $260,000             | $380,000                | $520,000            |
| - SOC 2 Type II & Security  | $80,000              | $95,000              | $120,000             | $140,000                | $175,000            |
| - Technical Account Success | $120,000             | $320,000             | $550,000             | $820,000                | $1,150,000          |
| Total COGS                  | $320,000             | $735,000             | $1,270,000           | $1,820,000              | $2,495,000          |
| Gross Margin ($)            | $1,180,000           | $3,540,000           | $5,880,000           | $8,380,000              | $12,505,000         |
| Gross Margin (%)            | 78.6%                | 82.8%                | 82.2%                | 82.1%                   | 83.3%               |
+-----------------------------+----------------------+----------------------+----------------------+-------------------------+---------------------+
| Operating Expenses:         |                      |                      |                      |                         |                     |
| - Engineering & Data Science| $680,000             | $1,450,000           | $2,400,000           | $3,500,000              | $4,800,000          |
| - Sales, Marketing & GTM    | $420,000             | $1,100,000           | $2,100,000           | $3,100,000              | $4,200,000          |
| - Legal, Regulatory & PIA   | $380,000             | $450,000             | $620,000             | $750,000                | $900,000            |
| - Cyber, E&O & Media Ins.   | $65,000              | $95,000              | $140,000             | $180,000                | $240,000            |
| - Admin, Billing & Ops      | $75,000              | $130,000             | $210,000             | $310,000                | $420,000            |
| Total Operating Expenses    | $1,620,000           | $3,225,000           | $5,470,000           | $7,840,000              | $10,560,000         |
| EBITDA ($)                  | ($760,000)           | $315,000             | $410,000             | $540,000                | $1,945,000          |
| EBITDA Margin (%)           | Negative (Seed Phase)| 7.3% (Breakeven)     | 5.7% (Reinvest)      | 5.2% (Reinvest)         | 12.9% (Scaled)      |
+-----------------------------+----------------------+----------------------+----------------------+-------------------------+---------------------+
```

### 7.2 Capital Strategy & Procurement Buffer
- **Seed Round Requirement**: $1,500,000 to fund Year 1 burn ($760k EBITDA burn + working capital buffer).
- **Enterprise Procurement Realism**: Sales cycles are modeled at **6 to 12 months**. Cash runway is planned to absorb pilot-to-contract procurement lags without compromising compliance budgets.
- **System SLA Commitment**: Standardized on **99.9% availability** (8.7 hours/year allowable maintenance), reflecting realistic cloud infrastructure capabilities.

---

## 8. Enterprise Risk Register & Institutional Kill Criteria

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                              REVISED TOP 10 ENTERPRISE RISK REGISTER                                                             |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| # | Risk Event             | Likelihood | Impact | Mitigation Strategy                                | Pre-Agreed Kill Trigger                      |
+===+========================+============+========+====================================================+==============================================+
| 1 | S9088 Data Broker      | Medium     | High   | Pre-revenue AG registration; automated centralized | If NY AG rejects registration or demands     |
|   | Enforcement Action     |            |        | deletion endpoint (`/api/v1/compliance/deletion`). | consumer consumer-facing portal, freeze.     |
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 2 | Public Disclosure Bar  | High       | Crit   | Reframe product as corroboration worksheet; audit   | If subscriber attempts to file qui tam based |
|   | Misrepresentation      |            |        | relator's non-public assets; clear warnings.       | solely on Vanguard public data, flag counsel.|
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 3 | Commercial Defamation /| Low        | Crit   | Complete ban on "fraud", "suspect", "probable";    | If plaintiff survives initial motion to      |
|   | Tortious Interference  |            |        | mandatory exculpatory counter-hypotheses.          | dismiss, overhaul UI descriptors immediately.|
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 4 | FCRA / Consumer Report | Low        | High   | Strict MSA Use-Restriction Clause. Prohibit natural| If subscriber uses output for natural person |
|   | Reclassification       |            |        | person credit/surety checks; entity-only warrants. | underwriting, terminate account immediately. |
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 5 | Accidental Ingestion   | Very Low   | Crit   | Ingestion gate verifies upstream PUF cell suppres- | If unsuppressed patient-level microdata      |
|   | of Regulated PHI       |            |        | sion; rejects unsuppressed microdata at perimeter. | touches database, trigger breach protocols.  |
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 6 | DCWP LL144 Bias Audit  | Low        | High   | Non-personnel scope; zero evaluation of human      | If DCWP issues formal inquiry regarding B2B  |
|   | Regulatory Inquest     |            |        | workers; outside counsel non-AEDT legal opinion.   | vendor vetting, submit legal opinion memo.   |
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 7 | Source Access Control  | Medium     | High   | Strictly adhere to open data terms; zero proxy-    | If source introduces CAPTCHA or blocks IPs,  |
|   | Reversal / Paywalls    |            |        | based rate limit circumvention; negotiate license. | halt ingestion in 60m; do not bypass controls|
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 8 | Cloud Hosting Tier     | Low        | Med    | Operate exclusively on Vercel Enterprise + AWS     | If cloud provider flags compute volume,      |
|   | Revocation             |            |        | dedicated VPC instances; zero Hobby/Pro usage.     | migrate immediately to private cloud cluster.|
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 9 | Enterprise Procurement | High       | Med    | Deliver Champion Diligence Pack on day 1; maintain | If pilot procurement stalls >120 days,       |
|   | Stall (>9 Months)      |            |        | SOC 2 Type II audit readiness; pre-agreed MSAs.    | re-qualify champion or redirect GTM capacity.|
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
| 10| False-Positive PR      | Low        | High   | Four-eyes human review queue; non-removable        | If subscriber misrepresents output to media, |
|   | Misattribution Event   |            |        | evidentiary disclaimers on every export.           | revoke license and issue public clarification|
+---+------------------------+------------+--------+----------------------------------------------------+----------------------------------------------+
```

---

## 9. 90-Day Validation Plan: Go / No-Go Milestones

Before deploying the Seed round, the business must execute the **90-Day Validation Gate**:

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                              90-DAY COMMERCIAL VALIDATION TIMELINE                                                               |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Milestone Window    | Core Engineering & Legal Deliverables               | Commercial & Discovery Objectives    | Go / No-Go Kill Gate          |
+=====================+=====================================================+======================================+===============================+
| Days 1 – 30         | 1. Enforce perimeter PUF cell-suppression check.    | 1. Finalize Champion Diligence Pack. | GATE 1:                       |
| (Compliance &       | 2. Deploy `/api/v1/compliance/deletion-request`.    | 2. Retain outside regulatory counsel | Obtain written legal opinion  |
| Perimeter Control)  | 3. Ban all conclusory terms ("fraud", "suspect").   |    for S9088 registration review.    | on Non-AEDT & S9088 compliance|
|                     | 4. Draft Model Enterprise MSA & Use-Restrictions.   | 3. Build target list of 30 AmLaw     | before external demos.        |
|                     | 5. Obtain Cyber & Media Liability insurance quotes. |    and regional healthcare practices.|                               |
+---------------------+-----------------------------------------------------+--------------------------------------+-------------------------------+
| Days 31 – 60        | 1. Ship Public Disclosure Bar Diligence Studio.     | 1. Execute 15 customer discovery     | GATE 2:                       |
| (Adjudication UX &  | 2. Build PASSPort Subcontractor Diligence Module.   |    interviews with GCs and CCOs.     | Secure at least 3 enterprise  |
| Customer Discovery) | 3. Complete internal SOC 2 pre-assessment audit.    | 2. Present Diligence Worksheets to   | pilot agreements with written |
|                     | 4. Validate SHA-256 evidence chain verification.    |    at least 8 prospective buyers.    | evaluation criteria.          |
|                     | 5. Benchmark 99.9% uptime infrastructure.           | 3. Secure redline feedback on MSA.   |                               |
+---------------------+-----------------------------------------------------+--------------------------------------+-------------------------------+
| Days 61 – 90        | 1. Deploy client Audit Log API with mutual TLS.     | 1. Conduct 3 enterprise pilots.      | FINAL COMMERCIAL GATE:        |
| (Pilot Execution &  | 2. Complete affirmative S9088 AG registration.      | 2. Pressure-test evidence binders    | Secure at least ONE paid pilot|
| Validation Close)   | 3. Implement automated PDF dossier watermarking.    |    with client General Counsel.      | commitment >= $25k. If failed,|
|                     | 4. Finalize production monitoring daemons.          | 3. Secure 1st paid pilot commitment. | pivot to internal tool or halt|
+---------------------+-----------------------------------------------------+--------------------------------------+-------------------------------+
```

---

## 10. The Institutional Pitch Narrative

> **“Vanguard licenses corroboration and diligence infrastructure, not fraud allegations.**
> 
> Every platform signal is grounded in an official administrative record, evaluated through an open statistical peer-normalization model, and verified via a documented human-in-the-loop review workflow before export. 
> 
> We do not scrape restricted data, we do not bypass authentication protocols, we do not sell personal tracking feeds, and we maintain an absolute Zero-PHI boundary under HIPAA and the NYC SHIELD Rule. We make zero automated eligibility determinations, operating entirely outside the scope of NYC Local Law 144 and the Fair Credit Reporting Act. 
> 
> Vanguard transforms disorganized administrative records into audit-ready evidence chains for general counsel, compliance officers, and risk underwriters—protecting relators from Public Disclosure Bar dismissals, accelerating subcontractor integrity checks, and ensuring defensible regulatory compliance. We do not sell raw data. **We license the evidence chain.**”

---

## 11. Appendix: Upstream-Sanitized Architectural Schema

```typescript
// Architectural Rule: Perimeter Validation of Upstream-Sanitized Metadata
export interface AdministrativeDiligenceRecord {
  entityId: string;             // Normalized NPPES NPI or NY DOS ID
  recordType: "HEALTHCARE_FACILITY" | "COMMERCIAL_CARRIER" | "MUNICIPAL_SUBCONTRACTOR";
  normalizedMetric: number;     // Statistical spending or complaint metric
  isUpstreamSuppressed: boolean;// Verifies federal cell-suppression (<11) was applied upstream
  sourceContentHash: string;    // SHA-256 digest of original public payload
  provenanceEndpoint: string;   // Exact URL of public clearinghouse API
}

export function validatePerimeterIngestion(record: AdministrativeDiligenceRecord): boolean {
  // Enforces HIPAA / CMS Public Use File Privacy Boundary
  // Rejects any unsuppressed microdata attempting to enter persistence
  if (!record.isUpstreamSuppressed) {
    throw new Error(
      `PERIMETER SECURITY VIOLATION: Ingestion rejected. Record ${record.entityId} ` +
      `lacks verification of upstream federal cell suppression. Microdata prohibited.`
    );
  }
  return true;
}

export function generateEvidentiaryDigest(payload: string): string {
  // Deterministic Cryptographic Proof of State
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(payload).digest("hex");
}
```

---
*End of Operating Charter V4.*  
**Adopted by Executive Committee:** October 2026  
**Distribution:** Confidential // Board of Directors, Legal Counsel, Executive Leadership
