"use client";

import { useState, useEffect, useCallback } from "react";
import { ZoneRecord, MedicaidProviderRecord } from "@/types";
import { Search, ShieldAlert, Crosshair, X } from "lucide-react";

interface CommandPaletteProps {
  zones: ZoneRecord[];
  medicaid?: MedicaidProviderRecord[];
  onSelectZone: (lat: number, lon: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CommandPalette({
  zones,
  medicaid = [],
  onSelectZone,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  
  const handleClose = useCallback(() => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  }, [controlledOnClose]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (controlledOnClose && controlledIsOpen !== undefined) {
          if (controlledIsOpen) controlledOnClose();
        } else {
          setInternalOpen((open) => !open);
        }
      }
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [controlledIsOpen, controlledOnClose, handleClose]);

  if (!isOpen) return null;

  const filteredZones = zones.filter((z) => 
    z.name.toLowerCase().includes(query.toLowerCase()) ||
    z.status.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMedicaid = medicaid.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.npi.includes(query) ||
    m.borough.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-canvas/80 backdrop-blur-md p-16 select-none">
      <div className="bg-surface border border-border w-full max-w-[620px] rounded-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-16 border-b border-border bg-inset">
          <Search className="w-4 h-4 text-muted" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-13 text-primary px-12 py-14 font-mono placeholder:text-muted"
            placeholder="Search zones, coordinates, NPI, or enforcement tracks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (filteredZones.length > 0) {
                  onSelectZone(filteredZones[0].lat, filteredZones[0].lon);
                  handleClose();
                  setQuery("");
                } else if (filteredMedicaid.length > 0) {
                  onSelectZone(filteredMedicaid[0].lat, filteredMedicaid[0].lon);
                  handleClose();
                  setQuery("");
                }
              }
            }}
          />
          <button 
            onClick={handleClose}
            className="p-4 text-muted hover:text-primary rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Results Stream */}
        <div className="max-h-[380px] overflow-y-auto p-8 space-y-8 font-mono">
          {/* Zones Section */}
          {filteredZones.length > 0 && (
            <div>
              <div className="text-10 text-muted px-10 py-4 uppercase tracking-wider">
                Patrol Zones ({filteredZones.length})
              </div>
              <div className="space-y-2">
                {filteredZones.map((z) => (
                  <div
                    key={z.rank}
                    onClick={() => {
                      onSelectZone(z.lat, z.lon);
                      handleClose();
                      setQuery("");
                    }}
                    className="px-12 py-8 flex items-center justify-between rounded-sm hover:bg-surface-hover hover:border-l-2 hover:border-l-emerald cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-8">
                      <Crosshair className="w-3.5 h-3.5 text-emerald" />
                      <div>
                        <div className="text-12 font-bold text-primary font-sans">{z.name}</div>
                        <div className="text-10 text-muted">Status: {z.status} · Rider: {z.rider || "None"}</div>
                      </div>
                    </div>
                    <div className="text-11 text-emerald font-bold">{z.score} pts</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medicaid Section */}
          {filteredMedicaid.length > 0 && (
            <div className="pt-4 border-t border-border/40">
              <div className="text-10 text-muted px-10 py-4 uppercase tracking-wider">
                Medicaid Targets (NYFCA Qui Tam)
              </div>
              <div className="space-y-2">
                {filteredMedicaid.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectZone(m.lat, m.lon);
                      handleClose();
                      setQuery("");
                    }}
                    className="px-12 py-8 flex items-center justify-between rounded-sm hover:bg-surface-hover hover:border-l-2 hover:border-l-crimson cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-8">
                      <ShieldAlert className="w-3.5 h-3.5 text-crimson" />
                      <div>
                        <div className="text-12 font-bold text-primary font-sans">{m.name}</div>
                        <div className="text-10 text-muted">NPI {m.npi} · {m.borough} · {m.facility_type}</div>
                      </div>
                    </div>
                    <div className="text-11 text-crimson font-bold">
                      ${(m.exposure_amount / 1000000).toFixed(1)}M
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredZones.length === 0 && filteredMedicaid.length === 0 && (
            <div className="p-20 text-center text-muted text-12 font-mono">
              No matching zones or targets found.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-16 py-8 border-t border-border bg-inset text-10 font-mono text-muted flex items-center justify-between">
          <span>Navigate with ↑↓ · Select with Enter</span>
          <span className="text-faint">ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}
