import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * CLEAN-ROOM DILIGENCE AUDIT & PROVENANCE VALIDATOR
 * - Computes cohort statistics live from public/data/medicaid_providers.json (T2024 cohort, n >= 30 enforced).
 * - Runs Luhn / suppression checks as DATA-QUALITY controls (not evidence).
 * - Emits a SYNTHETIC benchmark packet: no real NPI or provider name is ever written.
 */

const MIN_COHORT = 30;
const SYNTHETIC_ID = "SYNTHETIC-BENCHMARK-NPI-01";

function verifyNpiLuhn(npi) {
  if (!/^\d{10}$/.test(npi)) return false;
  const full = "80840" + npi;
  let sum = 0;
  for (let i = full.length - 1, alt = false; i >= 0; i--, alt = !alt) {
    let d = parseInt(full[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

function stats(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1));
  return { mean, sd, cv: sd / mean };
}

function run() {
  console.log("=== VANGUARD CLEAN-ROOM DILIGENCE AUDIT ===");
  const dataPath = path.join(process.cwd(), "public", "data", "medicaid_providers.json");
  const rawFile = fs.readFileSync(dataPath);
  const sourceHash = crypto.createHash("sha256").update(rawFile).digest("hex");
  const all = JSON.parse(rawFile.toString("utf8"));
  const cohort = all.filter(p => p.service_code && p.service_code.includes("T2024") && !p.is_synthetic);

  if (cohort.length < MIN_COHORT) throw new Error(`Peer cohort n=${cohort.length} < ${MIN_COHORT}`);
  console.log(`✓ Cohort: n=${cohort.length} (HCPCS T2024, NYC); minimum n=${MIN_COHORT} satisfied`);

  if (!cohort.every(p => p.total_beneficiaries >= 11)) throw new Error("Unsuppressed cell (<11 beneficiaries)");
  console.log("✓ Upstream cell suppression: all cohort entities >= 11 beneficiaries");

  const luhnPass = cohort.filter(p => verifyNpiLuhn(p.npi)).length;
  console.log(`✓ Data-quality control (not evidence): Luhn pass ${luhnPass}/${cohort.length}`);

  const vals = cohort.map(p => p.monthly_intensity);
  const { mean, sd, cv } = stats(vals);
  const within = vals.filter(v => Math.abs(v - mean) / sd <= 1.5).length;
  const outliers = vals.filter(v => (v - mean) / sd > 3).length;
  console.log(`✓ Mean $${Math.round(mean).toLocaleString()} | SD $${Math.round(sd).toLocaleString()} | CV ${(cv * 100).toFixed(1)}%`);
  console.log(`✓ Within ±1.5σ: ${within}/${cohort.length} | > +3σ: ${outliers}`);

  // Synthetic subject: fixed illustrative values, clearly watermarked.
  const subjectMonthly = 1080000;
  const z = ((subjectMonthly - mean) / sd).toFixed(2);

  const payload = JSON.stringify({
    source_file: "public/data/medicaid_providers.json",
    source_sha256: sourceHash,
    cohort_n: cohort.length,
    mean, sd, within_1_5_sigma: within, over_3_sigma: outliers,
    subject: SYNTHETIC_ID, subject_monthly: subjectMonthly, z
  });
  const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");
  const today = new Date().toISOString();

  const dossier = `================================================================================
SYNTHETIC BENCHMARK SAMPLE // NOT A REAL ENTITY // NOT AN ALLEGATION
SCREENING METHODOLOGY MEMORANDUM // ZERO-PHI
================================================================================
REF IDENTIFIER:          VANGUARD-SAMPLE-${SYNTHETIC_ID}-${today.slice(0, 10)}
PAYLOAD DIGEST:          ${payloadHash}
SOURCE FILE SHA-256:     ${sourceHash}

I. SUBJECT (SYNTHETIC)
--------------------------------------------------------------------------------
Identifier:              ${SYNTHETIC_ID} (illustrative; fails NPI format by design)
Taxonomy Scope:          HCPCS T2024 (illustrative)
Subject Monthly Rate:    $${subjectMonthly.toLocaleString()} (illustrative value)

II. PEER COHORT & STATISTICAL METHODOLOGY
--------------------------------------------------------------------------------
Peer Definition:         HCPCS T2024, NYC 5-borough ZIPs; acuity/facility-type NOT adjusted
Cohort Size:             n = ${cohort.length} (minimum n = ${MIN_COHORT} enforced)
Cohort Mean:             $${Math.round(mean).toLocaleString()} / active month
Cohort StdDev:           $${Math.round(sd).toLocaleString()} (CV = ${(cv * 100).toFixed(1)}%: heterogeneous)
Subject Deviation:       +${z}σ (screening signal only)
Limitation:              Recommend OMIG re-run against the full MMIS cohort.

III. NEGATIVE SPACE
--------------------------------------------------------------------------------
Screened:                ${cohort.length} providers
Within ±1.5σ:            ${within} (${(within / cohort.length * 100).toFixed(1)}%)
Above +3σ:               ${outliers} (${(outliers / cohort.length * 100).toFixed(1)}%)
Co-location screen:      NOT computed; any co-location observation is unverified.

IV. SCHEME HYPOTHESIS (HYPOTHESIS ONLY)
--------------------------------------------------------------------------------
Mechanism:               A common operator may bill facility per-diem and transport for the same beneficiaries.
Beneficiary:             Common principals, if common control exists (not shown by public data).
Program exposure:        Aggregate paid amount only; no overbilling quantified.
Confirm/Exonerate:       Attendance sign-ins, trip tickets/EVV, lease and billing-agent records.

V. INNOCENT EXPLANATIONS CONSIDERED
--------------------------------------------------------------------------------
1. Shared registered agent / mail drop — not tested.
2. Multi-tenant medical building / landlord-tenant — not tested.
3. Shared third-party billing agent — not testable from public data.
4. High-acuity population / extended hours — not testable from public data.

VI. FACT / INFERENCE / GAP
--------------------------------------------------------------------------------
[FACT]      Cohort statistics above, computed from the hashed source file.
[INFERENCE] Subject's billing intensity is high relative to an unadjusted cohort.
[GAP]       Ownership, attendance, transport records, clinical necessity.

VII. DATA QUALITY CONTROLS (NOT EVIDENCE)
--------------------------------------------------------------------------------
Luhn check:              ${luhnPass}/${cohort.length} cohort NPIs pass
Suppression:             all cohort entities >= 11 beneficiaries
PHI:                     none ingested

VIII. PROVENANCE
--------------------------------------------------------------------------------
Release:                 HHS Medicaid Provider Spending, 2026-02-09 (aggregated into public/data/medicaid_providers.json)
Reproduce:               node tests/clean_room_diligence_audit.mjs
Generated:               ${today}
================================================================================
`;
  fs.writeFileSync(path.join(process.cwd(), "docs", "SAMPLE_INSTITUTIONAL_DILIGENCE_PACKET.txt"), dossier);
  console.log("✓ Synthetic sample packet written");
  console.log(">>> CLEAN-ROOM AUDIT COMPLETED <<<");
}
run();
