import { NextResponse } from "next/server";

// SODA 2.0 Endpoint for NYC DOB Complaints Received
const NYC_DOB_COMPLAINTS_ENDPOINT = "https://data.cityofnewyork.us/resource/eabe-havv.json";

export interface NormalizedDOBComplaint {
  id: string;
  source: "NYC_DOB_SODA";
  sourceUrl: string;
  complaintNumber: string;
  dateEntered: string;
  houseNumber: string;
  houseStreet: string;
  borough: string;
  zipCode: string;
  bin: string;
  complaintCategory: string;
  dispositionCode: string;
  requiresReview: boolean;
  priorityLevel: "EMERGENCY" | "PRIORITY" | "STANDARD";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  // Socrata SODA query for recent complaints (Note: eabe-havv has no 'borough' column; borough is derived from BIN prefix)
  const soqlQuery = `$select=complaint_number,status,date_entered,house_number,house_street,zip_code,bin,complaint_category,disposition_code&$order=date_entered DESC&$limit=${limit}`;
  const fullUrl = `${NYC_DOB_COMPLAINTS_ENDPOINT}?${soqlQuery}`;

  const fetchStartTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "ESTAFO-Metropolitan-Engine/1.0",
      },
      next: { revalidate: 600 } // Cache for 10 minutes
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Socrata DOB Complaints API returned HTTP ${res.status}: ${res.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await res.json() as any[];

    const boroMap: Record<string, string> = {
      "1": "MANHATTAN",
      "2": "BRONX",
      "3": "BROOKLYN",
      "4": "QUEENS",
      "5": "STATEN ISLAND"
    };

    const normalized: NormalizedDOBComplaint[] = rawData.map((row) => {
      const cat = (row.complaint_category || "").toUpperCase();
      const isEmergency = cat.includes("COLLAPSE") || cat.includes("STRUCTURAL") || cat.includes("FATAL") || cat === "05" || cat === "45";
      const isPriority = cat.includes("ILLEGAL CONVERSION") || cat.includes("UNLICENSED") || cat.includes("STOP WORK") || cat === "31";
      const boroPrefix = (row.bin || "").charAt(0);
      const boro = boroMap[boroPrefix] || "NYC";

      return {
        id: `DOB-${row.complaint_number}`,
        source: "NYC_DOB_SODA",
        sourceUrl: `https://data.cityofnewyork.us/resource/eabe-havv.json?$where=complaint_number='${row.complaint_number}'`,
        complaintNumber: row.complaint_number || "N/A",
        dateEntered: row.date_entered || new Date().toISOString(),
        houseNumber: row.house_number || "",
        houseStreet: row.house_street || "",
        borough: boro,
        zipCode: row.zip_code || "",
        bin: row.bin || "",
        complaintCategory: row.complaint_category || "Unclassified",
        dispositionCode: row.disposition_code || "PENDING",
        requiresReview: isEmergency || isPriority,
        priorityLevel: isEmergency ? "EMERGENCY" : isPriority ? "PRIORITY" : "STANDARD",
      };
    });

    const latencyMs = Date.now() - fetchStartTime;

    return NextResponse.json({
      status: "SUCCESS",
      provenance: {
        source: "NYC Open Data (Socrata SODA 2.0)",
        datasetId: "eabe-havv",
        datasetName: "DOB Complaints Received",
        retrievalTimestamp: new Date().toISOString(),
        latencyMs,
        recordCount: normalized.length,
        isStale: false,
        attribution: "NYC Department of Buildings",
      },
      data: normalized,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
        "X-Estafo-Source": "NYC-DOB-LIVE",
      }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown network error";
    console.error("[ESTAFO Ingestion DOB Complaints Error]:", errorMessage);

    return NextResponse.json({
      status: "DEGRADED",
      provenance: {
        source: "NYC Open Data (Socrata SODA 2.0)",
        datasetId: "eabe-havv",
        retrievalTimestamp: new Date().toISOString(),
        error: errorMessage,
        isStale: true,
      },
      data: [],
    }, { status: 502 });
  }
}
