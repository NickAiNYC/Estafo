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
  { id: "dumping", label: "Dumping reports", source: "NYC 311" },
  { id: "noise", label: "Idling reports", source: "NYC 311" },
  { id: "zones", label: "Saved corridors", source: "Sample workspace" },
  { id: "permits", label: "Permit examples", source: "Sample data" },
  { id: "evidence", label: "Evidence examples", source: "Sample data" },
  { id: "medicaid", label: "Healthcare leads", source: "Restricted" },
];

export default function TelemetryStrip({ counts, onHoverLayer, onSelectLayer, activeLayers }: TelemetryStripProps) {
  return (
    <section className="grid shrink-0 grid-cols-2 gap-2 border-b border-border bg-canvas px-4 py-3 sm:grid-cols-3 lg:grid-cols-6 md:px-6" aria-label="Map layers">
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
            className={`min-w-0 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald ${
              active ? "border-border-highlight bg-surface text-primary" : "border-border bg-inset text-muted hover:text-secondary"
            }`}
          >
            <span className="block truncate text-xs text-secondary">{card.label}</span>
            <span className="mt-1 block text-xl font-semibold leading-tight tabular-nums">{counts[card.id] ?? 0}</span>
            <span className="block truncate text-xs text-muted">{card.source}</span>
          </button>
        );
      })}
    </section>
  );
}
