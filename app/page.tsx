"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Header, { ConsoleView } from "@/components/Header";
import Footer, { FeedTelemetryItem } from "@/components/Footer";
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

  // Legal Weaponizer selection bridge & Graph deep link target
  const [weaponizerTarget, setWeaponizerTarget] = useState<{ id?: string; track?: string }>({});
  const [selectedRadarNpi, setSelectedRadarNpi] = useState<string | undefined>(undefined);

  // Truthful Source & Telemetry State
  const [medicaidError, setMedicaidError] = useState<string | null>(null);
  const [feedTelemetry, setFeedTelemetry] = useState<FeedTelemetryItem[]>([]);
  const [feedStatus, setFeedStatus] = useState<"ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING">("ONLINE");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [liveRecordCount, setLiveRecordCount] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(45);

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

  // Reusable unified data ingestion & truthful telemetry loader
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    const overallStartTime = performance.now();
    const nowIso = new Date().toISOString().slice(11, 19) + " UTC";
    const telemetryItems: FeedTelemetryItem[] = [];

    try {
      // 1. Socrata 311 Live Stream Feed
      const t311Start = performance.now();
      let live311Count = 0;
      let socrataError: string | null = null;
      try {
        const live311Res = await fetch("/api/sources/311-stream?limit=150").catch(() => null);
        const t311Latency = Math.round(performance.now() - t311Start);

        if (live311Res?.ok) {
          const streamJson = await live311Res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const liveRows: any[] = streamJson.data || [];
          live311Count = liveRows.length;

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

          telemetryItems.push({
            id: "socrata_311",
            name: "NYC SODA 311 Live",
            source: "erm2-nwe9 (Idling & Dumping)",
            tier: "LIVE_SOURCED",
            status: "ONLINE",
            count: live311Count,
            latencyMs: t311Latency,
            lastSync: nowIso,
            error: null,
          });
        } else {
          socrataError = `HTTP ${live311Res?.status || "Unavailable"}`;
          telemetryItems.push({
            id: "socrata_311",
            name: "NYC SODA 311 Live",
            source: "erm2-nwe9 (Idling & Dumping)",
            tier: "LIVE_SOURCED",
            status: "OFFLINE",
            count: 0,
            latencyMs: t311Latency,
            lastSync: nowIso,
            error: socrataError,
          });
          // Offline fallback for spatial map visualization
          const [dRes, nRes] = await Promise.all([
            fetch("/data/dumping.json").catch(() => null),
            fetch("/data/noise.json").catch(() => null)
          ]);
          if (dRes?.ok) setDumping(await dRes.json());
          if (nRes?.ok) setNoise(await nRes.json());
        }
      } catch (err) {
        socrataError = String(err);
        telemetryItems.push({
          id: "socrata_311",
          name: "NYC SODA 311 Live",
          source: "erm2-nwe9 (Idling & Dumping)",
          tier: "LIVE_SOURCED",
          status: "OFFLINE",
          count: 0,
          latencyMs: Math.round(performance.now() - t311Start),
          lastSync: nowIso,
          error: socrataError,
        });
      }

      const tMedStart = performance.now();
      try {
        const sessionToken = typeof window !== "undefined" ? sessionStorage.getItem("estafotir_investigator_token") : null;
        const medHeaders: Record<string, string> = {};
        if (sessionToken) {
          medHeaders["Authorization"] = `Bearer ${sessionToken}`;
        }

        const medRes = await fetch("/api/sources/medicaid-leads", {
          headers: medHeaders,
        }).catch(() => null);
        const tMedLatency = Math.round(performance.now() - tMedStart);

        if (medRes?.ok) {
          const mData = await medRes.json();
          const items: MedicaidProviderRecord[] = Array.isArray(mData) ? mData : (mData.data || []);
          setMedicaid(items);
          setMedicaidError(null);

          telemetryItems.push({
            id: "medicaid_leads",
            name: "Medicaid Sourced Leads (NPPES Vetted)",
            source: "/api/sources/medicaid-leads (HCPCS T2024)",
            tier: "LIVE_SOURCED",
            status: "ONLINE",
            count: items.length,
            latencyMs: tMedLatency,
            lastSync: nowIso,
            error: null,
          });
        } else {
          setMedicaid([]);
          if (medRes?.status === 401) {
            setMedicaidError("RESTRICTED: Institutional Medicaid screening records require verified investigator credentials.");
            telemetryItems.push({
              id: "medicaid_leads",
              name: "Medicaid Sourced Leads (NPPES Vetted)",
              source: "/api/sources/medicaid-leads (HCPCS T2024)",
              tier: "LIVE_SOURCED",
              status: "RESTRICTED",
              count: 0,
              latencyMs: tMedLatency,
              lastSync: nowIso,
              error: "HTTP 401: Authentication Required",
            });
          } else if (medRes?.status === 503) {
            setMedicaidError("FAIL_CLOSED: Server authentication secret is unconfigured. Institutional data access refused.");
            telemetryItems.push({
              id: "medicaid_leads",
              name: "Medicaid Sourced Leads (NPPES Vetted)",
              source: "/api/sources/medicaid-leads (HCPCS T2024)",
              tier: "LIVE_SOURCED",
              status: "OFFLINE",
              count: 0,
              latencyMs: tMedLatency,
              lastSync: nowIso,
              error: "HTTP 503: Service Unconfigured (Fail Closed)",
            });
          } else {
            const errDetail = `Medicaid API unreachable (HTTP ${medRes?.status || 500})`;
            setMedicaidError(errDetail);
            telemetryItems.push({
              id: "medicaid_leads",
              name: "Medicaid Sourced Leads (NPPES Vetted)",
              source: "/api/sources/medicaid-leads (HCPCS T2024)",
              tier: "LIVE_SOURCED",
              status: "OFFLINE",
              count: 0,
              latencyMs: tMedLatency,
              lastSync: nowIso,
              error: errDetail,
            });
          }
        }
      } catch (err) {
        const errDetail = `Connection error: ${String(err)}`;
        setMedicaid([]);
        setMedicaidError(errDetail);
        telemetryItems.push({
          id: "medicaid_leads",
          name: "Medicaid Sourced Leads (NPPES Vetted)",
          source: "/api/sources/medicaid-leads (HCPCS T2024)",
          tier: "LIVE_SOURCED",
          status: "OFFLINE",
          count: 0,
          latencyMs: Math.round(performance.now() - tMedStart),
          lastSync: nowIso,
          error: errDetail,
        });
      }

      // 3. Commercial Financial Ledger Feed
      const tLedgerStart = performance.now();
      try {
        const liveLedgerRes = await fetch("/api/ledger").catch(() => null);
        const tLedgerLatency = Math.round(performance.now() - tLedgerStart);

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
            telemetryItems.push({
              id: "commercial_ledger",
              name: "Commercial Ledger & Disbursals",
              source: "/api/ledger (Demo Model)",
              tier: "SYNTHETIC_DEMO",
              status: "ONLINE",
              count: items.length,
              latencyMs: tLedgerLatency,
              lastSync: nowIso,
              error: null,
            });
          }
        } else {
          // Fallback to static verified research pilot ledger
          const lRes = await fetch("/data/bounty_ledger.json").catch(() => null);
          if (lRes?.ok) {
            const staticItems = await lRes.json();
            setBountyLedger(staticItems);
            telemetryItems.push({
              id: "commercial_ledger",
              name: "Commercial Ledger & Disbursals",
              source: "/data/bounty_ledger.json (Static)",
              tier: "SYNTHETIC_DEMO",
              status: "DEGRADED",
              count: staticItems.length,
              latencyMs: tLedgerLatency,
              lastSync: nowIso,
              error: "Live ledger API offline; loaded research pilot scope fixture",
            });
          }
        }
      } catch (err) {
        telemetryItems.push({
          id: "commercial_ledger",
          name: "Commercial Ledger & Disbursals",
          source: "/api/ledger",
          tier: "SYNTHETIC_DEMO",
          status: "OFFLINE",
          count: 0,
          latencyMs: Math.round(performance.now() - tLedgerStart),
          lastSync: nowIso,
          error: String(err),
        });
      }

      // 4. Palantir Nexus Graph Feed
      const tGraphStart = performance.now();
      try {
        const graphRes = await fetch("/data/palantir_graph.json").catch(() => null);
        const tGraphLatency = Math.round(performance.now() - tGraphStart);
        if (graphRes?.ok) {
          const gData = await graphRes.json();
          setPalantirGraph(gData);
          telemetryItems.push({
            id: "palantir_graph",
            name: "Corporate Entity Network Graph",
            source: "/data/palantir_graph.json",
            tier: "SYNTHETIC_DEMO",
            status: "ONLINE",
            count: gData.nodes?.length || 0,
            latencyMs: tGraphLatency,
            lastSync: nowIso,
            error: null,
          });
        }
      } catch (err) {
        telemetryItems.push({
          id: "palantir_graph",
          name: "Palantir Shell Knowledge Graph",
          source: "/data/palantir_graph.json",
          tier: "SYNTHETIC_DEMO",
          status: "OFFLINE",
          count: 0,
          latencyMs: Math.round(performance.now() - tGraphStart),
          lastSync: nowIso,
          error: String(err),
        });
      }

      // 5. Ancillary Datasets (Permits, Evidence, Zones, Fraud Rings)
      const [liveZonesRes, pRes, eRes, ringsRes] = await Promise.all([
        fetch("/api/zones").catch(() => null),
        fetch("/data/permits.json").catch(() => null),
        fetch("/data/evidence.json").catch(() => null),
        fetch("/data/fraud_rings.json").catch(() => null),
      ]);

      if (liveZonesRes?.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zJson = await liveZonesRes.json() as any;
        if (zJson.data) setZones(zJson.data);
      } else {
        const zRes = await fetch("/data/zones.json").catch(() => null);
        if (zRes?.ok) setZones(await zRes.json());
      }

      if (pRes?.ok) setPermits(await pRes.json());
      if (eRes?.ok) setEvidence(await eRes.json());
      if (ringsRes?.ok) setFraudRings(await ringsRes.json());

      // Telemetry rollup: live count strictly reflects live sourced feeds (no demo conflation)
      setLiveRecordCount(live311Count);
      setLatencyMs(Math.round(performance.now() - overallStartTime));

      // Calculate overall system ingestion status
      const hasOffline = telemetryItems.some((t) => t.status === "OFFLINE");
      const hasDegraded = telemetryItems.some((t) => t.status === "DEGRADED");
      const allOffline = telemetryItems.every((t) => t.status === "OFFLINE");

      if (allOffline) {
        setFeedStatus("OFFLINE");
      } else if (hasOffline || hasDegraded) {
        setFeedStatus("DEGRADED");
      } else {
        setFeedStatus("ONLINE");
      }

      setFeedTelemetry(telemetryItems);
    } catch (err) {
      console.error("Failed to load unified intelligence data:", err);
      setFeedStatus("OFFLINE");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

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

      switch (e.key) {
        case "1":
          handleToggleLayer("dumping");
          break;
        case "2":
          handleToggleLayer("noise");
          break;
        case "3":
          handleToggleLayer("medicaid");
          break;
        case "4":
          handleToggleLayer("permits");
          break;
        case "5":
          handleToggleLayer("evidence");
          break;
        case "6":
          handleToggleLayer("zones");
          break;
        case "k":
        case "K":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setIsCommandPaletteOpen((prev) => !prev);
          }
          break;
        case "Escape":
          setIsCommandPaletteOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleLayer]);

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

  const handleMedicaidAuth = useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/sources/medicaid-leads", {
        headers: { "Authorization": `Bearer ${token.trim()}` }
      });
      if (res.ok) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("estafotir_investigator_token", token.trim());
        }
        await loadData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [loadData]);

  const handleMedicaidLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("estafotir_investigator_token");
    }
    loadData();
  }, [loadData]);

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
            availableNpis={medicaid.map((m) => m.npi)}
            onSelectProvider={(npi) => {
              playClick();
              setSelectedRadarNpi(npi);
              setCurrentView("MEDICAID_RADAR");
            }}
          />
        )}

        {currentView === "MEDICAID_RADAR" && (
          <MedicaidQuiTamRadar 
            providers={medicaid}
            fraudRings={fraudRings}
            onOpenWeaponizer={handleOpenWeaponizer}
            initialSelectedNpi={selectedRadarNpi}
            sourceError={medicaidError}
            onAuthenticate={handleMedicaidAuth}
            onLogout={handleMedicaidLogout}
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
            providers={medicaid}
            onBackToRadar={() => {
              playClick();
              setCurrentView("MEDICAID_RADAR");
            }}
          />
        )}
      </main>

      <Footer 
        liveCount={liveRecordCount} 
        latencyMs={latencyMs} 
        liveSource="NYC SODA Live (erm2-nwe9, eabe-havv)" 
        feedStatus={feedStatus}
        feeds={feedTelemetry}
        onRefreshFeeds={loadData}
        isRefreshing={isRefreshing}
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
