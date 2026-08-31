"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KpiStrip, { LayerId } from "@/components/KpiStrip";
import MapPanel from "@/components/MapPanel";
import ZoneTable from "@/components/ZoneTable";
import CommandPalette from "@/components/CommandPalette";
import { DumpingRecord, NoiseRecord, PermitRecord, EvidenceRecord, ZoneRecord } from "@/types";
import { FlyToInterpolator } from "@deck.gl/core";

export default function Home() {
  const [dumping, setDumping] = useState<DumpingRecord[]>([]);
  const [noise, setNoise] = useState<NoiseRecord[]>([]);
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [zones, setZones] = useState<ZoneRecord[]>([]);

  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(new Set<LayerId>(["dumping", "noise", "permits", "evidence", "zones"]));
  const [hoveredKpiLayer, setHoveredKpiLayer] = useState<LayerId | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -73.92,
    latitude: 40.70,
    zoom: 10.2,
    pitch: 45,
    bearing: -12,
    transitionDuration: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transitionInterpolator: undefined as any,
  });

  useEffect(() => {
    // Fetch data at runtime
    const loadData = async () => {
      try {
        const [dRes, nRes, pRes, eRes, zRes] = await Promise.all([
          fetch("/data/dumping.json").catch(() => null),
          fetch("/data/noise.json").catch(() => null),
          fetch("/data/permits.json").catch(() => null),
          fetch("/data/evidence.json").catch(() => null),
          fetch("/data/zones.json").catch(() => null),
        ]);

        if (dRes?.ok) setDumping(await dRes.json());
        if (nRes?.ok) setNoise(await nRes.json());
        if (pRes?.ok) setPermits(await pRes.json());
        if (eRes?.ok) setEvidence(await eRes.json());
        if (zRes?.ok) setZones(await zRes.json());
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };

    loadData();
  }, []);

  const handleToggleLayer = useCallback((layerId: LayerId) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input (like command palette)
      if (document.activeElement?.tagName === "INPUT") return;
      
      const layerMap: Record<string, LayerId> = {
        "1": "dumping",
        "2": "noise",
        "3": "permits",
        "4": "evidence",
        "5": "zones"
      };

      const layerId = layerMap[e.key];
      if (layerId) {
        handleToggleLayer(layerId);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleLayer]);

  const handleZoneClick = (lat: number, lon: number) => {
    setViewState({
      ...viewState,
      longitude: lon,
      latitude: lat,
      zoom: 14,
      pitch: 55,
      transitionDuration: 1800,
      transitionInterpolator: new FlyToInterpolator(),
    });
  };

  const counts = {
    dumping: dumping.length,
    noise: noise.length,
    permits: permits.length,
    evidence: evidence.length,
    zones: zones.length,
  };

  return (
    <>
      <Header />
      <KpiStrip 
        counts={counts}
        hoveredLayer={hoveredKpiLayer}
        onHoverLayer={setHoveredKpiLayer}
      />
      <div className="flex-1 flex overflow-hidden lg:flex-row flex-col">
        <MapPanel 
          dumping={dumping}
          noise={noise}
          permits={permits}
          evidence={evidence}
          zones={zones}
          activeLayers={activeLayers}
          hoveredKpiLayer={hoveredKpiLayer}
          viewState={viewState}
          onViewStateChange={(e) => setViewState(e.viewState)}
          onToggleLayer={handleToggleLayer}
        />
        <ZoneTable 
          zones={zones}
          onZoneClick={handleZoneClick}
        />
      </div>
      <Footer />
      <CommandPalette 
        zones={zones}
        onSelectZone={handleZoneClick}
      />
    </>
  );
}
