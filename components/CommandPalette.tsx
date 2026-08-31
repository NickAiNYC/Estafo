"use client";

import { useState, useEffect } from "react";
import { ZoneRecord } from "@/types";
import { Search } from "lucide-react";

interface CommandPaletteProps {
  zones: ZoneRecord[];
  onSelectZone: (lat: number, lon: number) => void;
}

export default function CommandPalette({ zones, onSelectZone }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  const filtered = zones.filter((z) => z.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-canvas/80 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full max-w-[600px] rounded-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center px-16 border-b border-border">
          <Search className="w-16 h-16 text-muted" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-14 text-primary px-12 py-16 font-jakarta"
            placeholder="Search zones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length > 0) {
                onSelectZone(filtered[0].lat, filtered[0].lon);
                setOpen(false);
                setQuery("");
              }
            }}
          />
        </div>
        
        {filtered.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto p-8 flex flex-col gap-4">
            {filtered.map((z) => (
              <div
                key={z.rank}
                onClick={() => {
                  onSelectZone(z.lat, z.lon);
                  setOpen(false);
                  setQuery("");
                }}
                className="px-12 py-12 flex items-center justify-between rounded-sm hover:bg-surface-hover cursor-pointer"
              >
                <div className="text-14 text-primary">{z.name}</div>
                <div className="text-11 text-muted font-mono">{z.score} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
