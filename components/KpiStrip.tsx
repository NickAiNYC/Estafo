"use client";

import TelemetryStrip from "./metrics/TelemetryStrip";

export type LayerId = "dumping" | "noise" | "permits" | "evidence" | "zones" | "medicaid";

interface KpiStripProps {
  counts: Record<LayerId, number>;
  hoveredLayer: LayerId | null;
  onHoverLayer: (layer: LayerId | null) => void;
  onSelectLayer?: (layer: LayerId) => void;
  activeLayers?: Set<LayerId>;
}

export default function KpiStrip({
  counts,
  hoveredLayer,
  onHoverLayer,
  onSelectLayer = () => {},
  activeLayers = new Set<LayerId>(["dumping", "noise", "medicaid", "permits", "evidence", "zones"]),
}: KpiStripProps) {
  return (
    <TelemetryStrip
      counts={counts}
      hoveredLayer={hoveredLayer}
      onHoverLayer={onHoverLayer}
      onSelectLayer={onSelectLayer}
      activeLayers={activeLayers}
    />
  );
}
