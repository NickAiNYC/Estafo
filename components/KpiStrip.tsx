"use client";

import clsx from "clsx";

export type LayerId = "dumping" | "noise" | "permits" | "evidence" | "zones";

interface KpiStripProps {
  counts: Record<LayerId, number>;
  hoveredLayer: LayerId | null;
  onHoverLayer: (layer: LayerId | null) => void;
}

const ITEMS: { id: LayerId; label: string; colorClass: string }[] = [
  { id: "dumping", label: "DUMPING", colorClass: "text-amber" },
  { id: "noise", label: "NOISE", colorClass: "text-steel-blue" },
  { id: "permits", label: "PERMIT", colorClass: "text-sage" },
  { id: "evidence", label: "EVIDENCE", colorClass: "text-gold" },
  { id: "zones", label: "ZONES", colorClass: "text-primary" },
];

export default function KpiStrip({ counts, onHoverLayer }: KpiStripProps) {
  return (
    <div className="flex gap-16 px-24 py-16 bg-inset shrink-0 overflow-x-auto">
      {ITEMS.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => onHoverLayer(item.id)}
          onMouseLeave={() => onHoverLayer(null)}
          className={clsx(
            "flex flex-col justify-center bg-surface border border-border rounded-sm px-24 py-16 min-w-[120px] transition-all duration-150 cursor-default",
            "hover:bg-surface-hover hover:border-border-hover shadow-panel"
          )}
        >
          <div className={clsx("text-26 font-mono", item.colorClass)}>
            {counts[item.id]?.toLocaleString() || 0}
          </div>
          <div className="text-11 text-muted font-outfit mt-4 tracking-tight">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
