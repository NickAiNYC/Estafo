"use client";

import { useMemo, useCallback } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer, ColumnLayer } from "@deck.gl/layers";
import { LightingEffect, AmbientLight, DirectionalLight, FlyToInterpolator } from "@deck.gl/core";
import { DumpingRecord, NoiseRecord, PermitRecord, EvidenceRecord, ZoneRecord, MedicaidProviderRecord } from "@/types";
import { LayerId } from "@/components/KpiStrip";
import { Compass, RotateCw } from "lucide-react";

import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewportProps {
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
  onSelectZoneCoordinate?: (lat: number, lon: number) => void;
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

const THEME_COLORS = {
  dumping: [245, 158, 11], // Tactical Amber
  noise: hexToRgb("#38BDF8"), // Tactical Steel Blue
  permits: hexToRgb("#10B981"), // Tactical Emerald
  evidence: [242, 199, 68], // Gold
  medicaid: [239, 68, 68], // Tactical Crimson
  zones: hexToRgb("#F8FAFC"),
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.2
});
const dirLight = new DirectionalLight({
  color: [255, 255, 255],
  intensity: 2.2,
  direction: [-3, -9, -1]
});
const lightingEffect = new LightingEffect({ ambientLight, dirLight });

export default function MapViewport({
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
  onToggleLayer,
}: MapViewportProps) {

  const getOpacity = useCallback((layerId: LayerId, baseOpacity: number = 1) => {
    if (!hoveredKpiLayer) return baseOpacity;
    return hoveredKpiLayer === layerId ? 1.0 : baseOpacity * 0.35;
  }, [hoveredKpiLayer]);

  // Memoize deck.gl layers for locked 60 FPS performance
  const layers = useMemo(() => {
    return [
      // 1. DSNY Dumping Hexagon Layer (Extruded 3D pillars)
      activeLayers.has("dumping") && new HexagonLayer({
        id: "dumping-hex",
        data: dumping,
        getPosition: (d: DumpingRecord) => [d.lon, d.lat],
        radius: 130,
        extruded: true,
        elevationScale: 18,
        getColorWeight: () => 1,
        getElevationWeight: () => 1,
        colorRange: [
          [164, 110, 32],
          [190, 130, 40],
          [217, 145, 20],
          [245, 158, 11],
          [252, 211, 77]
        ],
        opacity: getOpacity("dumping", 0.92),
        material: {
          ambient: 0.65,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [40, 40, 40]
        }
      }),

      // 2. Clean Air Act Idling / Noise Scatterplot
      activeLayers.has("noise") && new ScatterplotLayer({
        id: "noise-scatter",
        data: noise,
        getPosition: (d: NoiseRecord) => [d.lon, d.lat],
        getFillColor: () => [...THEME_COLORS.noise, 110] as [number, number, number, number],
        radiusMinPixels: 5,
        radiusMaxPixels: 50,
        getRadius: 55,
        opacity: getOpacity("noise", 0.9),
      }),

      // 3. DOB Active Permits Layer
      activeLayers.has("permits") && new ScatterplotLayer({
        id: "permits-scatter",
        data: permits,
        getPosition: (d: PermitRecord) => [d.lon, d.lat],
        stroked: true,
        getLineColor: () => [...THEME_COLORS.permits, 255] as [number, number, number, number],
        lineWidthMinPixels: 1.5,
        filled: true,
        getFillColor: () => [...THEME_COLORS.permits, 35] as [number, number, number, number],
        radiusMinPixels: 8,
        radiusMaxPixels: 90,
        getRadius: 85,
        opacity: getOpacity("permits", 0.85),
      }),

      // 4. Tactical Patrol Zones (Pulsing Extruded Columns)
      activeLayers.has("zones") && new ColumnLayer({
        id: "zones-column",
        data: zones,
        getPosition: (d: ZoneRecord) => [d.lon, d.lat],
        radius: 200,
        extruded: true,
        elevationScale: 5,
        getElevation: (d: ZoneRecord) => d.score,
        getFillColor: (d: ZoneRecord) => {
          if (d.status === "DARK") return [239, 68, 68, 190]; // Crimson
          if (d.status === "COVERED") return [16, 185, 129, 190]; // Emerald
          return [148, 163, 184, 160];
        },
        opacity: getOpacity("zones", 0.95),
        pickable: true,
        material: {
          ambient: 0.8,
          diffuse: 0.4,
          shininess: 32,
          specularColor: [255, 255, 255]
        }
      }),

      // 5. Forensically Validated Evidence Pins
      activeLayers.has("evidence") && new ScatterplotLayer({
        id: "evidence-scatter",
        data: evidence,
        getPosition: (d: EvidenceRecord) => [d.lon, d.lat],
        filled: true,
        getFillColor: () => [242, 199, 68, 255] as [number, number, number, number],
        stroked: true,
        getLineColor: () => [255, 255, 255, 255] as [number, number, number, number],
        lineWidthMinPixels: 2,
        radiusMinPixels: 7,
        radiusMaxPixels: 220,
        getRadius: 180,
        opacity: getOpacity("evidence", 1.0),
        pickable: true,
      }),

      // 6. Medicaid Fraud Hotspots (Crimson High-Exposure Columns)
      activeLayers.has("medicaid") && new ColumnLayer({
        id: "medicaid-column",
        data: medicaid,
        getPosition: (d: MedicaidProviderRecord) => [d.lon, d.lat],
        radius: 170,
        extruded: true,
        elevationScale: 0.05,
        getElevation: (d: MedicaidProviderRecord) => Math.sqrt(d.exposure_amount) * 3.2,
        getFillColor: (d: MedicaidProviderRecord) => [239, 68, 68, Math.min(240, 110 + d.risk_score)],
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
  }, [activeLayers, dumping, noise, permits, zones, evidence, medicaid, getOpacity]);

  // Raycasting interactive tooltips
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTooltip = useCallback((info: any) => {
    if (!info.object) return null;
    const { object, layer } = info;
    
    if (layer.id === "evidence-scatter") {
      return {
        html: `
          <div class="font-mono text-11 text-amber font-bold tracking-tight">${object.pack_id}</div>
          <div class="font-mono text-10 text-muted mt-1">Vehicle Plate: <span class="text-white">${object.vehicle_plate || "N/A"}</span> · ${object.date}</div>
          <div class="font-sans text-11 text-secondary mt-1">${object.type}</div>
          <div class="font-mono text-9 text-emerald mt-2">HASH VERIFIED · STANDBY ACTIVE</div>
        `,
        style: {
          backgroundColor: '#12141C',
          color: '#F8FAFC',
          border: '1px solid #1E2230',
          borderRadius: '4px',
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }
      };
    }

    if (layer.id === "medicaid-column") {
      return {
        html: `
          <div class="font-sans text-13 font-bold text-red-400 mb-1">${object.name}</div>
          <div class="font-mono text-10 text-muted mb-2">NPI: ${object.npi} · ${object.borough}</div>
          <div class="font-mono text-11 text-secondary space-y-1">
            <div>Type: <span class="text-white font-semibold">${object.facility_type}</span></div>
            <div>Risk Score: <span class="text-red-400 font-bold">${object.risk_score}/100</span></div>
            <div>Exposure: <span class="text-white font-bold">$${(object.exposure_amount / 1000000).toFixed(2)}M</span></div>
            <div>Est. Qui Tam Bounty: <span class="text-emerald font-bold">$${(object.estimated_bounty / 1000000).toFixed(2)}M</span></div>
          </div>
        `,
        style: {
          backgroundColor: '#12141C',
          color: '#F8FAFC',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '4px',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }
      };
    }
    
    if (layer.id === "zones-column") {
      return {
        html: `
          <div class="font-sans text-13 font-bold text-white mb-2">#${object.rank} ${object.name}</div>
          <div class="font-mono text-11 text-secondary space-y-1">
            <div>Yield Score: <span class="text-emerald font-bold">${object.score}</span></div>
            <div>Assigned Rider: <span class="text-white">${object.rider || "Unassigned"}</span></div>
            <div>Peak Window: <span class="text-muted">${object.window}</span></div>
            <div class="mt-2 text-10 font-bold ${object.status === 'DARK' ? 'text-red-400' : 'text-emerald'}">STATUS: ${object.status}</div>
          </div>
        `,
        style: {
          backgroundColor: '#12141C',
          color: '#F8FAFC',
          border: '1px solid #1E2230',
          borderRadius: '4px',
          padding: '12px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }
      };
    }
    
    return null;
  }, []);

  // Preset camera flight controls
  const handleCameraPreset = (target: "MIDTOWN" | "MASPETH" | "SUNSET" | "OVERVIEW" | "FLAT") => {
    const presets = {
      MIDTOWN: { longitude: -73.984, latitude: 40.744, zoom: 14.5, pitch: 60, bearing: -20 },
      MASPETH: { longitude: -73.924, latitude: 40.718, zoom: 14.2, pitch: 55, bearing: 15 },
      SUNSET: { longitude: -74.008, latitude: 40.638, zoom: 14.0, pitch: 50, bearing: -10 },
      OVERVIEW: { longitude: -73.92, latitude: 40.70, zoom: 10.2, pitch: 45, bearing: -12 },
      FLAT: { longitude: -73.95, latitude: 40.72, zoom: 11.0, pitch: 0, bearing: 0 },
    };
    const next = presets[target];
    onViewStateChange({
      viewState: {
        ...viewState,
        ...next,
        transitionDuration: 1600,
        transitionInterpolator: new FlyToInterpolator(),
      }
    });
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

      {/* Camera Flight Control Orbital Overlay (Top Right) */}
      <div className="absolute top-16 right-16 flex flex-col gap-6 z-20 pointer-events-auto">
        <div className="bg-surface/90 backdrop-blur-md border border-border p-6 rounded-sm shadow-panel flex items-center gap-6">
          <div className="text-10 font-mono text-muted flex items-center gap-4 px-6 border-r border-border">
            <Compass className="w-3.5 h-3.5 text-emerald" />
            <span>ORBITAL FLY</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleCameraPreset("OVERVIEW")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border"
            >
              Omni NYC
            </button>
            <button
              onClick={() => handleCameraPreset("MIDTOWN")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border"
            >
              Midtown Choke
            </button>
            <button
              onClick={() => handleCameraPreset("MASPETH")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border"
            >
              Maspeth (T5)
            </button>
            <button
              onClick={() => handleCameraPreset("SUNSET")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border"
            >
              Sunset Park (T6)
            </button>
            <button
              onClick={() => handleCameraPreset("FLAT")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-muted hover:text-white rounded-sm text-10 font-mono border border-border flex items-center gap-4"
              title="Reset to Top-Down 2D"
            >
              <RotateCw className="w-3 h-3" />
              <span>2D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Layer Toggles (Bottom Left) */}
      <div className="absolute bottom-20 left-20 flex flex-wrap gap-6 z-10 max-w-xl pointer-events-auto">
        {(["dumping", "noise", "medicaid", "permits", "evidence", "zones"] as LayerId[]).map((layerId, idx) => {
          const isActive = activeLayers.has(layerId);
          return (
            <button
              key={layerId}
              onClick={() => onToggleLayer(layerId)}
              className={`
                px-10 py-5 rounded-sm text-11 font-mono uppercase tracking-tight
                transition-all duration-150 border backdrop-blur-md flex items-center gap-6
                ${isActive 
                  ? 'bg-surface/95 border-border-highlight text-primary shadow-tactical font-bold' 
                  : 'bg-canvas/80 border-border text-muted hover:text-secondary'}
              `}
              style={{
                borderBottomColor: isActive ? `rgb(${THEME_COLORS[layerId === 'noise' ? 'noise' : layerId === 'permits' ? 'permits' : layerId === 'medicaid' ? 'medicaid' : layerId === 'evidence' ? 'evidence' : layerId === 'zones' ? 'zones' : 'dumping'].join(',')})` : 'transparent',
                borderBottomWidth: isActive ? '2px' : '1px'
              }}
            >
              <span className="text-9 opacity-50 font-mono">{idx + 1}</span>
              <span>{layerId === "medicaid" ? "Medicaid ($38M)" : layerId === "noise" ? "CAC Idling" : layerId}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
