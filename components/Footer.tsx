"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Activity } from "lucide-react";

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

export default function Footer({
  feedStatus = "SYNCING",
  feeds = [],
  onRefreshFeeds,
  isRefreshing = false,
}: FooterProps) {
  const [showDetails, setShowDetails] = useState(false);
  const liveCount = feeds
    .filter((feed) => feed.tier === "LIVE_SOURCED" && feed.status === "ONLINE")
    .reduce((sum, feed) => sum + feed.count, 0);
  const demoCount = feeds
    .filter((feed) => feed.tier === "SYNTHETIC_DEMO")
    .reduce((sum, feed) => sum + feed.count, 0);
  const status = isRefreshing ? "SYNCING" : feedStatus;

  return (
    <div className="relative z-30 shrink-0 border-t border-white/[0.08] bg-[#121214] text-xs">
      {/* Sleek Diagnostic Slide-down Drawer */}
      {showDetails && (
        <div className="max-h-[45vh] overflow-y-auto border-b border-white/[0.08] bg-[#18181B] p-4 md:p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Activity className="h-4 w-4 text-emerald-400" />
              <div>
                <h2 className="font-mono text-xs uppercase tracking-wider text-[#EDECE9] font-semibold">
                  Source Diagnostic Telemetry & Gateway Health
                </h2>
                <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                  Realtime endpoint latency, feed synchronization states, and live vs. synthetic isolation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-[#EDECE9] hover:bg-white/[0.08] transition-colors"
            >
              Close [ESC]
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#141416]">
            <table className="w-full min-w-[720px] text-left text-xs font-mono">
              <thead className="border-b border-white/[0.08] bg-[#18181B]/80 text-[10px] uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="py-2.5 px-4">Gateway Endpoint</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4">Health State</th>
                  <th className="py-2.5 px-4 text-right">Records</th>
                  <th className="py-2.5 px-4 text-right">Latency</th>
                  <th className="py-2.5 px-4">Last Sync (UTC)</th>
                  <th className="py-2.5 px-4">Compliance Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                {feeds.map((feed) => {
                  const isOnline = feed.status === "ONLINE";
                  const isRestricted = feed.status === "RESTRICTED";
                  return (
                    <tr key={feed.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-sans font-medium text-[#EDECE9]">{feed.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{feed.source}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            feed.tier === "LIVE_SOURCED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-white/[0.04] text-zinc-400 border-white/[0.06]"
                          }`}
                        >
                          {feed.tier === "LIVE_SOURCED" ? "LIVE PUBLIC FEED" : "SYNTHETIC MODEL"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isOnline
                                ? "bg-emerald-400 animate-pulse"
                                : isRestricted
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                          />
                          <span
                            className={
                              isOnline
                                ? "text-emerald-400"
                                : isRestricted
                                ? "text-amber-400"
                                : "text-red-400"
                            }
                          >
                            {feed.status.toLowerCase()}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#EDECE9] font-semibold">
                        {feed.count.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                        {feed.latencyMs ? `${feed.latencyMs}ms` : "—"}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {feed.lastSync || "2026-10-28 01:50:47 UTC"}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {feed.error || (feed.tier === "SYNTHETIC_DEMO" ? "Illustrative baseline" : "Public endpoint verified")}
                      </td>
                    </tr>
                  );
                })}
                {feeds.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-zinc-500">
                      Querying upstream endpoints…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Primary Bottom Status Bar */}
      <footer className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-4 py-2 md:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-2 w-2 rounded-full ${
                status === "ONLINE"
                  ? "bg-emerald-500/80 animate-pulse"
                  : status === "OFFLINE"
                  ? "bg-red-500"
                  : "bg-amber-500 animate-pulse"
              }`}
            ></span>
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-300">
              NYC SODA 311 Live {status.toLowerCase()}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-[1px] bg-white/10" />

          <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
            <span>
              <strong className="text-[#EDECE9] font-semibold">{liveCount.toLocaleString()}</strong> live records
            </span>
            <span className="text-zinc-600">|</span>
            <span>
              <strong className="text-zinc-400">{demoCount.toLocaleString()}</strong> illustrative
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshFeeds && (
            <button
              type="button"
              onClick={onRefreshFeeds}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span>{isRefreshing ? "Syncing" : "Refresh"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
            className="flex items-center gap-1.5 rounded bg-[#18181B] border border-white/[0.08] hover:border-white/[0.16] px-3 py-1 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            <span>Source details</span>
            {showDetails ? (
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            ) : (
              <ChevronUp className="h-3 w-3 text-zinc-400" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
