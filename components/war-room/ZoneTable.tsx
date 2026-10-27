"use client";

import { useState, useMemo } from "react";
import { ZoneRecord } from "@/types";
import { ArrowUp, ArrowDown, MapPin, Crosshair } from "lucide-react";

interface ZoneTableProps {
  zones: ZoneRecord[];
  onZoneClick: (lat: number, lon: number) => void;
  onPlayClick?: () => void;
}

type SortCol = "rank" | "name" | "score" | "dump" | "noise" | "permits" | "status";

export default function ZoneTable({ zones, onZoneClick, onPlayClick }: ZoneTableProps) {
  const [sortCol, setSortCol] = useState<SortCol>("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  const handleSort = (col: SortCol) => {
    if (onPlayClick) onPlayClick();
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const filteredZones = useMemo(() => {
    return zones.filter((z) => 
      z.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      z.status.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (z.rider && z.rider.toLowerCase().includes(filterQuery.toLowerCase()))
    );
  }, [zones, filterQuery]);

  const sortedZones = useMemo(() => {
    return [...filteredZones].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredZones, sortCol, sortAsc]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DARK":
        return "bg-crimson/15 text-crimson border-crimson/40";
      case "COVERED":
      case "ACTIVE":
        return "bg-emerald/15 text-emerald border-emerald/40";
      case "LOCKED":
        return "bg-amber/15 text-amber border-amber/40";
      default:
        return "bg-surface text-muted border-border";
    }
  };

  return (
    <div className="w-full lg:w-[460px] flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-surface shrink-0 h-full overflow-hidden select-none">
      {/* Header Bar */}
      <div className="px-16 py-12 border-b border-border bg-inset flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <Crosshair className="w-4 h-4 text-emerald" />
          <h2 className="text-12 font-mono uppercase tracking-wider text-primary font-bold">
            Field Target Assignments
          </h2>
        </div>
        <div className="text-10 font-mono text-muted">
          {sortedZones.length} ZONES RANKED
        </div>
      </div>

      {/* Quick Filter */}
      <div className="p-8 border-b border-border bg-canvas/40">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter zones by name, rider, status..."
          className="w-full bg-inset border border-border rounded-sm px-10 py-5 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
        />
      </div>
      
      {/* Table Data Matrix */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-inset z-10 border-b border-border text-10 font-mono text-muted uppercase">
            <tr>
              <th 
                className="py-7 px-10 w-[42px] cursor-pointer hover:text-primary transition-colors" 
                onClick={() => handleSort("rank")}
              >
                <div className="flex items-center gap-2">
                  <span>#</span>
                  {sortCol === "rank" && (sortAsc ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th 
                className="py-7 px-10 cursor-pointer hover:text-primary transition-colors" 
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  <span>Patrol Corridor</span>
                  {sortCol === "name" && (sortAsc ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th 
                className="py-7 px-10 w-[110px] cursor-pointer hover:text-primary transition-colors text-right" 
                onClick={() => handleSort("score")}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Yield Score</span>
                  {sortCol === "score" && (sortAsc ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th 
                className="py-7 px-12 w-[85px] cursor-pointer hover:text-primary transition-colors text-right" 
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Status</span>
                  {sortCol === "status" && (sortAsc ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 font-mono text-12">
            {sortedZones.map((z, idx) => (
              <tr
                key={z.rank}
                onClick={() => {
                  if (onPlayClick) onPlayClick();
                  onZoneClick(z.lat, z.lon);
                }}
                className={`
                  group cursor-pointer transition-colors duration-100
                  ${idx % 2 === 0 ? "bg-surface/60" : "bg-inset/40"}
                  hover:bg-surface-hover hover:border-l-2 hover:border-l-emerald
                `}
              >
                <td className="py-9 px-10 font-mono text-11 text-muted group-hover:text-primary">
                  {z.rank < 10 ? `0${z.rank}` : z.rank}
                </td>
                <td className="py-9 px-10">
                  <div className="text-13 font-bold text-primary tracking-tight font-sans group-hover:text-emerald transition-colors">
                    {z.name}
                  </div>
                  <div className="text-10 text-muted font-mono mt-1 flex items-center gap-4">
                    <MapPin className="w-2.5 h-2.5 text-faint" />
                    <span>{z.lat.toFixed(3)}, {z.lon.toFixed(3)}</span>
                    {z.rider && <span>· Rider: {z.rider}</span>}
                  </div>
                </td>
                <td className="py-9 px-10 text-right">
                  <div className="text-12 font-bold text-primary font-mono">{z.score}</div>
                  {/* High precision composite progress bar */}
                  <div className="flex h-[3px] rounded-full overflow-hidden bg-canvas mt-1.5 ml-auto w-20">
                    <div className="bg-amber h-full" style={{ width: `${(z.dump / (z.score || 1)) * 100}%` }} title={`Dumping: ${z.dump}`} />
                    <div className="bg-steel h-full" style={{ width: `${(z.noise / (z.score || 1)) * 100}%` }} title={`Noise: ${z.noise}`} />
                    <div className="bg-emerald h-full" style={{ width: `${(z.permits / (z.score || 1)) * 100}%` }} title={`Permits: ${z.permits}`} />
                  </div>
                </td>
                <td className="py-9 px-12 text-right">
                  <span
                    className={`inline-block text-9 font-mono px-6 py-1.5 rounded-sm border font-bold uppercase tracking-wider ${getStatusBadge(
                      z.status
                    )}`}
                  >
                    {z.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Instructions */}
      <div className="px-16 py-8 border-t border-border bg-inset text-10 font-mono text-muted flex items-center justify-between">
        <span>Click row to camera fly-to</span>
        <span className="text-faint">Hotkeys 1–6</span>
      </div>
    </div>
  );
}
