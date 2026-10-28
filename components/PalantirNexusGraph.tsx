"use client";

import { useState, useMemo } from "react";
import { PalantirGraphNode, PalantirGraphData } from "@/types";
import {
  Shield,
  AlertTriangle,
  Building,
  Truck,
  MapPin,
  Hash,
  Search,
  ExternalLink,
  Zap,
  ZoomIn,
  RotateCcw,
} from "lucide-react";

interface PalantirNexusGraphProps {
  graphData: PalantirGraphData;
  availableNpis?: string[];
  onSelectProvider?: (npi: string) => void;
}

export default function PalantirNexusGraph({
  graphData,
  availableNpis = [],
  onSelectProvider,
}: PalantirNexusGraphProps) {
  const [selectedNode, setSelectedNode] = useState<PalantirGraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Balanced coordinates for visual stability in SVG
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {
      "DEMO-SADC-001": { x: 260, y: 260 },
      "DEMO-SADC-002": { x: 300, y: 450 },
      "DEMO-SADC-003": { x: 640, y: 260 },
      SampleHauler01: { x: 450, y: 320 },
      SampleIndustrialHub: { x: 180, y: 400 },
      SunsetParkIndustrial: { x: 450, y: 140 },
      HCPCS_T2024: { x: 220, y: 90 },
      OATH_DUMPING_HIT: { x: 450, y: 470 },
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
        return "#f87171"; // Clinical Red
      case "COMMERCIAL_HAULER":
        return "#fbbf24"; // Muted Amber
      case "CORPORATE_SHELL":
        return "#c084fc"; // Violet
      case "PHYSICAL_HUB":
        return "#38bdf8"; // Clinical Slate Blue
      case "BILLING_CODE":
        return "#34d399"; // Emerald
      case "ENFORCEMENT_RECORD":
        return "#fb7185"; // Rose
      default:
        return "#94a3b8";
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "HEALTHCARE_PROVIDER":
        return <Shield className="w-3.5 h-3.5 text-red-400" />;
      case "COMMERCIAL_HAULER":
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      case "CORPORATE_SHELL":
        return <Building className="w-3.5 h-3.5 text-purple-400" />;
      case "PHYSICAL_HUB":
        return <MapPin className="w-3.5 h-3.5 text-sky-400" />;
      case "BILLING_CODE":
        return <Hash className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-[#0A0A0C] text-[#EDECE9] overflow-hidden">
      {/* Graph Visual Canvas */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Top Controls Toolbar */}
        <div className="p-4 border-b border-white/[0.08] bg-[#141416]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                Entity Network Graph
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-emerald-400 border border-emerald-500/20">
                {graphData.nodes.length} Nodes Linked
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities, NPI, codes..."
                className="bg-[#18181B] border border-white/[0.08] rounded pl-8 pr-3 py-1 text-xs font-mono text-[#EDECE9] placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.2] w-56"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              {["ALL", "HEALTHCARE_PROVIDER", "COMMERCIAL_HAULER", "CORPORATE_SHELL", "PHYSICAL_HUB"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-1 text-[10px] font-mono uppercase rounded border transition-colors ${
                    filterType === type
                      ? "bg-white/[0.1] border-white/[0.2] text-white font-medium"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {type === "ALL" ? "ALL" : type.replace("_", " ").slice(0, 10)}
                </button>
              ))}
            </div>

            {/* Zoom / Reset Controls */}
            <div className="flex items-center gap-1 bg-[#18181B] p-0.5 rounded border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
                className="px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
                <span className="hidden sm:inline">Zoom</span>
              </button>
              <div className="w-[1px] h-3 bg-white/10"></div>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                title="Reset View"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Immersive Canvas Background with Radial Gradient & Dot Grid */}
        <div className="flex-1 relative overflow-auto flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E1E24] via-[#121212] to-[#0A0A0A]">
          {/* Subtle Dot Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>

          <div
            className="w-full h-full min-h-[540px] relative transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg
              className="w-full h-full min-h-[540px] select-none absolute inset-0"
              viewBox="0 0 900 560"
            >
              {/* Connecting Dashed SVG Lines */}
              {graphData.edges.map((edge, idx) => {
                const srcPos = nodePositions[edge.source] || { x: 450, y: 280 };
                const tgtPos = nodePositions[edge.target] || { x: 450, y: 280 };
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
                      stroke={isSelected ? "#fbbf24" : "rgba(255, 255, 255, 0.15)"}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? "none" : "4 4"}
                    />
                    {isSelected && (
                      <text
                        x={midX}
                        y={midY - 4}
                        fill="#fbbf24"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="bg-black/90 px-1 py-0.5"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Precision Floating Node Chips (HTML Badges for Ultra-Crisp Typography) */}
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id] || { x: 450, y: 280 };
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: `${(pos.x / 900) * 100}%`,
                    top: `${(pos.y / 560) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => setSelectedNode(node)}
                  className={`cursor-pointer transition-all duration-150 rounded-lg p-3 shadow-xl backdrop-blur-md max-w-[210px] select-none ${
                    isSelected
                      ? "bg-[#222228] border-2 border-amber-400 ring-2 ring-amber-400/20 z-30"
                      : "bg-[#18181B]/95 border border-white/[0.12] hover:border-white/[0.25] hover:bg-[#1E1E24] z-20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] font-mono text-zinc-400 uppercase truncate">
                        {node.type.replace("_", " ")}
                      </span>
                    </div>
                    {/* Status & Confidence Score Pill */}
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded border font-semibold shrink-0 ${
                        node.risk >= 90
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {node.risk >= 90 ? `RISK ${node.risk}` : "VERIFIED"}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-[#EDECE9] truncate font-sans">
                    {node.name}
                  </p>

                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-zinc-500">
                    <span>{node.npi ? `NPI: ${node.npi}` : node.id}</span>
                    {node.fine && (
                      <span className="text-amber-400/80 font-semibold">{node.fine.split("–")[0]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Legend / Info Footer */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-zinc-500 font-mono z-10 pt-3 border-t border-white/[0.06] bg-[#0A0A0C]/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border">
            <div className="flex items-center gap-4">
              <span>Active filter: All verified filings</span>
              <span className="hidden sm:inline text-zinc-600">|</span>
              <span className="hidden sm:flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Healthcare
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1"></span> Hauler
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 ml-1"></span> Shell
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 ml-1"></span> Hub
              </span>
            </div>
            <span
              onClick={() => setSelectedNode(null)}
              className="text-zinc-400 hover:text-white hover:underline cursor-pointer"
            >
              Clear selection
            </span>
          </div>
        </div>
      </div>

      {/* Target Dossier / Inspector Drawer */}
      <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#18181B] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#EDECE9] font-bold">
              Entity Dossier
            </span>
          </div>
          {selectedNode && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-400">
              ID: {selectedNode.id}
            </span>
          )}
        </div>

        {selectedNode ? (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getNodeIcon(selectedNode.type)}
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  {selectedNode.type.replace("_", " ")}
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-[#EDECE9] font-sans">
                {selectedNode.name}
              </h2>
            </div>

            {/* Risk & Exposure Box */}
            <div className="grid grid-cols-2 gap-3 bg-[#141416] p-3 rounded-lg border border-white/[0.08]">
              <div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Multi-Signal Index</div>
                <div
                  className={`text-2xl font-mono font-bold mt-1 ${
                    selectedNode.risk >= 90 ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {selectedNode.risk}/100
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Statutory Ceiling</div>
                <div className="text-sm font-mono font-bold text-[#EDECE9] mt-1">
                  {selectedNode.fine || "$3.5M–$14.2M"}
                </div>
                <div className="text-[9px] font-mono text-zinc-500">Unadjudicated Estimate</div>
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="space-y-2 text-xs font-mono bg-[#141416] p-3 rounded-lg border border-white/[0.08]">
              {selectedNode.npi && (
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-zinc-400">NPI Registry:</span>
                  <span className="text-[#EDECE9] font-semibold">{selectedNode.npi}</span>
                </div>
              )}
              {selectedNode.state && (
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Corporate Entity:</span>
                  <span className="text-[#EDECE9] font-semibold">{selectedNode.state} DOS Registered</span>
                </div>
              )}
              {selectedNode.borough && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Borough Market:</span>
                  <span className="text-[#EDECE9] font-semibold">{selectedNode.borough}</span>
                </div>
              )}
            </div>

            {/* Historical Entity Resolution Timeline */}
            <div className="bg-[#141416] border border-white/[0.08] rounded-lg p-3 space-y-2 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 uppercase font-bold text-[10px]">
                <Shield className="w-3.5 h-3.5" />
                <span>Historical Entity Resolution</span>
              </div>
              <div className="space-y-1.5 text-zinc-400">
                <div className="flex items-start gap-2">
                  <span className="text-[#EDECE9] font-bold">2021:</span>
                  <span>Formed under NYS DOS Division of Corporations.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#EDECE9] font-bold">2023:</span>
                  <span>Co-located Suite 2B with logistics freight hauler shell.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#EDECE9] font-bold">2026:</span>
                  <span>Procedure code T2003 billing accelerates +240% over 90 days.</span>
                </div>
              </div>
            </div>

            {/* Cross-Vector Notice */}
            <div className="bg-[#141416] border border-amber-500/20 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>BBL Co-Location Vector</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Entity shares address or corporate suite with commercial hauler record cited under Track 1/5.
              </p>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/[0.06]">
                Notice: Shared address is an investigative screening lead, not a judicial finding.
              </div>
            </div>

            {/* Actions */}
            {selectedNode.npi && availableNpis.includes(selectedNode.npi) && onSelectProvider && (
              <button
                type="button"
                onClick={() => onSelectProvider(selectedNode.npi!)}
                className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Inspect in Healthcare Radar</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <Zap className="w-8 h-8 text-zinc-700 mb-3" />
            <div className="text-sm font-mono text-zinc-300 mb-1 font-semibold">No Entity Selected</div>
            <p className="text-xs text-zinc-500 max-w-[220px]">
              Click on any floating node chip in the network graph to inspect corporate shell linkages and violation records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
