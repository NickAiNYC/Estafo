"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldCheck, Database } from "lucide-react";

interface FooterProps {
  liveCount?: number;
  liveSource?: string;
  latencyMs?: number;
}

export default function Footer({
  liveCount = 100,
  liveSource = "NYC SODA (erm2-nwe9, eabe-havv)",
  latencyMs = 42,
}: FooterProps) {
  const [time, setTime] = useState("...");

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-[36px] px-16 flex items-center justify-between border-t border-border bg-canvas text-10 text-muted font-mono shrink-0 select-none z-20">
      <div className="flex items-center gap-12">
        <span className="flex items-center gap-4 text-emerald">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>INGESTION: LIVE ({latencyMs}ms)</span>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-4 text-secondary hidden md:inline-flex">
          <Database className="w-3 h-3 text-steel-blue" />
          <span>TRUTH SOURCE: {liveSource}</span>
        </span>
        <span className="text-border hidden md:inline">|</span>
        <span className="text-primary/80 hidden lg:inline">
          RECORDS ACTIVE: <span className="text-emerald font-bold">{liveCount}</span>
        </span>
      </div>

      <div className="flex items-center gap-12">
        <span className="flex items-center gap-4 text-gold hidden sm:inline-flex">
          <ShieldCheck className="w-3 h-3 text-gold" />
          <span>AUDIT: GAAP-ALIGNED LEDGER (GATE G4)</span>
        </span>
        <span className="text-border">|</span>
        <span className="text-primary font-bold">
          UTC {time}
        </span>
      </div>
    </footer>
  );
}
