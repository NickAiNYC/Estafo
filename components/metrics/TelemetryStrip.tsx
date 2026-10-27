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
      label: "TOTAL IDENTIFIED RECOVERY",
      value: "$38.4M",
      subtext: "NYFCA Qui Tam Relator",
      delta: "+$3.55M 24h",
      trendColor: "crimson" as const,
      sparkData: [14, 18, 22, 26, 29, 32, 34, 38.4],
      bountyTag: "EST. $9.6M BOUNTY",
    },
    {
      id: "dumping" as LayerId,
      label: "DSNY COMMERCIAL DUMPING",
      value: `${counts.dumping || 142}`,
      subtext: "50% of up to $18k fines",
      delta: "+8 packs",
      trendColor: "amber" as const,
      sparkData: [102, 110, 118, 124, 129, 135, 142],
      bountyTag: "$9,000 / HIT",
    },
    {
      id: "noise" as LayerId,
      label: "CLEAN AIR ACT IDLING",
      value: `${counts.noise || 365}`,
      subtext: "50% OATH Citizen Bounty",
      delta: "+14 hits",
      trendColor: "steel" as const,
      sparkData: [310, 325, 332, 345, 350, 358, 365],
      bountyTag: "$175–$1,000",
    },
    {
      id: "evidence" as LayerId,
      label: "FORENSIC EVIDENCE PACKS",
      value: `${counts.evidence || 14}`,
      subtext: "Telephone Standby Certified",
      delta: "100% Hash Valid",
      trendColor: "emerald" as const,
      sparkData: [4, 6, 8, 9, 11, 12, 14],
      bountyTag: "ZERO REJECTS",
    },
    {
      id: "permits" as LayerId,
      label: "DOB ACTIVE PERMIT HUBS",
      value: `${counts.permits || 48}`,
      subtext: "Demolition & STR LL18",
      delta: "+3 unpermitted",
      trendColor: "steel" as const,
      sparkData: [38, 40, 42, 45, 46, 47, 48],
      bountyTag: "TRACK 11 & 12",
    },
    {
      id: "zones" as LayerId,
      label: "TACTICAL PATROL ZONES",
      value: `${counts.zones || 10}`,
      subtext: "Ranked by Payout Density",
      delta: "High Yield",
      trendColor: "emerald" as const,
      sparkData: [50, 58, 64, 70, 72],
      bountyTag: "TOP: HERALD SQ",
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
