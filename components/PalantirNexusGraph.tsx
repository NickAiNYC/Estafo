"use client";

import { useState, useMemo } from "react";
import { PalantirGraphNode, PalantirGraphData } from "@/types";
import { Shield, AlertTriangle, Building, Truck, MapPin, Hash, Search, ExternalLink, Zap } from "lucide-react";

interface PalantirNexusGraphProps {
  graphData: PalantirGraphData;
  availableNpis?: string[];
  onSelectProvider?: (npi: string) => void;
}

export default function PalantirNexusGraph({ graphData, availableNpis = [], onSelectProvider }: PalantirNexusGraphProps) {
  const [selectedNode, setSelectedNode] = useState<PalantirGraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Preset coordinates for visual stability in SVG
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {
      "DEMO-SADC-001": { x: 260, y: 260 },
      "DEMO-SADC-002": { x: 300, y: 450 },
      "DEMO-SADC-003": { x: 620, y: 260 },
      SampleHauler01: { x: 450, y: 320 },
      SampleIndustrialHub: { x: 180, y: 400 },
      SunsetParkIndustrial: { x: 450, y: 150 },
      HCPCS_T2024: { x: 200, y: 80 },
      OATH_DUMPING_HIT: { x: 450, y: 460 },
    };
    return positions;
  }, []);

  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((node) => {
      const matchesType = filterType === "ALL" || node.type === filterType;
      const matchesQuery =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.npi && node.npi.includes(searchQuery));
      return matchesType && matchesQuery;
    });
  }, [graphData.nodes, filterType, searchQuery]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case "HEALTHCARE_PROVIDER":
        return "#ef4444"; // Neon Red
      case "COMMERCIAL_HAULER":
        return "#d4a959"; // Amber Gold
      case "CORPORATE_SHELL":
        return "#a855f7"; // Violet
      case "PHYSICAL_HUB":
        return "#06b6d4"; // Cyan
      case "BILLING_CODE":
        return "#10b981"; // Emerald
      case "ENFORCEMENT_RECORD":
        return "#f43f5e"; // Rose
      default:
        return "#94a3b8";
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "HEALTHCARE_PROVIDER":
        return <Shield className="w-4 h-4 text-red-400" />;
      case "COMMERCIAL_HAULER":
        return <Truck className="w-4 h-4 text-amber-400" />;
      case "CORPORATE_SHELL":
        return <Building className="w-4 h-4 text-purple-400" />;
      case "PHYSICAL_HUB":
        return <MapPin className="w-4 h-4 text-cyan-400" />;
      case "BILLING_CODE":
        return <Hash className="w-4 h-4 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-canvas text-primary overflow-hidden">
      {/* Graph Visual Canvas */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Controls Toolbar */}
        <div className="p-16 border-b border-border bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-12 z-10">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-6 text-12.5 font-mono text-muted uppercase">
              <Zap className="w-4 h-4 text-amber" />
              <span>Cross-Vector Link Analysis</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-10 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities, NPI, plates..."
                className="bg-inset border border-border rounded-sm pl-32 pr-12 py-4 text-12.5 font-mono placeholder:text-muted focus:outline-none focus:border-amber w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {["ALL", "HEALTHCARE_PROVIDER", "COMMERCIAL_HAULER", "CORPORATE_SHELL", "PHYSICAL_HUB"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-10 py-4 text-11 font-mono uppercase rounded-sm border transition-all ${
                  filterType === type
                    ? "bg-surface border-amber text-amber font-semibold shadow-panel"
                    : "bg-canvas/40 border-border text-muted hover:text-secondary"
                }`}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Canvas Area */}
        <div className="flex-1 relative overflow-auto flex items-center justify-center p-24">
          <svg className="w-full h-full min-h-[560px] min-w-[700px] select-none" viewBox="0 0 900 580">
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="nexusGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nexusGrid)" />

            {/* Edges */}
            {graphData.edges.map((edge, idx) => {
              const srcPos = nodePositions[edge.source] || { x: 450, y: 290 };
              const tgtPos = nodePositions[edge.target] || { x: 450, y: 290 };
              const isSelected =
                selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

              const midX = (srcPos.x + tgtPos.x) / 2;
              const midY = (srcPos.y + tgtPos.y) / 2;

              return (
                <g key={idx}>
                  <line
                    x1={srcPos.x}
                    y1={srcPos.y}
                    x2={tgtPos.x}
                    y2={tgtPos.y}
                    stroke={isSelected ? "#f2c744" : "rgba(255, 255, 255, 0.18)"}
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    strokeDasharray={isSelected ? "none" : "3,3"}
                  />
                  {isSelected && (
                    <text
                      x={midX}
                      y={midY - 4}
                      fill="#f2c744"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="bg-black/80 px-4 py-1"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id] || { x: 450, y: 290 };
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-transform duration-150 hover:scale-110"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Outer pulse aura if critical */}
                  {node.risk >= 90 && (
                    <circle
                      r="22"
                      fill={color}
                      opacity="0.18"
                      className="animate-pulse"
                    />
                  )}
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      r="19"
                      fill="none"
                      stroke="#f2c744"
                      strokeWidth="2.5"
                    />
                  )}
                  {/* Node Circle */}
                  <circle
                    r="14"
                    fill="#16161b"
                    stroke={color}
                    strokeWidth="2"
                  />
                  {/* Inner Risk Core */}
                  <circle
                    r="6"
                    fill={color}
                  />
                  {/* Node Name Label */}
                  <text
                    y="26"
                    fill={isSelected ? "#f2c744" : "#f2f2f0"}
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="font-medium tracking-tight drop-shadow-md"
                  >
                    {node.name.length > 22 ? `${node.name.substring(0, 20)}...` : node.name}
                  </text>
                  {/* Risk Badge */}
                  <text
                    y="-16"
                    fill={color}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="font-bold"
                  >
                    RISK {node.risk}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-16 left-16 bg-surface/90 border border-border rounded-sm p-12 backdrop-blur-md text-11 font-mono flex items-center gap-16">
            <div className="flex items-center gap-6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Healthcare Provider</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Commercial Hauler</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Corporate Shell</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Physical Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Dossier / Inspector Drawer */}
      <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-border bg-surface flex flex-col shrink-0">
        <div className="p-16 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Shield className="w-4 h-4 text-amber" />
            <span className="text-12.5 font-mono uppercase tracking-wider text-primary font-bold">
              Entity Dossier
            </span>
          </div>
          {selectedNode && (
            <span className="text-11 font-mono px-8 py-2 rounded-sm bg-inset border border-border text-muted">
              ID: {selectedNode.id}
            </span>
          )}
        </div>

        {selectedNode ? (
          <div className="p-20 flex-1 overflow-y-auto space-y-16">
            <div>
              <div className="flex items-center gap-8 mb-4">
                {getNodeIcon(selectedNode.type)}
                <span className="text-11 font-mono text-muted uppercase">
                  {selectedNode.type.replace("_", " ")}
                </span>
              </div>
              <h2 className="text-18 font-bold tracking-tight text-primary">
                {selectedNode.name}
              </h2>
            </div>

            {/* Risk & Exposure Box */}
            <div className="grid grid-cols-2 gap-12 bg-inset p-12 rounded-sm border border-border">
              <div>
                <div className="text-10 font-mono text-muted uppercase">Multi-Signal Index</div>
                <div className={`text-20 font-mono font-bold ${selectedNode.risk >= 90 ? "text-red-400" : "text-amber-400"}`}>
                  {selectedNode.risk}/100
                </div>
              </div>
              <div>
                <div className="text-10 font-mono text-muted uppercase">Statutory Exposure</div>
                <div className="text-16 font-mono font-bold text-secondary">
                  {selectedNode.fine || "$3.5M–$14.2M"}
                </div>
                <div className="text-9 font-mono text-muted">Unadjudicated Ceiling</div>
              </div>
            </div>

            {/* Technical Metadata & Historical Entity Resolution (Component 1) */}
            <div className="space-y-8 text-11 font-mono">
              {selectedNode.npi && (
                <div className="flex justify-between py-5 border-b border-border/50">
                  <span className="text-muted">NPI Registry:</span>
                  <span className="text-primary font-semibold">{selectedNode.npi}</span>
                </div>
              )}
              {selectedNode.state && (
                <div className="flex justify-between py-5 border-b border-border/50">
                  <span className="text-muted">Corporate Entity:</span>
                  <span className="text-primary font-semibold">{selectedNode.state} DOS Registered</span>
                </div>
              )}
              {selectedNode.borough && (
                <div className="flex justify-between py-5 border-b border-border/50">
                  <span className="text-muted">Borough Market:</span>
                  <span className="text-primary font-semibold">{selectedNode.borough}</span>
                </div>
              )}
            </div>

            {/* Historical Entity Resolution Timeline (The Moat) */}
            <div className="bg-inset border border-border rounded-sm p-12 space-y-8 font-mono text-10">
              <div className="flex items-center gap-6 text-emerald uppercase font-bold">
                <Shield className="w-3.5 h-3.5 text-emerald" />
                <span>Historical Entity Resolution (Component 1)</span>
              </div>
              <div className="space-y-6 text-muted">
                <div className="flex items-start gap-6">
                  <span className="text-primary font-bold">2021:</span>
                  <span>Formed under NYS DOS Division of Corporations.</span>
                </div>
                <div className="flex items-start gap-6">
                  <span className="text-primary font-bold">2023:</span>
                  <span>Co-located Suite 2B with logistics freight hauler shell.</span>
                </div>
                <div className="flex items-start gap-6">
                  <span className="text-primary font-bold">2026:</span>
                  <span>Procedure code T2003 billing accelerates +240% over 90 days.</span>
                </div>
              </div>
            </div>

            {/* Cross-Vector Palantir Insight with Strict Evidence Notice */}
            <div className="bg-canvas border border-border-highlight/40 rounded-sm p-12 space-y-6">
              <div className="flex items-center gap-6 text-gold text-11 font-mono font-bold uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-gold" />
                <span>Physical BBL Co-Location Link</span>
              </div>
              <p className="text-11 font-sans text-secondary leading-relaxed">
                Entity shares address or suite with commercial freight hauler cited under Track 1/5.
              </p>
              <div className="text-9 font-mono text-muted bg-inset p-6 rounded-sm border border-border">
                LEGAL NOTICE: A shared address is an investigative lead; it does NOT establish common ownership or legal liability.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-8 space-y-8">
              {selectedNode.npi ? (
                availableNpis.includes(selectedNode.npi) && onSelectProvider ? (
                  <button
                    onClick={() => onSelectProvider(selectedNode.npi!)}
                    className="w-full py-10 px-16 bg-emerald/20 hover:bg-emerald/30 border border-emerald text-emerald font-mono font-bold text-11 rounded-sm flex items-center justify-center gap-8 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Inspect Lead in Screening Radar</span>
                  </button>
                ) : (
                  <div className="p-10 bg-inset rounded-sm border border-border text-10 font-mono text-muted text-center leading-relaxed">
                    Graph entity ({selectedNode.npi}) has no active screening lead in current cohort
                  </div>
                )
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-24 text-center text-muted">
            <Zap className="w-8 h-8 text-border mb-12" />
            <div className="text-14 font-mono text-secondary mb-4">No Entity Selected</div>
            <p className="text-12 font-outfit max-w-[220px]">
              Click on any node in the Palantir knowledge graph to inspect corporate shell linkages and violation records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
