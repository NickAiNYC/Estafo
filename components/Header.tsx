"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [times, setTimes] = useState({
    nyc: "...",
    sha: "...",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const nyc = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);

      const sha = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);

      setTimes({ nyc, sha });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-[56px] flex items-center justify-between px-24 border-b border-border bg-canvas z-10 shrink-0">
      <div className="flex items-center gap-24">
        <h1 className="text-18 font-bold text-primary tracking-tight">VANGUARD</h1>
        <div className="flex items-center gap-16 text-12.5 text-muted font-mono">
          <span>NYC {times.nyc}</span>
          <span>·</span>
          <span>SHA {times.sha}</span>
        </div>
      </div>
      <div className="flex items-center gap-12 text-12.5 font-mono">
        <div className="flex items-center gap-6 text-sage">
          <div className="w-8 h-8 rounded-full bg-sage animate-pulseSlow" />
          <span>LIVE</span>
        </div>
      </div>
    </header>
  );
}
