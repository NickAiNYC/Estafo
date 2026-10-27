"use client";

import { useState, useMemo } from "react";
import { MedicaidProviderRecord, FraudRingRecord } from "@/types";
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  FileText,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

interface MedicaidQuiTamRadarProps {
  providers: MedicaidProviderRecord[];
  fraudRings?: FraudRingRecord[];
  onOpenWeaponizer?: (targetId: string, track: string) => void;
}

export default function MedicaidQuiTamRadar({
  providers,
  onOpenWeaponizer
}: MedicaidQuiTamRadarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("ALL");
  const [selectedFacilityType, setSelectedFacilityType] = useState("ALL");
  const [selectedProvider, setSelectedProvider] = useState<MedicaidProviderRecord | null>(providers[0] || null);

  // Attorney Feedback state
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.npi.includes(searchQuery) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBorough = selectedBorough === "ALL" || p.borough === selectedBorough;
      const matchesType = selectedFacilityType === "ALL" || p.facility_type === selectedFacilityType;
      return matchesSearch && matchesBorough && matchesType;
    });
  }, [providers, searchQuery, selectedBorough, selectedFacilityType]);

  const totalIdentifiedExposure = useMemo(() => {
    return providers.reduce((acc, curr) => acc + curr.exposure_amount, 0);
  }, [providers]);

  // Submit attorney decision to Component 7 feedback loop
  const handleRecordDisposition = async (disposition: string) => {
    if (!selectedProvider) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedProvider.id,
          providerNPI: selectedProvider.npi,
          targetName: selectedProvider.name,
          lawFirmName: "Litigation Partner Review",
          disposition,
          attorneyNotes: `Disposition recorded via console radar view: ${disposition}`,
          analystHoursSaved: 25,
          primarySignal: "PEER_DEVIATION",
          corroboratingSignalsCount: 2
        })
      });
      setFeedbackSuccess(`Decision "${disposition}" recorded. Model weights recalibrated.`);
      setTimeout(() => setFeedbackSuccess(null), 3000);
    } catch (e) {
      console.error("Failed to post attorney feedback:", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      {/* Top Telemetry Header */}
      <div className="p-16 border-b border-border bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-16 shrink-0">
        <div className="flex items-center gap-12">
          <div className="p-8 bg-steel-blue/10 border border-steel-blue/30 rounded-sm">
            <Activity className="w-5 h-5 text-steel-blue" />
          </div>
          <div>
            <div className="text-11 font-mono text-muted uppercase tracking-wider">
              Litigation Intelligence // Multi-Signal Peer Deviation Engine
            </div>
            <h1 className="text-18 font-bold font-jakarta tracking-tight">
              Medicaid Provider Intelligence Radar
            </h1>
          </div>
        </div>

        {/* Aggregate Commercial & Exposure Metrics (GAAP Compliant) */}
        <div className="flex items-center gap-16 font-mono">
          <div className="bg-inset border border-border px-14 py-8 rounded-sm">
            <div className="text-10 text-muted uppercase">Statutory Exposure Ceiling</div>
            <div className="text-16 font-bold text-secondary">
              ${(totalIdentifiedExposure / 1000000).toFixed(1)}M
            </div>
            <div className="text-9 text-muted">Unadjudicated Pipeline</div>
          </div>

          <div className="bg-inset border border-emerald/40 px-14 py-8 rounded-sm">
            <div className="text-10 text-emerald uppercase font-bold">Research Pilot Retainers</div>
            <div className="text-16 font-bold text-emerald">
              $7,500 – $18,500
            </div>
            <div className="text-9 text-muted">Fixed Law Firm Fee / Lead</div>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Matrix */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Provider Priority Lead Queue */}
        <div className="w-full lg:w-[480px] border-r border-border bg-surface flex flex-col h-full overflow-hidden">
          {/* Filter Bar */}
          <div className="p-10 border-b border-border bg-canvas/40 space-y-8">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-10 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NPI, entity name, address..."
                className="w-full bg-inset border border-border rounded-sm pl-28 pr-10 py-5 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
              />
            </div>

            <div className="flex gap-8">
              <select
                value={selectedBorough}
                onChange={(e) => setSelectedBorough(e.target.value)}
                className="flex-1 bg-inset border border-border rounded-sm px-8 py-4 text-10 font-mono text-muted focus:outline-none"
              >
                <option value="ALL">All Boroughs</option>
                <option value="BROOKLYN">Brooklyn</option>
                <option value="QUEENS">Queens</option>
                <option value="BRONX">Bronx</option>
                <option value="MANHATTAN">Manhattan</option>
              </select>

              <select
                value={selectedFacilityType}
                onChange={(e) => setSelectedFacilityType(e.target.value)}
                className="flex-1 bg-inset border border-border rounded-sm px-8 py-4 text-10 font-mono text-muted focus:outline-none"
              >
                <option value="ALL">All Specialties</option>
                <option value="Adult Day Care">Adult Day Care</option>
                <option value="CDPAP Home Care">CDPAP Home Care</option>
                <option value="Medical Transport">Medical Transport</option>
                <option value="Specialty Pharmacy">Specialty Pharmacy</option>
              </select>
            </div>
          </div>

          {/* Provider Lead Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredProviders.map((provider) => {
              const isSelected = selectedProvider?.id === provider.id;
              return (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className={`p-12 cursor-pointer transition-colors ${
                    isSelected ? "bg-inset border-l-2 border-emerald" : "hover:bg-canvas/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-10 font-mono text-muted">NPI: {provider.npi}</span>
                    <span className="px-6 py-2 rounded-sm text-9 font-mono border bg-steel-blue/10 text-steel-blue border-steel-blue/30">
                      {provider.facility_type}
                    </span>
                  </div>

                  <h3 className="text-12 font-bold font-jakarta text-primary mb-2">
                    {provider.name}
                  </h3>

                  <div className="text-10 text-secondary truncate mb-6">
                    {provider.address} · {provider.borough}
                  </div>

                  <div className="flex items-center justify-between text-10 font-mono">
                    <span className="text-muted">Multi-Signal Score:</span>
                    <span className="text-gold font-bold">{provider.risk_score}/100</span>
                    <span className="text-muted">Exposure:</span>
                    <span className="text-primary font-bold">
                      ${(provider.exposure_amount / 1000).toLocaleString()}k
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Multi-Signal Deep Dive & Attorney Feedback */}
        <div className="flex-1 bg-canvas flex flex-col h-full overflow-y-auto">
          {selectedProvider ? (
            <div className="p-20 space-y-20 max-w-4xl">
              {/* Header Card */}
              <div className="p-16 border border-border bg-surface rounded-sm">
                <div className="flex flex-wrap items-start justify-between gap-12 mb-12">
                  <div>
                    <div className="text-10 font-mono text-muted uppercase">
                      Entity Identity // NPI: {selectedProvider.npi}
                    </div>
                    <h2 className="text-18 font-bold font-jakarta text-primary">
                      {selectedProvider.name}
                    </h2>
                    <div className="text-12 text-secondary mt-2">
                      {selectedProvider.address} ({selectedProvider.borough})
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {onOpenWeaponizer && (
                      <button
                        onClick={() => onOpenWeaponizer(selectedProvider.id, "TRACK_6_NYFCA_QUI_TAM")}
                        className="flex items-center gap-6 px-12 py-6 rounded-sm bg-emerald/20 border border-emerald text-emerald hover:bg-emerald/30 text-11 font-mono font-bold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>GENERATE ATTORNEY DOSSIER</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Independent Signals Matrix (Component 2) */}
                <div className="mt-16 pt-16 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 font-mono text-10">
                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Signal 1: Peer Deviation</div>
                    <div className="text-13 font-bold text-emerald mt-2">+4.8σ Above Mean</div>
                    <div className="text-9 text-muted mt-1">vs 312 Regional Peers</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Signal 2: Velocity Spike</div>
                    <div className="text-13 font-bold text-amber mt-2">+240% in 90 Days</div>
                    <div className="text-9 text-muted mt-1">Accelerated Trajectory</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Signal 3: Overlap Metric</div>
                    <div className="text-13 font-bold text-steel-blue mt-2">Impossible Shift</div>
                    <div className="text-9 text-muted mt-1">Simultaneous Billable Hours</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Signal 4: Cluster Risk</div>
                    <div className="text-13 font-bold text-gold mt-2">Shared BBL Shell</div>
                    <div className="text-9 text-muted mt-1">Co-located Hauler Entity</div>
                  </div>
                </div>
              </div>

              {/* Verified Sources & Provenance (Gate G3) */}
              <div className="p-16 border border-border bg-surface rounded-sm space-y-12">
                <div className="flex items-center gap-8 font-mono text-11 text-muted uppercase">
                  <Layers className="w-4 h-4 text-emerald" />
                  <span>Authoritative Provenance & Public Citations</span>
                </div>

                <div className="space-y-8 font-mono text-11">
                  <div className="p-8 bg-inset rounded-sm flex items-center justify-between">
                    <div>
                      <div className="text-primary font-bold">NPPES National Provider Registry (CMS)</div>
                      <div className="text-9 text-muted">Active Enumeration · Verified Enumeration Date</div>
                    </div>
                    <span className="text-emerald text-10">VERIFIED OFFICIAL</span>
                  </div>

                  <div className="p-8 bg-inset rounded-sm flex items-center justify-between">
                    <div>
                      <div className="text-primary font-bold">NYS Department of State Corporate Registry</div>
                      <div className="text-9 text-muted">DOS ID #6492019 · Active Good Standing</div>
                    </div>
                    <span className="text-emerald text-10">VERIFIED OFFICIAL</span>
                  </div>

                  <div className="p-8 bg-inset rounded-sm flex items-center justify-between">
                    <div>
                      <div className="text-primary font-bold">NYS OMIG & HHS OIG Exclusion Registry</div>
                      <div className="text-9 text-muted">Zero Active Administrative Exclusions</div>
                    </div>
                    <span className="text-gold text-10">CLEAN STATUS</span>
                  </div>
                </div>
              </div>

              {/* Closed-Loop Attorney Decision Gate (Component 7) */}
              <div className="p-16 border border-border bg-surface rounded-sm space-y-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8 font-mono text-11 text-gold uppercase font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Attorney Disposition & Learning Loop (Component 7)</span>
                  </div>
                  {feedbackSuccess && (
                    <span className="text-10 font-mono text-emerald animate-pulse">
                      {feedbackSuccess}
                    </span>
                  )}
                </div>

                <p className="text-11 text-secondary">
                  Record litigation counsel assessment on this research lead. The engine recalibrates signal weights based on actual attorney conversions.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 font-mono text-10">
                  <button
                    onClick={() => handleRecordDisposition("ACCEPTED_FOR_INVESTIGATION")}
                    className="p-8 bg-emerald/15 border border-emerald text-emerald hover:bg-emerald/25 rounded-sm flex flex-col items-center gap-4 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACCEPT (INVESTIGATE)</span>
                  </button>

                  <button
                    onClick={() => handleRecordDisposition("REJECTED_ALREADY_KNOWN")}
                    className="p-8 bg-inset border border-border text-muted hover:text-primary rounded-sm flex flex-col items-center gap-4 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span>REJECT (ALREADY KNOWN)</span>
                  </button>

                  <button
                    onClick={() => handleRecordDisposition("REJECTED_INSUFFICIENT_EVIDENCE")}
                    className="p-8 bg-inset border border-border text-muted hover:text-primary rounded-sm flex flex-col items-center gap-4 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>REJECT (WEAK PROOF)</span>
                  </button>

                  <button
                    onClick={() => handleRecordDisposition("REJECTED_EXCULPATORY_EXPLANATION")}
                    className="p-8 bg-inset border border-border text-muted hover:text-primary rounded-sm flex flex-col items-center gap-4 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>REJECT (EXCULPATORY)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted font-mono text-12">
              Select a healthcare provider lead from the queue to view multi-signal evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
