# The Seven Secret Sauce Components for Profitable Medicaid Fraud Intelligence

This document defines the defensible moat, multi-signal detection methodology, attorney evidence contract, commercial pricing model, and attorney feedback loop that powers **ESTAFO / MediFraudy**.

---

## 1. Proprietary Entity-Resolution Graph (The Compounding Moat)

A Medicaid fraud intelligence engine cannot rely on a commodity LLM or a generic dashboard. Government auditors (e.g. NY OMIG using tools like Salient) already have access to raw claims feeds. The commercial moat is **historical entity resolution** that ties together disparate records faster, more transparently, and with historical depth that a competitor scraping public records tomorrow cannot replicate.

### Compounding Graph Nodes:
- **Provider Identity**: NPI, State Medicaid Provider ID, EIN/TIN, Individual vs. Organization.
- **Historical Trajectory**:
  - Name changes (DBAs, corporate reorganizations, asset purchases).
  - Address histories (prior suites, virtual offices, industrial co-locations).
  - Provider status timelines (OMIG audit notices, LEIE exclusions, license restorations).
- **Corporate Shells & Beneficial Ownership**: NYS Department of State Division of Corporations filings, Delaware parent entities, cross-director linkages.
- **Physical BBL Co-Location**: Parcels where healthcare entities, billing services, and logistics fleets overlap.

### Edge Provenance Contract:
- `VERIFIED_CORPORATE`: Established via official Secretary of State filings.
- `PHYSICAL_PROXIMITY`: Established via NYC ACRIS property deeds and BBL mapping.
  - *Strict Rule*: A shared address is a research lead, **never** proof of common ownership or fraud.
- `BILLING_ASSOCIATION`: Established via shared clearinghouses or billing agent identifiers.

---

## 2. Multi-Signal Detection (Never a Single Outlier Score)

Single-metric anomaly detection generates noise and destroys credibility with litigation counsel. ESTAFO enforces a **multi-signal alignment rule**: an anomaly only surfaces to the prioritized review queue when at least two independent detection vectors trigger.

### The Four Independent Vectors:
1. **Peer Deviation ($\sigma$)**:
   - Compares the provider against an identical peer cohort: same taxonomy code, same geographic service area (e.g., Brooklyn MLTC transportation), and same patient acuity tier.
   - Triggers when paid amount per beneficiary or claims per beneficiary exceeds $+3.5\sigma$.
2. **Temporal Velocity Spikes**:
   - Identifies abrupt billing accelerations ($> 200\%$ growth over trailing 60 days) uncharacteristic of natural organic patient roster growth.
3. **Physically Impossible Metrics**:
   - Single personal assistant billing $> 24$ billable hours within a single calendar day across overlapping CDPAP fiscal intermediaries.
   - Procedure codes billed while the beneficiary is documented as an inpatient in an acute care hospital.
4. **Network Cluster Risk**:
   - The provider shares key management, phone numbers, or registered agents with an entity under active NY OMIG sanction or prior OATH environmental citation.

---

## 3. Attorney-Ready Evidence Dossier Contract

Litigation counsel will not pay for dashboard alerts; they pay for **hours of investigative reconstruction saved**. Every exported dossier must fulfill the following contract:

```
[ Section 1: Triggering Anomaly & Source Citations ]
  - Dataset ID, SODA / CMS URL, exact retrieval timestamp, HTTP ETag.
[ Section 2: Peer Group Definition & Calculation ]
  - Peer cohort size (N), mean, standard deviation, and provider percentile.
[ Section 3: Contradictory & Exculpatory Evidence ]
  - What innocent operational scenario explains this data? (e.g., competitor bankruptcy).
[ Section 4: Four-Tier Categorization ]
  - FACTS: Adjudicated public records, corporate filings, official dates.
  - INFERENCES: Statistical anomalies, geographic proximity.
  - ALLEGATIONS: ZERO asserted by the platform.
  - UNKNOWNS: Pending records, uninspected internal patient charts.
[ Section 5: Recommended Next Investigative Step ]
  - Precise discovery target (e.g., "Subpoena electronic visit verification EVV GPS pings").
[ Section 6: Qualified Human Legal Review Sign-Off ]
  - Reviewer identity, date, and certification.
```

---

## 4. Commercial Law Firm Pilot Model

The commercial strategy bypasses multi-year government procurement and avoids the long, uncertain timeline of qui tam relator bounties. It focuses on **immediate, paid law firm research engagements**:

| Offering | Target Customer | Scope & Deliverables | Price Point |
| :--- | :--- | :--- | :--- |
| **Provider Peer Deviation Dossier** | Healthcare Fraud Boutique Law Firms | Single provider forensic analysis, 3-year billing peer comparison, entity resolution graph, and exculpatory audit. | **$7,500** fixed fee |
| **Regional Sector Portfolio Audit** | Qui Tam Relator Counsel / Litigation Groups | Screening of 50+ providers in a high-risk category (e.g., NYC Adult Day Care Transportation or CDPAP), ranked by multi-signal alignment. | **$18,500** fixed fee |
| **Ongoing Intelligence Subscription** | National False Claims Act Practice Groups | Continuous monthly screening of newly published CMS/OMIG/OATH records with monthly prioritized action queue. | **$4,500 / mo** recurring |

---

## 5. Structural Realism on Success Fees

- **The Problem with 1% Relator Bounties**: Qui tam actions remain sealed for 60 days to several years; DOJ declines in $\approx 80\%$ of cases; litigation can take 5+ years with zero certainty of recovery.
- **The Scalable Solution**:
  1. Base research retainers cover all operating costs and analyst labor with $>80\%$ gross margin.
  2. For authorized claims audits with managed care organizations (MCOs), charge an overpayment identification fee ($10-15\%$ of identified and recovered improper claims, following the Cotiviti/Performant model).
  3. For law firm partners, structure agreements as a vendor research success fee pegged to the **firm's contingency recovery**, not a speculative relator share.

---

## 6. Mandatory Human Legal Review Gate

- No finding leaves the system without a documented review by a qualified healthcare compliance analyst or attorney.
- The platform strictly forbids autonomous outward communication:
  - **No automated demand letters.**
  - **No automated whistleblower filings.**
  - **No automated accusations or defamatory characterizations.**

---

## 7. Closed-Loop Decision Learning Engine

The system records the disposition of every delivered lead:
1. `ACCEPTED_FOR_INVESTIGATION`: Lead verified by counsel; formal preliminary investigation opened.
2. `REJECTED_ALREADY_KNOWN`: Entity was already under investigation by relator team.
3. `REJECTED_INSUFFICIENT_EVIDENCE`: Signal was statistically anomalous but lacked documentary corroboration.
4. `REJECTED_EXCULPATORY_EXPLANATION`: Counsel identified an innocent operational cause.
5. `FORMAL_CASE_OPENED`: Sealed qui tam complaint or demand filed.

**Algorithmic Feedback**: The opportunity ranking engine adjusts its signal weights ($w_{\text{peer}}$, $w_{\text{temporal}}$, $w_{\text{network}}$) dynamically as attorney dispositions are recorded, increasing precision over time.
