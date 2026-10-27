import { NextResponse } from "next/server";

// SODA 2.0 Endpoint for NYC DOB Violations
const NYC_DOB_VIOLATIONS_ENDPOINT = "https://data.cityofnewyork.us/resource/3h2n-5cm9.json";

export interface NormalizedDOBViolation {
  id: string;
  source: "NYC_DOB_SODA";
  sourceUrl: string;
  violationNumber: string;
  issueDate: string;
  houseNumber: string;
  street: string;
  borough: string;
  violationType: string;
  violationCategory: string;
  description: string;
  dispositionComments: string;
  status: "ACTIVE" | "RESOLVED" | "DISMISSED";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  // Socrata SODA query for violations
  const soqlQuery = `$select=isn_dob_bis_viol,boro,block,lot,issue_date,violation_number,house_number,street,violation_category,violation_type,description,disposition_comments&$order=issue_date DESC&$limit=${limit}`;
  const fullUrl = `${NYC_DOB_VIOLATIONS_ENDPOINT}?${soqlQuery}`;

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
      next: { revalidate: 600 }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Socrata DOB Violations API returned HTTP ${res.status}: ${res.statusText}`);
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

    const normalized: NormalizedDOBViolation[] = rawData.map((row) => ({
      id: `DOB-VIOL-${row.isn_dob_bis_viol || row.violation_number}`,
      source: "NYC_DOB_SODA",
      sourceUrl: `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=isn_dob_bis_viol='${row.isn_dob_bis_viol}'`,
      violationNumber: row.violation_number || "N/A",
      issueDate: row.issue_date || "",
      houseNumber: row.house_number || "",
      street: row.street || "",
      borough: boroMap[row.boro] || "NYC",
      violationType: (row.violation_type || "").trim(),
      violationCategory: (row.violation_category || "").trim(),
      description: row.description || "Building Code Violation",
      dispositionComments: row.disposition_comments || "",
      status: (row.violation_category || "").includes("ACTIVE") ? "ACTIVE" : "RESOLVED",
    }));

    const latencyMs = Date.now() - fetchStartTime;

    return NextResponse.json({
      status: "SUCCESS",
      provenance: {
        source: "NYC Open Data (Socrata SODA 2.0)",
        datasetId: "3h2n-5cm9",
        datasetName: "DOB Violations",
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
        "X-Estafo-Source": "NYC-DOB-VIOLATIONS-LIVE",
      }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown network error";
    console.error("[ESTAFO Ingestion DOB Violations Error]:", errorMessage);

    return NextResponse.json({
      status: "DEGRADED",
      provenance: {
        source: "NYC Open Data (Socrata SODA 2.0)",
        datasetId: "3h2n-5cm9",
        retrievalTimestamp: new Date().toISOString(),
        error: errorMessage,
        isStale: true,
      },
      data: [],
    }, { status: 502 });
  }
}
