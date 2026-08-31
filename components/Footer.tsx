"use client";

import { useEffect, useState } from "react";

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
    <footer className="h-[48px] flex items-center justify-center border-t border-border bg-canvas text-11 text-muted font-mono shrink-0">
      TRUTH SOURCE: static JSON · ZERO BACKEND · refresh {time}
    </footer>
  );
}
