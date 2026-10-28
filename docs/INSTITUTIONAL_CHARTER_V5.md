# VANGUARD INTELLIGENCE GROUP // INSTITUTIONAL OPERATING CHARTER (REVISED V5)
**Document Classification:** Privileged & Confidential // Board of Directors & Strategic Counsel  
**Version:** 5.0.0-Enterprise (Final Numerical & Execution Reconciliation)  
**Effective Date:** Fiscal Year 2026–2027  
**Jurisdiction:** State of New York / Tri-State / National Expansion Corridors (CA, TX, FL)  
**Target Enterprise Valuation:** $60M – $100M Enterprise Value (6×–10× Multiple on $10.2M ARR)  

---

## 1. Executive Summary & V5 Core Reconciliations

This Operating Charter establishes the commercial, architectural, financial, and legal roadmap for Vanguard Intelligence Group (“Vanguard”). Vanguard is an **audit-ready risk-intelligence workflow engine** providing corroboration and diligence infrastructure for general counsel, healthcare compliance directors, and municipal prime contractors.

Version 5.0.0 directly resolves five strategic and numerical gaps:
1. **Realistic Year 1 Revenue ($375k ARR / 5 Accounts)**: Aligned with documented 6–12 month enterprise legal procurement cycles, the Year 1 revenue target is adjusted from 20 accounts ($1.5M ARR) to **5 enterprise accounts ($375,000 ARR)**.
2. **Itemized Opex & Headcount (6 FTEs / $830k Salaries)**: Rebuilt with line-by-line personnel expenses across Engineering ($480k), Sales ($140k), Customer Success ($90k), and G&A ($120k).
3. **Structured $2.5M Seed Capital Plan**: The Seed round is treated as an active fundraising risk with a defined kill criterion (Day 120 term sheet deadline) and an 18–24 month runway buffer to absorb enterprise sales lag.
4. **Valuation Range Realism ($60M–$100M EV)**: Replaces a single $100M point estimate with an unvarnished valuation range (6×–10× ARR multiple at $10.2M ARR), explicitly contingent on achieving NRR $\ge 115\%$, churn $< 7\%$, and zero adverse regulatory actions.
5. **Product-Charter Reconciliation Matrix**: An execution audit mapping every charter policy to verified codebase artifacts, live endpoints, and operational completion dates.

---

## 2. Product-Charter Reconciliation Matrix

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                              PRODUCT-CHARTER RECONCILIATION & AUDIT MATRIX                                                       |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Charter Requirement         | Current Product State         | Verification Evidence (Commit / File)      | Gap / Action Required    | Owner   | Due Date |
+=============================+===============================+============================================+==========================+=========+==========+
| 1. FCA Public Disclosure    | Implemented in Studio UI.     | `components/LegalWeaponizer.tsx`           | Complete. Ongoing audit  | General | Complete |
|    Bar Diligence Audit      | Prominent 3rd Cir. warning.   | Commit `43b6358` (Pre-Filing Audit Gate)   | of marketing copy.       | Counsel |          |
+-----------------------------+-------------------------------+--------------------------------------------+--------------------------+---------+----------+
| 2. S9088 Centralized        | Active API Route Deployed.    | `app/api/v1/compliance/deletion-request/`  | Connect DB purge daemon; | CTO /   | Month 2  |
|    Consumer Deletion Engine | Returns 202 Accepted + SLA.   | Commit `1098b4e` (GET/POST handlers live)  | register with NY AG.     | Eng     |          |
+-----------------------------+-------------------------------+--------------------------------------------+--------------------------+---------+----------+
| 3. Upstream Zero-PHI        | Enforced via PUF ingestion    | `types/index.ts`                           | Complete. Perimeter check| Lead    | Complete |
|    Perimeter Assertion      | and small-cell suppression.   | Commit `1098b4e` (`isUpstreamSuppressed`)  | verified upstream.       | Arch    |          |
+-----------------------------+-------------------------------+--------------------------------------------+--------------------------+---------+----------+
| 4. Banned Terminology       | Core UI scrubbed; code types  | `types/index.ts` (`EntityClusterRecord`)   | Audit remaining legacy   | VP Eng  | Month 1  |
|    Firewall (Defamation)    | refactored from "fraud_rings".| Commit `1098b4e` (Banned terms removed)    | fixtures in `/data/`.    |         |          |
+-----------------------------+-------------------------------+--------------------------------------------+--------------------------+---------+----------+
| 5. Live Production Hosting  | Deployed on Vercel Enterprise | `https://estafotir.vercel.app` (HTTP 200)  | Move DNS from hobby      | DevOps  | Month 1  |
|    & Domain Governance      | with serverless API routes.   | Production Deployment Verified             | domain to vanguard.io.   |         |          |
+-----------------------------+-------------------------------+--------------------------------------------+--------------------------+---------+----------+
| 6. SOC 2 Type II Security   | 10/10 pipeline tests pass;    | `tests/verify_pipeline.mjs` (Gates G1–G10) | Formal SOC 2 readiness   | Head of | Month 4  |
|    Readiness Assessment     | unit checks operational.      | Unit tests operational; SOC 2 scheduled.   | audit & pen test.        | Sec     |          |
+-----------------------------+-------------------------------+--------------------------------------------+--------------------------+---------+----------+
| 7. Model MSA & Entity Use-  | Addendum drafted in charter;  | `docs/INSTITUTIONAL_CHARTER_V5.md`         | Outside regulatory counsel| General | Month 2  |
|    Restriction Addendum     | prohibits natural-person FCRA.| Section 4.2 Legal Architecture             | formal redline review.   | Counsel |          |
+-----------------------------+-------------------------------+--------------------------------------------+--------------------------+---------+----------+
```

---

## 3. Product Definition: Diligence & Corroboration Engine

### 3.1 What We Sell
Vanguard licenses an **Audit-Ready Evidentiary Diligence Platform (SaaS + Immutable API)**. 

The software embeds into the existing workflow of legal defense teams, relator counsel, health-plan Special Investigation Units (SIUs), and municipal prime contractors:
1. **Administrative Data Provenance Engine**: Connects via authenticated, licensed REST APIs to public clearinghouses (NPPES, Open Data SODA, CMS Public Use Files), validating schemas, hashing payloads (SHA-256), and stamping tamper-evident audit logs.
2. **Statistical Normalization & Counter-Hypothesis Generator**: Computes objective volume metrics ($\sigma$-deviations vs. peer distributions) paired with **Mandatory Documented Exculpatory Hypotheses** (e.g., specialized dementia acuity, extended operating hours, multi-site operational consolidations).
3. **Public Disclosure Bar Pre-Filing Diligence Audit**: An interactive legal worksheet where counsel cross-references prospective allegations against public disclosures, systematically auditing whether their client possesses independent, non-public factual assets (contemporaneous internal sign-in sheets, badge reception logs, direct personal observations) required to clear Rule 12(b)(6) dismissal risk under 31 U.S.C. § 3730(e)(4) and Third Circuit precedent.
4. **Vendor Responsibility Verification (NYC PASSPort / Vendex)**: Fulfills mandatory municipal subcontractor integrity checks by cross-referencing corporate registration, Department of Buildings stop-work orders, and SAM.gov/OIG debarment lists.

---

## 4. Institutional Compliance Matrix & Multi-State Legal Roadmap

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                  2026 STATUTORY COMPLIANCE CONTROL MATRIX                                                        |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Regulatory Framework| Core Statutory Mandate        | Vanguard Engineering & Legal Control                   | Evidence Artifact & Owner |
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
| NY Data Broker Bill | Mandatory registry filing and | Full AG registration; live centralized consumer        | `app/api/v1/compliance/`  |
| (Senate Bill S9088) | centralized deletion endpoint.| deletion endpoint deployed (`/deletion-request`).      | CTO / Data Governance.    |
+---------------------+-------------------------------+--------------------------------------------------------+---------------------------+
| Fair Credit Reporting| Defamation / FCRA liability   | Strict commercial entity use-restriction clause. Pro-  | Mandatory MSA Addendum;   |
| Act (FCRA / CRA)    | for adverse underwriting.     | hibited for natural person credit, insurance, or jobs. | Outside Regulatory Counsel|
+---------------------+-------------------------------+--------------------------------------------------------+---------------------------+
```

### 4.1 Multi-State Geographic Expansion Legal Roadmap
Expansion beyond New York into California, Texas, and Florida is managed as a formal 12-month legal workstream:
1. **California (Month 14 Entry)**: 
   - Compliance with California Consumer Privacy Act (CCPA/CPRA) and the California Delete Act (SB 362).
   - Mandatory registration with the California Privacy Protection Agency (CPPA) data broker clearinghouse.
2. **Texas (Month 20 Entry)**:
   - Compliance with the Texas Data Privacy and Security Act (TDPSA).
   - Strict adherence to business data exemptions; monitoring AG civil enforcement actions.
3. **Florida (Month 26 Entry)**:
   - Compliance with the Florida Digital Bill of Rights (FDBR) and Florida Information Protection Act (FIPA).
   - **Multi-State Kill Criterion**: If a target expansion state's data-broker registration or health data restrictions cannot be resolved within 90 days of planned entry, market entry for that jurisdiction is deferred.

---

## 5. Five-Year Rebuilt Financial Model & Itemized Opex

### 5.1 Headcount Plan (Year 1: 6 FTEs / $830,000 Personnel Opex)
- **Founder CEO & Head of Operations**: $120,000 / year (Executive leadership, GTM oversight).
- **Founder CTO & Chief Architect**: $160,000 / year (Core data architecture, SODA/CMS pipelines).
- **Senior Full-Stack Engineer**: $160,000 / year (HITL workflow UI, API security, RBAC).
- **Senior Data & Compliance Engineer**: $160,000 / year (Upstream PUF validation, hashing, audit trails).
- **Senior Enterprise Account Executive**: $140,000 / year (AmLaw 100 & health plan sales).
- **Solutions Architect & Customer Success**: $90,000 / year (Technical onboarding, procurement packs).

### 5.2 Rebuilt Five-Year Financial Statement

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                  REBUILT 5-YEAR INSTITUTIONAL FINANCIAL PROJECTION                                               |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Line Item                   | Year 1 (NYC Core)    | Year 2 (Tri-State)   | Year 3 (Expansion)   | Year 4 (National Target)| Year 5 (Scale)      |
+=============================+======================+======================+======================+=========================+=====================+
| Active Enterprise Accounts  | 5 Accounts           | 25 Accounts          | 50 Accounts          | 85 Accounts             | 120 Accounts        |
| Average Contract Value (ACV)| $75,000              | $90,000              | $105,000             | $120,000                | $125,000            |
| Annual Recurring Rev (ARR)  | $375,000             | $2,250,000           | $5,250,000           | $10,200,000             | $15,000,000         |
+-----------------------------+----------------------+----------------------+----------------------+-------------------------+---------------------+
| Cost of Goods Sold (COGS):  |                      |                      |                      |                         |                     |
| - Commercial Feeds & API Lic| $65,000              | $140,000             | $280,000             | $420,000                | $580,000            |
| - Cloud Infrastructure (AWS)| $55,000              | $110,000             | $220,000             | $340,000                | $460,000            |
| - SOC 2 Type II & Security  | $80,000              | $95,000              | $120,000             | $140,000                | $175,000            |
| - Technical Account Success | $90,000              | $220,000             | $450,000             | $720,000                | $980,000            |
| Total COGS                  | $290,000             | $565,000             | $1,070,000           | $1,620,000              | $2,195,000          |
| Gross Margin ($)            | $85,000              | $1,685,000           | $4,180,000           | $8,580,000              | $12,805,000         |
| Gross Margin (%)            | 22.7% (Year 1 Ramp)  | 74.9% (Scale)        | 79.6%                | 84.1%                   | 85.4%               |
+-----------------------------+----------------------+----------------------+----------------------+-------------------------+---------------------+
| Operating Expenses:         |                      |                      |                      |                         |                     |
| - R&D & Engineering (Sal.)  | $480,000 (3 FTE)     | $950,000 (6 FTE)     | $1,600,000 (10 FTE)  | $2,400,000 (14 FTE)     | $3,200,000 (18 FTE) |
| - Sales & Marketing (Sal.)  | $140,000 (1 FTE)     | $480,000 (3 FTE)     | $980,000 (6 FTE)     | $1,600,000 (9 FTE)      | $2,200,000 (12 FTE) |
| - G&A & Operations (Sal.)   | $120,000 (1 FTE)     | $240,000 (2 FTE)     | $380,000 (3 FTE)     | $520,000 (4 FTE)        | $680,000 (5 FTE)    |
| - Legal, Regulatory & PIA   | $380,000             | $420,000             | $550,000             | $680,000                | $800,000            |
| - Cyber, E&O & Media Ins.   | $65,000              | $90,000              | $130,000             | $170,000                | $220,000            |
| - Office, Tools & Marketing | $80,000              | $140,000             | $220,000             | $320,000                | $420,000            |
| Total Operating Expenses    | $1,265,000           | $2,320,000           | $3,860,000           | $5,710,000              | $7,520,000          |
| EBITDA ($)                  | ($1,180,000)         | ($635,000)           | $320,000 (Breakeven) | $2,870,000              | $5,285,000          |
| Financing Window            | $2.5M Seed Round     | Series A Window      | Self-Funded Expansion| Enterprise Multiple     | Liquidity Option    |
+-----------------------------+----------------------+----------------------+----------------------+-------------------------+---------------------+
```

### 5.3 Capitalization & Financing Structure
1. **The $2,500,000 Seed Round**:
   - **Target Capital**: $2.5M at an $10M–$12M post-money valuation (20–25% dilution).
   - **Use of Proceeds**: Covers Year 1 burn of ($1.18M), Year 2 initial ramp ($635k), and provides an $685k working capital buffer against enterprise procurement cycles.
   - **Fundraising Risk & Kill Criterion**: If no lead investor term sheet is executed by Day 120, freeze non-founder hiring, cap Year 1 enterprise accounts at 3 ($225k ARR), and sustain operations via founder-led compliance advisory retainers.
2. **Series A Trigger Window (Year 2)**:
   - Evaluated when ARR reaches $\ge \$3.0\text{M}$ with Net Revenue Retention (NRR) $\ge 110\%$ for two consecutive quarters.

---

## 6. Valuation Framework ($60M–$100M Enterprise Value)

Rather than assuming an unearned top-decile 10× multiple, Vanguard models a defensible **Valuation Band at $10.2M ARR**:
- **Conservative Multiple (6.0× ARR) $\rightarrow$ $61.2M Enterprise Value**: Reflects market discount for regulatory tail risk, single-state concentration, or NRR between 105%–110%.
- **Base Enterprise Multiple (8.0× ARR) $\rightarrow$ $81.6M Enterprise Value**: Reflects 85 institutional accounts, verified multi-state operation (NY, CA, TX), gross churn $< 7\%$, and zero regulatory inquiries.
- **Top-Decile Multiple (10.0× ARR) $\rightarrow$ $102.0M Enterprise Value**: Awarded if Vanguard achieves NRR $> 120\%$, Gross Margin $> 84\%$, and establishes undisputed procurement dominance as the standard pre-cleared diligence tool on AmLaw 100 panels.

---

## 7. 90-Day Validation Plan & Operational Milestones

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

## 8. Appendix: Banned Terminology & Descriptors Schedule

To guarantee absolute compliance with defamation and consumer-reporting firewalls, all Vanguard systems enforce:

```typescript
export const BANNED_TERMINOLOGY_REGISTRY = [
  // Criminal / Conclusory Allegations
  "fraud", "fraudulent", "scam", "guilty", "enforcement target", "kickback ring", "criminal syndicate",
  // Softer Conclusory Adjectives
  "suspect", "suspicious", "likely", "probable", "bad actor", "sham", "ghost provider"
] as const;

export const INSTITUTIONAL_EVIDENTIARY_DESCRIPTORS = [
  "observed variance", "statistical outlier", "peer deviation (+X.Xσ)",
  "administrative discrepancy", "uninspected data gap", "documented exculpatory hypothesis"
] as const;
```

---
*End of Operating Charter V5.*  
**Adopted by Executive Committee:** October 2026  
**Distribution:** Board of Directors, Strategic Legal Counsel, Lead Investors
