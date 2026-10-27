import { NextResponse } from "next/server";

// SODA 2.0 Endpoint for NYC 311 Service Requests
const NYC_311_ENDPOINT = "https://data.cityofnewyork.us/resource/erm2-nwe9.json";

export interface Normalized311Event {
  id: string;
  source: "NYC_311_SODA";
  sourceUrl: string;
  complaintType: string;
  descriptor: string;
  incidentAddress: string;
  borough: string;
  zipCode: string;
  coordinates: [number, number]; // [longitude, latitude]
  createdDate: string;
  status: string;
  actionableCategory: "IDLING" | "DUMPING" | "OTHER";
  estimatedStatutoryFine: number;
  statutoryBountyMax: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  // Socrata SODA query: filter for Idling and Illegal Dumping with valid coordinates
  const soqlQuery = `$select=unique_key,created_date,complaint_type,descriptor,incident_address,incident_zip,borough,status,latitude,longitude&$where=complaint_type in ('Idling', 'Illegal Dumping') and latitude is not null&$order=created_date DESC&$limit=${limit}`;
  const fullUrl = `${NYC_311_ENDPOINT}?${soqlQuery}`;

  const fetchStartTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "ESTAFO-Metropolitan-Engine/1.0",
      },
      next: { revalidate: 300 } // Cache at edge for 5 minutes
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Socrata SODA API returned HTTP ${res.status}: ${res.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await res.json() as any[];

    const normalized: Normalized311Event[] = rawData.map((row) => {
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      const isIdling = (row.complaint_type || "").toLowerCase().includes("idling");

      return {
        id: `311-${row.unique_key}`,
        source: "NYC_311_SODA",
        sourceUrl: `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$where=unique_key='${row.unique_key}'`,
        complaintType: row.complaint_type || "Unknown",
        descriptor: row.descriptor || "Citizen Report",
        incidentAddress: row.incident_address || "Unspecified Location",
        borough: row.borough || "NYC",
        zipCode: row.incident_zip || "",
        coordinates: [lng, lat],
        createdDate: row.created_date,
        status: row.status || "OPEN",
        actionableCategory: isIdling ? "IDLING" : "DUMPING",
        // Statutory ranges according to NYC Admin Code
        estimatedStatutoryFine: isIdling ? 1000 : 4000,
        statutoryBountyMax: isIdling ? 250 : 2000, // 25% for idling (Local Law 58), up to 50% for dumping
      };
    });

    const latencyMs = Date.now() - fetchStartTime;

    return NextResponse.json({
      status: "SUCCESS",
      provenance: {
        source: "NYC Open Data (Socrata SODA 2.0)",
        datasetId: "erm2-nwe9",
        datasetName: "311 Service Requests from 2010 to Present",
        retrievalTimestamp: new Date().toISOString(),
        latencyMs,
        recordCount: normalized.length,
        isStale: false,
        attribution: "Open Data NYC / DEP / DSNY",
      },
      data: normalized,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        "X-Estafo-Source": "NYC-311-LIVE",
      }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown network error";
    console.error("[ESTAFO Ingestion 311 Error]:", errorMessage);

    return NextResponse.json({
      status: "DEGRADED",
      provenance: {
        source: "NYC Open Data (Socrata SODA 2.0)",
        datasetId: "erm2-nwe9",
        retrievalTimestamp: new Date().toISOString(),
        error: errorMessage,
        isStale: true,
      },
      data: [],
    }, { status: 502 });
  }
}
