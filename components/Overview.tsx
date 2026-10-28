"use client";

import { Activity, ArrowUpRight, CalendarDays, Database, MapPinned } from "lucide-react";
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
  const live = feeds.filter((feed) => feed.tier === "LIVE_SOURCED" && feed.status === "ONLINE").reduce((sum, feed) => sum + feed.count, 0);
  const sample = feeds.filter((feed) => feed.tier === "SYNTHETIC_DEMO").reduce((sum, feed) => sum + feed.count, 0);
  const cards: { title: string; detail: string; view: ConsoleView; icon: typeof MapPinned; action: string }[] = [
    { title: "Municipal map", detail: city?.status === "ONLINE" ? `${city.count} NYC 311 records loaded` : "Live 311 feed unavailable", view: "WAR_ROOM", icon: MapPinned, action: "Open map" },
    { title: "Healthcare research", detail: medicaid?.status === "ONLINE" ? `${medicaid.count} sourced leads loaded` : medicaid?.status === "RESTRICTED" ? "Investigator access required" : "Source unavailable", view: "MEDICAID_RADAR", icon: Activity, action: "Open research" },
    { title: "Case timeline", detail: "Start from your own dated, attributed observations", view: "CASE_TIMELINE", icon: CalendarDays, action: "Open workspace" },
  ];
  return <section className="flex-1 overflow-y-auto bg-canvas px-4 py-8 md:px-8" aria-label="Dashboard overview">
    <div className="mx-auto max-w-6xl space-y-8">
      <div><p className="font-mono text-xs uppercase tracking-widest text-emerald">Estafotir / Personal dashboard</p><h1 className="mt-2 text-3xl font-semibold text-primary">Your research command center</h1><p className="mt-3 max-w-2xl text-sm text-secondary">Explore public signals, record what you know, and keep samples separate from sourced records. A screening signal is a reason to investigate, not a finding of fraud.</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-5"><p className="text-sm text-secondary">Live sourced records</p><p className="mt-2 text-3xl font-semibold text-primary">{refreshing ? "…" : live.toLocaleString()}</p><p className="mt-1 text-xs text-muted">Current response from available feeds</p></div>
        <div className="rounded-xl border border-border bg-surface p-5"><p className="text-sm text-secondary">Illustrative records</p><p className="mt-2 text-3xl font-semibold text-primary">{refreshing ? "…" : sample.toLocaleString()}</p><p className="mt-1 text-xs text-muted">Demo material, excluded from live count</p></div>
        <div className="rounded-xl border border-border bg-surface p-5"><p className="text-sm text-secondary">Healthcare access</p><p className="mt-2 text-lg font-semibold text-primary">{refreshing ? "Checking" : medicaid?.status === "ONLINE" ? "Available" : medicaid?.status === "RESTRICTED" ? "Restricted" : "Unavailable"}</p><p className="mt-1 text-xs text-muted">Claims-level data is not available here</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">{cards.map(({ title, detail, view, icon: Icon, action }) => <button key={title} type="button" onClick={() => onSelectView(view)} className="group rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-emerald/50 hover:bg-surface-elevated"><Icon className="h-6 w-6 text-emerald" /><h2 className="mt-4 text-lg font-semibold text-primary">{title}</h2><p className="mt-2 min-h-10 text-sm text-secondary">{detail}</p><span className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald">{action}<ArrowUpRight className="h-4 w-4" /></span></button>)}</div>
      <div className="rounded-xl border border-border bg-surface p-5"><div className="flex items-center gap-2"><Database className="h-5 w-5 text-steel" /><h2 className="font-semibold text-primary">Source health</h2></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{feeds.length ? feeds.map((feed) => <div key={feed.id} className="flex items-center justify-between gap-3 rounded-lg bg-inset px-3 py-2 text-sm"><span className="truncate text-secondary">{feed.name}</span><span className={feed.status === "ONLINE" ? "text-emerald" : feed.status === "RESTRICTED" ? "text-amber" : "text-crimson"}>{feed.status.toLowerCase()}</span></div>) : <p className="text-sm text-muted">Checking feeds…</p>}</div></div>
    </div>
  </section>;
}
