import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type AttorneyDisposition = 
  | "ACCEPTED_FOR_INVESTIGATION"
  | "REJECTED_ALREADY_KNOWN"
  | "REJECTED_INSUFFICIENT_EVIDENCE"
  | "REJECTED_EXCULPATORY_EXPLANATION"
  | "FORMAL_CASE_OPENED"
  | "SETTLED_OR_RECOVERED"
  | "PENDING_PILOT_REVIEW";

export interface AttorneyFeedbackRecord {
  id: string;
  leadId: string;
  providerNPI: string;
  targetName: string;
  reviewerOrganization: string;
  disposition: AttorneyDisposition;
  leadUtility: string;
  reviewDate: string;
  reviewerNotes: string;
  observedReviewSeconds: number;
  observedReviewMinutes: number;
  documentHashes: Record<string, string>;
  decisionSignatureHash: string;
  primarySignal: "PEER_DEVIATION" | "TEMPORAL_SPIKE" | "IMPOSSIBLE_METRICS" | "NETWORK_CLUSTER";
  corroboratingSignalsCount: number;
}

interface DatabaseSyncInstance {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
  };
  close(): void;
}

function getDb(): DatabaseSyncInstance {
  let dbPath = path.join(process.cwd(), "db", "estafo_feedback.db");
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  if (isServerless) {
    dbPath = path.join("/tmp", "estafo_feedback.db");
  } else {
    const dbDir = path.join(process.cwd(), "db");
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch {
      dbPath = path.join("/tmp", "estafo_feedback.db");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqlite = require("node:sqlite");
  const db: DatabaseSyncInstance = new sqlite.DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS attorney_feedback (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      provider_npi TEXT NOT NULL,
      target_name TEXT NOT NULL,
      reviewer_organization TEXT NOT NULL,
      disposition TEXT NOT NULL,
      lead_utility TEXT NOT NULL,
      review_date TEXT NOT NULL,
      reviewer_notes TEXT NOT NULL,
      observed_review_seconds INTEGER NOT NULL,
      observed_review_minutes REAL NOT NULL,
      document_hashes_json TEXT DEFAULT '{}',
      decision_signature_hash TEXT NOT NULL,
      primary_signal TEXT NOT NULL,
      corroborating_signals_count INTEGER NOT NULL
    );
  `);

  return db;
}

interface RawFeedbackRow {
  id: string;
  lead_id: string;
  provider_npi: string;
  target_name: string;
  reviewer_organization: string;
  disposition: string;
  lead_utility: string;
  review_date: string;
  reviewer_notes: string;
  observed_review_seconds: number;
  observed_review_minutes: number;
  document_hashes_json: string;
  decision_signature_hash: string;
  primary_signal: "PEER_DEVIATION" | "TEMPORAL_SPIKE" | "IMPOSSIBLE_METRICS" | "NETWORK_CLUSTER";
  corroborating_signals_count: number;
}

export async function GET() {
  try {
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM attorney_feedback
      ORDER BY id DESC
    `).all() as unknown as RawFeedbackRow[];

    const records: AttorneyFeedbackRecord[] = rows.map((r) => ({
      id: r.id,
      leadId: r.lead_id,
      providerNPI: r.provider_npi,
      targetName: r.target_name,
      reviewerOrganization: r.reviewer_organization,
      disposition: r.disposition as AttorneyDisposition,
      leadUtility: r.lead_utility,
      reviewDate: r.review_date,
      reviewerNotes: r.reviewer_notes,
      observedReviewSeconds: r.observed_review_seconds,
      observedReviewMinutes: r.observed_review_minutes,
      documentHashes: JSON.parse(r.document_hashes_json || "{}"),
      decisionSignatureHash: r.decision_signature_hash,
      primarySignal: r.primary_signal,
      corroboratingSignalsCount: r.corroborating_signals_count
    }));

    const total = records.length;
    const avgObservedMinutes = total > 0 ? +(records.reduce((acc, f) => acc + f.observedReviewMinutes, 0) / total).toFixed(1) : 0;

    return NextResponse.json({
      status: "SUCCESS",
      review_summary: {
        totalReviewsLogged: total,
        avgObservedReviewMinutes: avgObservedMinutes,
        storageMode: isServerless ? "EPHEMERAL_SERVERLESS_TMP" : "LOCAL_SQLITE",
        disclaimer: "Reviews reflect active session screen time in this prototype interface. Not measured manual audit savings. Serverless /tmp storage is ephemeral."
      },
      data: records
    });
  } catch (error) {
    console.error("Feedback GET error:", error);
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : "Failed to query feedback database"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      leadId,
      providerNPI,
      targetName,
      reviewerOrganization = "Research Pilot Reviewer",
      disposition,
      leadUtility = "INCONCLUSIVE_RECORDS_PENDING",
      reviewerNotes = "",
      observedReviewSeconds = 0,
      documentHashes = {},
      primarySignal = "PEER_DEVIATION",
      corroboratingSignalsCount = 1
    } = body;

    if (!leadId || !providerNPI || !disposition) {
      return NextResponse.json({
        status: "ERROR",
        message: "Missing required review fields (leadId, providerNPI, disposition)."
      }, { status: 400 });
    }

    const reviewDate = new Date().toISOString();
    const observedMinutes = +(observedReviewSeconds / 60).toFixed(1);

    // Cryptographic SHA-256 hash representing the review content digest
    const hashPayload = `${leadId}:${providerNPI}:${disposition}:${observedReviewSeconds}:${JSON.stringify(documentHashes)}:${reviewDate}`;
    const decisionSignatureHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

    const id = `REV-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO attorney_feedback (
        id, lead_id, provider_npi, target_name, reviewer_organization, disposition,
        lead_utility, review_date, reviewer_notes, observed_review_seconds,
        observed_review_minutes, document_hashes_json,
        decision_signature_hash, primary_signal, corroborating_signals_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      leadId,
      providerNPI,
      targetName || "Demo Provider",
      reviewerOrganization,
      disposition,
      leadUtility,
      reviewDate,
      reviewerNotes,
      observedReviewSeconds,
      observedMinutes,
      JSON.stringify(documentHashes),
      decisionSignatureHash,
      primarySignal,
      corroboratingSignalsCount
    );

    const record: AttorneyFeedbackRecord = {
      id,
      leadId,
      providerNPI,
      targetName: targetName || "Demo Provider",
      reviewerOrganization,
      disposition,
      leadUtility,
      reviewDate,
      reviewerNotes,
      observedReviewSeconds,
      observedReviewMinutes: observedMinutes,
      documentHashes,
      decisionSignatureHash,
      primarySignal,
      corroboratingSignalsCount
    };

    return NextResponse.json({
      status: "SUCCESS",
      message: "Review disposition recorded to audit ledger.",
      data: record
    });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : "Failed to record review disposition"
    }, { status: 500 });
  }
}
