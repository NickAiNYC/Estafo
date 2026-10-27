"use client";

import clsx from "clsx";

export type LayerId = "dumping" | "noise" | "permits" | "evidence" | "zones" | "medicaid";

interface KpiStripProps {
  counts: Record<LayerId, number>;
  hoveredLayer: LayerId | null;
  onHoverLayer: (layer: LayerId | null) => void;
}

const ITEMS: { id: LayerId; label: string; colorClass: string; sublabel?: string }[] = [
  { id: "dumping", label: "DUMPING", colorClass: "text-amber", sublabel: "$9k / hit" },
  { id: "noise", label: "IDLING / CAC", colorClass: "text-steel-blue", sublabel: "50% OATH" },
  { id: "medicaid", label: "MEDICAID FRAUD", colorClass: "text-red", sublabel: "NYFCA Qui Tam" },
  { id: "permits", label: "DOB PERMITS", colorClass: "text-sage", sublabel: "Active sites" },
  { id: "evidence", label: "EVIDENCE PACKS", colorClass: "text-gold", sublabel: "Validated" },
  { id: "zones", label: "PATROL ZONES", colorClass: "text-primary", sublabel: "Ranked" },
];

export default function KpiStrip({ counts, hoveredLayer, onHoverLayer }: KpiStripProps) {
  return (
    <div className="flex gap-12 px-24 py-12 bg-inset shrink-0 overflow-x-auto border-b border-border">
      {ITEMS.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => onHoverLayer(item.id)}
          onMouseLeave={() => onHoverLayer(null)}
          className={clsx(
            "flex flex-col justify-center bg-surface border border-border rounded-sm px-16 py-10 min-w-[130px] transition-all duration-150 cursor-pointer",
            hoveredLayer === item.id ? "bg-surface-hover border-border-hover scale-[1.02]" : "hover:bg-surface-hover hover:border-border-hover",
            "shadow-panel"
          )}
        >
          <div className="flex items-baseline justify-between gap-8">
            <div className={clsx("text-22 font-mono font-bold", item.colorClass)}>
              {counts[item.id]?.toLocaleString() || 0}
            </div>
            {item.sublabel && (
              <span className="text-10 font-mono text-muted uppercase">
                {item.sublabel}
              </span>
            )}
          </div>
          <div className="text-11 text-muted font-outfit mt-2 tracking-tight">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
