"use client";

import { useState, useMemo } from "react";
import { BountyLedgerItem } from "@/types";
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Download, 
  Search, 
  ArrowUpRight,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface ProfitEngineLedgerProps {
  ledgerItems: BountyLedgerItem[];
  onOpenWeaponizer?: (targetId: string, track: string) => void;
}

export default function ProfitEngineLedger({ ledgerItems, onOpenWeaponizer }: ProfitEngineLedgerProps) {
  const [filterTrack, setFilterTrack] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredItems = useMemo(() => {
    return ledgerItems.filter((item) => {
      const matchesTrack = filterTrack === "ALL" || item.track === filterTrack;
      const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
      const matchesQuery =
        item.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.case_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTrack && matchesStatus && matchesQuery;
    });
  }, [ledgerItems, filterTrack, filterStatus, searchQuery]);

  // Aggregate Metrics (GAAP-Aligned)
  const totalCollectedAndPaid = useMemo(() => {
    return ledgerItems
      .filter((i) => i.status === "PAID" || i.status === "COLLECTED")
      .reduce((acc, curr) => acc + (curr.actual_payout || curr.estimated_payout), 0);
  }, [ledgerItems]);

  const quiTamPipelineAmount = useMemo(() => {
    return ledgerItems
      .filter((i) => i.track === "TRACK_6_NYFCA_QUI_TAM")
      .reduce((acc, curr) => acc + curr.estimated_payout, 0);
  }, [ledgerItems]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-sage/20 text-sage border-sage/40";
      case "COLLECTED":
        return "bg-amber/20 text-amber border-amber/40";
      case "PENDING_HEARING":
        return "bg-steel-blue/20 text-steel-blue border-steel-blue/40";
      case "FILED_SEALED":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      case "DOJ_REVIEW":
        return "bg-red/20 text-red border-red/40";
      case "VALIDATED":
        return "bg-gold/20 text-gold border-gold/40";
      default:
        return "bg-inset text-muted border-border";
    }
  };

  const exportAuditCSV = () => {
    const headers = [
      "ID",
      "Track",
      "Target Name",
      "Statutory Basis",
      "Fine Potential",
      "Bounty Rate",
      "Estimated Payout",
      "Actual Payout",
      "Status",
      "Date Filed",
      "Case Ref",
      "Location"
    ];
    const rows = filteredItems.map((item) => [
      item.id,
      item.track,
      `"${item.target_name}"`,
      `"${item.statutory_basis}"`,
      item.statutory_fine_potential,
      `"${item.bounty_rate}"`,
      item.estimated_payout,
      item.actual_payout || 0,
      item.status,
      item.date_filed,
      item.case_reference,
      `"${item.location}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vanguard_bounty_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      {/* Telemetry Header */}
      <div className="p-16 border-b border-border bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-16 shrink-0">
        <div>
          <div className="text-11 font-mono text-muted uppercase tracking-wider">
            Financial Ledger // PENDING vs PAID Pipeline
          </div>
          <h1 className="text-18 font-bold font-jakarta tracking-tight">
            Vanguard Profit Engine & Payout Matrix
          </h1>
        </div>

        <button
          onClick={exportAuditCSV}
          className="px-14 py-8 bg-surface hover:bg-surface-hover border border-border text-12 font-mono text-primary rounded-sm flex items-center gap-8 transition-colors"
        >
          <Download className="w-4 h-4 text-sage" />
          <span>Export Ledger Audit CSV</span>
        </button>
      </div>

      {/* Prominent Demonstration Model Disclaimer */}
      <div className="px-16 py-8 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Notice: Synthetic commercial financial model. Figures reflect illustrative prototype projections ($16,350 collected, $9.6M statutory pipeline) demonstrating accounting cash-segregation architecture, NOT verified bank receipts or real legal retainers.</span>
        </div>
        <span className="text-amber-400 font-bold ml-8 shrink-0 uppercase text-10">Synthetic Financial Model</span>
      </div>

      {/* Aggregate Metric Cards (Gate G4 & Component 4/5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 p-16 bg-inset shrink-0 border-b border-border font-mono">
        <div className="bg-surface border border-emerald/40 p-14 rounded-sm shadow-panel">
          <div className="flex items-center justify-between text-muted text-10">
            <span className="text-emerald font-bold">ILLUSTRATIVE CASH (DEMO)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald" />
          </div>
          <div className="text-22 font-bold text-emerald mt-6">
            ${totalCollectedAndPaid.toLocaleString()}
          </div>
          <div className="text-10 text-muted mt-2">Simulated Pilots ($12.5k) + OATH ($3.8k)</div>
        </div>

        <div className="bg-surface border border-border p-14 rounded-sm shadow-panel">
          <div className="flex items-center justify-between text-muted text-10">
            <span>INVOICED AR (DEMO MODEL)</span>
            <Clock className="w-4 h-4 text-steel-blue" />
          </div>
          <div className="text-22 font-bold text-steel-blue mt-6">
            $7,500
          </div>
          <div className="text-10 text-muted mt-2">Dossier Delivered (Net 30 Sample)</div>
        </div>

        <div className="bg-surface border border-border p-14 rounded-sm shadow-panel">
          <div className="flex items-center justify-between text-muted text-10">
            <span>COMMITTED CONTRACTS (DEMO)</span>
            <DollarSign className="w-4 h-4 text-gold" />
          </div>
          <div className="text-22 font-bold text-gold mt-6">
            $25,000
          </div>
          <div className="text-10 text-muted mt-2">Signed Retainers (Q4 Deliverable Sample)</div>
        </div>

        <div className="bg-surface border border-border p-14 rounded-sm shadow-panel">
          <div className="flex items-center justify-between text-muted text-10">
            <span>STATUTORY CEILING (THEORETICAL)</span>
            <TrendingUp className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-22 font-bold text-secondary mt-6">
            ${(quiTamPipelineAmount / 1000000).toFixed(1)}M
          </div>
          <div className="text-10 text-amber mt-2">Unadjudicated (Never Counted as Rev)</div>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="p-12 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-12 shrink-0">
        <div className="flex items-center gap-12 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-10 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target, case reference, location..."
              className="w-full bg-inset border border-border rounded-sm pl-32 pr-12 py-6 text-12 font-mono placeholder:text-muted focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div className="flex items-center gap-8">
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value)}
            className="bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono text-secondary focus:outline-none focus:border-amber"
          >
            <option value="ALL">All Tracks</option>
            <option value="TRACK_5_DUMPING">Track 5: DSNY Dumping ($9k)</option>
            <option value="TRACK_1_IDLING">Track 1: CAC Idling (50%)</option>
            <option value="TRACK_6_NYFCA_QUI_TAM">Track 6: NYFCA Qui Tam (25%)</option>
            <option value="TRACK_11_DOB">Track 11: DOB Unpermitted</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono text-secondary focus:outline-none focus:border-amber"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="COLLECTED">COLLECTED</option>
            <option value="PENDING_HEARING">PENDING HEARING</option>
            <option value="FILED_SEALED">FILED SEALED</option>
            <option value="VALIDATED">VALIDATED</option>
            <option value="CAPTURED">CAPTURED</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-inset sticky top-0 border-b border-border text-11 font-mono text-muted uppercase z-10">
            <tr>
              <th className="py-8 px-14">Case / Target</th>
              <th className="py-8 px-12">Track</th>
              <th className="py-8 px-12">Statutory Fine</th>
              <th className="py-8 px-12">Bounty Rate</th>
              <th className="py-8 px-12">Est. Payout</th>
              <th className="py-8 px-12">Status</th>
              <th className="py-8 px-12">Location</th>
              <th className="py-8 px-14 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono text-12">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-surface/60 transition-colors">
                <td className="py-10 px-14">
                  <div className="font-semibold text-primary">{item.target_name}</div>
                  <div className="text-11 text-muted">
                    {item.case_reference} · {item.date_filed}
                  </div>
                </td>
                <td className="py-10 px-12 text-secondary">
                  <span className="px-6 py-2 rounded-sm bg-inset border border-border text-10">
                    {item.track.replace("TRACK_", "T")}
                  </span>
                </td>
                <td className="py-10 px-12 text-primary">
                  ${item.statutory_fine_potential.toLocaleString()}
                </td>
                <td className="py-10 px-12 text-muted">{item.bounty_rate}</td>
                <td className="py-10 px-12 font-bold text-sage">
                  ${item.estimated_payout.toLocaleString()}
                </td>
                <td className="py-10 px-12">
                  <span
                    className={`px-8 py-2 rounded-sm text-10 font-bold border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-10 px-12 text-muted text-11">{item.location}</td>
                <td className="py-10 px-14 text-right">
                  <button
                    onClick={() => {
                      if (onOpenWeaponizer) {
                        onOpenWeaponizer(item.id, item.track);
                      }
                    }}
                    className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border rounded-sm text-11 text-primary transition-colors inline-flex items-center gap-4"
                  >
                    <span>Filing</span>
                    <ArrowUpRight className="w-3 h-3 text-muted" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
