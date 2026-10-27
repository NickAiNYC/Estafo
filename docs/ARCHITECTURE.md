# SYSTEM ARCHITECTURE & DATA FLOW
**Project:** Vanguard Console / Estafo (Metropolitan Intelligence & Profit Engine)  
**Version:** 2.4.0  
**Status:** Production  

---

## 1. Architectural Philosophy

Vanguard is designed not as a passive reporting dashboard, but as an **evidence-driven opportunity discovery and profit execution engine**. The system closes the loop between authoritative real-world observations and verified financial results.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. AUTHORITATIVE DATA SOURCES                                          │
│    • NYC Open Data Socrata APIs (DOB Complaints, Violations, 311)       │
│    • HHS Open Data Medicaid Provider Spending (Monthly Aggregates)      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. INGESTION, NORMALIZATION & PROVENANCE LAYER                         │
│    • SODA Socrata API Adapters with exponential backoff & retries      │
│    • Deterministic Deduplication via Source Composite Keys             │
│    • Provenance Tagging: Source URL, Record ID, Retrieval Timestamp    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. ENTITY RESOLUTION & CROSS-VECTOR GRAPH                              │
│    • Physical Resolution: Building Identification Number (BIN), BBL    │
│    • Commercial Fleet Resolution: Vehicle Plate, DOT / Carrier Numbers │
│    • Healthcare Entity Resolution: National Provider Identifier (NPI)  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. OPPORTUNITY INTELLIGENCE & EXPLAINABLE SCORING                      │
│    • Track 1: Clean Air Act Idling Chokepoints (50% OATH Bounty)       │
│    • Track 5: DSNY Commercial Illegal Dumping ($9,000 / hit bounty)    │
│    • Track 6: NYFCA Medicaid Anomaly Screening (Law Firm Pilots)       │
│    • Track 11: DOB Unpermitted Construction & Demolition Work          │
│    • Formula: ENPV = P(conv) × Gross Value - Costs - Downside Risk     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. OPERATOR ACTION QUEUE & FORENSIC EVIDENCE PACKAGER                  │
│    • Ranked Action List with Required Next Steps & Due Dates           │
│    • 1-Click OATH Citizen Affidavits (Mandatory Telephone Standby)     │
│    • 1-Click DOJ / NY AG Qui Tam Research Disclosure Memoranda         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 6. COMMERCIAL PROFIT LEDGER & OUTCOME FEEDBACK LOOP                    │
│    • Realized Revenue: Fixed-Fee Research Pilots & Collected Bounties  │
│    • Auditable Accounting: Separate Forecast, Invoiced, Cash Collected │
│    • Outcome Calibration: Feedback loop adjusting conversion priors    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Real-World Source Ingestion Layer

Data ingestion utilizes Socrata Open Data API (SODA) endpoints directly from `data.cityofnewyork.us`:

1. **NYC DOB Complaints Received (`eabe-havv`):**
   - Official records of building complaints, inspection dates, and disposition codes.
   - Primary key: `complaint_number`. Entity link: `bin` (Building Identification Number).
2. **NYC DOB Violations (`3h2n-5cm9`):**
   - Active and historical safety violations, violation categories, and penalty amounts.
   - Primary key: `isn_dob_bis_viol`. Entity link: `block`, `lot`, `bin`.
3. **NYC 311 Service Requests (`erm2-nwe9`):**
   - High-frequency daily stream filtered for `complaint_type in ('Idling', 'Illegal Dumping')`.
   - Primary key: `unique_key`. Entity link: Geographic coordinates (`latitude`, `longitude`), `bbl`.

---

## 3. Opportunity Scoring Specification

Every detected opportunity must be backed by a transparent mathematical model:

$$\text{Expected Net Value} = \left[ P(\text{conversion}) \times \text{Expected Value} \right] - \text{Investigation Cost} - \text{Pursuit Cost} - \text{Downside Exposure}$$

Where:
- $P(\text{conversion})$: Historical conversion probability based on source confidence and evidence completeness.
- $\text{Expected Value}$: Legally actionable bounty or fixed commercial pilot contract value.
- $\text{Investigation Cost}$: Time and travel costs for field riders or intelligence analysts.
- $\text{Downside Exposure}$: Regulatory or reputational risks associated with unverified filings.

---

## 4. Separation of Church and State: Cash vs Hypothetical Recovery

Under the Vanguard Accounting Doctrine:
- **Never count potential government recoveries as platform revenue.**
- Bounties are only marked as `PAID` after fines have been formally collected by the NYC Comptroller or OATH.
- For Medicaid intelligence, revenue is earned through **fixed-scope law firm research pilots ($5,000–$25,000)**, not speculative whistleblower recoveries.
