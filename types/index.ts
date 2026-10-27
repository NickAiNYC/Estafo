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
  estimated_bounty: number;
  anomaly_types: string[];
  status: "INVESTIGATING" | "EVIDENCE_GATHERED" | "FILED_SEALED" | "DOJ_REVIEW" | "RECOVERY_PENDING" | "PAID";
  ring_id?: string;
  cross_vector_link?: string;
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
