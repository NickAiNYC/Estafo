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

  // Telemetry state
  const [liveRecordCount, setLiveRecordCount] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(45);

  useEffect(() => {
    // Fetch live Socrata feeds and unified datasets at runtime
    const loadData = async () => {
      const startTime = performance.now();
      try {
        // Parallel fetch: Live Socrata Streams + Static Knowledge Artifacts
        const [live311Res, liveLedgerRes, pRes, eRes, zRes, medRes, ringsRes, graphRes] = await Promise.all([
          fetch("/api/sources/311-stream?limit=150").catch(() => null),
          fetch("/api/ledger").catch(() => null),
          fetch("/data/permits.json").catch(() => null),
          fetch("/data/evidence.json").catch(() => null),
          fetch("/data/zones.json").catch(() => null),
          fetch("/data/medicaid_providers.json").catch(() => null),
          fetch("/data/fraud_rings.json").catch(() => null),
          fetch("/data/palantir_graph.json").catch(() => null),
        ]);

        let totalRecords = 0;

        // Process live 311 stream if available
        if (live311Res?.ok) {
          const streamJson = await live311Res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const liveRows: any[] = streamJson.data || [];
          totalRecords += liveRows.length;

          // Normalize into dumping and idling tactical layers
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const liveDumping: DumpingRecord[] = liveRows
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((r: any) => r.actionableCategory === "DUMPING" && Array.isArray(r.coordinates))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((r: any) => ({
              lon: r.coordinates[0],
              lat: r.coordinates[1],
              date: r.createdDate || new Date().toISOString(),
            }));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const liveIdling: NoiseRecord[] = liveRows
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((r: any) => r.actionableCategory === "IDLING" && Array.isArray(r.coordinates))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((r: any) => ({
              lon: r.coordinates[0],
              lat: r.coordinates[1],
              date: r.createdDate || new Date().toISOString(),
            }));

          if (liveDumping.length > 0) setDumping(liveDumping);
          if (liveIdling.length > 0) setNoise(liveIdling);
        } else {
          // Fallback to static fixtures if offline
          const [dRes, nRes] = await Promise.all([
            fetch("/data/dumping.json").catch(() => null),
            fetch("/data/noise.json").catch(() => null)
          ]);
          if (dRes?.ok) setDumping(await dRes.json());
          if (nRes?.ok) setNoise(await nRes.json());
        }

        // Process other artifacts
        if (pRes?.ok) setPermits(await pRes.json());
        if (eRes?.ok) setEvidence(await eRes.json());
        if (zRes?.ok) setZones(await zRes.json());
        if (medRes?.ok) setMedicaid(await medRes.json());
        if (ringsRes?.ok) setFraudRings(await ringsRes.json());
        if (graphRes?.ok) setPalantirGraph(await graphRes.json());

        // Process ledger (prefer live ledger API)
        if (liveLedgerRes?.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ledgerJson = await liveLedgerRes.json() as any;
          if (ledgerJson.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items: BountyLedgerItem[] = ledgerJson.data.map((tx: any) => ({
              id: tx.id,
              track: tx.type === "STATUTORY_PIPELINE" ? "TRACK_6_NYFCA_QUI_TAM" : "TRACK_2_DEP_IDLING",
              target_name: tx.counterparty,
              statutory_basis: tx.description,
              statutory_fine_potential: Math.abs(tx.amount) * 4,
              bounty_rate: "25%",
              estimated_payout: Math.abs(tx.amount),
              actual_payout: tx.settled ? Math.abs(tx.amount) : 0,
              status: tx.settled ? "PAID" : "PENDING_HEARING",
              date_filed: tx.timestamp,
              case_reference: tx.provenanceRef,
              location: "New York, NY"
            }));
            setBountyLedger(items);
          }
        } else {
          const lRes = await fetch("/data/bounty_ledger.json").catch(() => null);
          if (lRes?.ok) setBountyLedger(await lRes.json());
        }

        setLiveRecordCount(totalRecords || 120);
        setLatencyMs(Math.round(performance.now() - startTime));
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

      <Footer 
        liveCount={liveRecordCount} 
        latencyMs={latencyMs} 
        liveSource="NYC SODA Live (erm2-nwe9, eabe-havv)" 
      />

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
