import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { MedicaidProviderRecord } from "@/types";

// Illustrative Prototype Cohort for Screening Workflow Evaluation
// NOTE: These are synthetic demonstration rows created for workflow and interface evaluation.
// They are NOT live HHS claims rows and NOT verified CMS NPPES provider findings.
interface SyntheticCohortItem {
  id: string;
  npi: string;
  name: string;
  facility_type: string;
  borough: string;
  address: string;
  lat: number;
  lon: number;
  total_spend: number;
  months_active: number;
  total_claims: number;
  total_beneficiaries: number;
  anomaly_types: string[];
}

const DEMO_SYNTHETIC_COHORT: SyntheticCohortItem[] = [
  {
    id: "DEMO-SADC-001",
    npi: "DEMO-NPI-001",
    name: "Sample Adult Day Care Facility Alpha [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Queens",
    address: "Flushing Corridor, Queens, NY",
    lat: 40.7602,
    lon: -73.8315,
    total_spend: 12960000,
    months_active: 12,
    total_claims: 86400,
    total_beneficiaries: 1800,
    anomaly_types: ["Spending Intensity Outlier (+2.4σ)", "High Volume per Active Month"]
  },
  {
    id: "DEMO-SADC-002",
    npi: "DEMO-NPI-002",
    name: "Sample Adult Day Care Facility Beta [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Brooklyn",
    address: "Sunset Park Corridor, Brooklyn, NY",
    lat: 40.6391,
    lon: -74.0042,
    total_spend: 8640000,
    months_active: 12,
    total_claims: 57600,
    total_beneficiaries: 1200,
    anomaly_types: ["Spending Rate Outlier (+1.3σ)", "Elevated Claims per Beneficiary"]
  },
  {
    id: "DEMO-SADC-003",
    npi: "DEMO-NPI-003",
    name: "Sample Adult Day Care Facility Gamma [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Brooklyn",
    address: "Brighton Beach Corridor, Brooklyn, NY",
    lat: 40.5772,
    lon: -73.9615,
    total_spend: 4750000,
    months_active: 12,
    total_claims: 31600,
    total_beneficiaries: 950,
    anomaly_types: ["Census Capacity Threshold Outlier", "Upper-Quartile Spending"]
  },
  {
    id: "DEMO-SADC-004",
    npi: "DEMO-NPI-004",
    name: "Sample Adult Day Care Facility Delta [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Queens",
    address: "Rego Park Corridor, Queens, NY",
    lat: 40.7282,
    lon: -73.8612,
    total_spend: 1980000,
    months_active: 12,
    total_claims: 19800,
    total_beneficiaries: 650,
    anomaly_types: ["Moderate Spending Variation", "Expected Regional Cluster"]
  },
  {
    id: "DEMO-SADC-005",
    npi: "DEMO-NPI-005",
    name: "Sample Adult Day Care Facility Epsilon [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Manhattan",
    address: "Lower Manhattan Corridor, New York, NY",
    lat: 40.7185,
    lon: -73.9972,
    total_spend: 1800000,
    months_active: 12,
    total_claims: 18000,
    total_beneficiaries: 600,
    anomaly_types: ["Expected Peer Baseline Rate"]
  },
  {
    id: "DEMO-SADC-006",
    npi: "DEMO-NPI-006",
    name: "Sample Adult Day Care Facility Zeta [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Manhattan",
    address: "Harlem Corridor, New York, NY",
    lat: 40.8089,
    lon: -73.9485,
    total_spend: 1680000,
    months_active: 12,
    total_claims: 16800,
    total_beneficiaries: 550,
    anomaly_types: ["Standard Peer Baseline Rate"]
  },
  {
    id: "DEMO-SADC-007",
    npi: "DEMO-NPI-007",
    name: "Sample Adult Day Care Facility Eta [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Bronx",
    address: "South Bronx Corridor, Bronx, NY",
    lat: 40.8115,
    lon: -73.8765,
    total_spend: 1560000,
    months_active: 12,
    total_claims: 15600,
    total_beneficiaries: 480,
    anomaly_types: ["Standard Peer Baseline Rate"]
  },
  {
    id: "DEMO-SADC-008",
    npi: "DEMO-NPI-008",
    name: "Sample Adult Day Care Facility Theta [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Brooklyn",
    address: "Bay Ridge Corridor, Brooklyn, NY",
    lat: 40.6215,
    lon: -74.0261,
    total_spend: 1440000,
    months_active: 12,
    total_claims: 14400,
    total_beneficiaries: 460,
    anomaly_types: ["Standard Peer Baseline Rate"]
  },
  {
    id: "DEMO-SADC-009",
    npi: "DEMO-NPI-009",
    name: "Sample Adult Day Care Facility Iota [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Queens",
    address: "Flushing Main Corridor, Flushing, NY",
    lat: 40.7554,
    lon: -73.8276,
    total_spend: 1425000,
    months_active: 12,
    total_claims: 14250,
    total_beneficiaries: 520,
    anomaly_types: ["Standard Peer Baseline Rate"]
  },
  {
    id: "DEMO-SADC-010",
    npi: "DEMO-NPI-010",
    name: "Sample Adult Day Care Facility Kappa [Workflow Demo]",
    facility_type: "SADC Adult Day Care",
    borough: "Staten Island",
    address: "Castleton Corridor, Staten Island, NY",
    lat: 40.6352,
    lon: -74.1281,
    total_spend: 1320000,
    months_active: 12,
    total_claims: 13200,
    total_beneficiaries: 410,
    anomaly_types: ["Standard Peer Baseline Rate"]
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sort_by") || "normalized_rate";

  const startTime = Date.now();

  // Calculate peer statistics for normalized monthly intensity
  const monthlyIntensities = DEMO_SYNTHETIC_COHORT.map(p => p.total_spend / p.months_active);
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

  // Transform into full MedicaidProviderRecords
  const providers: MedicaidProviderRecord[] = DEMO_SYNTHETIC_COHORT.map((item) => {
    const monthlyIntensity = Math.round(item.total_spend / item.months_active);
    const zScore = +((monthlyIntensity - meanIntensity) / stdIntensity).toFixed(2);
    const riskScore = Math.min(99, Math.max(40, Math.round(50 + (zScore * 12.5))));

    const reviewed = reviewedDispositions.get(item.npi);

    let status: MedicaidProviderRecord["status"] = "INVESTIGATING";
    if (reviewed) {
      if (reviewed.disposition === "ACCEPTED_FOR_INVESTIGATION") status = "EVIDENCE_GATHERED";
      else if (reviewed.disposition === "FORMAL_CASE_OPENED") status = "FILED_SEALED";
      else if (reviewed.disposition === "SETTLED_OR_RECOVERED") status = "RECOVERY_PENDING";
    }

    return {
      id: item.id,
      npi: item.npi,
      name: item.name,
      facility_type: item.facility_type,
      borough: item.borough,
      address: item.address,
      lat: item.lat,
      lon: item.lon,
      risk_score: riskScore,
      exposure_amount: item.total_spend,
      monthly_intensity: monthlyIntensity,
      months_active: item.months_active,
      z_score: zScore,
      estimated_bounty: 0, // Unadjudicated research leads do not possess calculated bounties
      anomaly_types: item.anomaly_types,
      status,
      lead_utility: reviewed?.leadUtility || (zScore >= 2.0 ? "STATISTICAL_OUTLIER" : "WITHIN_EXPECTED_VARIANCE"),
      decision_signature_hash: reviewed?.signature,
      reviewed_at: reviewed?.reviewDate
    };
  });

  // Sort according to requested metric
  if (sortBy === "total_spending") {
    providers.sort((a, b) => b.exposure_amount - a.exposure_amount);
  } else {
    // Default: normalized monthly spending rate ($/mo)
    providers.sort((a, b) => (b.monthly_intensity || 0) - (a.monthly_intensity || 0));
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    status: "SUCCESS",
    provenance: {
      mode: "DEMO_SYNTHETIC_WORKFLOW_PREVIEW",
      status: "UNVERIFIED_PROTOTYPE",
      disclaimer: "ILLUSTRATIVE WORKFLOW PREVIEW ONLY. Not sourced from live CMS claims or verified NPPES queries. Synthetic records for interface and workflow validation. No real provider fraud or legal violations asserted.",
      hcpcs_code: "T2024",
      specialty: "Adult Day Health Care",
      location_scope: "New York City (Demonstration Corridors)",
      cohort_size: providers.length,
      retrievalLatencyMs: durationMs,
      normalized_mean_monthly_intensity: Math.round(meanIntensity),
      std_dev: Math.round(stdIntensity),
      methodology: "Normalized spending intensity per active reported month (statistical screening model prototype)"
    },
    data: providers
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Estafo-Mode": "SYNTHETIC_WORKFLOW_PREVIEW"
    }
  });
}
