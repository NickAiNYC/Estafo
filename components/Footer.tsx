"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldCheck, Database, RefreshCw, AlertTriangle, XCircle, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";

export interface FeedTelemetryItem {
  id: string;
  name: string;
  source: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING";
  count: number;
  latencyMs: number;
  lastSync: string | null;
  error?: string | null;
}

interface FooterProps {
  liveCount?: number;
  liveSource?: string;
  latencyMs?: number;
  feedStatus?: "ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING";
  feeds?: FeedTelemetryItem[];
  onRefreshFeeds?: () => void;
  isRefreshing?: boolean;
}

export default function Footer({
  liveCount = 0,
  liveSource = "NYC SODA (erm2-nwe9, eabe-havv)",
  latencyMs = 42,
  feedStatus = "ONLINE",
  feeds = [],
  onRefreshFeeds,
  isRefreshing = false,
}: FooterProps) {
  const [time, setTime] = useState("...");
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false);

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }).format(new Date())
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: "ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING") => {
    switch (status) {
      case "ONLINE":
        return (
          <span className="flex items-center gap-4 text-emerald font-bold">
            <CheckCircle2 className="w-3 h-3" /> ONLINE
          </span>
        );
      case "DEGRADED":
        return (
          <span className="flex items-center gap-4 text-gold font-bold">
            <AlertTriangle className="w-3 h-3" /> DEGRADED
          </span>
        );
      case "OFFLINE":
        return (
          <span className="flex items-center gap-4 text-red-400 font-bold">
            <XCircle className="w-3 h-3" /> OFFLINE
          </span>
        );
      case "SYNCING":
        return (
          <span className="flex items-center gap-4 text-cyan-400 font-bold">
            <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING
          </span>
        );
    }
  };

  return (
    <div className="relative shrink-0 z-30 select-none font-mono">
      {/* Expandable Feed Telemetry Drawer */}
      {showTelemetryDrawer && (
        <div className="bg-canvas/95 backdrop-blur-md border-t border-border-highlight p-16 shadow-tactical max-h-[320px] overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex items-center justify-between pb-8 border-b border-border">
              <div className="flex items-center gap-8">
                <Activity className="w-4 h-4 text-emerald" />
                <span className="text-12 font-bold uppercase tracking-wider text-primary">
                  Live Feed Telemetry & Source Diagnostics
                </span>
                <span className="text-10 text-muted px-6 py-1 bg-inset rounded-sm border border-border">
                  {feeds.length} Active Feeds Monitored
                </span>
              </div>
              <div className="flex items-center gap-8">
                {onRefreshFeeds && (
                  <button
                    onClick={onRefreshFeeds}
                    disabled={isRefreshing}
                    className="flex items-center gap-6 px-10 py-4 bg-emerald/20 hover:bg-emerald/30 border border-emerald/60 text-emerald text-10 font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>{isRefreshing ? "SYNCING..." : "SYNC ALL FEEDS NOW"}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowTelemetryDrawer(false)}
                  className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border text-muted hover:text-primary text-10 rounded-sm cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Feeds Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-11">
                <thead>
                  <tr className="text-muted border-b border-border/60 text-9 uppercase tracking-wider">
                    <th className="py-6 px-8">Feed Name</th>
                    <th className="py-6 px-8">Source Endpoint</th>
                    <th className="py-6 px-8">Status</th>
                    <th className="py-6 px-8 text-right">Records</th>
                    <th className="py-6 px-8 text-right">Latency</th>
                    <th className="py-6 px-8">Last Sync (UTC)</th>
                    <th className="py-6 px-8">Diagnostic Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {feeds.map((feed) => (
                    <tr key={feed.id} className="hover:bg-surface/40 transition-colors">
                      <td className="py-6 px-8 font-bold text-primary">{feed.name}</td>
                      <td className="py-6 px-8 text-muted text-10">{feed.source}</td>
                      <td className="py-6 px-8">{getStatusBadge(feed.status)}</td>
                      <td className="py-6 px-8 text-right font-bold text-secondary">
                        {feed.count.toLocaleString()}
                      </td>
                      <td className="py-6 px-8 text-right text-muted">{feed.latencyMs}ms</td>
                      <td className="py-6 px-8 text-muted">{feed.lastSync || "—"}</td>
                      <td className="py-6 px-8">
                        {feed.error ? (
                          <span className="text-red-400 font-bold bg-red-950/40 px-6 py-1 rounded-sm border border-red-500/30">
                            {feed.error}
                          </span>
                        ) : (
                          <span className="text-faint">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {feeds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted">
                        No feeds configured or telemetry initializing...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Primary Footer Bar */}
      <footer className="h-[36px] px-16 flex items-center justify-between border-t border-border bg-canvas text-10 text-muted shrink-0">
        <div className="flex items-center gap-12">
          {/* Live Ingestion Status */}
          <span className="flex items-center gap-6">
            {isRefreshing ? (
              <span className="flex items-center gap-4 text-cyan-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>INGESTION: SYNCING...</span>
              </span>
            ) : feedStatus === "ONLINE" ? (
              <span className="flex items-center gap-4 text-emerald">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>INGESTION: LIVE ({latencyMs}ms)</span>
              </span>
            ) : feedStatus === "DEGRADED" ? (
              <span className="flex items-center gap-4 text-gold">
                <AlertTriangle className="w-3 h-3" />
                <span>INGESTION: DEGRADED ({latencyMs}ms)</span>
              </span>
            ) : (
              <span className="flex items-center gap-4 text-red-400">
                <XCircle className="w-3 h-3" />
                <span>INGESTION: OFFLINE ({latencyMs}ms)</span>
              </span>
            )}
          </span>

          <span className="text-border">|</span>

          {/* Telemetry Drawer Toggle Button */}
          <button
            onClick={() => setShowTelemetryDrawer((prev) => !prev)}
            className="flex items-center gap-4 text-secondary hover:text-primary transition-colors cursor-pointer bg-surface/60 hover:bg-surface border border-border px-6 py-2 rounded-sm"
            title="Inspect feed-level diagnostics, latencies, and error logs"
          >
            <span>TELEMETRY ({feeds.length} FEEDS)</span>
            {showTelemetryDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>

          {/* Quick Refresh Button */}
          {onRefreshFeeds && (
            <button
              onClick={onRefreshFeeds}
              disabled={isRefreshing}
              className="flex items-center gap-4 text-steel-blue hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh all data feeds"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">SYNC</span>
            </button>
          )}

          <span className="text-border hidden md:inline">|</span>

          <span className="flex items-center gap-4 text-secondary hidden md:inline-flex">
            <Database className="w-3 h-3 text-steel-blue" />
            <span>TRUTH SOURCE: {liveSource}</span>
          </span>

          <span className="text-border hidden md:inline">|</span>

          <span className="text-primary/80 hidden lg:inline">
            RECORDS ACTIVE: <span className="text-emerald font-bold">{liveCount}</span>
          </span>
        </div>

        <div className="flex items-center gap-12">
          <span className="flex items-center gap-4 text-gold hidden sm:inline-flex">
            <ShieldCheck className="w-3 h-3 text-gold" />
            <span>AUDIT: GAAP-ALIGNED LEDGER (GATE G4)</span>
          </span>
          <span className="text-border">|</span>
          <span className="text-primary font-bold">
            UTC {time}
          </span>
        </div>
      </footer>
    </div>
  );
}
