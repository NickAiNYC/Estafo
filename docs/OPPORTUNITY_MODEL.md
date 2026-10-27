# ESTAFO — Opportunity Scoring & Analytical Prioritization Model

This document outlines the mathematical formulation, empirical assumptions, uncertainty modeling, and verification requirements for ranking actionable intelligence in the ESTAFO console.

---

## 1. Core Operating Objective

The primary objective of the Opportunity Engine is to answer:
> **"What specific action should an investigator, field operator, or litigation team take next to maximize expected net value per unit of time and capital expended?"**

---

## 2. Expected Net Present Value (ENPV) Formulation

Every detected event or anomaly $i$ is evaluated using an explainable, deterministic scoring formula:

$$\text{ENPV}_i = \left( P(\text{success}_i) \times \text{Expected Value}_i \right) - \text{Investigation Cost}_i - \text{Pursuit Cost}_i - \text{Downside Risk}_i$$

Where:

### A. $P(\text{success}_i)$ — Probability of Successful Conversion
A calibrated probability between $0.05$ and $0.90$ based on verified historical criteria:
- **Corroborating Evidence Bonus**: $+0.15$ if $\ge 2$ independent sources confirm the event (e.g., citizen 311 report + official inspector violation notice).
- **Recency Decay**: Multiplier $e^{-\lambda \cdot \Delta t}$, where $\lambda = 0.05/\text{day}$ (events older than 30 days lose prioritisation).
- **Jurisdictional Clarity**: $+0.10$ if the agency with enforcement authority (e.g. DSNY, DEP, DOB, NYAG) has active statutory penalty schedules.
- **Default Cap**: For unadjudicated statistical anomalies, $P(\text{success})$ is capped at $0.25$ until reviewed by an analyst.

### B. $\text{Expected Value}_i$ — Commercial / Recovery Ceiling
- **Commercial Litigation / Research Pilots**: Retainer value of law firm research report ($5,000 - $25,000).
- **Citizen Enforcement (NYC Admin Code 24-163 / Local Law 58)**:
  - Commercial Idling penalty: $350 - $2,000. Statutory citizen reward: 25% of collected fine ($87.50 - $500).
  - Illegal Commercial Dumping: $4,000 - $18,000 fine. Statutory bounty: up to 50% ($2,000 - $9,000).
- **Medicaid Qui Tam (False Claims Act)**: Documented as **Potential Statutory Exposure** only. Never used as expected value without formal DOJ/NYAG intervention agreement.

### C. $\text{Investigation Cost}_i$ & $\text{Pursuit Cost}_i$
- Field verification labor (hours $\times \$45/\text{hr}$).
- FOIL / public records retrieval fee.
- Attorney / legal analyst review time ($150/\text{hr}$).

### D. $\text{Downside Risk}_i$
- Risk of frivolous filing penalties or administrative rejection.
- Reputational and compliance risk weightings.

---

## 3. Explainability & Evidence Contract (Gate G3)

Every ranked opportunity must output an explainability card containing:
1. **Triggering Event**: Exact dataset, record ID, and timestamp.
2. **Confidence Band**: `HIGH` ($\ge 0.70$), `MEDIUM` ($0.40 - 0.69$), or `PRELIMINARY` ($< 0.40$).
3. **Assumptions List**: Transparently exposed constants used in the calculation.
4. **Counter-Evidence & Missing Links**: Explicitly stated data gaps (e.g., "Property owner identity pending ACRIS lookup").
5. **Recommended Next Step**: Specific, lawful action (e.g., "Perform on-site 3-minute video verification", "Cross-reference DOB BIN with active alteration permits").
