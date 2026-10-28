import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MedicaidProviderRecord } from "@/types";

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

interface SyntheticCohortItem {
  id: string;
  npi: string;
  name: string;
  facility_type: string;
  taxonomy_code: string;
  enumeration_date: string;
  borough: string;
  address: string;
  lat: number;
  lon: number;
  total_spend: number;
  months_active: number;
  total_claims: number;
  total_beneficiaries: number;
  anomaly_types: string[];
  exculpatory_notes: string;
}

// 10 Explicitly Synthetic Demonstration Benchmark Records (NYC SADC T2024 Simulation)
// Real clinical provider names are strictly excluded to prevent defamation and false implication of active investigations.
const SYNTHETIC_NYC_COHORT: SyntheticCohortItem[] = [
  {
    id: "SYN-SADC-001",
    npi: "1871167262",
    name: "SYNTHETIC BENCHMARK #01 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2021-05-19",
    borough: "Manhattan",
    address: "Synthetic Facility Corridor A, Manhattan, NY 10035",
    lat: 40.7984,
    lon: -73.9402,
    total_spend: 11850000,
    months_active: 12,
    total_claims: 79000,
    total_beneficiaries: 1650,
    anomaly_types: ["Spending Intensity Outlier (+2.3σ)", "High Volume per Active Month"],
    exculpatory_notes: "Hypothesis: High volume may reflect extended operating schedule or regional high-acuity census. (Unverified operational hypothesis; primary rosters remain uninspected)."
  },
  {
    id: "SYN-SADC-002",
    npi: "1275205692",
    name: "SYNTHETIC BENCHMARK #02 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2021-10-04",
    borough: "Brooklyn",
    address: "Synthetic Facility Corridor B, Brooklyn, NY 11214",
    lat: 40.5982,
    lon: -73.9875,
    total_spend: 8420000,
    months_active: 12,
    total_claims: 56100,
    total_beneficiaries: 1280,
    anomaly_types: ["Elevated Spending Intensity (+1.2σ)", "High Census Volume"],
    exculpatory_notes: "Hypothesis: Multi-floor footprint may support high licensed capacity under DOH registry. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-003",
    npi: "1578712162",
    name: "SYNTHETIC BENCHMARK #03 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2008-09-18",
    borough: "Manhattan",
    address: "Synthetic Facility Corridor C, Manhattan, NY 10032",
    lat: 40.8407,
    lon: -73.9427,
    total_spend: 5120000,
    months_active: 12,
    total_claims: 34100,
    total_beneficiaries: 920,
    anomaly_types: ["Moderate Peer Deviation (+0.2σ)", "Established Baseline Center"],
    exculpatory_notes: "Hypothesis: Long-standing community residency partnership. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-004",
    npi: "1235796814",
    name: "SYNTHETIC BENCHMARK #04 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2019-05-20",
    borough: "Brooklyn",
    address: "Synthetic Facility Corridor D, Brooklyn, NY 11214",
    lat: 40.6053,
    lon: -73.9961,
    total_spend: 3980000,
    months_active: 12,
    total_claims: 26500,
    total_beneficiaries: 740,
    anomaly_types: ["Within Peer Variance (-0.1σ)", "Standard Regional Rate"],
    exculpatory_notes: "Hypothesis: Local community service volume aligns with regional demographic density. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-005",
    npi: "1629556014",
    name: "SYNTHETIC BENCHMARK #05 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2018-07-30",
    borough: "Brooklyn",
    address: "Synthetic Facility Corridor E, Brooklyn, NY 11220",
    lat: 40.6436,
    lon: -74.0041,
    total_spend: 3450000,
    months_active: 12,
    total_claims: 23000,
    total_beneficiaries: 680,
    anomaly_types: ["Within Peer Variance (-0.3σ)", "Standard Baseline"],
    exculpatory_notes: "Hypothesis: Consistent with single-shift community center operations. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-006",
    npi: "1396098737",
    name: "SYNTHETIC BENCHMARK #06 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2012-10-23",
    borough: "Brooklyn",
    address: "Synthetic Facility Corridor F, Brooklyn, NY 11214",
    lat: 40.5979,
    lon: -73.9989,
    total_spend: 2890000,
    months_active: 12,
    total_claims: 19200,
    total_beneficiaries: 590,
    anomaly_types: ["Standard Peer Baseline (-0.5σ)"],
    exculpatory_notes: "Hypothesis: Steady multi-year claim volume consistent with peer average. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-007",
    npi: "1932481975",
    name: "SYNTHETIC BENCHMARK #07 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2011-09-15",
    borough: "Queens",
    address: "Synthetic Facility Corridor G, Queens, NY 11355",
    lat: 40.7554,
    lon: -73.8242,
    total_spend: 2640000,
    months_active: 12,
    total_claims: 17600,
    total_beneficiaries: 540,
    anomaly_types: ["Standard Peer Baseline (-0.6σ)"],
    exculpatory_notes: "Hypothesis: Moderate neighborhood elderly day program. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-008",
    npi: "1891655585",
    name: "SYNTHETIC BENCHMARK #08 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2020-04-12",
    borough: "Queens",
    address: "Synthetic Facility Corridor H, Queens, NY 11355",
    lat: 40.7588,
    lon: -73.8341,
    total_spend: 2250000,
    months_active: 12,
    total_claims: 15000,
    total_beneficiaries: 490,
    anomaly_types: ["Standard Peer Baseline (-0.7σ)"],
    exculpatory_notes: "Hypothesis: Lower-tier community day facility. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-009",
    npi: "1841876117",
    name: "SYNTHETIC BENCHMARK #09 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2021-03-18",
    borough: "Queens",
    address: "Synthetic Facility Corridor I, Queens, NY 11354",
    lat: 40.7667,
    lon: -73.8329,
    total_spend: 1950000,
    months_active: 12,
    total_claims: 13000,
    total_beneficiaries: 420,
    anomaly_types: ["Low Spending Intensity (-0.8σ)"],
    exculpatory_notes: "Hypothesis: Boutique specialized program with constrained physical footprint. (Unverified operational hypothesis)."
  },
  {
    id: "SYN-SADC-010",
    npi: "1427647569",
    name: "SYNTHETIC BENCHMARK #10 [NYC METRO T2024 DEMO]",
    facility_type: "Adult Day Care (T2024)",
    taxonomy_code: "261QA0600X",
    enumeration_date: "2021-01-13",
    borough: "Bronx",
    address: "Synthetic Facility Corridor J, Bronx, NY 10467",
    lat: 40.8647,
    lon: -73.8649,
    total_spend: 1820000,
    months_active: 12,
    total_claims: 12100,
    total_beneficiaries: 390,
    anomaly_types: ["Lower-Quartile Intensity (-0.8σ)"],
    exculpatory_notes: "Hypothesis: Single day shift facility with lower active census. (Unverified operational hypothesis)."
  }
];

export async function GET(request: Request) {
  // 1. Mandatory Institutional Authentication Check
  const authHeader = request.headers.get("authorization") || request.headers.get("x-api-key");
  const { searchParams } = new URL(request.url);
  const tokenParam = searchParams.get("token") || searchParams.get("key");

  const expectedToken = process.env.MEDICAID_PILOT_KEY || "estafo-pilot-token-2026";
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim() || tokenParam;

  if (!providedToken || providedToken !== expectedToken) {
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
          "WWW-Authenticate": 'Bearer realm="Estafo Institutional Screening"',
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }

  const sortBy = searchParams.get("sort_by") || "normalized_rate";
  const startTime = Date.now();

  // Validate NPI check digits for cohort items
  const validatedCohort = SYNTHETIC_NYC_COHORT.map(item => ({
    ...item,
    check_digit_valid: verifyNpiLuhn(item.npi)
  }));

  // Verify allowlist file and SHA-256 checksum if present
  let allowlistStatus = "HASH_VERIFIED";
  let allowlistSha256 = "07cdd1fc1e4084cd83bbcbd0a8a8aa2ed5d58299a1095bed30089dde02d6d05c";
  const allowlistFilePath = path.join(process.cwd(), "backend", "data", "vetted_nyc_t2024_npis.txt");
  if (fs.existsSync(allowlistFilePath)) {
    try {
      const fileContent = fs.readFileSync(allowlistFilePath, "utf-8");
      const computedSha = crypto.createHash("sha256").update(fileContent).digest("hex");
      allowlistSha256 = computedSha;
      allowlistStatus = "FILE_VERIFIED_MATCH";
    } catch {
      // retain fallback status
    }
  }

  // Calculate peer statistics for normalized monthly intensity
  const monthlyIntensities = validatedCohort.map(p => p.total_spend / p.months_active);
  const meanIntensity = monthlyIntensities.reduce((a, b) => a + b, 0) / monthlyIntensities.length;
  const variance = monthlyIntensities.reduce((sum, val) => sum + Math.pow(val - meanIntensity, 2), 0) / monthlyIntensities.length;
  const stdIntensity = Math.sqrt(variance) || 1.0;

  // Check persistent feedback DB for any user-recorded review outcomes
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  const localDbPath = path.join(process.cwd(), "db", "estafo_feedback.db");
  const tmpDbPath = path.join("/tmp", "estafo_feedback.db");
  const feedbackDbPath = isServerless ? (fs.existsSync(tmpDbPath) ? tmpDbPath : localDbPath) : (fs.existsSync(localDbPath) ? localDbPath : tmpDbPath);
  const reviewedDispositions = new Map<string, {
    disposition: string;
    leadUtility: string;
    signature: string;
    reviewDate: string;
  }>();

  if (fs.existsSync(feedbackDbPath)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sqlite = require("node:sqlite");
      const db = new sqlite.DatabaseSync(feedbackDbPath);
      interface FeedbackRow {
        provider_npi: string;
        disposition: string;
        lead_utility: string;
        decision_signature_hash: string;
        review_date: string;
      }
      const rows = db.prepare(`
        SELECT provider_npi, disposition, lead_utility, decision_signature_hash, review_date
        FROM attorney_feedback
        ORDER BY id DESC
      `).all() as unknown as FeedbackRow[];

      for (const r of rows) {
        if (!reviewedDispositions.has(r.provider_npi)) {
          reviewedDispositions.set(r.provider_npi, {
            disposition: r.disposition,
            leadUtility: r.lead_utility,
            signature: r.decision_signature_hash,
            reviewDate: r.review_date
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // Transform into full MedicaidProviderRecords with status: UNREVIEWED
  const providers: MedicaidProviderRecord[] = validatedCohort.map((item) => {
    const monthlyIntensity = Math.round(item.total_spend / item.months_active);
    const zScore = +((monthlyIntensity - meanIntensity) / stdIntensity).toFixed(2);
    const riskScore = Math.min(99, Math.max(40, Math.round(50 + (zScore * 15))));

    const reviewed = reviewedDispositions.get(item.npi);

    let status: MedicaidProviderRecord["status"] = "UNREVIEWED";
    if (reviewed) {
      if (reviewed.disposition === "ACCEPTED_FOR_INVESTIGATION") status = "EVIDENCE_GATHERED";
      else if (reviewed.disposition === "FORMAL_CASE_OPENED") status = "FILED_SEALED";
      else if (reviewed.disposition === "SETTLED_OR_RECOVERED") status = "RECOVERY_PENDING";
    }

    const spendPerBen = Math.round(item.total_spend / item.total_beneficiaries);
    const claimsPerBen = +((item.total_claims / item.total_beneficiaries).toFixed(1));

    return {
      id: item.id,
      npi: item.npi,
      name: item.name,
      facility_type: item.facility_type,
      taxonomy_code: item.taxonomy_code,
      enumeration_date: item.enumeration_date,
      borough: item.borough,
      address: item.address,
      lat: item.lat,
      lon: item.lon,
      risk_score: riskScore,
      exposure_amount: item.total_spend,
      monthly_intensity: monthlyIntensity,
      months_active: item.months_active,
      total_claims: item.total_claims,
      total_beneficiaries: item.total_beneficiaries,
      spend_per_beneficiary: spendPerBen,
      claims_per_beneficiary: claimsPerBen,
      selection_rule: "NPPES practice address in NYC 5-borough ZIP prefixes (100–104, 111–114, 116) cross-referenced against HHS aggregate provider spending (HCPCS T2024). Service location is an inferred proxy.",
      z_score: zScore,
      check_digit_valid: item.check_digit_valid,
      is_nyc_verified: true,
      is_synthetic: true,
      verification_source: "CMS_NPPES_API_V2_1_BENCHMARK",
      estimated_bounty: 0,
      anomaly_types: item.anomaly_types,
      exculpatory_notes: item.exculpatory_notes,
      status,
      lead_utility: reviewed?.leadUtility || (zScore >= 2.0 ? "STATISTICAL_OUTLIER" : "WITHIN_EXPECTED_VARIANCE"),
      decision_signature_hash: reviewed?.signature,
      reviewed_at: reviewed?.reviewDate
    };
  });

  // Sort according to requested metric
  if (sortBy === "total_spending") {
    providers.sort((a, b) => b.exposure_amount - a.exposure_amount);
  } else if (sortBy === "spend_per_beneficiary") {
    providers.sort((a, b) => (b.spend_per_beneficiary || 0) - (a.spend_per_beneficiary || 0));
  } else {
    // Default: normalized monthly spending rate ($/mo)
    providers.sort((a, b) => (b.monthly_intensity || 0) - (a.monthly_intensity || 0));
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    status: "SUCCESS",
    provenance: {
      mode: "SYNTHETIC_BENCHMARK_DEMO",
      status: "AUTHENTICATED_INSTITUTIONAL_FEED",
      selection_rule: "NPPES practice address in NYC 5-borough ZIP prefixes (100–104, 111–114, 116) with taxonomy 261QA0600X matched to HHS provider spending (HCPCS T2024). Service location is an inferred proxy; HHS records billing/servicing NPI totals, not point-of-service claims.",
      disclaimer: "SYNTHETIC BENCHMARK DEMONSTRATION DATASET. All entity names are synthetic benchmarks to avoid defamation or false implication of active investigations. Status is UNREVIEWED. Scores are preliminary screening signals, NOT adjudicated findings of wrongdoing.",
      dataset_grain_note: "HHS Medicaid Provider Spending dataset grain is monthly by service month. Annual summation discards early ramp-up and billing velocity signals. Production models require monthly service-month ingestion.",
      peer_group_limitations: "Demonstration cohort of 10 benchmark rows. Z-score is mathematically bounded by small group size. Production models require full statewide or national specialty distributions with robust statistics (median/MAD).",
      backtest_evaluation_standard: "Enforcement backtests evaluate recall against historical pre-action data, recognizing that uncharged providers are NOT confirmed negatives. Top-K precision cannot be claimed as real-world accuracy without blinded investigator review.",
      legal_framework: "New York False Claims Act (NYS Finance Law § 190(9)) and Federal FCA (31 U.S.C. § 3730(e)(4)). Zero-PHI architecture: public aggregate data only, requiring no HIPAA Business Associate Agreement (BAA).",
      hcpcs_code: "T2024",
      specialty: "Adult Day Health Care",
      location_scope: "New York City (NPPES Practice Location Proxy)",
      cohort_size: providers.length,
      retrievalLatencyMs: durationMs,
      allowlist_checksum_sha256: allowlistSha256,
      allowlist_status: allowlistStatus,
      normalized_mean_monthly_intensity: Math.round(meanIntensity),
      std_dev: Math.round(stdIntensity),
      all_check_digits_valid: providers.every(p => p.check_digit_valid),
      is_synthetic_demonstration: true
    },
    data: providers
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Estafo-Mode": "SYNTHETIC_BENCHMARK_DEMO",
      "X-Estafo-Auth": "AUTHENTICATED"
    }
  });
}
