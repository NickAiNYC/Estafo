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

// Synthetic demonstration ledger records illustrating cash-segregation accounting architecture
const transactions: FinancialTransaction[] = [
  {
    id: "TX-2026-001",
    timestamp: "2026-10-04T14:30:00Z",
    type: "CASH_COLLECTED",
    counterparty: "Sample Research Pilot Client Alpha [Demonstration]",
    description: "Sample Research Pilot Retainer — Medicaid Anomaly Outlier Screening Model (Demo Scope)",
    amount: 12500,
    settled: true,
    provenanceRef: "DEMO-INV-001 / Simulated Wire Confirmation"
  },
  {
    id: "TX-2026-002",
    timestamp: "2026-10-12T11:15:00Z",
    type: "CASH_COLLECTED",
    counterparty: "NYC DEP / OATH Citizen Conservation [Sample Batch]",
    description: "Simulated Citizen Enforcement Bounties (Local Law 58 Batch 14 Demo)",
    amount: 3850,
    settled: true,
    provenanceRef: "DEMO-OATH-DISBURSAL-LL58-Q3"
  },
  {
    id: "TX-2026-003",
    timestamp: "2026-10-20T16:00:00Z",
    type: "INVOICE_SENT",
    counterparty: "Sample Structural Litigation Practice Beta [Demonstration]",
    description: "Illustrative Invoiced Retainer — DOB Stop Work Order Timeline (Demo Scope, Net 30)",
    amount: 7500,
    settled: false,
    provenanceRef: "DEMO-INV-003 (Net 30 Sample)"
  },
  {
    id: "TX-2026-004",
    timestamp: "2026-10-22T09:45:00Z",
    type: "CONTRACT_SIGNED",
    counterparty: "Sample Healthcare Advisory Group Gamma [Demonstration]",
    description: "Illustrative Pilot Retainer Agreement for NYC Medical Transportation Screening (Demo Scope)",
    amount: 25000,
    settled: false,
    provenanceRef: "DEMO-AGR-2026-Q4"
  },
  {
    id: "TX-2026-005",
    timestamp: "2026-10-24T18:20:00Z",
    type: "OPERATING_EXPENSE",
    counterparty: "Field Verification Operatives [Demonstration Expense]",
    description: "Simulated direct on-site verification & certified document copy costs",
    amount: -1450,
    settled: true,
    provenanceRef: "DEMO-EXP-OPS-2026-10"
  },
  {
    id: "TX-2026-006",
    timestamp: "2026-10-25T12:00:00Z",
    type: "STATUTORY_PIPELINE",
    counterparty: "State of New York / Qui Tam Exposure Model [Theoretical Ceiling]",
    description: "Hypothetical statutory damage ceiling model (Illustrative only; never counted as cash revenue)",
    amount: 9600000,
    settled: false,
    provenanceRef: "THEORETICAL-STATUTORY-CEILING-NOT-REVENUE"
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
    accountingStandard: "Demonstration Cash-Segregation Model // Unaudited Illustrative Prototype"
  };

  return NextResponse.json({
    status: "SUCCESS",
    provenance: {
      mode: "SYNTHETIC_WORKFLOW_DEMO",
      disclaimer: "ILLUSTRATIVE FINANCIAL PROJECTION MODEL ONLY. Figures shown ($16,350 collected, $9.6M pipeline) are synthetic demonstration values for interface and cash-segregation testing, NOT verified commercial bank receipts or real legal retainers.",
      isAuditedProductionLedger: false,
      accountingBasis: "Demonstration Cash-Segregation Prototype (Gate G4)"
    },
    summary,
    transactionCount: transactions.length,
    data: transactions
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=15",
      "X-Estafo-Ledger": "DEMO-PROTOTYPE-V1"
    }
  });
}
