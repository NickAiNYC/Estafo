"use client";

import { useState, useMemo, useEffect } from "react";
import { ZoneRecord } from "@/types";
import { 
  ArrowUp, 
  ArrowDown, 
  MapPin, 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  RefreshCw
} from "lucide-react";

interface OperatorTaskItem {
  id: string;
  opportunityId: string;
  title: string;
  priority: "P0_IMMEDIATE" | "P1_HIGH" | "P2_STANDARD";
  status: "TODO" | "IN_PROGRESS" | "FILED" | "COMPLETED";
  location: string;
  borough: string;
  assignedTo: string;
  dueDate: string;
  estimatedCost: number;
  expectedNetValue: number;
  evidenceCount: number;
  notes: string;
}

interface ZoneTableProps {
  zones: ZoneRecord[];
  onZoneClick: (lat: number, lon: number) => void;
  onPlayClick?: () => void;
}

type TableMode = "HOT_ZONES" | "TASK_QUEUE";
type SortCol = "rank" | "name" | "score" | "dump" | "noise" | "permits" | "status";

export default function ZoneTable({ zones, onZoneClick, onPlayClick }: ZoneTableProps) {
  const [mode, setMode] = useState<TableMode>("HOT_ZONES");
  const [sortCol, setSortCol] = useState<SortCol>("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  // Live Operator Tasks State
  const [tasks, setTasks] = useState<OperatorTaskItem[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const json = await res.json();
        if (json.data) setTasks(json.data);
      }
    } catch (err) {
      console.error("Failed to load operator tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAdvanceTaskStatus = async (task: OperatorTaskItem) => {
    const nextStatusMap: Record<string, "TODO" | "IN_PROGRESS" | "FILED" | "COMPLETED"> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "FILED",
      FILED: "COMPLETED",
      COMPLETED: "TODO",
    };
    const nextStatus = nextStatusMap[task.status] || "IN_PROGRESS";
    setUpdatingTaskId(task.id);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          newStatus: nextStatus,
          notes: `Status advanced to ${nextStatus} by operator`
        })
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      console.error("Failed to advance task:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.status.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [tasks, filterQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DARK":
        return "bg-crimson/15 text-crimson border-crimson/40";
      case "COVERED":
      case "ACTIVE":
      case "COMPLETED":
        return "bg-emerald/15 text-emerald border-emerald/40";
      case "LOCKED":
      case "IN_PROGRESS":
        return "bg-amber/15 text-amber border-amber/40";
      case "FILED":
        return "bg-steel-blue/20 text-steel-blue border-steel-blue/40";
      default:
        return "bg-surface text-muted border-border";
    }
  };

  return (
    <div className="w-full lg:w-[460px] flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-surface shrink-0 h-full overflow-hidden select-none">
      {/* Tab Switcher Header */}
      <div className="px-16 py-10 border-b border-border bg-inset flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setMode("HOT_ZONES")}
            className={`px-10 py-5 rounded-sm font-mono text-11 flex items-center gap-6 transition-colors ${
              mode === "HOT_ZONES"
                ? "bg-emerald/15 border border-emerald/40 text-emerald font-bold"
                : "text-muted hover:text-primary"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>CORRIDORS ({zones.length})</span>
          </button>

          <button
            onClick={() => setMode("TASK_QUEUE")}
            className={`px-10 py-5 rounded-sm font-mono text-11 flex items-center gap-6 transition-colors ${
              mode === "TASK_QUEUE"
                ? "bg-emerald/15 border border-emerald/40 text-emerald font-bold"
                : "text-muted hover:text-primary"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>TASKS ({tasks.length})</span>
          </button>
        </div>

        <button 
          onClick={fetchTasks} 
          title="Refresh task list"
          className="text-muted hover:text-primary transition-colors p-4"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Quick Search Filter */}
      <div className="p-8 border-b border-border bg-canvas/40">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder={mode === "HOT_ZONES" ? "Filter corridors by name, borough..." : "Filter action tasks by assignee, title..."}
          className="w-full bg-inset border border-border rounded-sm px-10 py-5 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
        />
      </div>
      
      {/* Mode 1: SPATIAL HOT ZONES TABLE */}
      {mode === "HOT_ZONES" ? (
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
                    <span>Corridor Location</span>
                    {sortCol === "name" && (sortAsc ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                  </div>
                </th>
                <th 
                  className="py-7 px-10 w-[100px] cursor-pointer hover:text-primary transition-colors text-right" 
                  onClick={() => handleSort("score")}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>Priority Score</span>
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
                    <div className="text-12 font-bold text-primary tracking-tight font-sans group-hover:text-emerald transition-colors">
                      {z.name}
                    </div>
                    <div className="text-10 text-muted font-mono mt-1 flex items-center gap-4">
                      <MapPin className="w-2.5 h-2.5 text-faint" />
                      <span>{z.lat.toFixed(3)}, {z.lon.toFixed(3)}</span>
                      {z.rider && <span>· Operative: {z.rider}</span>}
                    </div>
                  </td>
                  <td className="py-9 px-10 text-right">
                    <div className="text-12 font-bold text-primary font-mono">{z.score}</div>
                    <div className="flex h-[3px] rounded-full overflow-hidden bg-canvas mt-1.5 ml-auto w-20">
                      <div className="bg-amber h-full" style={{ width: `${(z.dump / (z.score || 1)) * 100}%` }} title={`Dumping: ${z.dump}`} />
                      <div className="bg-steel-blue h-full" style={{ width: `${(z.noise / (z.score || 1)) * 100}%` }} title={`Idling: ${z.noise}`} />
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
      ) : (
        /* Mode 2: OPERATOR TASK QUEUE (Interactive Action Matrix) */
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredTasks.map((task) => (
            <div key={task.id} className="p-12 hover:bg-canvas/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-10 font-mono text-muted">{task.id} · {task.priority}</span>
                <span className={`text-9 font-mono px-6 py-1 rounded-sm border uppercase font-bold ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
              </div>

              <h3 className="text-12 font-bold font-jakarta text-primary mb-2">
                {task.title}
              </h3>

              <div className="text-10 font-mono text-secondary mb-4 flex items-center gap-4">
                <MapPin className="w-3 h-3 text-steel-blue" />
                <span>{task.location}</span>
                <span>· Assigned: {task.assignedTo}</span>
              </div>

              <div className="p-8 bg-inset rounded-sm border border-border text-10 font-mono text-muted mb-8 leading-relaxed">
                {task.notes}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div className="text-10 font-mono">
                  <span className="text-muted">ENPV: </span>
                  <span className="text-emerald font-bold">${task.expectedNetValue.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => handleAdvanceTaskStatus(task)}
                  disabled={updatingTaskId === task.id}
                  className="px-8 py-3 bg-surface hover:bg-surface-hover border border-border text-10 font-mono text-primary rounded-sm flex items-center gap-4 transition-colors"
                >
                  {task.status === "COMPLETED" ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald" />
                  ) : (
                    <Clock className="w-3 h-3 text-amber" />
                  )}
                  <span>{updatingTaskId === task.id ? "UPDATING..." : `ADVANCE: ${task.status}`}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-16 py-8 border-t border-border bg-inset text-10 font-mono text-muted flex items-center justify-between">
        <span>{mode === "HOT_ZONES" ? "Click row to camera fly-to" : "Click ADVANCE to progress workflow"}</span>
        <span className="text-muted font-mono text-9">STORAGE: EPHEMERAL SERVERLESS (LOCAL /tmp)</span>
      </div>
    </div>
  );
}
