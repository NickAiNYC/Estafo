"use client";

import { Activity, Calendar, DollarSign, FileText, Map as MapIcon, Network, Search } from "lucide-react";
import { ConsoleView } from "@/components/Header";

interface ExecutiveHeaderProps {
  currentView: ConsoleView;
  onSelectView: (view: ConsoleView) => void;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  onOpenCommandPalette: () => void;
}

const navItems: { id: ConsoleView; label: string; icon: typeof MapIcon }[] = [
  { id: "WAR_ROOM", label: "Map", icon: MapIcon },
  { id: "MEDICAID_RADAR", label: "Healthcare", icon: Activity },
  { id: "CASE_TIMELINE", label: "Case Timeline", icon: Calendar },
  { id: "LEGAL_WEAPONIZER", label: "Drafts", icon: FileText },
  { id: "PROFIT_LEDGER", label: "Financial examples", icon: DollarSign },
  { id: "NEXUS_GRAPH", label: "Entity graph", icon: Network },
];

export default function ExecutiveHeader({ currentView, onSelectView, onOpenCommandPalette }: ExecutiveHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-canvas px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white px-2.5 py-1 rounded-md border border-white/20 shadow-sm h-8 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/images/estafotir-logo.png" 
              alt="ESTAFOTIR" 
              className="h-5 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <div className="text-11 font-mono text-secondary tracking-wider uppercase font-semibold">Enforcement Intelligence</div>
            <div className="text-9 text-muted font-mono">NYC Medicaid & Qui Tam Research</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 rounded-lg border border-border-highlight bg-surface px-3 py-2 text-sm text-secondary transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      </div>
      <nav className="mt-3 flex w-full gap-1 overflow-x-auto pb-1" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectView(id)}
            aria-current={currentView === id ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald ${
              currentView === id ? "bg-surface-elevated text-primary" : "text-secondary hover:bg-surface hover:text-primary"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
