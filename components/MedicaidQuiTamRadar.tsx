"use client";

import { useState, useMemo } from "react";
import { MedicaidProviderRecord, FraudRingRecord } from "@/types";
import { 
  ShieldAlert, 
  Search, 
  AlertTriangle, 
  Calculator, 
  FileText,
  Activity
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

  // Qui Tam Calculator states
  const [calcRecovery, setCalcRecovery] = useState<number>(14200000);
  const [calcRelatorPct, setCalcRelatorPct] = useState<number>(25);

  const estimatedWhistleblowerShare = useMemo(() => {
    return (calcRecovery * calcRelatorPct) / 100;
  }, [calcRecovery, calcRelatorPct]);

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

  const totalEstimatedBounty = useMemo(() => {
    return providers.reduce((acc, curr) => acc + curr.estimated_bounty, 0);
  }, [providers]);

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      {/* Top Telemetry Header */}
      <div className="p-16 border-b border-border bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-16 shrink-0">
        <div className="flex items-center gap-12">
          <div className="p-8 bg-red/10 border border-red/30 rounded-sm">
            <ShieldAlert className="w-5 h-5 text-red" />
          </div>
          <div>
            <div className="text-11 font-mono text-muted uppercase tracking-wider">
              Track 6 Intelligence // New York False Claims Act (NYFCA § 189)
            </div>
            <h1 className="text-18 font-bold font-jakarta tracking-tight">
              Medicaid & Qui Tam Financial Fraud Radar
            </h1>
          </div>
        </div>

        {/* Aggregate Financial Metrics */}
        <div className="flex items-center gap-16 font-mono">
          <div className="bg-inset border border-border px-14 py-8 rounded-sm">
            <div className="text-11 text-muted">IDENTIFIED FRAUD EXPOSURE</div>
            <div className="text-18 font-bold text-red">
              ${(totalIdentifiedExposure / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-inset border border-border px-14 py-8 rounded-sm">
            <div className="text-11 text-muted">EST. RELATOR BOUNTY (15-30%)</div>
            <div className="text-18 font-bold text-sage">
              ${(totalEstimatedBounty / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Provider Table & Filter Matrix */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
          {/* Filter Bar */}
          <div className="p-12 border-b border-border bg-inset flex flex-wrap items-center gap-10">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-10 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search provider name, NPI, address..."
                className="w-full bg-surface border border-border rounded-sm pl-32 pr-12 py-6 text-12 font-mono placeholder:text-muted focus:outline-none focus:border-red"
              />
            </div>

            <select
              value={selectedBorough}
              onChange={(e) => setSelectedBorough(e.target.value)}
              className="bg-surface border border-border rounded-sm px-10 py-6 text-11 font-mono text-secondary focus:outline-none focus:border-red"
            >
              <option value="ALL">All Boroughs</option>
              <option value="Queens">Queens</option>
              <option value="Brooklyn">Brooklyn</option>
              <option value="Bronx">Bronx</option>
              <option value="Manhattan">Manhattan</option>
            </select>

            <select
              value={selectedFacilityType}
              onChange={(e) => setSelectedFacilityType(e.target.value)}
              className="bg-surface border border-border rounded-sm px-10 py-6 text-11 font-mono text-secondary focus:outline-none focus:border-red"
            >
              <option value="ALL">All Facility Types</option>
              <option value="SADC Adult Day Care">SADC Adult Day Care</option>
              <option value="CDPAP Home Care Agency">CDPAP Home Care Agency</option>
              <option value="Specialty Pharmacy">Specialty Pharmacy</option>
              <option value="NEMT Transport Fleet">NEMT Transport Fleet</option>
              <option value="Multi-Specialty Clinic">Multi-Specialty Clinic</option>
            </select>
          </div>

          {/* Table of Providers */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface/80 sticky top-0 border-b border-border text-11 font-mono text-muted uppercase z-10">
                <tr>
                  <th className="py-8 px-14">Provider / Facility</th>
                  <th className="py-8 px-12">Borough</th>
                  <th className="py-8 px-12">Risk Index</th>
                  <th className="py-8 px-12">Exposure</th>
                  <th className="py-8 px-12">Est. Bounty</th>
                  <th className="py-8 px-12">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-12">
                {filteredProviders.map((provider) => {
                  const isSelected = selectedProvider?.id === provider.id;
                  return (
                    <tr
                      key={provider.id}
                      onClick={() => {
                        setSelectedProvider(provider);
                        setCalcRecovery(provider.exposure_amount);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-red/10 border-l-4 border-l-red"
                          : "hover:bg-surface/60"
                      }`}
                    >
                      <td className="py-10 px-14">
                        <div className="font-semibold text-primary">{provider.name}</div>
                        <div className="text-11 text-muted">
                          NPI {provider.npi} · {provider.facility_type}
                        </div>
                      </td>
                      <td className="py-10 px-12 text-secondary">{provider.borough}</td>
                      <td className="py-10 px-12">
                        <span
                          className={`px-6 py-2 rounded-sm text-11 font-bold ${
                            provider.risk_score >= 90
                              ? "bg-red/20 text-red"
                              : provider.risk_score >= 80
                              ? "bg-amber/20 text-amber"
                              : "bg-sage/20 text-sage"
                          }`}
                        >
                          {provider.risk_score}
                        </span>
                      </td>
                      <td className="py-10 px-12 font-bold text-primary">
                        ${(provider.exposure_amount / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-10 px-12 text-sage font-bold">
                        ${(provider.estimated_bounty / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-10 px-12">
                        <span className="px-6 py-2 text-10 uppercase rounded-sm border border-border bg-inset text-secondary">
                          {provider.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detailed Target Dossier & Qui Tam Payout Calculator */}
        <div className="w-full lg:w-[440px] flex flex-col bg-surface overflow-y-auto shrink-0 divide-y divide-border">
          {/* Target Profile */}
          {selectedProvider && (
            <div className="p-20 space-y-16">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-11 font-mono text-muted uppercase">
                    {selectedProvider.facility_type}
                  </span>
                  <span className="text-11 font-mono px-8 py-2 rounded-sm bg-red/10 text-red font-bold">
                    CRITICAL RISK {selectedProvider.risk_score}/100
                  </span>
                </div>
                <h2 className="text-20 font-bold font-jakarta text-primary">
                  {selectedProvider.name}
                </h2>
                <div className="text-12 font-mono text-muted mt-2">
                  {selectedProvider.address}
                </div>
              </div>

              {/* Anomaly Detection Tags */}
              <div className="space-y-6">
                <div className="text-11 font-mono text-muted uppercase">Detected Fraud Patterns</div>
                <div className="flex flex-wrap gap-6">
                  {selectedProvider.anomaly_types.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-8 py-4 rounded-sm bg-inset border border-border text-11 font-mono text-secondary flex items-center gap-4"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber" />
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cross-Vector Municipal Intelligence */}
              {selectedProvider.cross_vector_link && (
                <div className="p-12 rounded-sm bg-canvas border border-amber/30 space-y-6">
                  <div className="flex items-center gap-6 text-11 font-mono text-amber font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>PALANTIR CROSS-VECTOR CORRELATION</span>
                  </div>
                  <p className="text-12 font-outfit text-secondary">
                    {selectedProvider.cross_vector_link}
                  </p>
                </div>
              )}

              {/* Qui Tam Statutory Recovery Breakdown */}
              <div className="bg-inset border border-border p-14 rounded-sm space-y-10 font-mono">
                <div className="flex items-center gap-6 text-11 text-muted uppercase">
                  <Calculator className="w-3.5 h-3.5 text-sage" />
                  <span>Statutory Qui Tam Damages Potential</span>
                </div>
                <div className="space-y-6 text-12">
                  <div className="flex justify-between">
                    <span className="text-muted">Direct Medicaid Billings:</span>
                    <span className="text-primary font-semibold">
                      ${(selectedProvider.exposure_amount / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Treble Damages (3x under NYFCA):</span>
                    <span className="text-red font-semibold">
                      ${((selectedProvider.exposure_amount * 3) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between pt-6 border-t border-border">
                    <span className="text-muted font-bold">Estimated Relator Bounty (25%):</span>
                    <span className="text-sage font-bold text-14">
                      ${(selectedProvider.estimated_bounty / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-8 pt-4">
                <button
                  onClick={() => {
                    if (onOpenWeaponizer) {
                      onOpenWeaponizer(selectedProvider.id, "TRACK_6_NYFCA_QUI_TAM");
                    }
                  }}
                  className="w-full py-10 px-16 bg-red hover:bg-red/90 text-white font-mono font-bold text-12.5 rounded-sm flex items-center justify-center gap-8 transition-colors shadow-panel"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate DOJ Qui Tam Disclosure Memo</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Qui Tam Bounty Simulator */}
          <div className="p-20 space-y-16 bg-inset/50">
            <div className="flex items-center gap-8">
              <Calculator className="w-4 h-4 text-sage" />
              <h3 className="text-14 font-bold font-jakarta text-primary">
                Qui Tam Relator Profit Simulator
              </h3>
            </div>

            <div className="space-y-12 text-12 font-mono">
              <div>
                <div className="flex justify-between text-muted mb-4">
                  <span>Gross Fraud Recovery:</span>
                  <span className="text-primary font-bold">
                    ${(calcRecovery / 1000000).toFixed(1)} Million
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="30000000"
                  step="250000"
                  value={calcRecovery}
                  onChange={(e) => setCalcRecovery(Number(e.target.value))}
                  className="w-full accent-sage"
                />
              </div>

              <div>
                <div className="flex justify-between text-muted mb-4">
                  <span>Relator Share (NYS False Claims Act § 190):</span>
                  <span className="text-sage font-bold">{calcRelatorPct}%</span>
                </div>
                <div className="flex gap-8">
                  {[15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setCalcRelatorPct(pct)}
                      className={`flex-1 py-4 text-11 rounded-sm border ${
                        calcRelatorPct === pct
                          ? "bg-sage border-sage text-canvas font-bold"
                          : "bg-surface border-border text-muted hover:text-primary"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-12 rounded-sm bg-surface border border-sage/30 flex items-center justify-between">
                <div>
                  <div className="text-10 text-muted uppercase">NET WHISTLEBLOWER PAYOUT</div>
                  <div className="text-20 font-bold text-sage">
                    ${estimatedWhistleblowerShare.toLocaleString()}
                  </div>
                </div>
                <div className="text-11 font-outfit text-muted text-right max-w-[130px]">
                  Subject to attorney relator fee agreement & government intervention
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
