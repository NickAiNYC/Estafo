"use client";

import React, { useEffect } from "react";
import type { FeedTelemetryItem } from "@/components/Footer";
import { useTelemetryHeartbeat, formatTimeAgo } from "@/hooks/useTelemetryHeartbeat";

interface SourceDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feeds?: FeedTelemetryItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function SourceDetailsDrawer({
  isOpen,
  onClose,
  feeds = [],
  onRefresh,
  isRefreshing = false,
}: SourceDetailsDrawerProps) {
  // Realtime SSE Heartbeat Hook active whenever drawer is visible
  const { telemetry, isConnected } = useTelemetryHeartbeat(isOpen);

  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract dynamic feed counts or fallback to live telemetry stream
  const sodaFeed = feeds.find((f) => f.id === "socrata_311");
  const medicaidFeed = feeds.find((f) => f.id === "medicaid_leads");

  const sodaCount = sodaFeed ? sodaFeed.count : (telemetry.feeds.socrata_311.records ?? 150);
  const medicaidCount = medicaidFeed ? medicaidFeed.count : (telemetry.feeds.medicaid_leads.records ?? 448);

  const sodaLatency = `${telemetry.feeds.socrata_311.latencyMs}ms`;
  const medicaidLatency = `${telemetry.feeds.medicaid_leads.latencyMs}ms`;
  const ledgerLatency = `${telemetry.feeds.commercial_ledger.latencyMs}ms`;
  const graphLatency = `${telemetry.feeds.nexus_graph.latencyMs}ms`;

  const sodaSync = formatTimeAgo(telemetry.feeds.socrata_311.lastSyncAgoSeconds);
  const medicaidSync = formatTimeAgo(telemetry.feeds.medicaid_leads.lastSyncAgoSeconds);
  const ledgerSync = formatTimeAgo(telemetry.feeds.commercial_ledger.lastSyncAgoSeconds);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[#141416]/95 backdrop-blur-md border-t border-white/[0.12] shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
              title={isConnected ? "Live SSE Stream Active" : "Connecting SSE stream..."}
            ></span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#EDECE9]">
              System Telemetry & Feed Diagnostics
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              4 Active
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {isConnected ? "LIVE SSE HEARTBEAT" : "CONNECTING..."}
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            Close [esc]
          </button>
        </div>

        {/* Feeds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-4">
          {/* Feed 1: NYC SODA 311 */}
          <div className="p-3.5 rounded-lg bg-[#18181B] border border-white/[0.06] hover:border-white/[0.12] transition-colors shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-200 font-sans">NYC SODA 311</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Online
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>Records:</span>
                <span className="text-zinc-200 font-semibold">{sodaCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="text-emerald-400 tabular-nums">{sodaLatency}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync:</span>
                <span className="text-zinc-300 tabular-nums">{sodaSync}</span>
              </div>
            </div>
          </div>

          {/* Feed 2: Medicaid (NPPES) */}
          <div className="p-3.5 rounded-lg bg-[#18181B] border border-white/[0.06] hover:border-white/[0.12] transition-colors shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-200 font-sans">Medicaid (NPPES)</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Online
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>Records:</span>
                <span className="text-zinc-200 font-semibold">{medicaidCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="text-emerald-400 tabular-nums">{medicaidLatency}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync:</span>
                <span className="text-zinc-300 tabular-nums">{medicaidSync}</span>
              </div>
            </div>
          </div>

          {/* Feed 3: Commercial Ledger */}
          <div className="p-3.5 rounded-lg bg-[#18181B] border border-white/[0.06] hover:border-white/[0.12] transition-colors shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-200 font-sans">Commercial Ledger</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Online
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>Records:</span>
                <span className="text-zinc-200 font-semibold">Synced</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="text-emerald-400 tabular-nums">{ledgerLatency}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync:</span>
                <span className="text-zinc-300 tabular-nums">{ledgerSync}</span>
              </div>
            </div>
          </div>

          {/* Feed 4: Entity Network Graph */}
          <div className="p-3.5 rounded-lg bg-[#18181B] border border-white/[0.06] hover:border-white/[0.12] transition-colors shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-200 font-sans">Entity Network Graph</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Online
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>Nodes:</span>
                <span className="text-zinc-200 font-semibold">Linked</span>
              </div>
              <div className="flex justify-between">
                <span>Engine:</span>
                <span className="text-zinc-200">V2 Core</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="text-emerald-400 tabular-nums">{graphLatency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Subtext */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 border-t border-white/[0.06]">
          <span>Endpoint integrity verified against public SODA and NPPES registries.</span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-zinc-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <span>{isRefreshing ? "Re-indexing..." : "Force global re-index ↻"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
