"use client";

import { useMemo } from "react";
import Sparkline from "./Sparkline";
import { LayerId } from "@/components/KpiStrip";
import { TrendingUp } from "lucide-react";

interface TelemetryStripProps {
  counts: Record<LayerId, number>;
  hoveredLayer: LayerId | null;
  onHoverLayer: (layer: LayerId | null) => void;
  onSelectLayer: (layer: LayerId) => void;
  activeLayers: Set<LayerId>;
}

export default function TelemetryStrip({
  counts,
  hoveredLayer,
  onHoverLayer,
  onSelectLayer,
  activeLayers,
}: TelemetryStripProps) {
  const cards = useMemo(() => [
    {
      id: "medicaid" as LayerId,
      label: "REALIZED CITIZEN REVENUE",
      value: "$16,350",
      subtext: "OATH DEP Disbursals Settled",
      delta: "+$3,850 batch",
      trendColor: "emerald" as const,
      sparkData: [4, 6, 8, 10, 12.5, 14, 16.35],
      bountyTag: "NET REALIZED CASH",
    },
    {
      id: "dumping" as LayerId,
      label: "DSNY COMMERCIAL DUMPING",
      value: `${counts.dumping ?? 0}`,
      subtext: "NYC Admin Code § 16-119",
      delta: "Up to 50% upon collection",
      trendColor: "amber" as const,
      sparkData: [0, 2, 5, 8, 12, 14, counts.dumping || 1],
      bountyTag: "$1,500–$4,000 FINE",
    },
    {
      id: "noise" as LayerId,
      label: "DEP CITIZEN AIR IDLING",
      value: `${counts.noise ?? 0}`,
      subtext: "NYC Admin Code § 24-182",
      delta: "25% citizen reward (>3 min)",
      trendColor: "steel" as const,
      sparkData: [0, 3, 7, 10, 15, counts.noise || 1],
      bountyTag: "$87.50–$250 / SUMMONS",
    },
    {
      id: "evidence" as LayerId,
      label: "VERIFIED EVIDENCE PACKS",
      value: `${counts.evidence ?? 0}`,
      subtext: "Field Video & Plate Matches",
      delta: "SHA-256 Digest Valid",
      trendColor: "emerald" as const,
      sparkData: [1, 2, 4, 6, 8, counts.evidence || 1],
      bountyTag: "TIMED & TAGGED",
    },
    {
      id: "permits" as LayerId,
      label: "DOB COMPLAINT CORRIDORS",
      value: `${counts.permits ?? 0}`,
      subtext: "NYC Admin Code § 28-213",
      delta: "Unpermitted demo / commercial",
      trendColor: "steel" as const,
      sparkData: [2, 4, 6, 8, counts.permits || 1],
      bountyTag: "TRACK 11 DOB",
    },
    {
      id: "zones" as LayerId,
      label: "ACTIVE PATROL ZONES",
      value: `${counts.zones ?? 0}`,
      subtext: "Ranked by Complaint Frequency",
      delta: "Time-of-day density",
      trendColor: "emerald" as const,
      sparkData: [1, 2, 3, 4, counts.zones || 1],
      bountyTag: "FIELD ROUTE",
    },
  ], [counts]);

  return (
    <div className="bg-inset border-b border-border px-20 py-10 flex gap-10 overflow-x-auto shrink-0 select-none">
      {cards.map((card) => {
        const isHovered = hoveredLayer === card.id;
        const isActive = activeLayers.has(card.id);

        return (
          <div
            key={card.id}
            onMouseEnter={() => onHoverLayer(card.id)}
            onMouseLeave={() => onHoverLayer(null)}
            onClick={() => onSelectLayer(card.id)}
            className={`
              flex-1 min-w-[200px] p-12 rounded-sm border cursor-pointer transition-all duration-150 flex flex-col justify-between
              ${isActive 
                ? "bg-surface/90 border-border hover:border-border-highlight" 
                : "bg-surface/40 border-border/50 opacity-60 hover:opacity-100"}
              ${isHovered ? "border-amber/40 shadow-tactical -translate-y-0.5" : "shadow-panel"}
            `}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-6 mb-4">
              <span className="text-10 font-mono text-muted uppercase tracking-wider truncate">
                {card.label}
              </span>
              <span className="text-9 font-mono px-5 py-1 rounded-sm bg-canvas border border-border text-secondary font-semibold shrink-0">
                {card.bountyTag}
              </span>
            </div>

            {/* Main Value & Sparkline */}
            <div className="flex items-baseline justify-between gap-8 my-2">
              <div className="text-22 font-mono font-bold tracking-tight text-primary">
                {card.value}
              </div>
              <Sparkline data={card.sparkData} color={card.trendColor} width={58} height={20} />
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between text-10 font-mono text-muted pt-2 border-t border-border/40">
              <span className="truncate">{card.subtext}</span>
              <span className="text-emerald font-semibold flex items-center gap-2 shrink-0">
                <TrendingUp className="w-3 h-3" />
                {card.delta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
