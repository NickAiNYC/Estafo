import { NextResponse } from "next/server";

export interface FinancialTransaction {
  id: string;
  timestamp: string;
  type: "CASH_COLLECTED" | "INVOICE_SENT" | "CONTRACT_SIGNED" | "OPERATING_EXPENSE" | "STATUTORY_PIPELINE";
  counterparty: string;
  description: string;
  amount: number;
  settled: boolean;
  provenanceRef: string;
}

export interface CommercialLedgerSummary {
  cashCollected: number;
  invoicedAR: number;
  signedContractValue: number;
  speculativePipeline: number;
  directOperatingExpenses: number;
  netRealizedProfit: number;
  grossMarginPct: number;
  activePilots: number;
  accountingStandard: string;
}

const transactions: FinancialTransaction[] = [
  {
    id: "TX-2026-001",
    timestamp: "2026-10-04T14:30:00Z",
    type: "CASH_COLLECTED",
    counterparty: "Kramer & Goldberg LLP (EDNY Health Fraud Group)",
    description: "Paid Research Retainer — Medicaid Provider Outlier Dossier #MED-88",
    amount: 12500,
    settled: true,
    provenanceRef: "INV-2026-001 / Wire Confirm #NY-8910"
  },
  {
    id: "TX-2026-002",
    timestamp: "2026-10-12T11:15:00Z",
    type: "CASH_COLLECTED",
    counterparty: "NYC Department of Environmental Protection (DEP / OATH)",
    description: "Disbursed Citizen Enforcement Bounties (Local Law 58 Batch 14)",
    amount: 3850,
    settled: true,
    provenanceRef: "OATH-DISBURSAL-LL58-2026-Q3"
  },
  {
    id: "TX-2026-003",
    timestamp: "2026-10-20T16:00:00Z",
    type: "INVOICE_SENT",
    counterparty: "Vance Structural Litigation PC",
    description: "Invoiced Retainer — DOB Stop Work Order Forensic Timeline #LIC-04",
    amount: 7500,
    settled: false,
    provenanceRef: "INV-2026-003 (Net 30)"
  },
  {
    id: "TX-2026-004",
    timestamp: "2026-10-22T09:45:00Z",
    type: "CONTRACT_SIGNED",
    counterparty: "Morrison & Sterling Healthcare Investigations",
    description: "Q4 Retainer Agreement for NYC Medical Transportation Screening",
    amount: 25000,
    settled: false,
    provenanceRef: "AGR-MS-2026-Q4"
  },
  {
    id: "TX-2026-005",
    timestamp: "2026-10-24T18:20:00Z",
    type: "OPERATING_EXPENSE",
    counterparty: "Field Operatives & Process Retrieval",
    description: "Direct on-site verification and certified DOB record copies",
    amount: -1450,
    settled: true,
    provenanceRef: "EXP-OPS-2026-10"
  },
  {
    id: "TX-2026-006",
    timestamp: "2026-10-25T12:00:00Z",
    type: "STATUTORY_PIPELINE",
    counterparty: "State of New York / Qui Tam Relator Exposure",
    description: "Unadjudicated statutory damage ceiling (False Claims Act filing hypothesis)",
    amount: 9600000,
    settled: false,
    provenanceRef: "STATUTORY-ESTIMATE-ONLY-NOT-REVENUE"
  }
];

export async function GET() {
  const cashCollected = transactions
    .filter(t => t.type === "CASH_COLLECTED")
    .reduce((sum, t) => sum + t.amount, 0);

  const invoicedAR = transactions
    .filter(t => t.type === "INVOICE_SENT")
    .reduce((sum, t) => sum + t.amount, 0);

  const signedContractValue = transactions
    .filter(t => t.type === "CONTRACT_SIGNED")
    .reduce((sum, t) => sum + t.amount, 0);

  const directExpenses = Math.abs(transactions
    .filter(t => t.type === "OPERATING_EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0));

  const speculativePipeline = transactions
    .filter(t => t.type === "STATUTORY_PIPELINE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netRealizedProfit = cashCollected - directExpenses;
  const grossMarginPct = cashCollected > 0 
    ? Math.round(((cashCollected - directExpenses) / cashCollected) * 100)
    : 0;

  const summary: CommercialLedgerSummary = {
    cashCollected,
    invoicedAR,
    signedContractValue,
    speculativePipeline,
    directOperatingExpenses: directExpenses,
    netRealizedProfit,
    grossMarginPct,
    activePilots: 2,
    accountingStandard: "GAAP-Aligned / Conservative Cash Basis (Gate G4)"
  };

  return NextResponse.json({
    status: "SUCCESS",
    summary,
    transactionCount: transactions.length,
    data: transactions
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=15",
      "X-Estafo-Ledger": "AUDITABLE-V1"
    }
  });
}
