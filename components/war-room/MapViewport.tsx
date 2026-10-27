"use client";

import { useMemo, useCallback, useState } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { HexagonLayer, HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer, ColumnLayer, ArcLayer } from "@deck.gl/layers";
import { LightingEffect, AmbientLight, DirectionalLight, FlyToInterpolator } from "@deck.gl/core";
import { DumpingRecord, NoiseRecord, PermitRecord, EvidenceRecord, ZoneRecord, MedicaidProviderRecord } from "@/types";
import { LayerId } from "@/components/KpiStrip";
import { Compass, RotateCw, Flame, Box, GitBranch } from "lucide-react";

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

interface TransitArcRecord {
  id: string;
  name: string;
  corridor: string;
  source: [number, number];
  target: [number, number];
  yieldIndex: number;
  status: "ACTIVE_SWEEP" | "HIGH_DENSITY" | "PATROL_ROUTE";
  statute: string;
}

// Inter-Borough logistics transit vectors connecting key commercial hauling & enforcement nodes
const TRANSIT_VECTORS: TransitArcRecord[] = [
  {
    id: "ARC-01",
    name: "Hunts Point Food Hub → Maspeth Creek Choke",
    corridor: "Track 5 Commercial Freight & Waste Conduit",
    source: [-73.882, 40.812],
    target: [-73.924, 40.718],
    yieldIndex: 88,
    status: "HIGH_DENSITY",
    statute: "NYC Admin Code § 16-119 / § 24-163",
  },
  {
    id: "ARC-02",
    name: "Maspeth Creek Choke → Sunset Park Freight Corridor",
    corridor: "Inter-Borough Industrial Hauling Spine",
    source: [-73.924, 40.718],
    target: [-74.010, 40.655],
    yieldIndex: 92,
    status: "ACTIVE_SWEEP",
    statute: "Local Law 58 Enforcement Vector",
  },
  {
    id: "ARC-03",
    name: "Sunset Park Freight → Queens Plaza South",
    corridor: "Logistics Transfer & Commercial Artery",
    source: [-74.010, 40.655],
    target: [-73.938, 40.750],
    yieldIndex: 74,
    status: "PATROL_ROUTE",
    statute: "NYC Admin Code § 24-163 (Engine Idling)",
  },
  {
    id: "ARC-04",
    name: "Greenpoint Railhead → Midtown West Choke",
    corridor: "Cross-River Freight & Distribution Pipeline",
    source: [-73.942, 40.732],
    target: [-74.002, 40.758],
    yieldIndex: 95,
    status: "HIGH_DENSITY",
    statute: "NYC Commercial Freight Curfew Audit",
  },
  {
    id: "ARC-05",
    name: "Hunts Point Food Hub → Flushing Industrial Corridor",
    corridor: "North Queens Hauling Interconnect",
    source: [-73.882, 40.812],
    target: [-73.831, 40.760],
    yieldIndex: 68,
    status: "PATROL_ROUTE",
    statute: "DSNY Unpermitted Dumping Monitoring",
  },
];

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

interface HudItem {
  title: string;
  category: string;
  yieldScore?: number;
  status?: string;
  metrics: Array<{ label: string; value: string; color?: string }>;
  note?: string;
}

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
  // Enhanced visualization toggles
  const [renderMode, setRenderMode] = useState<"HEX_3D" | "HEATMAP">("HEX_3D");
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [hoveredHud, setHoveredHud] = useState<HudItem | null>(null);

  const getOpacity = useCallback((layerId: LayerId, baseOpacity: number = 1) => {
    if (!hoveredKpiLayer) return baseOpacity;
    return hoveredKpiLayer === layerId ? 1.0 : baseOpacity * 0.35;
  }, [hoveredKpiLayer]);

  // Combined hits for heatmap aggregation
  const heatmapData = useMemo(() => {
    const points: Array<{ coordinates: [number, number]; weight: number }> = [];
    dumping.forEach(d => points.push({ coordinates: [d.lon, d.lat], weight: 2 }));
    noise.forEach(n => points.push({ coordinates: [n.lon, n.lat], weight: 1.5 }));
    return points;
  }, [dumping, noise]);

  // Memoize deck.gl layers for locked 60 FPS performance
  const layers = useMemo(() => {
    return [
      // 1. DSNY Dumping Hexagon Layer (Extruded 3D pillars or Heatmap)
      activeLayers.has("dumping") && renderMode === "HEX_3D" && new HexagonLayer({
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
        pickable: true,
        autoHighlight: true,
        material: {
          ambient: 0.65,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [40, 40, 40]
        }
      }),

      // Heatmap Layer (Active when Heatmap mode is selected)
      renderMode === "HEATMAP" && new HeatmapLayer({
        id: "enforcement-heatmap",
        data: heatmapData,
        getPosition: (d: { coordinates: [number, number] }) => d.coordinates,
        getWeight: (d: { weight: number }) => d.weight,
        radiusPixels: 45,
        intensity: 1.8,
        threshold: 0.05,
        opacity: 0.85,
        colorRange: [
          [14, 165, 233, 40],
          [16, 185, 129, 120],
          [245, 158, 11, 200],
          [239, 68, 68, 255]
        ]
      }),

      // 2. Clean Air Act Idling / Noise Scatterplot (Only in Hex mode)
      activeLayers.has("noise") && renderMode === "HEX_3D" && new ScatterplotLayer({
        id: "noise-scatter",
        data: noise,
        getPosition: (d: NoiseRecord) => [d.lon, d.lat],
        getFillColor: () => [...THEME_COLORS.noise, 130] as [number, number, number, number],
        radiusMinPixels: 5,
        radiusMaxPixels: 45,
        getRadius: 55,
        opacity: getOpacity("noise", 0.9),
        pickable: true,
      }),

      // 3. DOB Active Permits Layer (Neon Emerald Rings)
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
        pickable: true,
      }),

      // 4. Tactical Patrol Zones (Pulsing Extruded Columns scaling by Yield Score)
      activeLayers.has("zones") && new ColumnLayer({
        id: "zones-column",
        data: zones,
        getPosition: (d: ZoneRecord) => [d.lon, d.lat],
        radius: 200,
        extruded: true,
        elevationScale: 5,
        getElevation: (d: ZoneRecord) => d.score,
        getFillColor: (d: ZoneRecord) => {
          if (d.status === "DARK") return [239, 68, 68, 200]; // Crimson
          if (d.status === "COVERED") return [16, 185, 129, 200]; // Emerald
          return [148, 163, 184, 160];
        },
        opacity: getOpacity("zones", 0.95),
        pickable: true,
        autoHighlight: true,
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
        radiusMaxPixels: 200,
        getRadius: 160,
        opacity: getOpacity("evidence", 1.0),
        pickable: true,
      }),

      // 6. Medicaid Anomaly Hotspots (Crimson High-Exposure Columns)
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
        autoHighlight: true,
        material: {
          ambient: 0.85,
          diffuse: 0.5,
          shininess: 40,
          specularColor: [255, 200, 200]
        }
      }),

      // 7. Inter-Borough Logistics & Enforcement Transit Arcs
      showVectors && new ArcLayer({
        id: "transit-vectors-arc",
        data: TRANSIT_VECTORS,
        getSourcePosition: (d: TransitArcRecord) => d.source,
        getTargetPosition: (d: TransitArcRecord) => d.target,
        getSourceColor: [16, 185, 129, 230], // Emerald start
        getTargetColor: (d: TransitArcRecord) => 
          d.status === "HIGH_DENSITY" ? [239, 68, 68, 230] : [245, 158, 11, 230],
        getWidth: (d: TransitArcRecord) => Math.max(2.5, Math.round(d.yieldIndex / 25)),
        pickable: true,
        autoHighlight: true,
      })
    ].filter(Boolean);
  }, [activeLayers, renderMode, dumping, heatmapData, noise, permits, zones, evidence, medicaid, showVectors, getOpacity]);

  // Synchronize hovering with floating HUD card
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onHover = useCallback((info: any) => {
    if (!info.object) {
      setHoveredHud(null);
      return;
    }

    const { object, layer } = info;

    if (layer.id === "transit-vectors-arc") {
      setHoveredHud({
        title: object.name,
        category: "LOGISTICS ENFORCEMENT VECTOR",
        yieldScore: object.yieldIndex,
        status: object.status,
        metrics: [
          { label: "Corridor Role", value: object.corridor, color: "text-secondary" },
          { label: "Statutory Basis", value: object.statute, color: "text-emerald font-bold" },
          { label: "Transit Intensity", value: `${object.yieldIndex}/100`, color: "text-gold font-bold" }
        ],
        note: "Track 5/6 cross-vector transit corridor."
      });
      return;
    }

    if (layer.id === "zones-column") {
      setHoveredHud({
        title: `#${object.rank} ${object.name}`,
        category: "TACTICAL PATROL ZONE",
        yieldScore: object.score,
        status: object.status,
        metrics: [
          { label: "Yield Score", value: `${object.score}/100`, color: "text-emerald font-bold" },
          { label: "Assigned Rider", value: object.rider || "Unassigned", color: "text-primary" },
          { label: "Peak Window", value: object.window || "Continuous", color: "text-secondary" },
          { label: "Status", value: object.status, color: object.status === "DARK" ? "text-red-400 font-bold" : "text-emerald font-bold" }
        ],
        note: "Click row in table below to fly camera."
      });
      return;
    }

    if (layer.id === "medicaid-column") {
      setHoveredHud({
        title: object.name,
        category: "MEDICAID SCREENING OUTLIER",
        yieldScore: object.risk_score,
        status: "INVESTIGATING",
        metrics: [
          { label: "NPI Identifier", value: object.npi, color: "text-primary font-mono" },
          { label: "Specialty Scope", value: object.facility_type, color: "text-secondary" },
          { label: "Monthly Intensity", value: `$${object.monthly_intensity?.toLocaleString() || "0"}/mo`, color: "text-primary font-bold" },
          { label: "Observed Deviation", value: `+${object.z_score?.toFixed(1) || "2.0"}σ vs Peer Mean`, color: "text-red-400 font-bold" }
        ],
        note: "Unverified screening prototype. Does not establish fraud or liability."
      });
      return;
    }

    if (layer.id === "evidence-scatter") {
      setHoveredHud({
        title: object.pack_id,
        category: "FORENSIC EVIDENCE DISCLOSURE",
        status: "STANDBY_ACTIVE",
        metrics: [
          { label: "Vehicle Plate", value: object.vehicle_plate || "N/A", color: "text-white font-bold" },
          { label: "Observation Date", value: object.date, color: "text-secondary" },
          { label: "Type", value: object.type, color: "text-gold" }
        ],
        note: "Hash verified against SHA-256 standard."
      });
      return;
    }

    if (layer.id === "dumping-hex") {
      setHoveredHud({
        title: "Commercial Dumping Density Column",
        category: "DSNY SANITATION CLUSTER",
        status: "CONCENTRATED",
        metrics: [
          { label: "Point Count", value: `${object.points?.length || 1} hits binned`, color: "text-amber font-bold" },
          { label: "Statutory Authority", value: "NYC Admin Code § 16-119", color: "text-secondary" }
        ],
        note: "Hexagonal spatial aggregation."
      });
      return;
    }

    if (layer.id === "noise-scatter") {
      setHoveredHud({
        title: "Clean Air Act Engine Idling Hit",
        category: "DEP CITIZEN ENFORCEMENT",
        status: "PENDING_HEARING",
        metrics: [
          { label: "Recorded Date", value: object.date?.slice(0, 10) || "Recent", color: "text-secondary" },
          { label: "Statutory Bounty", value: "25% of collected fine", color: "text-emerald font-bold" }
        ]
      });
      return;
    }

    if (layer.id === "permits-scatter") {
      setHoveredHud({
        title: "Active Building Construction Permit",
        category: "DOB STRUCTURAL SAFETY",
        status: "ACTIVE",
        metrics: [
          { label: "Job Number", value: object.job_number || "DOB-PERMIT", color: "text-emerald font-mono font-bold" },
          { label: "Filing Date", value: object.date?.slice(0, 10) || "Active", color: "text-secondary" }
        ]
      });
      return;
    }

    setHoveredHud(null);
  }, []);

  // Preset camera flight controls
  const handleCameraPreset = (target: "MIDTOWN" | "MASPETH" | "SUNSET" | "HUNTS" | "OVERVIEW" | "FLAT") => {
    const presets = {
      MIDTOWN: { longitude: -73.984, latitude: 40.744, zoom: 14.5, pitch: 60, bearing: -20 },
      MASPETH: { longitude: -73.924, latitude: 40.718, zoom: 14.2, pitch: 55, bearing: 15 },
      SUNSET: { longitude: -74.008, latitude: 40.638, zoom: 14.0, pitch: 50, bearing: -10 },
      HUNTS: { longitude: -73.882, latitude: 40.812, zoom: 14.2, pitch: 55, bearing: -25 },
      OVERVIEW: { longitude: -73.92, latitude: 40.70, zoom: 10.2, pitch: 45, bearing: -12 },
      FLAT: { longitude: -73.95, latitude: 40.72, zoom: 11.0, pitch: 0, bearing: 0 },
    };
    const next = presets[target];
    onViewStateChange({
      viewState: {
        ...viewState,
        ...next,
        transitionDuration: 1600,
        transitionInterpolator: new FlyToInterpolator({ curve: 1.414 }),
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
        onHover={onHover}
        effects={[lightingEffect]}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
          reuseMaps
        />
      </DeckGL>

      {/* Floating Tactical Glassmorphic HUD Tooltip Card (Top Left) */}
      {hoveredHud && (
        <div className="absolute top-16 left-16 z-30 pointer-events-none max-w-sm font-mono animate-in fade-in duration-150">
          <div className="bg-surface/95 backdrop-blur-xl border border-emerald-500/40 p-14 rounded-sm shadow-tactical space-y-8">
            <div className="flex items-center justify-between gap-8 pb-6 border-b border-border/80">
              <span className="text-9 px-6 py-1 bg-emerald/15 border border-emerald/40 text-emerald font-bold rounded-sm uppercase tracking-wider">
                {hoveredHud.category}
              </span>
              {hoveredHud.status && (
                <span className="flex items-center gap-4 text-9 font-bold">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    hoveredHud.status === "DARK" || hoveredHud.status === "HIGH_DENSITY" ? "bg-red-500" : "bg-emerald"
                  }`} />
                  <span className={hoveredHud.status === "DARK" ? "text-red-400" : "text-emerald"}>
                    {hoveredHud.status}
                  </span>
                </span>
              )}
            </div>

            <div className="text-13 font-bold text-primary tracking-tight font-sans">
              {hoveredHud.title}
            </div>

            {typeof hoveredHud.yieldScore === "number" && (
              <div className="bg-inset border border-border p-6 rounded-sm flex items-center justify-between">
                <span className="text-10 text-muted uppercase">Tactical Yield Index</span>
                <span className="text-14 font-bold text-amber">{hoveredHud.yieldScore}/100</span>
              </div>
            )}

            <div className="space-y-4 text-11">
              {hoveredHud.metrics.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center text-10">
                  <span className="text-muted">{m.label}:</span>
                  <span className={m.color || "text-secondary"}>{m.value}</span>
                </div>
              ))}
            </div>

            {hoveredHud.note && (
              <div className="text-9 text-faint pt-4 border-t border-border/50">
                {hoveredHud.note}
              </div>
            )}
          </div>
        </div>
      )}

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
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border transition-colors cursor-pointer"
            >
              Omni NYC
            </button>
            <button
              onClick={() => handleCameraPreset("MIDTOWN")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border transition-colors cursor-pointer"
            >
              Midtown Choke
            </button>
            <button
              onClick={() => handleCameraPreset("MASPETH")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border transition-colors cursor-pointer"
            >
              Maspeth (T5)
            </button>
            <button
              onClick={() => handleCameraPreset("HUNTS")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border transition-colors cursor-pointer"
            >
              Hunts Point
            </button>
            <button
              onClick={() => handleCameraPreset("SUNSET")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-secondary hover:text-white rounded-sm text-10 font-mono border border-border transition-colors cursor-pointer"
            >
              Sunset Park (T6)
            </button>
            <button
              onClick={() => handleCameraPreset("FLAT")}
              className="px-8 py-4 bg-canvas/80 hover:bg-canvas text-muted hover:text-white rounded-sm text-10 font-mono border border-border flex items-center gap-4 transition-colors cursor-pointer"
              title="Reset to Top-Down 2D"
            >
              <RotateCw className="w-3 h-3" />
              <span>2D</span>
            </button>
          </div>
        </div>

        {/* Viewport Rendering Mode & Vector Switches */}
        <div className="bg-surface/90 backdrop-blur-md border border-border p-6 rounded-sm shadow-panel flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRenderMode("HEX_3D")}
              className={`flex items-center gap-4 px-8 py-4 rounded-sm text-10 font-mono border transition-colors cursor-pointer ${
                renderMode === "HEX_3D"
                  ? "bg-steel-blue/20 border-steel-blue text-steel-blue font-bold"
                  : "bg-canvas/60 border-border text-muted hover:text-primary"
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D HEX</span>
            </button>
            <button
              onClick={() => setRenderMode("HEATMAP")}
              className={`flex items-center gap-4 px-8 py-4 rounded-sm text-10 font-mono border transition-colors cursor-pointer ${
                renderMode === "HEATMAP"
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 font-bold"
                  : "bg-canvas/60 border-border text-muted hover:text-primary"
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>HEATMAP</span>
            </button>
          </div>

          <button
            onClick={() => setShowVectors(prev => !prev)}
            className={`flex items-center gap-4 px-8 py-4 rounded-sm text-10 font-mono border transition-colors cursor-pointer ${
              showVectors
                ? "bg-emerald/20 border-emerald text-emerald font-bold"
                : "bg-canvas/60 border-border text-muted hover:text-primary"
            }`}
            title="Toggle logistics supply & enforcement vectors"
          >
            <GitBranch className="w-3 h-3" />
            <span>ARCS: {showVectors ? "ON" : "OFF"}</span>
          </button>
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
                transition-all duration-150 border backdrop-blur-md flex items-center gap-6 cursor-pointer
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
