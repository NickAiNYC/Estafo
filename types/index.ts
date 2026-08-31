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
}
