"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Header, { ConsoleView } from "@/components/Header";
import Footer from "@/components/Footer";
import KpiStrip, { LayerId } from "@/components/KpiStrip";
import MapPanel from "@/components/MapPanel";
import ZoneTable from "@/components/ZoneTable";
import CommandPalette from "@/components/CommandPalette";
import PalantirNexusGraph from "@/components/PalantirNexusGraph";
import MedicaidQuiTamRadar from "@/components/MedicaidQuiTamRadar";
import ProfitEngineLedger from "@/components/ProfitEngineLedger";
import LegalWeaponizer from "@/components/LegalWeaponizer";
import { useTacticalAudio } from "@/hooks/useTacticalAudio";
import { 
  DumpingRecord, 
  NoiseRecord, 
  PermitRecord, 
  EvidenceRecord, 
  ZoneRecord, 
  MedicaidProviderRecord, 
  FraudRingRecord, 
  BountyLedgerItem, 
  PalantirGraphData 
} from "@/types";
import { FlyToInterpolator } from "@deck.gl/core";

export default function Home() {
  const [currentView, setCurrentView] = useState<ConsoleView>("WAR_ROOM");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const { playClick, playChirp } = useTacticalAudio();

  // Core Tactical Data
  const [dumping, setDumping] = useState<DumpingRecord[]>([]);
  const [noise, setNoise] = useState<NoiseRecord[]>([]);
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [zones, setZones] = useState<ZoneRecord[]>([]);

  // MediFraudy & Palantir Unified Datasets
  const [medicaid, setMedicaid] = useState<MedicaidProviderRecord[]>([]);
  const [fraudRings, setFraudRings] = useState<FraudRingRecord[]>([]);
  const [bountyLedger, setBountyLedger] = useState<BountyLedgerItem[]>([]);
  const [palantirGraph, setPalantirGraph] = useState<PalantirGraphData>({ nodes: [], edges: [] });

  // Legal Weaponizer selection bridge
  const [weaponizerTarget, setWeaponizerTarget] = useState<{ id?: string; track?: string }>({});

  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(
    new Set<LayerId>(["dumping", "noise", "medicaid", "permits", "evidence", "zones"])
  );
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
    // Fetch all unified datasets at runtime
    const loadData = async () => {
      try {
        const [dRes, nRes, pRes, eRes, zRes, medRes, ringsRes, ledgerRes, graphRes] = await Promise.all([
          fetch("/data/dumping.json").catch(() => null),
          fetch("/data/noise.json").catch(() => null),
          fetch("/data/permits.json").catch(() => null),
          fetch("/data/evidence.json").catch(() => null),
          fetch("/data/zones.json").catch(() => null),
          fetch("/data/medicaid_providers.json").catch(() => null),
          fetch("/data/fraud_rings.json").catch(() => null),
          fetch("/data/bounty_ledger.json").catch(() => null),
          fetch("/data/palantir_graph.json").catch(() => null),
        ]);

        if (dRes?.ok) setDumping(await dRes.json());
        if (nRes?.ok) setNoise(await nRes.json());
        if (pRes?.ok) setPermits(await pRes.json());
        if (eRes?.ok) setEvidence(await eRes.json());
        if (zRes?.ok) setZones(await zRes.json());
        if (medRes?.ok) setMedicaid(await medRes.json());
        if (ringsRes?.ok) setFraudRings(await ringsRes.json());
        if (ledgerRes?.ok) setBountyLedger(await ledgerRes.json());
        if (graphRes?.ok) setPalantirGraph(await graphRes.json());
      } catch (err) {
        console.error("Failed to load unified intelligence data:", err);
      }
    };

    loadData();
  }, []);

  const handleToggleLayer = useCallback((layerId: LayerId) => {
    playClick();
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, [playClick]);

  // Keyboard navigation & layer toggles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") {
        return;
      }
      
      const layerMap: Record<string, LayerId> = {
        "1": "dumping",
        "2": "noise",
        "3": "medicaid",
        "4": "permits",
        "5": "evidence",
        "6": "zones",
      };

      if (layerMap[e.key]) {
        handleToggleLayer(layerMap[e.key]);
      } else if (e.key.toLowerCase() === "g") {
        playClick();
        setCurrentView("NEXUS_GRAPH");
      } else if (e.key.toLowerCase() === "m") {
        playClick();
        setCurrentView("MEDICAID_RADAR");
      } else if (e.key.toLowerCase() === "l") {
        playClick();
        setCurrentView("PROFIT_LEDGER");
      } else if (e.key.toLowerCase() === "w") {
        playClick();
        setCurrentView("LEGAL_WEAPONIZER");
      } else if (e.key === "Escape" || e.key === "0") {
        playClick();
        setCurrentView("WAR_ROOM");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleLayer, playClick]);

  const handleZoneClick = useCallback((lat: number, lon: number) => {
    playChirp();
    setViewState((prev) => ({
      ...prev,
      longitude: lon,
      latitude: lat,
      zoom: 14.2,
      pitch: 55,
      bearing: -15,
      transitionDuration: 1800,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  }, [playChirp]);

  const handleOpenWeaponizer = useCallback((targetId: string, track: string) => {
    playClick();
    setWeaponizerTarget({ id: targetId, track });
    setCurrentView("LEGAL_WEAPONIZER");
  }, [playClick]);

  const counts: Record<LayerId, number> = useMemo(() => ({
    dumping: dumping.length,
    noise: noise.length,
    medicaid: medicaid.length,
    permits: permits.length,
    evidence: evidence.length,
    zones: zones.length,
  }), [dumping.length, noise.length, medicaid.length, permits.length, evidence.length, zones.length]);

  return (
    <>
      <Header 
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <KpiStrip 
        counts={counts}
        hoveredLayer={hoveredKpiLayer}
        onHoverLayer={setHoveredKpiLayer}
        onSelectLayer={handleToggleLayer}
        activeLayers={activeLayers}
      />

      {/* Main View Switcher */}
      <main className="flex-1 flex overflow-hidden">
        {currentView === "WAR_ROOM" && (
          <div className="flex-1 flex overflow-hidden lg:flex-row flex-col">
            <MapPanel 
              dumping={dumping}
              noise={noise}
              permits={permits}
              evidence={evidence}
              zones={zones}
              medicaid={medicaid}
              activeLayers={activeLayers}
              hoveredKpiLayer={hoveredKpiLayer}
              viewState={viewState}
              onViewStateChange={(e) => setViewState(e.viewState)}
              onToggleLayer={handleToggleLayer}
            />
            <ZoneTable 
              zones={zones}
              onZoneClick={handleZoneClick}
              onPlayClick={playClick}
            />
          </div>
        )}

        {currentView === "NEXUS_GRAPH" && (
          <PalantirNexusGraph 
            graphData={palantirGraph}
            onSelectProvider={() => {
              playClick();
              setCurrentView("MEDICAID_RADAR");
            }}
          />
        )}

        {currentView === "MEDICAID_RADAR" && (
          <MedicaidQuiTamRadar 
            providers={medicaid}
            fraudRings={fraudRings}
            onOpenWeaponizer={handleOpenWeaponizer}
          />
        )}

        {currentView === "PROFIT_LEDGER" && (
          <ProfitEngineLedger 
            ledgerItems={bountyLedger}
            onOpenWeaponizer={handleOpenWeaponizer}
          />
        )}

        {currentView === "LEGAL_WEAPONIZER" && (
          <LegalWeaponizer 
            initialTargetId={weaponizerTarget.id}
            initialTrack={weaponizerTarget.track}
          />
        )}
      </main>

      <Footer />

      <CommandPalette 
        zones={zones}
        medicaid={medicaid}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectZone={(lat, lon) => {
          playChirp();
          setCurrentView("WAR_ROOM");
          handleZoneClick(lat, lon);
        }}
      />
    </>
  );
}
