import { NextResponse } from "next/server";

export interface OperatorTask {
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

// In-memory serverless state (hydrated with persistent baseline)
const tasksStore: OperatorTask[] = [
  {
    id: "TSK-001",
    opportunityId: "OPP-NYC-2026-081",
    title: "Optical Field Audit: Hunts Point Idling Corridor",
    priority: "P0_IMMEDIATE",
    status: "IN_PROGRESS",
    location: "Food Center Dr & Halleck St, Bronx",
    borough: "BRONX",
    assignedTo: "Operative K. Vance",
    dueDate: "2026-10-28T18:00:00Z",
    estimatedCost: 450,
    expectedNetValue: 9000,
    evidenceCount: 2,
    notes: "Equipment: 4K optical timestamp recorder. Target: 10 commercial rigs exceeding 180s threshold."
  },
  {
    id: "TSK-002",
    opportunityId: "OPP-NYC-2026-042",
    title: "ACRIS Chain of Title & Stop Work Dossier Assembly",
    priority: "P1_HIGH",
    status: "TODO",
    location: "27-01 Queens Plaza S, LIC",
    borough: "QUEENS",
    assignedTo: "Litigation Analyst M. Chen",
    dueDate: "2026-10-29T12:00:00Z",
    estimatedCost: 1200,
    expectedNetValue: 19700,
    evidenceCount: 3,
    notes: "Pull DOB structural audit and verify easement conflicts with MTA tunnel easement."
  },
  {
    id: "TSK-003",
    opportunityId: "OPP-MED-2026-019",
    title: "Peer Group Distribution Sanitization (NPI: 1982736410)",
    priority: "P2_STANDARD",
    status: "TODO",
    location: "Metro Health Mobility, Brooklyn",
    borough: "BROOKLYN",
    assignedTo: "Health Data Analyst R. Hayes",
    dueDate: "2026-10-31T17:00:00Z",
    estimatedCost: 800,
    expectedNetValue: 5300,
    evidenceCount: 1,
    notes: "Cross-reference NYC taxi limousine commission medical transport permits with Medicaid claims codes."
  }
];

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    taskCount: tasksStore.length,
    activeTasks: tasksStore.filter(t => t.status !== "COMPLETED").length,
    totalCommittedValue: tasksStore.reduce((acc, t) => acc + t.expectedNetValue, 0),
    data: tasksStore
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, newStatus, notes } = body;

    const task = tasksStore.find(t => t.id === taskId);
    if (!task) {
      return NextResponse.json({ status: "ERROR", message: `Task ${taskId} not found` }, { status: 404 });
    }

    if (newStatus) task.status = newStatus;
    if (notes) task.notes = `${task.notes}\n[${new Date().toISOString()}] ${notes}`;

    return NextResponse.json({
      status: "SUCCESS",
      message: `Task ${taskId} updated successfully`,
      data: task
    });
  } catch {
    return NextResponse.json({ status: "ERROR", message: "Invalid payload" }, { status: 400 });
  }
}
