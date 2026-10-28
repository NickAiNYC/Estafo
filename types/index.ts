export interface DumpingRecord {
  lat: number;
  lon: number;
  date: string;
}

export interface NoiseRecord {
  lat: number;
  lon: number;
  date: string;
}

export interface PermitRecord {
  lat: number;
  lon: number;
  type: string;
  gc: string;
}

export interface ZoneRecord {
  rank: number;
  name: string;
  lat: number;
  lon: number;
  score: number;
  dump: number;
  noise: number;
  permits: number;
  rider: string;
  window: string;
  status: "DARK" | "COVERED" | "COLD";
}

export interface EvidenceRecord {
  lat: number;
  lon: number;
  date: string;
  rider: string;
  pack_id: string;
  type: string;
  vehicle_plate?: string;
  hash?: string;
  status?: string;
}

export interface MedicaidProviderRecord {
  id: string;
  npi: string;
  name: string;
  facility_type: string;
  borough: string;
  address: string;
  lat: number;
  lon: number;
  risk_score: number;
  exposure_amount: number;
  monthly_intensity?: number;
  months_active?: number;
  z_score?: number;
  total_claims?: number;
  total_beneficiaries?: number;
  spend_per_beneficiary?: number;
  claims_per_beneficiary?: number;
  selection_rule?: string;
  is_nyc_verified?: boolean;
  verification_source?: string;
  enumeration_date?: string;
  taxonomy_code?: string;
  check_digit_valid?: boolean;
  exculpatory_notes?: string;
  is_synthetic?: boolean;
  estimated_bounty: number;
  anomaly_types: string[];
  status: "UNREVIEWED" | "INVESTIGATING" | "EVIDENCE_GATHERED" | "FILED_SEALED" | "DOJ_REVIEW" | "RECOVERY_PENDING" | "PAID";
  ring_id?: string;
  cross_vector_link?: string;
  lead_utility?: string;
  document_hashes?: Record<string, string>;
  decision_signature_hash?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  source_records_hash?: string;
  source_release?: string;
  source_sha256?: string;
  service_code?: string;
  uncertainty?: string;
}

export interface FraudRingRecord {
  id: string;
  name: string;
  type: "CROSS_VECTOR_SHELL" | "CDPAP_GHOST_NETWORK" | "MEDICAID_KICKBACK" | "COMMERCIAL_DUMPING_SYNDICATE";
  total_exposure: number;
  estimated_whistleblower_bounty: number;
  nodes_count: number;
  primary_borough: string;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM";
  description: string;
  key_entities: string[];
  patterns: string[];
}

export interface BountyLedgerItem {
  id: string;
  track: "TRACK_1_IDLING" | "TRACK_5_DUMPING" | "TRACK_6_NYFCA_QUI_TAM" | "TRACK_7_FAIR_ACT" | "TRACK_11_DOB";
  target_name: string;
  statutory_basis: string;
  statutory_fine_potential: number;
  bounty_rate: string;
  estimated_payout: number;
  status: "CAPTURED" | "VALIDATED" | "FILED" | "FILED_SEALED" | "PENDING_HEARING" | "DOJ_REVIEW" | "COLLECTED" | "PAID";
  date_filed: string;
  case_reference: string;
  assigned_agent: string;
  location: string;
  payout_date?: string;
  actual_payout?: number;
}

export interface PalantirGraphNode {
  id: string;
  name: string;
  type: "HEALTHCARE_PROVIDER" | "COMMERCIAL_HAULER" | "CORPORATE_SHELL" | "PHYSICAL_HUB" | "BILLING_CODE" | "ENFORCEMENT_RECORD";
  risk: number;
  npi?: string;
  val: number;
  fine?: string;
  state?: string;
  borough?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface PalantirGraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

export interface PalantirGraphData {
  nodes: PalantirGraphNode[];
  edges: PalantirGraphEdge[];
}

export interface ServiceCodeDefinition {
  code: string;
  official_title: string;
  authority: "CMS" | "NY_DOH" | "NYS_OASAS";
  billing_unit: string;
  regulatory_citation: string;
  investigative_notes: string;
}

export interface InvestigativeTimelineEvent {
  id: string;
  case_id: string;
  event_date: string;
  facility_name: string;
  facility_npi?: string;
  transport_company?: string;
  transport_npi?: string;
  cash_amount_offered?: number;
  cash_purpose_alleged?: string;
  observer_role: "FIRSTHAND_WORKER" | "FIRSTHAND_PARTICIPANT" | "SECONDHAND_HEARSAY" | "DOCUMENTED_RECORD";
  observation_notes: string;
  claimed_service_code?: string;
  evidence_level: "DIRECT_WITNESS" | "CORROBORATING_DOCUMENT" | "INFERENCE" | "UNVERIFIED";
  innocent_explanation?: string;
  verification_status: "UNVERIFIED" | "CORROBORATED_BY_EOB" | "OASAS_CONFIRMED" | "DISPROVED";
  created_at: string;
}

export interface FourQuadrantDossier {
  case_title: string;
  target_entities: {
    facility: string;
    facility_npi?: string;
    transport?: string;
    transport_npi?: string;
  };
  facts: string[];
  inferences: string[];
  allegations: string[];
  unknowns: string[];
  innocent_explanations: string[];
  next_lawful_verification_steps: string[];
  legal_framework: {
    nys_fca: {
      citation: "NY State Finance Law § 190";
      relator_share_intervened: "15% – 25%";
      relator_share_declined: "25% – 30%";
      sealed_filing_required: true;
    };
    doj_criminal_tip_pilot: {
      program: "DOJ Criminal Tip Rewards Pilot Program";
      reward_range: "$10,000 – $30,000 (Discretionary)";
      trigger: "Unsealed federal criminal charges resulting from original tip";
      intake_url: "https://www.america.gov/fraud";
    };
  };
  confidentiality_notice: string;
}

