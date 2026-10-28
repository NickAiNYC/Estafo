"use client";

import { LayerId } from "@/components/KpiStrip";

interface TelemetryStripProps {
  counts: Record<LayerId, number>;
  hoveredLayer: LayerId | null;
  onHoverLayer: (layer: LayerId | null) => void;
  onSelectLayer: (layer: LayerId) => void;
  activeLayers: Set<LayerId>;
}

const cards: { id: LayerId; label: string; source: string }[] = [
  { id: "dumping", label: "Dumping reports", source: "NYC 311 SODA" },
  { id: "noise", label: "Idling reports", source: "NYC 311 SODA" },
  { id: "zones", label: "Saved corridors", source: "Sample workspace" },
  { id: "permits", label: "Permit examples", source: "Sample data" },
  { id: "evidence", label: "Evidence examples", source: "Sample data" },
  { id: "medicaid", label: "Healthcare leads", source: "Restricted radar" },
];

export default function TelemetryStrip({ counts, onHoverLayer, onSelectLayer, activeLayers }: TelemetryStripProps) {
  return (
    <section className="shrink-0 border-b border-white/[0.08] bg-[#0A0A0C] px-4 py-2.5 md:px-6" aria-label="Map layers">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-lg bg-[#18181B] border border-white/[0.08] divide-x divide-y sm:divide-y-0 divide-white/[0.08] overflow-hidden shadow-xl">
        {cards.map((card) => {
          const active = activeLayers.has(card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectLayer(card.id)}
              onMouseEnter={() => onHoverLayer(card.id)}
              onMouseLeave={() => onHoverLayer(null)}
              aria-pressed={active}
              className={`min-w-0 p-3 text-left transition-all ${
                active
                  ? "bg-white/[0.08] text-[#EDECE9]"
                  : "bg-transparent text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="truncate text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  {card.label}
                </span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
              </div>
              <span className="block font-mono text-xl font-semibold leading-tight tabular-nums text-[#EDECE9]">
                {(counts[card.id] ?? 0).toLocaleString()}
              </span>
              <span className="mt-1 block truncate text-[10px] font-mono text-zinc-500">
                {card.source}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
