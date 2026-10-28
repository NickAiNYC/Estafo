"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ZoneRecord, MedicaidProviderRecord } from "@/types";
import type { ConsoleView } from "@/components/Header";
import { Search, ShieldAlert, Crosshair, RefreshCw } from "lucide-react";

interface CommandPaletteProps {
  zones?: ZoneRecord[];
  medicaid?: MedicaidProviderRecord[];
  onSelectZone?: (lat: number, lon: number) => void;
  onSelectView?: (view: ConsoleView) => void;
  onRefreshFeeds?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  liveRecordsCount?: number;
}

export default function CommandPalette({
  zones = [],
  medicaid = [],
  onSelectZone,
  onSelectView,
  onRefreshFeeds,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  liveRecordsCount = 598,
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
    setQuery("");
  }, [controlledOnClose]);

  // Global Key Down listener for ⌘K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (controlledIsOpen !== undefined && controlledOnClose) {
          if (controlledIsOpen) controlledOnClose();
        } else {
          setInternalOpen((prev) => !prev);
        }
      } else if (e.key === "Escape") {
        handleClose();
      } else if ((e.metaKey || e.ctrlKey) && isOpen && onSelectView) {
        if (e.key === "1") {
          e.preventDefault();
          onSelectView("OVERVIEW");
          handleClose();
        } else if (e.key === "2") {
          e.preventDefault();
          onSelectView("WAR_ROOM");
          handleClose();
        } else if (e.key === "3") {
          e.preventDefault();
          onSelectView("MEDICAID_RADAR");
          handleClose();
        } else if (e.key === "4") {
          e.preventDefault();
          onSelectView("CASE_TIMELINE");
          handleClose();
        } else if (e.key === "5") {
          e.preventDefault();
          onSelectView("LEGAL_WEAPONIZER");
          handleClose();
        } else if (e.key === "6") {
          e.preventDefault();
          onSelectView("NEXUS_GRAPH");
          handleClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, controlledIsOpen, controlledOnClose, handleClose, onSelectView]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredZones = zones
    .filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.status.toLowerCase().includes(q) ||
        (z.rider && z.rider.toLowerCase().includes(q))
    )
    .slice(0, 6);

  const filteredMedicaid = medicaid
    .filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.npi.includes(q) ||
        m.borough.toLowerCase().includes(q) ||
        m.facility_type.toLowerCase().includes(q)
    )
    .slice(0, 6);

  const navItems: { label: string; view: ConsoleView; shortcut: string; active?: boolean }[] = [
    { label: "Overview Dashboard", view: "OVERVIEW", shortcut: "⌘1", active: true },
    { label: "Municipal Map (150 Records)", view: "WAR_ROOM", shortcut: "⌘2" },
    { label: "Healthcare Research Leads", view: "MEDICAID_RADAR", shortcut: "⌘3" },
    { label: "Case Timeline Audit Trail", view: "CASE_TIMELINE", shortcut: "⌘4" },
    { label: "Dossier & Filing Drafts", view: "LEGAL_WEAPONIZER", shortcut: "⌘5" },
    { label: "Entity Network Graph", view: "NEXUS_GRAPH", shortcut: "⌘6" },
  ];

  const filteredNavItems = q
    ? navItems.filter((item) => item.label.toLowerCase().includes(q))
    : navItems;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Modal Container */}
      <div className="w-full max-w-xl bg-[#18181B] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/[0.08] bg-[#121212]/50">
          <Search className="w-4 h-4 text-zinc-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search records, entities, or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-[#EDECE9] placeholder-zinc-500 text-sm focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={handleClose}
            className="text-[10px] font-mono bg-white/[0.08] text-zinc-400 px-1.5 py-0.5 rounded border border-white/[0.06] hover:text-white hover:bg-white/[0.12] transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results / Quick Navigation List */}
        <div className="p-2 space-y-1 max-h-80 overflow-y-auto font-sans">
          {/* Quick Navigation Section */}
          {filteredNavItems.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Quick Navigation
              </div>
              <div className="space-y-0.5">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => {
                      if (onSelectView) onSelectView(item.view);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-xs text-left group"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.active ? "bg-emerald-400" : "bg-transparent group-hover:bg-zinc-500"
                        }`}
                      />
                      <span>{item.label}</span>
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500 group-hover:text-zinc-300">
                      {item.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* System Feeds Section */}
          {!q && (
            <div>
              <div className="pt-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                System Feeds
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onRefreshFeeds) onRefreshFeeds();
                  handleClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-xs text-left group"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Refresh NYC SODA 311 Feed</span>
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20">
                  API
                </span>
              </button>
            </div>
          )}

          {/* Filtered Zones Results */}
          {q && filteredZones.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Patrol Corridors ({filteredZones.length})
              </div>
              <div className="space-y-0.5 font-mono">
                {filteredZones.map((z) => (
                  <button
                    key={z.rank}
                    type="button"
                    onClick={() => {
                      if (onSelectZone) onSelectZone(z.lat, z.lon);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-xs text-left group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Crosshair className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-sans font-medium text-[#EDECE9]">{z.name}</span>
                        <span className="text-[10px] text-zinc-500 ml-2">Status: {z.status}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 shrink-0">
                      {z.score} pts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtered Medicaid Targets */}
          {q && filteredMedicaid.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Healthcare Providers ({filteredMedicaid.length})
              </div>
              <div className="space-y-0.5 font-mono">
                {filteredMedicaid.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (onSelectZone) onSelectZone(m.lat, m.lon);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-xs text-left group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-sans font-medium text-[#EDECE9]">{m.name}</span>
                        <span className="text-[10px] text-zinc-500 ml-2">
                          NPI {m.npi} · {m.borough}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 shrink-0">
                      ${(m.exposure_amount / 1_000_000).toFixed(1)}M
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {q && filteredNavItems.length === 0 && filteredZones.length === 0 && filteredMedicaid.length === 0 && (
            <div className="py-8 text-center text-zinc-500 text-xs font-mono">
              No matching records, entities, or commands found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#121212] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>{liveRecordsCount.toLocaleString()} active sourced records indexed</span>
          <span className="text-zinc-400">ESTAFOTIR Terminal</span>
        </div>
      </div>
    </div>
  );
}
