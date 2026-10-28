# ESTAFOTIR FIELD PRE-VISIT RECONNAISSANCE PACKET
**Document ID:** `ESTAFO-PACKET-1235760927-20261028`  
**Target Entity:** REGO PARK COUNSELING LLC  
**Primary Location:** 63-36 99TH ST, Queens, NY 11374  
**Date Generated:** 2026-10-28  
**Classification:** STRICTLY CONFIDENTIAL // UNVERIFIED PRELIMINARY RECONNAISSANCE AID  
**Statutory Framework:** NYS Finance Law § 190 (False Claims Act) / 31 U.S.C. § 3730 / DOJ WHIP Pilot  

---

> ### ⚠️ MANDATORY INVESTIGATOR NOTICE & ZERO-PHI BOUNDARY
> 1. **Zero Protected Health Information (PHI) & 42 CFR Part 2 Discipline:**  
>    Because this facility is licensed under NYS OASAS for chemical dependence treatment, federal **42 CFR Part 2** and HIPAA regulations strictly apply. **NEVER** photograph, videotape, record, track, tail, or document patient faces, names, or identifying personal information. Violations of 42 CFR Part 2 carry federal criminal penalties.
> 2. **Public Vantage Point Only:**  
>    Conduct all observations exclusively from lawful public spaces (public sidewalks, public street parking). Do not trespass into private clinic suites, employee-only corridors, or private parking lots.
> 3. **No Direct Accusations or Interviews:**  
>    Never contact, confront, or accuse facility staff, drivers, or patients of fraud, kickbacks, or false billing. Street observations alone **do not prove billing fraud** and cannot clear the False Claims Act Public Disclosure Bar without non-public corroboration.

---

## 1. TARGET SUBJECT & PUBLIC REGISTRY IDENTIFIERS

| Attribute | Primary Facility Record | Secondary Branch Site |
| :--- | :--- | :--- |
| **Provider Legal Name** | **REGO PARK COUNSELING LLC** | **REGO PARK COUNSELING LLC (FRESH MEADOWS)** |
| **National Provider Identifier (NPI)** | **`1235760927`** (Type 2: Organization) | **`1932061611`** (Type 2: Organization) |
| **Practice Address** | 63-36 99th Street, Rego Park, NY 11374 | 71-82 Parsons Blvd, Fresh Meadows, NY 11365 |
| **Taxonomy Code** | `261QR0405X` (Substance Use Disorder Clinic) | `261QM1300X` (Multi-Specialty Clinic) |
| **Enumeration Date** | 2020-01-31 | 2025-12-01 |
| **Authorized Official** | Emanuil Kalendarev (CEO) | Emanuil Kalendarev (CEO) |
| **State Licensing Authority** | **NYS OASAS Provider #51310** | **NYS OASAS Provider #51310** |
| **OASAS Program Code** | **Program #53489** (Part 822 Outpatient Clinic) | Secondary Program Location |
| **HHS OIG LEIE Exclusion Status** | **CLEAR (No Exclusion Record)** | **CLEAR (No Exclusion Record)** |

---

## 2. VERIFIED HHS MEDICAID PROVIDER SPENDING BASELINE

*Source: Official HHS Medicaid Provider Spending Dataset (Release Date: 2026-02-09, SHA-256: `3387c48ea9...`)*  
*Query Partition: `HCPCS_CODE = 'H0005'` (Outpatient Chemical Dependence Group Counseling) | `BILLING_PROVIDER_NPI_NUM = '1235760927'`*

- **Active Historical Window:** July 2020 through December 2024 (60 calendar months / 59 aggregate monthly reporting rows).
- **Total Medicaid Paid:** **$2,780,731.31**
- **Total Billed Claims:** **53,213 claims**
- **Total Unique Patients (Beneficiaries):** **3,964 individuals**
- **Average Run-Rate Intensity:** **$46,345.52 per month**
- **Average Spend per Patient:** **$701.50**
- **Average Group Sessions per Patient:** **13.42 group counseling claims**

### Detected Velocity Surge Windows (3x Acceleration Flag):
The DuckDB screening engine flagged two distinct acceleration spikes exceeding 3.0x over a 3-month offset:
1. **October 2020 Acceleration (3.22x):**
   - Prior Quarter (July 2020): **$17,188.31** (Early clinic ramp-up)
   - Surge Month (October 2020): **$55,373.55**
2. **August 2024 Acceleration (3.08x):**
   - Prior Quarter (May 2024): **$9,787.54**
   - Surge Month (August 2024): **$30,108.49**

*Note on Fresh Meadows Location (`1932061611`):* Slices in the 2018–2024 HHS release show $0.00 because enumeration occurred on `2025-12-01`, which post-dates the release cutoff.

---

## 3. PHYSICAL SITE & CO-LOCATION CONTEXT

- **Property Type:** Multi-story commercial / professional medical office building in Rego Park, Queens.
- **Co-Located Medical Practices:**
  - **CitiMedical Services P.C.** (`NPI 1275172280` / `NPI 1447597828`) operates out of the same 63-36 99th Street address.
  - *Evidentiary Significance:* Ambulettes arriving at 63-36 99th Street drop off patients for multiple independent practices (internal medicine, physical therapy, pain management). Ambulette passenger activity alone does **NOT** establish attendance or billing at Rego Park Counseling LLC.
- **Transit & Arrival Patterns:**
  - Reporter accounts indicate ambulette and van activity occurs primarily around **8:45 a.m. – 9:30 a.m. Monday through Friday**.
  - Van traffic must be logged by commercial vehicle operator name, plate number, and arrival timestamp without tracking passenger identities.

---

## 4. PLAUSIBLE INNOCENT EXPLANATIONS TO TEST BEFORE DRAWING INFERENCES

Investigators and counsel must actively test and rule out innocent medical explanations:
1. **Legitimate Multi-Tenant Medical Co-Location:** The majority of ambulette drop-offs at 63-36 99th Street may be visiting physical therapy or physician offices on other floors.
2. **Brief Treatment Codes:** Short attendee stops (e.g., 15–20 minutes) do not prove false group billing. NYS OASAS Part 822 permits brief intervention billing under HCPCS `H0004` with modifier `U5` (8–14 minutes), and co-located clinics bill physical therapy timed units (`CPT 97110`, 15-minute units).
3. **Staggered Multi-Cohort Schedules:** A high monthly claim volume (e.g. ~880 claims/month) is readily explained by multiple certified group counseling sessions per day (e.g., 3 daily groups of 10–12 clients across 22 clinic operating days).
4. **Thirdhand Rumors vs. Direct Evidence:** Reports of cash payments to attendees currently represent thirdhand statements. An uncorroborated rumor cannot support a False Claims Act complaint.

---

## 5. THE THREE-WAY INVESTIGATIVE MATCH (NON-PUBLIC EVIDENCE STANDARD)

To support a DOJ WHIP tip ($10k–$30k fee) or clear the False Claims Act Public Disclosure Bar (31 U.S.C. § 3730(e)(4)), counsel requires non-public records establishing a three-way mismatch:

```
[ Element A: Authorized Ride ] ───► MAS Trip Ticket & Vehicle GPS Logs
                                          │
[ Element B: Clinic Check-In ] ───► Contemporaneous Daily Signed Roster
                                          │
[ Element C: Billed Claim    ] ───► NYS Medicaid MMIS Claim (H0005) + Signed Clinical Note
```

### Investigator Checklist:
- [ ] **Authorized Transportation Ticket:** Was the ride authorized through Medical Answering Services (MAS) for chemical dependence treatment on that specific date?
- [ ] **Contemporaneous Clinic Check-In:** Did the patient sign into the physical attendance roster at 63-36 99th Street at the timestamp corresponding to the ride drop-off?
- [ ] **Documented Clinical Service:** Is there a signed, contemporaneous clinical progress note in the patient file describing the chemical dependence group counseling topic, duration (typically 45–60 minutes), and counselor signature?
- [ ] **False Claim Discrepancy:** Does a Medicaid claim exist for a group counseling session (`H0005`) on a date when the patient was either absent, present for under 15 minutes, or transported for a different specialty?

---

## 6. FIELD RECONNAISSANCE LOG SHEET

**Investigator Name / ID:** ________________________________________________  
**Observation Date:** ________________________  **Weather:** _________________  
**Observation Window:** Start: ____________ AM/PM  |  End: ____________ AM/PM  
**Vantage Point:** _________________________________________________________  

### Vehicle Activity Log (Public Observations Only — Do Not Record Passenger Faces):

| # | Time | Vehicle Make / Type | Operating Company (Signage) | License Plate & State | Est. Drop-Off Count | Notes (Building Entrance Used, Direction) |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | : AM | | | | | |
| 2 | : AM | | | | | |
| 3 | : AM | | | | | |
| 4 | : AM | | | | | |
| 5 | : AM | | | | | |

### Physical Facility Inspection Checklist:
- [ ] Facility signage at 63-36 99th St verifies "Rego Park Counseling LLC" on exterior directory / suite door.
- [ ] Suite / Suite number documented: Suite # ____________.
- [ ] Operating hours posted on exterior or entrance: ____________________________________.
- [ ] Public informational brochures / intake forms available in public reception area: [ ] YES  [ ] NO.
- [ ] Physical waiting area capacity estimated: Approximately ______ seats.
- [ ] Number of distinct counseling / group meeting rooms visible from public reception: ______.

### Neutral Investigator Notes:
________________________________________________________________________________  
________________________________________________________________________________  
________________________________________________________________________________  
________________________________________________________________________________  

*Estafotir Legal Intelligence // Compiled from Official NYS OASAS Public Registry & CMS/HHS Medicaid Provider Datasets.*
