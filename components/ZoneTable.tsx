"use client";

import { useState } from "react";
import clsx from "clsx";
import { ZoneRecord } from "@/types";

interface ZoneTableProps {
  zones: ZoneRecord[];
  onZoneClick: (lat: number, lon: number) => void;
}

type SortCol = "rank" | "name" | "score" | "dump" | "noise" | "permits" | "status";

export default function ZoneTable({ zones, onZoneClick }: ZoneTableProps) {
  const [sortCol, setSortCol] = useState<SortCol>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const sortedZones = [...zones].sort((a, b) => {
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

  return (
    <div className="flex-1 flex flex-col min-w-[400px] border-l border-border bg-surface h-full">
      <div className="px-24 py-16 border-b border-border shrink-0 flex items-center justify-between">
        <h2 className="text-14 font-bold text-primary tracking-tight">FIELD ASSIGNMENTS</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-surface z-10 border-b border-border px-24 py-8 flex items-center text-11 text-muted font-outfit uppercase">
          <div className="w-[40px] cursor-pointer" onClick={() => handleSort("rank")}>#</div>
          <div className="flex-1 cursor-pointer" onClick={() => handleSort("name")}>Zone</div>
          <div className="w-[100px] cursor-pointer" onClick={() => handleSort("score")}>Score/Mix</div>
          <div className="w-[80px] cursor-pointer text-right" onClick={() => handleSort("status")}>Status</div>
        </div>

        <div className="flex flex-col p-8 gap-4">
          {sortedZones.map((z) => (
            <div
              key={z.rank}
              onClick={() => onZoneClick(z.lat, z.lon)}
              className="group flex items-center px-16 py-12 rounded-sm bg-inset border border-transparent hover:border-border-hover hover:-translate-y-[1px] hover:shadow-panel transition-all duration-150 cursor-pointer"
            >
              <div className="w-[40px] font-mono text-12.5 text-muted">{z.rank}</div>
              <div className="flex-1">
                <div className="text-14 text-primary font-jakarta">{z.name}</div>
                <div className="text-11 text-muted mt-2">{z.window}</div>
              </div>
              <div className="w-[100px] flex flex-col gap-4">
                <div className="text-12.5 font-mono text-primary">{z.score}</div>
                {/* Score composition bar */}
                <div className="flex h-[4px] rounded-full overflow-hidden bg-surface-hover">
                  <div className="bg-amber h-full" style={{ width: `${(z.dump / z.score) * 100}%` }} />
                  <div className="bg-steel-blue h-full" style={{ width: `${(z.noise / z.score) * 100}%` }} />
                  <div className="bg-sage h-full" style={{ width: `${(z.permits / z.score) * 100}%` }} />
                </div>
              </div>
              <div className="w-[80px] flex justify-end">
                <div
                  className={clsx(
                    "text-11 font-mono px-8 py-2 rounded-sm border",
                    z.status === "DARK" && "text-red border-red bg-transparent",
                    z.status === "COVERED" && "text-sage border-transparent bg-[rgba(95,191,151,0.1)]",
                    z.status === "COLD" && "text-muted border-muted bg-transparent"
                  )}
                >
                  {z.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
