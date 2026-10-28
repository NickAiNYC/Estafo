"use client";

import { useState, useEffect, useRef } from "react";

export interface TelemetryFeedState {
  id: string;
  name: string;
  status: string;
  records?: string | number;
  latencyMs: number;
  lastSyncAgoSeconds?: number;
  engine?: string;
  health?: string;
  nodes?: string;
}

export interface TelemetryHeartbeatData {
  seq: number;
  timestamp: string;
  feeds: {
    socrata_311: TelemetryFeedState;
    medicaid_leads: TelemetryFeedState;
    commercial_ledger: TelemetryFeedState;
    nexus_graph: TelemetryFeedState;
  };
}

const DEFAULT_TELEMETRY: TelemetryHeartbeatData = {
  seq: 0,
  timestamp: new Date().toISOString(),
  feeds: {
    socrata_311: {
      id: "socrata_311",
      name: "NYC SODA 311",
      status: "ONLINE",
      records: 150,
      latencyMs: 142,
      lastSyncAgoSeconds: 120,
    },
    medicaid_leads: {
      id: "medicaid_leads",
      name: "Medicaid (NPPES)",
      status: "ONLINE",
      records: 448,
      latencyMs: 210,
      lastSyncAgoSeconds: 720,
    },
    commercial_ledger: {
      id: "commercial_ledger",
      name: "Commercial Ledger",
      status: "ONLINE",
      records: "Synced",
      latencyMs: 89,
      lastSyncAgoSeconds: 2,
    },
    nexus_graph: {
      id: "nexus_graph",
      name: "Entity Network Graph",
      status: "ONLINE",
      nodes: "Linked",
      engine: "V2 Core",
      latencyMs: 42,
      health: "Nominal",
    },
  },
};

export function formatTimeAgo(seconds: number | undefined): string {
  if (seconds === undefined || seconds < 5) return "Just now";
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function useTelemetryHeartbeat(enabled: boolean = true) {
  const [telemetry, setTelemetry] = useState<TelemetryHeartbeatData>(DEFAULT_TELEMETRY);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let localTimer: NodeJS.Timeout | null = null;

    // Connect to SSE Heartbeat stream
    try {
      const es = new EventSource("/api/telemetry/heartbeat");
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TelemetryHeartbeatData;
          setTelemetry(data);
          setIsConnected(true);
        } catch {
          // Ignore JSON parse errors on malformed chunks
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        // EventSource will automatically attempt reconnection
      };
    } catch {
      setIsConnected(false);
    }

    // Local 1-second ticker to increment sync times smoothly between pulses
    localTimer = setInterval(() => {
      setTelemetry((prev) => {
        const feeds = { ...prev.feeds };
        if (feeds.socrata_311.lastSyncAgoSeconds !== undefined) {
          feeds.socrata_311 = {
            ...feeds.socrata_311,
            lastSyncAgoSeconds: feeds.socrata_311.lastSyncAgoSeconds + 1,
          };
        }
        if (feeds.medicaid_leads.lastSyncAgoSeconds !== undefined) {
          feeds.medicaid_leads = {
            ...feeds.medicaid_leads,
            lastSyncAgoSeconds: feeds.medicaid_leads.lastSyncAgoSeconds + 1,
          };
        }
        if (feeds.commercial_ledger.lastSyncAgoSeconds !== undefined) {
          feeds.commercial_ledger = {
            ...feeds.commercial_ledger,
            lastSyncAgoSeconds: feeds.commercial_ledger.lastSyncAgoSeconds + 1,
          };
        }
        return { ...prev, feeds };
      });
    }, 1000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (localTimer) clearInterval(localTimer);
    };
  }, [enabled]);

  return { telemetry, isConnected };
}
