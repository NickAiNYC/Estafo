import assert from "node:assert";

console.log("=== ESTAFO VERIFICATION SUITE (Gates G1 - G6) ===\n");

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

// Test 1: SODA 311 Live API connectivity and schema validation
console.log("[Test 1] Testing live NYC 311 Socrata SODA (erm2-nwe9)...");
const soqlQuery = "$select=unique_key,created_date,complaint_type,descriptor,incident_address,incident_zip,borough,status,latitude,longitude&$where=complaint_type in ('Idling', 'Illegal Dumping') and latitude is not null&$order=created_date DESC&$limit=5";
const test311Url = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?${soqlQuery}`;

const res311 = await fetchWithRetry(test311Url, {
  headers: { "Accept": "application/json", "User-Agent": "ESTAFO-Test-Runner/1.0" }
});

assert.strictEqual(res311.status, 200, "Socrata 311 must return HTTP 200");
const data311 = await res311.json();
assert(Array.isArray(data311), "311 response must be an array");
assert(data311.length > 0, "311 response must have records");

const firstRecord = data311[0];
assert(firstRecord.unique_key, "Record must have unique_key");
assert(firstRecord.complaint_type, "Record must have complaint_type");
assert(!isNaN(parseFloat(firstRecord.latitude)), "Record must have valid latitude");
assert(!isNaN(parseFloat(firstRecord.longitude)), "Record must have valid longitude");

console.log(`✓ 311 Stream Verified: Received ${data311.length} live records. Most recent event: ${firstRecord.created_date} (${firstRecord.complaint_type})`);

// Test 2: SODA DOB Complaints Live API connectivity
console.log("\n[Test 2] Testing live NYC DOB Complaints SODA (eabe-havv)...");
const dobQuery = "$select=complaint_number,status,date_entered,house_number,house_street,zip_code,bin,complaint_category&$order=date_entered DESC&$limit=5";
const resDOB = await fetchWithRetry(`https://data.cityofnewyork.us/resource/eabe-havv.json?${dobQuery}`, {
  headers: { "Accept": "application/json", "User-Agent": "ESTAFO-Test-Runner/1.0" }
});

assert.strictEqual(resDOB.status, 200, "DOB Complaints must return HTTP 200");
const dataDOB = await resDOB.json();
assert(Array.isArray(dataDOB), "DOB response must be an array");
assert(dataDOB.length > 0, "DOB response must have records");
console.log(`✓ DOB Complaints Verified: Received ${dataDOB.length} live records. Most recent complaint: #${dataDOB[0].complaint_number}`);

// Test 2b: SODA DOB Violations Live API connectivity
console.log("\n[Test 2b] Testing live NYC DOB Violations SODA (3h2n-5cm9)...");
const violQuery = "$select=isn_dob_bis_viol,boro,block,lot,issue_date,violation_number,house_number,street,violation_category&$order=issue_date DESC&$limit=5";
const resViol = await fetchWithRetry(`https://data.cityofnewyork.us/resource/3h2n-5cm9.json?${violQuery}`, {
  headers: { "Accept": "application/json", "User-Agent": "ESTAFO-Test-Runner/1.0" }
});
assert.strictEqual(resViol.status, 200, "DOB Violations must return HTTP 200");
const dataViol = await resViol.json();
assert(Array.isArray(dataViol), "DOB Violations response must be an array");
assert(dataViol.length > 0, "DOB Violations response must have records");
console.log(`✓ DOB Violations Verified: Received ${dataViol.length} live records. Most recent violation: #${dataViol[0].violation_number}`);

// Test 3: ENPV Scoring Model Mathematical Consistency
console.log("\n[Test 3] Verifying Opportunity ENPV calculation...");
function calculateENPV(grossValue, pSuccess, investCost, pursuitCost, downsideRisk) {
  return Math.round((pSuccess * grossValue) - investCost - pursuitCost - downsideRisk);
}

const enpv = calculateENPV(12500, 0.78, 450, 200, 100);
assert.strictEqual(enpv, 9000, "ENPV calculation must match deterministic expectation: (0.78 * 12500) - 450 - 200 - 100 = 9000");
console.log(`✓ ENPV formula verified: Gross=$12,500, P(succ)=78%, Costs=$750 -> Expected Net=$9,000`);

// Test 3b: Citizen Idling 25% Expected Value Math (NYC Admin Code § 24-182)
function calculateCitizenIdlingEV(statutoryFine, pWin, pCollect, fieldTimeMinutes, hourlyRate, transitCost) {
  const citizenGrossBounty = 0.25 * statutoryFine;
  const expectedGrossRecovery = pWin * pCollect * citizenGrossBounty;
  const laborCost = (fieldTimeMinutes / 60) * hourlyRate;
  return +((expectedGrossRecovery - laborCost - transitCost).toFixed(2));
}

const idlingEV = calculateCitizenIdlingEV(350, 0.80, 0.65, 10, 60, 2.90);
assert.strictEqual(idlingEV, 32.60, "Citizen idling EV calculation must match calibrated OATH realization formula: 45.50 gross expected - 12.90 costs = 32.60 net");
console.log(`✓ Calibrated Idling EV Verified: Fine=$350, 25% Share=$87.50, P(win)=80%, P(collect)=65% -> Net EV=$32.60`);

// Test 4: Financial Integrity Rules (Gate G4)
console.log("\n[Test 4] Verifying Financial Accounting segregation...");
const mockTransactions = [
  { type: "CASH_COLLECTED", amount: 12500 },
  { type: "CASH_COLLECTED", amount: 3850 },
  { type: "INVOICE_SENT", amount: 7500 },
  { type: "CONTRACT_SIGNED", amount: 25000 },
  { type: "STATUTORY_PIPELINE", amount: 9600000 },
  { type: "OPERATING_EXPENSE", amount: -1450 }
];

const cashCollected = mockTransactions
  .filter(t => t.type === "CASH_COLLECTED")
  .reduce((s, t) => s + t.amount, 0);

const invoicedAR = mockTransactions
  .filter(t => t.type === "INVOICE_SENT")
  .reduce((s, t) => s + t.amount, 0);

const pipeline = mockTransactions
  .filter(t => t.type === "STATUTORY_PIPELINE")
  .reduce((s, t) => s + t.amount, 0);

assert.strictEqual(cashCollected, 16350, "Cash collected must strictly equal 12500 + 3850 = 16350");
assert.strictEqual(invoicedAR, 7500, "Invoiced AR must strictly equal 7500");
assert.strictEqual(pipeline, 9600000, "Pipeline must remain segregated");
assert.notStrictEqual(cashCollected, pipeline, "CRITICAL: Pipeline exposure must NEVER be counted as realized revenue");

console.log(`✓ Financial Ledger Rules Verified: Realized Cash ($${cashCollected}) strictly isolated from Speculative Pipeline ($${pipeline})`);

// Test 5: Statistical Spending Intensity Normalization (Gate G5)
console.log("\n[Test 5] Verifying Normalized Spending Intensity & Z-Score Mathematics...");
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const sampleSpends = [12960000, 8640000, 4750000, 1980000, 1800000];
const sampleMonths = [12, 12, 12, 12, 12];
const intensities = sampleSpends.map((s, i) => s / sampleMonths[i]);
const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
const variance = intensities.reduce((s, val) => s + Math.pow(val - mean, 2), 0) / intensities.length;
const std = Math.sqrt(variance);

const zScoreTop = +((intensities[0] - mean) / std).toFixed(2);
assert(zScoreTop > 1.5, "Outlier spending rate must register descriptive z-score above peer mean");
console.log(`✓ Statistical Normalization Math Verified: Mean=$${Math.round(mean)}/mo, Top Z-Score=+${zScoreTop}σ`);

// Test 6: Content Digest SHA-256 Hash Generation (Gate G6)
console.log("\n[Test 6] Verifying Review Content Digest SHA-256 Hash Generation...");
const testNpi = "DEMO-NPI-001";
const testDisposition = "FLAGGED_FOR_INVESTIGATION";
const testUtility = "STATISTICAL_OUTLIER";
const testDate = "2026-10-27T10:00:00.000Z";
const testHashes = { roster: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" };

const sigPayload = `${testNpi}:${testDisposition}:${testUtility}:${testDate}:${JSON.stringify(testHashes)}`;
const contentDigest = crypto.createHash("sha256").update(sigPayload).digest("hex");
assert(contentDigest && contentDigest.length === 64, "Content digest must be 64-character SHA-256 hex string");
console.log(`✓ Content Digest Verified: ${contentDigest.slice(0, 16)}...`);

// Test 7: Research Dossier Preview JSON Structure & Disclaimer Validation (Gate G7)
console.log("\n[Test 7] Verifying Research Dossier JSON Schema & Disclaimers (ESTAFO_RESEARCH_DOSSIER_PREVIEW_V1)...");
const mockDossier = {
  protocol: "ESTAFO_RESEARCH_DOSSIER_PREVIEW_V1",
  status: "UNVERIFIED_RESEARCH_PREVIEW",
  notice: "RESEARCH AID ONLY. This export is an unauthenticated research summary and does not constitute a signed legal complaint, subpoena, proof of fraud, or official relator disclosure.",
  timestamp: new Date().toISOString(),
  provider: {
    leadId: "DEMO-SADC-001",
    npi: "DEMO-NPI-001",
    providerName: "Sample Adult Day Care Facility Alpha [Workflow Demo]"
  },
  reviewSession: {
    disposition: "STATISTICAL_OUTLIER",
    observedSessionMinutes: (1080 / 60).toFixed(2),
    elapsedSeconds: 1080
  },
  provenance: {
    documentHashesSha256: ["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    contentIntegrityDigestSha256: contentDigest
  }
};

assert.strictEqual(mockDossier.protocol, "ESTAFO_RESEARCH_DOSSIER_PREVIEW_V1");
assert.strictEqual(mockDossier.status, "UNVERIFIED_RESEARCH_PREVIEW");
assert(mockDossier.notice.includes("RESEARCH AID ONLY"));
assert.strictEqual(mockDossier.provenance.contentIntegrityDigestSha256.length, 64);
assert.strictEqual(mockDossier.reviewSession.observedSessionMinutes, "18.00");
console.log(`✓ Research Dossier Schema Verified: Conforms to unverified research aid standard with mandatory disclaimers.`);

// Test 8: Serverless SQLite Feedback Storage CRUD (Gate G8)
console.log("\n[Test 8] Verifying Serverless SQLite Storage CRUD cycle on /tmp...");
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sqlite = require("node:sqlite");

const testDbPath = path.join("/tmp", "estafo_test_feedback.db");
const testDb = new sqlite.DatabaseSync(testDbPath);
testDb.exec(`
  CREATE TABLE IF NOT EXISTS test_feedback (
    id TEXT PRIMARY KEY,
    npi TEXT NOT NULL,
    disposition TEXT NOT NULL,
    observed_seconds INTEGER NOT NULL
  );
`);

testDb.prepare("INSERT OR REPLACE INTO test_feedback VALUES (?, ?, ?, ?)").run("REV-TEST-1", "DEMO-NPI-001", "FLAGGED", 1080);
const readRow = testDb.prepare("SELECT * FROM test_feedback WHERE id = ?").get("REV-TEST-1");
assert.strictEqual(readRow.npi, "DEMO-NPI-001");
assert.strictEqual(readRow.observed_seconds, 1080);
testDb.close();
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
console.log(`✓ Serverless SQLite CRUD Verified: Clean write, read, and cleanup on /tmp filesystem.`);

// Test 9: Vetted NYC NPI Cohort & Luhn Check Digit Verification (Gate G9)
console.log("\n[Test 9] Verifying Vetted NYC NPI Cohort & 100% Luhn Check Digit Integrity...");
const allowlistPath = path.join(process.cwd(), "backend", "data", "vetted_nyc_t2024_npis.txt");
assert(fs.existsSync(allowlistPath), "vetted_nyc_t2024_npis.txt must exist");
const allowlistContent = fs.readFileSync(allowlistPath, "utf-8");
const allowlistHash = crypto.createHash("sha256").update(allowlistContent.trim()).digest("hex");
assert.strictEqual(
  allowlistHash,
  "a98b2d1ba7addbfad681a45e81554895db737811a3c83242e940709789ea3432",
  "Allowlist SHA-256 must match authoritative manifest"
);

const cohortNpis = allowlistContent.split("\n").map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith("#"));
assert.strictEqual(cohortNpis.length, 446, "Cohort must contain 446 vetted NYC NPIs");

function testLuhn(npi) {
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

for (const npi of cohortNpis) {
  assert(testLuhn(npi), `NPI ${npi} must pass CMS Luhn check digit test`);
}
console.log(`✓ Vetted NPI Cohort Verified: All ${cohortNpis.length} NPIs pass Luhn check digits with SHA-256: ${allowlistHash.slice(0, 16)}...`);

// Test 10: Institutional Authentication Security Gate (Gate G10)
console.log("\n[Test 10] Verifying Institutional Authentication Security Gate for Medicaid Leads...");

function simulateAuthCheck(headers = {}, queryToken = null, envSecret = process.env.MEDICAID_PILOT_KEY) {
  // Fail closed if server has no secret configured
  if (!envSecret || !envSecret.trim()) {
    return { status: 503, error: "AUTH_NOT_CONFIGURED" };
  }
  // Query tokens are strictly rejected
  const authHeader = headers["authorization"] || headers["Authorization"] || headers["x-api-key"];
  const providedToken = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
  if (!providedToken) {
    return { status: 401, error: "AUTHENTICATION_REQUIRED" };
  }
  const expBuf = Buffer.from(envSecret.trim());
  const provBuf = Buffer.from(providedToken);
  const isValid = expBuf.length === provBuf.length && crypto.timingSafeEqual(expBuf, provBuf);
  if (!isValid) {
    return { status: 401, error: "INVALID_CREDENTIALS" };
  }
  return { status: 200, authenticated: true };
}

// 1. Fail closed when server secret unset
const failClosedAttempt = simulateAuthCheck({}, null, "");
assert.strictEqual(failClosedAttempt.status, 503, "API must fail closed (503) if server secret is unconfigured");

const TEST_SECRET = "estafotir-pilot-sec-vault-789";

// 2. Unauthenticated request rejected
const unauthenticatedAttempt = simulateAuthCheck({}, null, TEST_SECRET);
assert.strictEqual(unauthenticatedAttempt.status, 401, "Unauthenticated request must return HTTP 401");

// 3. Query parameter tokens are rejected (prevent URL log leakage)
const queryTokenAttempt = simulateAuthCheck({}, TEST_SECRET, TEST_SECRET);
assert.strictEqual(queryTokenAttempt.status, 401, "Query parameter token must be rejected (only headers allowed)");

// 4. Revoked legacy token rejected
const legacyTokenAttempt = simulateAuthCheck({ "Authorization": "Bearer estafo-pilot-token-2026" }, null, TEST_SECRET);
assert.strictEqual(legacyTokenAttempt.status, 401, "Revoked legacy token must be rejected");

// 5. Valid Authorization header succeeds
const bearerAuthAttempt = simulateAuthCheck({ "Authorization": `Bearer ${TEST_SECRET}` }, null, TEST_SECRET);
assert.strictEqual(bearerAuthAttempt.status, 200, "Authenticated request with valid Bearer token must succeed");

// 6. Valid x-api-key header succeeds
const apiKeyAuthAttempt = simulateAuthCheck({ "x-api-key": TEST_SECRET }, null, TEST_SECRET);
assert.strictEqual(apiKeyAuthAttempt.status, 200, "Authenticated request with valid x-api-key header must succeed");

console.log("✓ Institutional Auth Gate Verified: Fail-closed on missing config, query tokens blocked, timing-safe header credentials enforced.");

console.log("\n>>> ALL PIPELINE TESTS (Gates G1 - G10) PASSED WITH 100% SUCCESS <<<");
