"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function Footer() {
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
    <footer className="h-[36px] px-20 flex items-center justify-between border-t border-border bg-canvas text-10 text-muted font-mono shrink-0 select-none">
      <div className="flex items-center gap-12">
        <span className="flex items-center gap-4 text-emerald">
          <Activity className="w-3 h-3" />
          <span>INGESTION: ACTIVE (18ms)</span>
        </span>
        <span className="text-border">|</span>
        <span className="text-secondary hidden md:inline">
          DSNY § 16-119 · CAC § 24-163 · NYS FALSE CLAIMS ACT § 189
        </span>
      </div>

      <div className="flex items-center gap-12">
        <span className="text-muted hidden sm:inline">
          TELEPHONE STANDBY CERTIFIED (48 RCNY § 6-08)
        </span>
        <span className="text-border">|</span>
        <span className="text-primary font-bold">
          UTC {time}
        </span>
      </div>
    </footer>
  );
}
