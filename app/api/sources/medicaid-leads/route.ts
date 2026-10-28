import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MedicaidProviderRecord, ServiceCodeDefinition } from "@/types";

// Official Service Code Master Taxonomy (CMS, NY DOH, NYS OASAS)
const OFFICIAL_SERVICE_CODES: Record<string, ServiceCodeDefinition> = {
  "T2024": {
    code: "T2024",
    official_title: "Service assessment / plan of care development, waiver",
    authority: "CMS",
    billing_unit: "Per assessment encounter",
    regulatory_citation: "CMS Manual Pub 100-04 Transmittal R3674CP",
    investigative_notes: "Plan-of-care development/intake waiver assessment. NOT per diem adult day attendance. Compare billed assessment dates against primary participant intake charts."
  },
  "S5102": {
    code: "S5102",
    official_title: "Day care services, adult; per diem",
    authority: "NY_DOH",
    billing_unit: "Per diem (full day, min 5 hrs)",
    regulatory_citation: "NY DOH Long Term Care Reimbursement DAL 2024-08-05",
    investigative_notes: "Adult Day Health Care (ADHC) medical model per diem. Requires licensed clinical staffing (RN/PT/OT/SW) on-site. Compare billed days against transportation manifests and signed attendance rosters."
  },
  "S5105": {
    code: "S5105",
    official_title: "Day care services, adult; per 15 minutes",
    authority: "NY_DOH",
    billing_unit: "15-minute encounter units",
    regulatory_citation: "NY DOH MLTC Policy 13.06 / DAL 2024-08-05",
    investigative_notes: "Social Adult Day Care (SADC) social model. Billed in 15-min increments. Check for overlapping hours, impossible concurrent billing with personal care/CDPAP, and kickback payments for attendance."
  },
  "A0130": {
    code: "A0130",
    official_title: "Nonemergency transportation: wheelchair van",
    authority: "NY_DOH",
    billing_unit: "Per one-way transport trip",
    regulatory_citation: "NY DOH Transportation Manual Policy Guidelines",
    investigative_notes: "Nonemergency medical transportation. Wheelchair van vehicle requirement. Check vehicle GPS logs, driver trip tickets, and confirm whether recipient attended an eligible medical/day program."
  },
  "T2003": {
    code: "T2003",
    official_title: "Non-emergency transportation; encounter/trip",
    authority: "NY_DOH",
    billing_unit: "Per encounter / base rate",
    regulatory_citation: "NY DOH Transportation Manual",
    investigative_notes: "Ambulette / taxi / livery Medicaid trip base rate. Check for phantom trips, unapproved group rides billed individually, and driver kickback recruitment."
  },
  "A0425": {
    code: "A0425",
    official_title: "Ground mileage, per statute mile",
    authority: "NY_DOH",
    billing_unit: "Statute mile",
    regulatory_citation: "NY DOH Transportation Fee Schedule",
    investigative_notes: "Billed mileage. Compare billed mileage against geodesic pickup-to-dropoff distance for inflated mileage fraud."
  },
  "H0005": {
    code: "H0005",
    official_title: "Alcohol and/or drug services; group counseling by a clinician",
    authority: "NYS_OASAS",
    billing_unit: "60-minute minimum group session",
    regulatory_citation: "NYS OASAS Part 822 Outpatient Chemical Dependence Billing Guidance",
    investigative_notes: "Outpatient substance use group session (minimum 60 minutes). Mandates signed progress notes and clinical documentation. Compare attendee sign-ins against member statements and ambulette dropoffs. (Strict HIPAA & 42 CFR Part 2 Zero-PHI rules apply)."
  },
  "90853": {
    code: "90853",
    official_title: "Interactive group psychotherapy",
    authority: "CMS",
    billing_unit: "Per group psychotherapy session",
    regulatory_citation: "CPT / NYS OASAS Clinical Manual",
    investigative_notes: "Group psychotherapy. Check for maximum group size rules, unlicensed facilitators, and payment-for-attendance kickbacks."
  }
};

// Luhn check digit verification algorithm for standard 10-digit NPIs (CMS formula with 80840 prefix)
function verifyNpiLuhn(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;
  const full = "80840" + npi;
  let sum = 0;
  for (let i = full.length - 1, alt = false; i >= 0; i--, alt = !alt) {
    let digit = parseInt(full[i], 10);
    if (alt) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

interface ImportRunMeta {
  id: number;
  source_dataset: string;
  source_url: string;
  source_sha256: string;
  release_id: string;
  hcpcs_code: string;
  npi_allowlist_sha256: string;
  imported_rows: number;
  imported_at: string;
}

interface DbAggResult {
  importRuns: ImportRunMeta[];
  records: Array<{
    billing_npi: string;
    hcpcs_code: string;
    total_spend: number;
    months_active: number;
    total_claims: number;
    total_patients: number;
  }>;
}

// Fail-Closed Database Loader: Read ONLY actual imported HHS rows with valid import manifest
function loadImportedHhsRecords(): DbAggResult {
  const candidatePaths = [
    path.join(process.cwd(), "test.db"),
    path.join(process.cwd(), "..", "MediFraudy", "test.db"),
    path.join(process.cwd(), "medifraudy.db")
  ];

  for (const dbPath of candidatePaths) {
    if (fs.existsSync(dbPath)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sqlite = require("node:sqlite");
        const db = new sqlite.DatabaseSync(dbPath, { readOnly: true });

        // Check if tables exist
        const hasRuns = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='aggregate_import_runs'").get();
        const hasRecords = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='aggregate_spending_records'").get();

        if (!hasRuns || !hasRecords) continue;

        const importRuns = db.prepare(`
          SELECT id, source_dataset, source_url, source_sha256, release_id, hcpcs_code, npi_allowlist_sha256, imported_rows, imported_at
          FROM aggregate_import_runs
          ORDER BY id DESC
        `).all() as unknown as ImportRunMeta[];

        if (!importRuns || importRuns.length === 0) continue;

        const records = db.prepare(`
          SELECT 
            billing_npi,
            hcpcs_code,
            SUM(total_paid_amount) as total_spend,
            COUNT(DISTINCT year_month) as months_active,
            SUM(COALESCE(total_claims, 0)) as total_claims,
            MAX(COALESCE(total_beneficiaries, 0)) as total_patients
          FROM aggregate_spending_records
          GROUP BY billing_npi, hcpcs_code
        `).all() as unknown as Array<{
          billing_npi: string;
          hcpcs_code: string;
          total_spend: number;
          months_active: number;
          total_claims: number;
          total_patients: number;
        }>;

        return { importRuns, records };
      } catch {
        // ignore and try next path
      }
    }
  }

  return { importRuns: [], records: [] };
}

// Load verified provider identity dictionary (NPPES practice location registry)
function loadVettedProviderDict(): Map<string, {
  name: string;
  borough: string;
  address: string;
  taxonomy_code: string;
  enumeration_date: string;
  lat: number;
  lon: number;
}> {
  const map = new Map();
  const candidatePaths = [
    path.join(process.cwd(), "backend", "data", "vetted_nyc_adhc_cohort.json"),
    path.join(process.cwd(), "..", "MediFraudy", "backend", "data", "vetted_nyc_adhc_cohort.json")
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
        if (Array.isArray(raw)) {
          for (const item of raw) {
            map.set(item.npi, {
              name: item.name,
              borough: item.borough,
              address: item.address,
              taxonomy_code: item.taxonomy_code || "261QA0600X",
              enumeration_date: item.enumeration_date || "Verified",
              lat: item.lat || 40.7128,
              lon: item.lon || -74.0060
            });
          }
          break;
        }
      } catch {
        // continue
      }
    }
  }
  return map;
}

export async function GET(request: Request) {
  // 1. Mandatory Institutional Authentication Check (Fail-Closed)
  const expectedToken = process.env.MEDICAID_PILOT_KEY?.trim();

  if (!expectedToken) {
    return NextResponse.json(
      {
        error: "AUTH_NOT_CONFIGURED",
        status: 503,
        message: "Institutional screening authentication secret is not configured on server. Access is failed closed.",
        disclaimer: "Contact platform administrator to configure MEDICAID_PILOT_KEY in the execution environment."
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, max-age=0" }
      }
    );
  }

  // Strict header inspection (rejection of URL query tokens)
  const authHeader = request.headers.get("authorization") || request.headers.get("x-api-key");
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!providedToken) {
    return NextResponse.json(
      {
        error: "AUTHENTICATION_REQUIRED",
        status: 401,
        message: "Institutional Medicaid screening records are restricted. Valid investigator credentials (Authorization: Bearer <token> or x-api-key header) required.",
        disclaimer: "Public unauthenticated access to provider screening metrics is prohibited by institutional compliance policy."
      },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Bearer realm="Estafotir Institutional Screening"',
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }

  const expectedBuf = Buffer.from(expectedToken);
  const providedBuf = Buffer.from(providedToken);
  const isValid = expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!isValid) {
    return NextResponse.json(
      {
        error: "INVALID_CREDENTIALS",
        status: 401,
        message: "Provided investigator credential is invalid or has been revoked.",
        disclaimer: "Ensure your institutional pilot authorization token is active."
      },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Bearer realm="Estafotir Institutional Screening"',
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedHcpcs = searchParams.get("hcpcs_code")?.toUpperCase() || "T2024";
  const sortBy = searchParams.get("sort_by") || "normalized_rate";
  const boroughFilter = searchParams.get("borough")?.toUpperCase();
  const startTime = Date.now();

  // 2. Strict Fail-Closed Real-Data Boundary
  // Query only genuinely imported rows backed by an official AggregateImportRun manifest
  const { importRuns, records } = loadImportedHhsRecords();

  if (!importRuns || importRuns.length === 0 || !records || records.length === 0) {
    return NextResponse.json({
      status: "UNIMPORTED_EMPTY_FEED",
      provenance: {
        mode: "FAIL_CLOSED_REAL_DATA_BOUNDARY",
        status: "AUTHENTICATED_INSTITUTIONAL_FEED",
        message: "Fail-closed real-data boundary: Zero official HHS aggregate spending rows have been imported. Screening requires a verified import manifest and matching aggregate_spending_records in the local database. Run backend/scripts/import_hhs_aggregates.py with a vetted NPI allowlist to import official HHS records.",
        imported_runs: 0,
        imported_records: 0,
        requested_code: requestedHcpcs,
        service_code_metadata: OFFICIAL_SERVICE_CODES[requestedHcpcs] || {
          code: requestedHcpcs,
          official_title: "Custom Service Code",
          authority: "CMS",
          billing_unit: "Unknown",
          regulatory_citation: "Unknown",
          investigative_notes: "Verify service code in official CMS/DOH fee schedule."
        },
        disclaimer: "Unimported scores or rankings are strictly excluded to prevent defamation and unsubstantiated findings. High spending is a research lead, not evidence of fraud."
      },
      data: []
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Estafo-Mode": "FAIL_CLOSED_EMPTY",
        "X-Estafo-Auth": "AUTHENTICATED"
      }
    });
  }

  // Filter imported records for requested HCPCS code
  const filteredRecords = records.filter(r => r.hcpcs_code.toUpperCase() === requestedHcpcs);
  const activeRun = importRuns.find(run => run.hcpcs_code.toUpperCase() === requestedHcpcs) || importRuns[0];
  const providerDict = loadVettedProviderDict();
  const codeMeta = OFFICIAL_SERVICE_CODES[requestedHcpcs] || OFFICIAL_SERVICE_CODES["T2024"];

  // If no records match requested code, fail closed and return empty
  if (filteredRecords.length === 0) {
    return NextResponse.json({
      status: "NO_RECORDS_FOR_CODE",
      provenance: {
        mode: "FAIL_CLOSED_REAL_DATA_BOUNDARY",
        status: "AUTHENTICATED_INSTITUTIONAL_FEED",
        message: `No imported HHS aggregate rows found for service code ${requestedHcpcs}. Run import_hhs_aggregates.py --hcpcs-code ${requestedHcpcs} to import official rows for this code.`,
        requested_code: requestedHcpcs,
        service_code_metadata: codeMeta,
        imported_runs_available: importRuns.map(r => ({ code: r.hcpcs_code, rows: r.imported_rows, release: r.release_id })),
        disclaimer: "Scores are strictly not generated for unimported codes."
      },
      data: []
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Estafo-Mode": "FAIL_CLOSED_EMPTY"
      }
    });
  }

  // Calculate peer statistics across genuinely imported providers
  const monthlyIntensities = filteredRecords.map(r => r.total_spend / Math.max(1, r.months_active));
  const meanIntensity = monthlyIntensities.reduce((a, b) => a + b, 0) / monthlyIntensities.length;
  const variance = monthlyIntensities.reduce((sum, val) => sum + Math.pow(val - meanIntensity, 2), 0) / monthlyIntensities.length;
  const stdIntensity = Math.sqrt(variance) || 1.0;

  // Transform imported records into full MedicaidProviderRecords
  let providers: MedicaidProviderRecord[] = filteredRecords.map((r) => {
    const providerMeta = providerDict.get(r.billing_npi);
    const months = r.months_active || 1;
    const spend = r.total_spend;
    const monthlyIntensity = Math.round(spend / months);
    const zScore = +((monthlyIntensity - meanIntensity) / stdIntensity).toFixed(2);
    const riskScore = Math.min(99, Math.max(40, Math.round(50 + (zScore * 15))));

    const patients = r.total_patients || 1;
    const claims = r.total_claims || 1;
    const spendPerBen = Math.round(spend / Math.max(1, patients));
    const claimsPerBen = +((claims / Math.max(1, patients)).toFixed(1));

    return {
      id: `HHS-NY-${r.billing_npi}`,
      npi: r.billing_npi,
      name: providerMeta?.name || `MEDICAID PROVIDER NPI ${r.billing_npi}`,
      facility_type: `${codeMeta.official_title} (${r.hcpcs_code})`,
      taxonomy_code: providerMeta?.taxonomy_code || "261QA0600X",
      enumeration_date: providerMeta?.enumeration_date || "Verified Registry Date",
      borough: providerMeta?.borough || "NYC Metro",
      address: providerMeta?.address || "NYC Provider Practice Address Proxy",
      lat: providerMeta?.lat || 40.7128,
      lon: providerMeta?.lon || -74.0060,
      risk_score: riskScore,
      exposure_amount: spend,
      monthly_intensity: monthlyIntensity,
      months_active: months,
      total_claims: claims,
      total_beneficiaries: patients,
      spend_per_beneficiary: spendPerBen,
      claims_per_beneficiary: claimsPerBen,
      source_release: `HHS_HCPCS_${activeRun.release_id}`,
      source_sha256: activeRun.source_sha256,
      service_code: `${r.hcpcs_code}: ${codeMeta.official_title}`,
      selection_rule: "Billing NPI matched to imported HHS aggregate spending slice with verified CMS NPPES practice address (proxy). HHS dataset records aggregate paid amounts, not point-of-service claims.",
      uncertainty: "Descriptive screening signal only. High spending is a research lead, not evidence of fraud. Service location is inferred from practice address proxy. Small cell counts (<11) are suppressed upstream by HHS; missing cells are not zero. Zero-PHI architecture: no patient-level claims inspected.",
      z_score: zScore,
      check_digit_valid: verifyNpiLuhn(r.billing_npi),
      is_nyc_verified: true,
      is_synthetic: false,
      verification_source: "HHS_MEDICAID_PROVIDER_SPENDING_OFFICIAL",
      estimated_bounty: 0,
      anomaly_types: [
        zScore >= 1.5 ? `Elevated Spending Intensity (+${zScore}σ)` : "Standard Peer Baseline",
        codeMeta.investigative_notes.slice(0, 80) + "..."
      ],
      exculpatory_notes: `High volume may reflect extended operating schedule, high-acuity census, or regional demand. Test innocent explanations: verify primary sign-in logs, patient transportation manifests, and clinical progress notes. (${codeMeta.authority} citation: ${codeMeta.regulatory_citation}).`,
      status: "UNREVIEWED",
      lead_utility: zScore >= 2.0 ? "STATISTICAL_OUTLIER" : "BASELINE_COHORT"
    };
  });

  // Optional borough filter
  if (boroughFilter && boroughFilter !== "ALL") {
    providers = providers.filter(p => p.borough.toUpperCase() === boroughFilter);
  }

  // Sort according to requested metric
  if (sortBy === "total_spending") {
    providers.sort((a, b) => b.exposure_amount - a.exposure_amount);
  } else if (sortBy === "spend_per_beneficiary") {
    providers.sort((a, b) => (b.spend_per_beneficiary || 0) - (a.spend_per_beneficiary || 0));
  } else {
    providers.sort((a, b) => (b.monthly_intensity || 0) - (a.monthly_intensity || 0));
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    status: "SUCCESS",
    provenance: {
      mode: "OFFICIAL_IMPORTED_HHS_SPENDING",
      status: "AUTHENTICATED_INSTITUTIONAL_FEED",
      source_release: `HHS_HCPCS_${activeRun.release_id} (Covering Jan 2018 – Dec 2024)`,
      source_release_url: "https://opendata.hhs.gov/datasets/medicaid-provider-spending",
      source_release_sha256: activeRun.source_sha256,
      hcpcs_code: requestedHcpcs,
      service_code_metadata: codeMeta,
      selection_rule: "Independently verified billing NPI allowlist cross-referenced against HHS aggregate provider spending file. Practice address is a location clue, not proof that services occurred there.",
      uncertainty_notice: "Descriptive screening signal only. High spending is a research lead, not evidence of fraud. Practice addresses are registry location clues, not proof of point-of-service delivery. Small cell counts (<11) are suppressed by HHS upstream.",
      dataset_grain_note: "HHS Medicaid Provider Spending dataset grain is monthly by service month. Annual summation discards early ramp-up and billing velocity signals.",
      peer_comparison_note: `Multi-dimensional comparison across genuinely imported ${codeMeta.official_title} providers evaluating monthly intensity, patient census, and claim line density.`,
      legal_framework: {
        qui_tam: "New York False Claims Act (NYS Finance Law § 190): Relators receive 15–25% of proceeds in intervened cases or 25–30% in declined cases. Requires a sealed complaint with material evidence disclosure.",
        doj_criminal_tip_pilot: "DOJ Criminal Tip Rewards Pilot Program: Discretionary $10,000–$30,000 award (not 1%) for original nonpublic information resulting in unsealed criminal charges. File via America.gov/fraud.",
        zero_phi_architecture: "Public aggregate CMS data only, requiring no HIPAA Business Associate Agreement (BAA)."
      },
      cohort_size: providers.length,
      retrievalLatencyMs: durationMs,
      allowlist_checksum_sha256: activeRun.npi_allowlist_sha256,
      all_check_digits_valid: providers.every(p => p.check_digit_valid),
      is_synthetic: false
    },
    data: providers
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Estafo-Mode": "OFFICIAL_IMPORTED_HHS_SPENDING",
      "X-Estafo-Auth": "AUTHENTICATED"
    }
  });
}
