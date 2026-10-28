"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import SourceDetailsDrawer from "@/components/SourceDetailsDrawer";

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
  isDrawerOpen?: boolean;
  onToggleDrawer?: (open: boolean) => void;
}

export default function Footer({
  feedStatus = "SYNCING",
  feeds = [],
  onRefreshFeeds,
  isRefreshing = false,
  isDrawerOpen,
  onToggleDrawer,
}: FooterProps) {
  const [internalShowDetails, setInternalShowDetails] = useState(false);
  const showDetails = isDrawerOpen !== undefined ? isDrawerOpen : internalShowDetails;

  const toggleDetails = (nextVal: boolean) => {
    if (onToggleDrawer) {
      onToggleDrawer(nextVal);
    } else {
      setInternalShowDetails(nextVal);
    }
  };
  const liveCount = feeds
    .filter((feed) => feed.tier === "LIVE_SOURCED" && feed.status === "ONLINE")
    .reduce((sum, feed) => sum + feed.count, 0);
  const demoCount = feeds
    .filter((feed) => feed.tier === "SYNTHETIC_DEMO")
    .reduce((sum, feed) => sum + feed.count, 0);
  const status = isRefreshing ? "SYNCING" : feedStatus;

  return (
    <>
      {/* Slide-Up Telemetry & Diagnostic Drawer */}
      <SourceDetailsDrawer
        isOpen={showDetails}
        onClose={() => toggleDetails(false)}
        feeds={feeds}
        onRefresh={onRefreshFeeds}
        isRefreshing={isRefreshing}
      />

      {/* Primary Bottom Status Bar */}
      <div className="relative z-30 shrink-0 border-t border-white/[0.08] bg-[#121214] text-xs">
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
              onClick={() => toggleDetails(!showDetails)}
              aria-expanded={showDetails}
              className="flex items-center gap-1.5 rounded bg-[#18181B] border border-white/[0.08] hover:border-white/[0.16] px-3 py-1 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
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
    </>
  );
}
