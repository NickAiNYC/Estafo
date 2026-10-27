"use client";

import { useEffect, useState } from "react";
import { 
  Shield, 
  Map as MapIcon, 
  Network, 
  Activity, 
  DollarSign, 
  Scale, 
  Flame 
} from "lucide-react";

export type ConsoleView = "WAR_ROOM" | "NEXUS_GRAPH" | "MEDICAID_RADAR" | "PROFIT_LEDGER" | "LEGAL_WEAPONIZER";

interface HeaderProps {
  currentView: ConsoleView;
  onSelectView: (view: ConsoleView) => void;
}

export default function Header({ currentView, onSelectView }: HeaderProps) {
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

  return (
    <header className="h-[64px] flex items-center justify-between px-20 border-b border-border bg-canvas z-20 shrink-0">
      {/* Brand & Doctrine */}
      <div className="flex items-center gap-16">
        <div className="flex items-center gap-10">
          <div className="w-8 h-8 rounded-sm bg-amber/20 border border-amber/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber" />
          </div>
          <div>
            <div className="flex items-center gap-8">
              <span className="text-16 font-extrabold text-primary tracking-tight font-jakarta">
                ESTAFO
              </span>
              <span className="text-11 font-mono px-6 py-1 rounded bg-amber/10 border border-amber/30 text-amber font-bold">
                PALANTIR FOR NYC
              </span>
            </div>
            <div className="text-10 text-muted font-mono tracking-tight">
              METROPOLITAN INTELLIGENCE & PROFIT ENGINE
            </div>
          </div>
        </div>

        {/* Clocks */}
        <div className="hidden xl:flex items-center gap-12 text-11 text-muted font-mono border-l border-border pl-16">
          <span>NYC {times.nyc}</span>
          <span>·</span>
          <span>SHA {times.sha}</span>
          <span>·</span>
          <span>UTC {times.utc}</span>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <nav className="flex items-center gap-4 bg-inset border border-border p-3 rounded-md">
        <button
          onClick={() => onSelectView("WAR_ROOM")}
          className={`flex items-center gap-6 px-12 py-6 rounded-sm text-11 font-mono transition-all ${
            currentView === "WAR_ROOM"
              ? "bg-surface text-primary border border-border-hover shadow-panel font-bold"
              : "text-muted hover:text-secondary"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5 text-steel-blue" />
          <span>3D WAR ROOM</span>
        </button>

        <button
          onClick={() => onSelectView("NEXUS_GRAPH")}
          className={`flex items-center gap-6 px-12 py-6 rounded-sm text-11 font-mono transition-all ${
            currentView === "NEXUS_GRAPH"
              ? "bg-surface text-primary border border-border-hover shadow-panel font-bold"
              : "text-muted hover:text-secondary"
          }`}
        >
          <Network className="w-3.5 h-3.5 text-purple-400" />
          <span>PALANTIR NEXUS</span>
        </button>

        <button
          onClick={() => onSelectView("MEDICAID_RADAR")}
          className={`flex items-center gap-6 px-12 py-6 rounded-sm text-11 font-mono transition-all ${
            currentView === "MEDICAID_RADAR"
              ? "bg-surface text-primary border border-border-hover shadow-panel font-bold"
              : "text-muted hover:text-secondary"
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-red" />
          <span>MEDICAID QUI TAM</span>
        </button>

        <button
          onClick={() => onSelectView("PROFIT_LEDGER")}
          className={`flex items-center gap-6 px-12 py-6 rounded-sm text-11 font-mono transition-all ${
            currentView === "PROFIT_LEDGER"
              ? "bg-surface text-primary border border-border-hover shadow-panel font-bold"
              : "text-muted hover:text-secondary"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-sage" />
          <span>PROFIT LEDGER</span>
        </button>

        <button
          onClick={() => onSelectView("LEGAL_WEAPONIZER")}
          className={`flex items-center gap-6 px-12 py-6 rounded-sm text-11 font-mono transition-all ${
            currentView === "LEGAL_WEAPONIZER"
              ? "bg-surface text-primary border border-border-hover shadow-panel font-bold"
              : "text-muted hover:text-secondary"
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber" />
          <span>FILING STUDIO</span>
        </button>
      </nav>

      {/* Live Status & Bounty Pipeline */}
      <div className="flex items-center gap-16 font-mono text-11">
        <div className="hidden lg:flex items-center gap-8 bg-inset px-10 py-5 rounded-sm border border-border">
          <Flame className="w-3.5 h-3.5 text-amber" />
          <span className="text-muted">PIPELINE:</span>
          <span className="text-sage font-bold">$9.6M BOUNTY</span>
        </div>

        <div className="flex items-center gap-6 text-sage bg-sage/10 border border-sage/20 px-8 py-4 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
          <span className="font-bold">VERCEL LIVE</span>
        </div>
      </div>
    </header>
  );
}
