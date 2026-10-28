"use client";

import { Activity, ArrowUpRight, CalendarDays, Database, MapPinned, Network } from "lucide-react";
import type { ConsoleView } from "@/components/Header";
import type { FeedTelemetryItem } from "@/components/Footer";

type Props = {
  feeds: FeedTelemetryItem[];
  refreshing: boolean;
  onSelectView: (view: ConsoleView) => void;
};

export default function Overview({ feeds, refreshing, onSelectView }: Props) {
  const source = (id: string) => feeds.find((feed) => feed.id === id);
  const city = source("socrata_311");
  const medicaid = source("medicaid_leads");
  const live = feeds
    .filter((feed) => feed.tier === "LIVE_SOURCED" && feed.status === "ONLINE")
    .reduce((sum, feed) => sum + feed.count, 0);
  const sample = feeds
    .filter((feed) => feed.tier === "SYNTHETIC_DEMO")
    .reduce((sum, feed) => sum + feed.count, 0);

  const cards: { title: string; detail: string; view: ConsoleView; icon: typeof MapPinned; action: string; badge: string }[] = [
    {
      title: "Municipal Map",
      detail: city?.status === "ONLINE" ? `${city.count.toLocaleString()} NYC 311 live incidents geo-indexed` : "Live 311 SODA feed offline",
      view: "WAR_ROOM",
      icon: MapPinned,
      action: "Open Tactical Map",
      badge: "150 RECORDS",
    },
    {
      title: "Healthcare Research",
      detail: medicaid?.status === "ONLINE" ? `${medicaid.count.toLocaleString()} verified provider records loaded` : "Investigator credentialing active",
      view: "MEDICAID_RADAR",
      icon: Activity,
      action: "Open Provider Matrix",
      badge: "RESTRICTED",
    },
    {
      title: "Case Timeline",
      detail: "Dated, attributed observation audit trail with 4-quadrant analysis",
      view: "CASE_TIMELINE",
      icon: CalendarDays,
      action: "Open Audit Trail",
      badge: "ZERO-PHI",
    },
    {
      title: "Entity Network Graph",
      detail: "Cross-vector link analysis mapping haulers, facilities, and billing nodes",
      view: "NEXUS_GRAPH",
      icon: Network,
      action: "Open Node Graph",
      badge: "8 NODES",
    },
  ];

  return (
    <section className="flex-1 overflow-y-auto bg-[#0A0A0C] px-4 py-8 md:px-8" aria-label="Dashboard overview">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Terminal Header */}
        <div className="border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400">
              ESTAFOTIR // PERSONAL DASHBOARD
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              TERMINAL READY
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-[#EDECE9] tracking-tight">
            Research Command Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400 leading-relaxed font-sans">
            Institutional workstation for municipal compliance and healthcare lead intelligence.
            Public signals and verified feeds are strictly isolated from illustrative models.
            Screening signals represent investigatory leads, not findings of fraud.
          </p>
        </div>

        {/* Unified Metrics Ribbon (Command Strip) */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono mb-2 flex items-center justify-between">
            <span>Primary Telemetry Strip</span>
            <span className="text-zinc-500">REALTIME DATA FEED</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 rounded-xl bg-[#18181B] border border-white/[0.08] shadow-2xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            {/* Live Sourced Records */}
            <div className="p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
                  Live Sourced Records
                </span>
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" title="Feed online"></span>
              </div>
              <div className="text-3xl font-mono font-semibold text-[#EDECE9] tracking-tight">
                {refreshing ? "…" : live.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500 mt-2 font-mono">
                Current response from active municipal feeds
              </p>
            </div>

            {/* Illustrative Records */}
            <div className="p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
                  Illustrative Records
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                  BENCHMARK
                </span>
              </div>
              <div className="text-3xl font-mono font-semibold text-[#EDECE9] tracking-tight">
                {refreshing ? "…" : sample.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500 mt-2 font-mono">
                Calibrated demo models, excluded from live metrics
              </p>
            </div>

            {/* Healthcare Access */}
            <div className="p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
                  Healthcare Access
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  LEAD RADAR
                </span>
              </div>
              <div className="text-2xl font-mono font-semibold text-[#EDECE9] tracking-tight">
                {refreshing
                  ? "Checking…"
                  : medicaid?.status === "ONLINE"
                  ? "Available"
                  : medicaid?.status === "RESTRICTED"
                  ? "Restricted Access"
                  : "Unavailable"}
              </div>
              <p className="text-xs text-zinc-500 mt-2 font-mono">
                Claims-level data protected; screening aggregate only
              </p>
            </div>
          </div>
        </div>

        {/* Action / Workstation Navigation Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ title, detail, view, icon: Icon, action, badge }) => (
            <button
              key={title}
              type="button"
              onClick={() => onSelectView(view)}
              className="relative rounded-lg bg-[#18181B] p-6 border border-white/[0.08] hover:border-white/[0.16] transition-all duration-200 shadow-2xl text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-white/[0.04] border border-white/[0.06] text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                    {badge}
                  </span>
                </div>
                <h2 className="text-base font-medium text-[#EDECE9] tracking-tight font-sans">
                  {title}
                </h2>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-sans min-h-[36px]">
                  {detail}
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400 group-hover:text-[#EDECE9] transition-colors">
                <span>{action}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Source Health Diagnostic Panel */}
        <div className="rounded-xl bg-[#18181B] border border-white/[0.08] p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-mono font-semibold text-[#EDECE9] uppercase tracking-wider">
                Source Health & Ingestion Telemetry
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse"></span>
              <span className="text-xs font-mono text-zinc-400">All Gateway Endpoints Reachable</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {feeds.length ? (
              feeds.map((feed) => {
                const isOnline = feed.status === "ONLINE";
                const isRestricted = feed.status === "RESTRICTED";
                return (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#141416] border border-white/[0.06] p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            isOnline
                              ? "bg-emerald-400"
                              : isRestricted
                              ? "bg-amber-400"
                              : "bg-red-400"
                          }`}
                        />
                        <span className="truncate font-medium text-[#EDECE9]">
                          {feed.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 truncate block mt-0.5">
                        {feed.source}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase ${
                          isOnline
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isRestricted
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {feed.status}
                      </span>
                      <div className="text-[10px] font-mono text-zinc-400 mt-1">
                        {feed.count.toLocaleString()} recs
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs font-mono text-zinc-500">Checking feeds…</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
