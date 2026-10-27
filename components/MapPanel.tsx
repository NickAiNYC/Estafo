"use client";

import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer, ColumnLayer } from "@deck.gl/layers";
import { LightingEffect, AmbientLight, DirectionalLight } from "@deck.gl/core";
import { DumpingRecord, NoiseRecord, PermitRecord, EvidenceRecord, ZoneRecord, MedicaidProviderRecord } from "@/types";
import { LayerId } from "./KpiStrip";

import "maplibre-gl/dist/maplibre-gl.css";

interface MapPanelProps {
  dumping: DumpingRecord[];
  noise: NoiseRecord[];
  permits: PermitRecord[];
  evidence: EvidenceRecord[];
  zones: ZoneRecord[];
  medicaid?: MedicaidProviderRecord[];
  activeLayers: Set<LayerId>;
  hoveredKpiLayer: LayerId | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewState: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onViewStateChange: (evt: any) => void;
  onToggleLayer: (layerId: LayerId) => void;
}

// Convert hex to rgb array for deck.gl
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

const COLORS = {
  dumping: [237, 224, 150], // amber ramp start
  noise: hexToRgb("#5ea5d8"),
  permits: hexToRgb("#5fbf97"),
  evidence: hexToRgb("#f2c744"),
  medicaid: hexToRgb("#ef4444"),
  red: hexToRgb("#e06c6c"),
  sage: hexToRgb("#5fbf97"),
  muted: hexToRgb("#7d7f88")
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});
const dirLight = new DirectionalLight({
  color: [255, 255, 255],
  intensity: 2.5,
  direction: [-3, -9, -1]
});
const lightingEffect = new LightingEffect({ ambientLight, dirLight });

export default function MapPanel({
  dumping,
  noise,
  permits,
  evidence,
  zones,
  medicaid = [],
  activeLayers,
  hoveredKpiLayer,
  viewState,
  onViewStateChange,
  onToggleLayer
}: MapPanelProps) {

  const getOpacity = (layerId: LayerId, baseOpacity: number = 1) => {
    if (!hoveredKpiLayer) return baseOpacity;
    return hoveredKpiLayer === layerId ? 1.0 : baseOpacity * 0.4;
  };

  const layers = [
    activeLayers.has("dumping") && new HexagonLayer({
      id: "dumping-hex",
      data: dumping,
      getPosition: (d) => [d.lon, d.lat],
      radius: 120,
      extruded: true,
      elevationScale: 15,
      getColorWeight: () => 1,
      getElevationWeight: () => 1,
      colorRange: [
        [164, 120, 52],
        [180, 140, 70],
        [200, 170, 90],
        [220, 200, 120],
        [237, 224, 150]
      ],
      opacity: getOpacity("dumping", 0.95),
      material: {
        ambient: 0.64,
        diffuse: 0.6,
        shininess: 32,
        specularColor: [51, 51, 51]
      }
    }),

    activeLayers.has("noise") && new ScatterplotLayer({
      id: "noise-scatter",
      data: noise,
      getPosition: (d) => [d.lon, d.lat],
      getFillColor: [...COLORS.noise, 102], // 40% opacity
      radiusMinPixels: 6,
      radiusMaxPixels: 60,
      getRadius: 60,
      opacity: getOpacity("noise", 1),
    }),

    activeLayers.has("permits") && new ScatterplotLayer({
      id: "permits-scatter",
      data: permits,
      getPosition: (d) => [d.lon, d.lat],
      stroked: true,
      getLineColor: COLORS.permits,
      lineWidthMinPixels: 2,
      filled: true,
      getFillColor: [...COLORS.permits, 38], // 15% opacity
      radiusMinPixels: 10,
      radiusMaxPixels: 110,
      getRadius: 110,
      opacity: getOpacity("permits", 1),
    }),

    activeLayers.has("zones") && new ColumnLayer({
      id: "zones-column",
      data: zones,
      getPosition: (d) => [d.lon, d.lat],
      radius: 220,
      extruded: true,
      elevationScale: 4,
      getElevation: (d) => d.score,
      getFillColor: (d) => {
        if (d.status === "DARK") return [...COLORS.red, 180];
        if (d.status === "COVERED") return [...COLORS.sage, 180];
        return [...COLORS.muted, 180];
      },
      opacity: getOpacity("zones", 1),
      pickable: true,
      material: {
        ambient: 0.8,
        diffuse: 0.4,
        shininess: 32,
        specularColor: [255, 255, 255]
      }
    }),

    activeLayers.has("evidence") && new ScatterplotLayer({
      id: "evidence-scatter",
      data: evidence,
      getPosition: (d) => [d.lon, d.lat],
      filled: true,
      getFillColor: COLORS.evidence,
      stroked: true,
      getLineColor: [255, 255, 255],
      lineWidthMinPixels: 2,
      radiusMinPixels: 6,
      radiusMaxPixels: 220,
      getRadius: 200,
      opacity: getOpacity("evidence", 1),
      pickable: true,
    }),

    activeLayers.has("medicaid") && new ColumnLayer({
      id: "medicaid-column",
      data: medicaid,
      getPosition: (d) => [d.lon, d.lat],
      radius: 180,
      extruded: true,
      elevationScale: 0.05,
      getElevation: (d) => Math.sqrt(d.exposure_amount) * 3,
      getFillColor: (d) => [239, 68, 68, Math.min(240, 100 + d.risk_score)],
      opacity: getOpacity("medicaid", 0.95),
      pickable: true,
      material: {
        ambient: 0.85,
        diffuse: 0.5,
        shininess: 40,
        specularColor: [255, 200, 200]
      }
    })
  ].filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTooltip = (info: any) => {
    if (!info.object) return null;
    const { object, layer } = info;
    
    if (layer.id === "evidence-scatter") {
      return {
        html: `
          <div class="font-mono text-12.5 tracking-tight text-gold font-bold">${object.pack_id}</div>
          <div class="font-mono text-11 text-muted mt-1">Plate: ${object.vehicle_plate || "N/A"} · ${object.date}</div>
          <div class="font-outfit text-12 text-secondary mt-1">${object.type}</div>
        `,
        style: {
          backgroundColor: '#17171d',
          color: '#f2f2f0',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '6px',
          padding: '10px 14px',
        }
      };
    }

    if (layer.id === "medicaid-column") {
      return {
        html: `
          <div class="font-jakarta text-14 font-bold text-red mb-1">${object.name}</div>
          <div class="font-mono text-11 text-muted mb-2">NPI: ${object.npi} · ${object.borough}</div>
          <div class="font-mono text-12 text-secondary space-y-1">
            <div>Facility: <span class="text-primary font-semibold">${object.facility_type}</span></div>
            <div>Risk Score: <span class="text-red font-bold">${object.risk_score}/100</span></div>
            <div>Identified Exposure: <span class="text-primary font-bold">$${(object.exposure_amount / 1000000).toFixed(2)}M</span></div>
            <div>Est. Qui Tam Bounty: <span class="text-sage font-bold">$${(object.estimated_bounty / 1000000).toFixed(2)}M</span></div>
          </div>
        `,
        style: {
          backgroundColor: '#17171d',
          color: '#f2f2f0',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          padding: '12px 16px',
        }
      };
    }
    
    if (layer.id === "zones-column") {
      return {
        html: `
          <div class="font-jakarta text-14 mb-2">#${object.rank} ${object.name}</div>
          <div class="font-mono text-12.5 text-muted">
            <div>Score: <span class="text-primary">${object.score}</span></div>
            <div>Rider: ${object.rider || "None"}</div>
            <div>Window: ${object.window}</div>
          </div>
        `,
        style: {
          backgroundColor: '#17171d',
          color: '#f2f2f0',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '6px',
          padding: '12px',
        }
      };
    }
    
    return null;
  };

  return (
    <div className="relative flex-1 h-full bg-canvas overflow-hidden">
      <DeckGL
        layers={layers}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={true}
        getTooltip={getTooltip}
        effects={[lightingEffect]}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>

      {/* Layer Toggles */}
      <div className="absolute bottom-24 left-24 flex flex-wrap gap-8 z-10 max-w-xl">
        {(["dumping", "noise", "medicaid", "permits", "evidence", "zones"] as LayerId[]).map((layerId, idx) => (
          <button
            key={layerId}
            onClick={() => onToggleLayer(layerId)}
            className={`
              px-12 py-6 rounded-full text-12 font-mono uppercase tracking-tight
              transition-all duration-150 border backdrop-blur-md
              ${activeLayers.has(layerId) 
                ? 'bg-surface border-border text-primary shadow-panel font-semibold' 
                : 'bg-canvas/60 border-transparent text-muted hover:text-secondary'}
            `}
            style={{
              borderBottomColor: activeLayers.has(layerId) ? `rgb(${COLORS[layerId === 'zones' ? 'muted' : layerId].join(',')})` : 'transparent',
              borderBottomWidth: activeLayers.has(layerId) ? '2px' : '1px'
            }}
          >
            <span className="opacity-50 mr-2">{idx + 1}</span>
            {layerId === "medicaid" ? "Medicaid ($38M)" : layerId}
          </button>
        ))}
      </div>
    </div>
  );
}
