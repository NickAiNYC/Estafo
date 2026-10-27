"use client";

import { useEffect, useState } from "react";
import { 
  Shield, 
  Map as MapIcon, 
  Network, 
  Activity, 
  DollarSign, 
  Scale, 
  Volume2, 
  VolumeX, 
  Terminal,
  Clock
} from "lucide-react";
import { ConsoleView } from "@/components/Header";

interface ExecutiveHeaderProps {
  currentView: ConsoleView;
  onSelectView: (view: ConsoleView) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenCommandPalette: () => void;
}

export default function ExecutiveHeader({
  currentView,
  onSelectView,
  audioEnabled,
  onToggleAudio,
  onOpenCommandPalette,
}: ExecutiveHeaderProps) {
  const [times, setTimes] = useState({
    nyc: "...",
    sha: "...",
    utc: "...",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const nyc = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);

      const sha = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);

      const utc = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);

      setTimes({ nyc, sha, utc });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: ConsoleView; label: string; icon: typeof MapIcon; shortcut: string }[] = [
    { id: "WAR_ROOM", label: "3D WAR ROOM", icon: MapIcon, shortcut: "0" },
    { id: "NEXUS_GRAPH", label: "PALANTIR NEXUS", icon: Network, shortcut: "G" },
    { id: "MEDICAID_RADAR", label: "MEDICAID QUI TAM", icon: Activity, shortcut: "M" },
    { id: "PROFIT_LEDGER", label: "PROFIT LEDGER", icon: DollarSign, shortcut: "L" },
    { id: "LEGAL_WEAPONIZER", label: "FILING STUDIO", icon: Scale, shortcut: "W" },
  ];

  return (
    <header className="h-[60px] flex items-center justify-between px-20 border-b border-border bg-canvas/95 backdrop-blur-md z-30 shrink-0 select-none">
      {/* Brand & Terminal Badge */}
      <div className="flex items-center gap-16">
        <div className="flex items-center gap-10">
          <div className="w-8 h-8 rounded-sm bg-surface border border-border-highlight flex items-center justify-center shadow-inner-glow">
            <Shield className="w-4 h-4 text-emerald" />
          </div>
          <div>
            <div className="flex items-center gap-8">
              <span className="text-15 font-bold tracking-tight font-sans text-primary">
                VANGUARD
              </span>
              <span className="text-10 font-mono px-6 py-1 rounded-sm bg-surface border border-border-highlight text-secondary">
                PALANTIR FOR NYC
              </span>
            </div>
            <div className="text-10 font-mono text-muted tracking-tight">
              ESTAFO INTELLIGENCE & PROFIT TERMINAL
            </div>
          </div>
        </div>

        {/* Real-time World Clocks */}
        <div className="hidden 2xl:flex items-center gap-12 text-11 font-mono text-muted border-l border-border pl-16">
          <div className="flex items-center gap-4">
            <Clock className="w-3 h-3 text-faint" />
            <span>NYC <strong className="text-secondary">{times.nyc}</strong></span>
          </div>
          <span>·</span>
          <span>SHA <strong className="text-secondary">{times.sha}</strong></span>
          <span>·</span>
          <span>UTC <strong className="text-secondary">{times.utc}</strong></span>
        </div>
      </div>

      {/* Center Nav Strip */}
      <nav className="flex items-center gap-4 bg-surface border border-border p-3 rounded-sm shadow-panel">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-6 px-12 py-5 rounded-sm text-11 font-mono transition-all ${
                isSelected
                  ? "bg-surface-elevated text-primary border border-border-highlight font-bold shadow-tactical"
                  : "text-muted hover:text-secondary hover:bg-surface-hover"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald" : "text-faint"}`} />
              <span>{item.label}</span>
              <span className="text-9 px-4 py-0.5 rounded bg-canvas/60 text-faint ml-2 hidden lg:inline">
                {item.shortcut}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Command Bar, Audio Toggle, Live Status */}
      <div className="flex items-center gap-12">
        {/* Quick Search trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-8 px-10 py-5 bg-surface border border-border hover:border-border-highlight rounded-sm text-11 font-mono text-muted hover:text-secondary transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-faint" />
          <span>CMD BAR</span>
          <kbd className="text-9 bg-canvas px-4 py-0.5 rounded border border-border text-faint">⌘K</kbd>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? "Tactical Audio: Enabled" : "Tactical Audio: Muted"}
          className={`p-6 rounded-sm border transition-all ${
            audioEnabled 
              ? "bg-surface text-emerald border-emerald/40" 
              : "bg-surface/50 text-faint border-border hover:text-muted"
          }`}
        >
          {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Live System Beacon */}
        <div className="flex items-center gap-6 text-11 font-mono bg-surface border border-border px-8 py-4 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-emerald font-bold">LIVE 18ms</span>
        </div>
      </div>
    </header>
  );
}
