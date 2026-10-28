"use client";

import { 
  Shield, 
  Map as MapIcon, 
  Network, 
  Activity, 
  DollarSign, 
  Scale, 
  Search,
  ExternalLink
} from "lucide-react";
import { ConsoleView } from "@/components/Header";

interface ExecutiveHeaderProps {
  currentView: ConsoleView;
  onSelectView: (view: ConsoleView) => void;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  onOpenCommandPalette: () => void;
}

export default function ExecutiveHeader({
  currentView,
  onSelectView,
  onOpenCommandPalette,
}: ExecutiveHeaderProps) {
  const navItems: { id: ConsoleView; label: string; icon: typeof MapIcon }[] = [
    { id: "WAR_ROOM", label: "Dispatch Map", icon: MapIcon },
    { id: "LEGAL_WEAPONIZER", label: "Complaint Studio", icon: Scale },
    { id: "MEDICAID_RADAR", label: "Healthcare Screener", icon: Activity },
    { id: "PROFIT_LEDGER", label: "Financial Model", icon: DollarSign },
    { id: "NEXUS_GRAPH", label: "Entity Network", icon: Network },
  ];

  return (
    <header className="h-[60px] flex items-center justify-between px-20 border-b border-border bg-canvas/95 backdrop-blur-md z-30 shrink-0 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-16">
        <div className="flex items-center gap-10">
          <div className="w-8 h-8 rounded-sm bg-surface border border-border-highlight flex items-center justify-center shadow-inner-glow">
            <Shield className="w-4.5 h-4.5 text-emerald" />
          </div>
          <div>
            <div className="flex items-center gap-8">
              <span className="text-16 font-bold tracking-tight font-sans text-primary">
                ESTAFOTIR
              </span>
              <a 
                href="https://estafotir.vercel.app" 
                target="_blank" 
                rel="noreferrer"
                className="text-10 font-mono px-6 py-1 rounded-sm bg-surface border border-border-highlight text-emerald hover:text-emerald/80 flex items-center gap-4 transition-colors"
              >
                <span>estafotir.vercel.app</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="text-10 font-mono text-muted tracking-tight">
              NYC Citizen Enforcement & Healthcare Compliance
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-6 bg-surface border border-border p-3 rounded-sm shadow-panel">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-6 px-12 py-6 rounded-sm text-11 font-medium transition-all ${
                isSelected
                  ? "bg-surface-elevated text-primary border border-border-highlight font-bold shadow-tactical"
                  : "text-muted hover:text-secondary hover:bg-surface-hover"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald" : "text-muted"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Command Bar, Live System Status */}
      <div className="flex items-center gap-12">
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-8 px-10 py-5 bg-surface border border-border hover:border-border-highlight rounded-sm text-11 font-mono text-muted hover:text-secondary transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-muted" />
          <span>Search</span>
          <kbd className="text-9 bg-canvas px-4 py-0.5 rounded border border-border text-muted">⌘K</kbd>
        </button>

        <div className="flex items-center gap-6 text-11 font-mono bg-surface border border-border px-8 py-4 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-emerald" />
          <span className="text-emerald font-semibold">FEED ONLINE</span>
        </div>
      </div>
    </header>
  );
}
