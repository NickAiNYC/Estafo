"use client";

import { Activity, Calendar, DollarSign, FileText, LayoutDashboard, Map as MapIcon, Network, Search } from "lucide-react";
import { ConsoleView } from "@/components/Header";

interface ExecutiveHeaderProps {
  currentView: ConsoleView;
  onSelectView: (view: ConsoleView) => void;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  onOpenCommandPalette: () => void;
  onOpenSourceDrawer?: () => void;
}

const navItems: { id: ConsoleView; label: string; icon: typeof MapIcon }[] = [
  { id: "OVERVIEW", label: "Overview", icon: LayoutDashboard },
  { id: "WAR_ROOM", label: "Map", icon: MapIcon },
  { id: "MEDICAID_RADAR", label: "Healthcare", icon: Activity },
  { id: "CASE_TIMELINE", label: "Case Timeline", icon: Calendar },
  { id: "LEGAL_WEAPONIZER", label: "Diligence Dossiers", icon: FileText },
  { id: "PROFIT_LEDGER", label: "Financial examples", icon: DollarSign },
  { id: "NEXUS_GRAPH", label: "Entity graph", icon: Network },
];

export default function ExecutiveHeader({
  currentView,
  onSelectView,
  onOpenCommandPalette,
  onOpenSourceDrawer,
}: ExecutiveHeaderProps) {
  return (
    <header className="shrink-0 border-b border-white/[0.08] bg-[#121214] px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center h-8 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/images/estafotir-logo.png" 
              alt="ESTAFOTIR" 
              className="h-6 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <div className="text-[11px] font-mono text-[#EDECE9] tracking-wider uppercase font-semibold">
              Risk &amp; Compliance Intelligence
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Municipal Compliance &amp; Healthcare Diligence Terminal
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSourceDrawer && (
            <button
              type="button"
              onClick={onOpenSourceDrawer}
              className="hidden sm:flex items-center gap-2 rounded bg-[#18181B] border border-white/[0.08] hover:border-white/[0.16] px-2.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-sm"
              title="Open System Telemetry Diagnostics (⌘D)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-zinc-300">Telemetry</span>
              <span className="text-[10px] text-zinc-500">⌘D</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded bg-[#18181B] border border-white/[0.08] hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-all shadow-sm"
            aria-label="Open search command palette"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-mono text-zinc-400">Search</span>
            <span className="ml-1 text-[10px] font-mono bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded border border-white/[0.06]">
              ⌘K
            </span>
          </button>
        </div>
      </div>

      <nav className="mt-3 flex w-full gap-1 overflow-x-auto pb-1" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectView(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-white/[0.08] text-[#EDECE9] border border-white/[0.12] shadow-sm"
                  : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
