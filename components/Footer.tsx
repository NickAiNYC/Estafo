"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

export type FeedTier = "LIVE_SOURCED" | "SYNTHETIC_DEMO";

export interface FeedTelemetryItem {
  id: string;
  name: string;
  source: string;
  tier: FeedTier;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING" | "RESTRICTED";
  count: number;
  latencyMs: number;
  lastSync: string | null;
  error?: string | null;
}

interface FooterProps {
  liveCount?: number;
  liveSource?: string;
  latencyMs?: number;
  feedStatus?: "ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING" | "RESTRICTED";
  feeds?: FeedTelemetryItem[];
  onRefreshFeeds?: () => void;
  isRefreshing?: boolean;
}

export default function Footer({ feedStatus = "SYNCING", feeds = [], onRefreshFeeds, isRefreshing = false }: FooterProps) {
  const [showDetails, setShowDetails] = useState(false);
  const liveCount = feeds.filter((feed) => feed.tier === "LIVE_SOURCED" && feed.status === "ONLINE").reduce((sum, feed) => sum + feed.count, 0);
  const demoCount = feeds.filter((feed) => feed.tier === "SYNTHETIC_DEMO").reduce((sum, feed) => sum + feed.count, 0);
  const status = isRefreshing ? "SYNCING" : feedStatus;
  const statusColor = status === "ONLINE" ? "text-emerald" : status === "OFFLINE" ? "text-red-400" : "text-amber-300";

  return (
    <div className="relative z-30 shrink-0 border-t border-border bg-canvas text-sm">
      {showDetails && (
        <div className="max-h-[35vh] overflow-auto border-b border-border bg-surface p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-primary">Data sources</h2>
              <p className="text-xs text-secondary">Live records and sample data are counted separately.</p>
            </div>
            <button type="button" onClick={() => setShowDetails(false)} className="rounded-lg border border-border-highlight px-3 py-2 text-xs text-secondary hover:text-primary">Close</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="border-b border-border text-secondary">
                <tr><th className="py-2 pr-4">Source</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4 text-right">Records</th><th className="py-2 pr-4">Last checked</th><th className="py-2">Note</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feeds.map((feed) => (
                  <tr key={feed.id}>
                    <td className="py-3 pr-4 text-primary"><span className="font-medium">{feed.name}</span><span className="block text-muted">{feed.source}</span></td>
                    <td className="py-3 pr-4 text-secondary">{feed.tier === "LIVE_SOURCED" ? "Live source" : "Sample"}</td>
                    <td className="py-3 pr-4 text-secondary">{feed.status.toLowerCase()}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-primary">{feed.count.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-secondary">{feed.lastSync || "—"}</td>
                    <td className="py-3 text-secondary">{feed.error || (feed.tier === "SYNTHETIC_DEMO" ? "Illustrative data" : "—")}</td>
                  </tr>
                ))}
                {feeds.length === 0 && <tr><td colSpan={6} className="py-4 text-secondary">Sources have not loaded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <footer className="flex min-h-12 flex-wrap items-center justify-between gap-2 px-4 py-2 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`font-medium ${statusColor}`}>Sources: {status.toLowerCase()}</span>
          <span className="text-secondary">{liveCount} live records · {demoCount} sample records</span>
        </div>
        <div className="flex items-center gap-2">
          {onRefreshFeeds && (
            <button type="button" onClick={onRefreshFeeds} disabled={isRefreshing} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-secondary hover:bg-surface hover:text-primary disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />Refresh
            </button>
          )}
          <button type="button" onClick={() => setShowDetails((value) => !value)} aria-expanded={showDetails} className="flex items-center gap-1 rounded-lg border border-border-highlight px-3 py-1.5 text-secondary hover:text-primary">
            Source details {showDetails ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
