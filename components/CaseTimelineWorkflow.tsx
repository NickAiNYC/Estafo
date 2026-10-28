"use client";

import { useState } from "react";
import { 
  Calendar, 
  ShieldAlert, 
  FileText, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Scale, 
  Download, 
  DollarSign, 
  Car, 
  Lock, 
  ChevronRight, 
  ExternalLink 
} from "lucide-react";
import { InvestigativeTimelineEvent, FourQuadrantDossier } from "@/types";

// Pre-seeded initial case template based on Queens Outpatient / Ambulette Kickback Pattern
const DEFAULT_INITIAL_EVENTS: InvestigativeTimelineEvent[] = [];

export default function CaseTimelineWorkflow() {
  const [events, setEvents] = useState<InvestigativeTimelineEvent[]>(DEFAULT_INITIAL_EVENTS);
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "DOSSIER" | "THREE_WAY_MATCH" | "LEGAL_ROUTES">("TIMELINE");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    event_date: new Date().toISOString().slice(0, 10),
    facility_name: "",
    facility_npi: "",
    transport_company: "",
    transport_npi: "",
    cash_amount_offered: 0,
    cash_purpose_alleged: "",
    observer_role: "SECONDHAND_HEARSAY" as InvestigativeTimelineEvent["observer_role"],
    observation_notes: "",
    claimed_service_code: "",
    evidence_level: "UNVERIFIED" as InvestigativeTimelineEvent["evidence_level"],
    innocent_explanation: ""
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.observation_notes.trim()) return;

    const event: InvestigativeTimelineEvent = {
      id: `EVT-${Date.now()}`,
      case_id: "CASE-QUEENS-OASAS-01",
      event_date: newEvent.event_date,
      facility_name: newEvent.facility_name,
      facility_npi: newEvent.facility_npi || undefined,
      transport_company: newEvent.transport_company || undefined,
      transport_npi: newEvent.transport_npi || undefined,
      cash_amount_offered: Number(newEvent.cash_amount_offered) || 0,
      cash_purpose_alleged: newEvent.cash_purpose_alleged,
      observer_role: newEvent.observer_role,
      observation_notes: newEvent.observation_notes,
      claimed_service_code: newEvent.claimed_service_code,
      evidence_level: newEvent.evidence_level,
      innocent_explanation: newEvent.innocent_explanation || "Innocent explanation pending documentary review.",
      verification_status: "UNVERIFIED",
      created_at: new Date().toISOString()
    };

    setEvents(prev => [...prev, event]);
    setShowAddModal(false);
    setNewEvent({
      event_date: new Date().toISOString().slice(0, 10),
      facility_name: "",
      facility_npi: "",
      transport_company: "",
      transport_npi: "",
      cash_amount_offered: 0,
      cash_purpose_alleged: "",
      observer_role: "SECONDHAND_HEARSAY",
      observation_notes: "",
      claimed_service_code: "",
      evidence_level: "UNVERIFIED",
      innocent_explanation: ""
    });
  };

  // Generate 4-Quadrant Dossier
  const dossier: FourQuadrantDossier = {
    case_title: "ESTAFOTIR research draft — unverified",
    target_entities: {
      facility: events[0]?.facility_name || "Unidentified",
      facility_npi: events[0]?.facility_npi,
      transport: events[0]?.transport_company,
      transport_npi: events[0]?.transport_npi
    },
    facts: [],
    inferences: events.filter(e => e.observer_role === "SECONDHAND_HEARSAY").map(e => `${e.event_date}: Secondhand account — ${e.observation_notes}`),
    allegations: [],
    unknowns: ["Were claims submitted for the dates and services described?", "Can these accounts be corroborated with lawfully obtained records?"],
    innocent_explanations: events.map(e => e.innocent_explanation).filter((v): v is string => Boolean(v)),
    next_lawful_verification_steps: ["Verify dates, identity, and source of each account.", "Seek counsel review before any legal filing or formal allegation."],
    legal_framework: {
      nys_fca: { citation: "NY State Finance Law § 190", relator_share_intervened: "15% – 25%", relator_share_declined: "25% – 30%", sealed_filing_required: true },
      doj_criminal_tip_pilot: { program: "DOJ Criminal Tip Rewards Pilot Program", reward_range: "$10,000 – $30,000 (Discretionary)", trigger: "Unsealed federal criminal charges resulting from original tip", intake_url: "https://www.america.gov/fraud" }
    },
    confidentiality_notice: "Do not include patient identifiers, treatment records, or other protected health information. Unverified notes are not legal findings."
  };

  const handleDownloadMarkdown = () => {
    const md = `# ${dossier.case_title}
**Date Generated:** ${new Date().toLocaleDateString()}
**Status:** UNVERIFIED RESEARCH DRAFT // NOT A LEGAL FILING OR PRIVILEGED DOCUMENT

---

## 1. TARGET ENTITIES
- **Treatment Facility:** ${dossier.target_entities.facility} (NPI: ${dossier.target_entities.facility_npi || "Unverified"})
- **Transportation Provider:** ${dossier.target_entities.transport} (NPI: ${dossier.target_entities.transport_npi || "Unverified"})

---

## 2. CHRONOLOGICAL TIMELINE OF OBSERVED EVENTS
${events.map((e, idx) => `
### Event #${idx + 1}: ${e.event_date}
- **Service Code Claimed:** ${e.claimed_service_code}
- **Cash Offered/Alleged:** $${e.cash_amount_offered} (${e.cash_purpose_alleged})
- **Observer Role:** ${e.observer_role} [${e.evidence_level}]
- **Observations:** ${e.observation_notes}
- **Innocent Explanation Hypothesis:** ${e.innocent_explanation}
`).join("\n")}

---

## 3. FOUR-QUADRANT INVESTIGATIVE ANALYSIS

### QUADRANT I: OBSERVED FACTS
${dossier.facts.map(f => `- ${f}`).join("\n")}

### QUADRANT II: INFERENCES & WORKING HYPOTHESES
${dossier.inferences.map(i => `- ${i}`).join("\n")}

### QUADRANT III: STATUTORY ALLEGATIONS
${dossier.allegations.map(a => `- ${a}`).join("\n")}

### QUADRANT IV: UNKNOWNS & INNOCENT EXPLANATIONS
${dossier.unknowns.map(u => `- [Unknown] ${u}`).join("\n")}
${dossier.innocent_explanations.map(e => `- [Innocent Hypothesis] ${e}`).join("\n")}

---

## 4. NEXT LAWFUL VERIFICATION STEPS
${dossier.next_lawful_verification_steps.map(s => `${s}`).join("\n")}

---

## 5. STATUTORY RECOVERY FRAMEWORK COMPARISON
1. **New York False Claims Act (NYS Finance Law § 190)**:
   - Relator Share: ${dossier.legal_framework.nys_fca.relator_share_intervened} if intervened; ${dossier.legal_framework.nys_fca.relator_share_declined} if declined.
   - Requirement: Sealed complaint filed in court with confidential disclosure of all material evidence to the NY Attorney General.
2. **DOJ Criminal Tip Rewards Pilot Program**:
   - Award: ${dossier.legal_framework.doj_criminal_tip_pilot.reward_range} at DOJ discretion (no 1% automatic fee).
   - Trigger: Original nonpublic information leading to unsealed federal criminal charges.
   - Intake: ${dossier.legal_framework.doj_criminal_tip_pilot.intake_url}

---
*Notice: ${dossier.confidentiality_notice}*
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Estafotir_Case_Dossier_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-canvas flex flex-col h-full overflow-y-auto">
      {/* Top Banner: Zero-PHI & Lawful Investigation Shield */}
      <div className="bg-surface border-b border-border p-16 md:px-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div>
            <div className="flex items-center gap-8 font-mono text-10 text-emerald uppercase font-bold tracking-wider">
              <Scale className="w-4 h-4 text-emerald" />
              <span>Investigative Case Intake & Timeline Studio</span>
              <span className="text-secondary bg-surface-elevated px-6 py-1 rounded-sm border border-border">
                NYS Finance Law § 190 // DOJ Tip Rewards
              </span>
            </div>
            <h1 className="text-20 font-bold font-jakarta text-primary mt-4">
              Contradiction Hunter: Billed Services vs. Actual Delivery
            </h1>
            <p className="text-12 text-secondary mt-2 max-w-3xl leading-relaxed">
              A million dollars of unusual spending is a lead; a documented pattern of billed services that did not happen is a case. 
              Track dated events, isolate firsthand observations from hearsay, test innocent explanations, and draft counsel-ready dossiers.
            </p>
          </div>

          <div className="flex items-center gap-10 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-6 px-14 py-8 rounded-lg bg-emerald text-canvas font-mono text-11 font-bold hover:bg-emerald/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>LOG DATED EVENT</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              disabled={events.length === 0}
              className="flex items-center gap-6 px-14 py-8 rounded-lg bg-surface-elevated border border-border-highlight text-primary font-mono text-11 font-bold hover:bg-surface-hover transition-colors"
            >
              <Download className="w-4 h-4 text-steel-blue" />
              <span>EXPORT DOSSIER (MD)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Strict Confidentiality Warning */}
      <div className="bg-amber/10 border-b border-amber/30 px-16 py-10">
        <div className="max-w-6xl mx-auto flex items-start gap-10 font-mono text-11 text-amber">
          <Lock className="w-4 h-4 shrink-0 mt-2 text-amber" />
          <div className="leading-relaxed">
            <span className="font-bold uppercase">Strict Zero-PHI Boundary (42 CFR Part 2 & HIPAA):</span> Never record patient names, Medicaid recipient IDs, or medical charts in Estafotir. Substance use disorder treatment records carry strict federal confidentiality protections. Focus exclusively on operational timelines, cash handoffs, vehicle trips, and billing codes.
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-border bg-surface px-16 md:px-24">
        <div className="max-w-6xl mx-auto flex gap-12 font-mono text-11">
          <button
            onClick={() => setActiveTab("TIMELINE")}
            className={`py-12 border-b-2 font-bold transition-colors flex items-center gap-6 ${
              activeTab === "TIMELINE"
                ? "border-emerald text-emerald"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>CASE TIMELINE ({events.length} EVENTS)</span>
          </button>
          <button
            onClick={() => setActiveTab("DOSSIER")}
            className={`py-12 border-b-2 font-bold transition-colors flex items-center gap-6 ${
              activeTab === "DOSSIER"
                ? "border-steel-blue text-steel-blue"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>4-QUADRANT ANALYSIS (FACTS / INFERENCES / ALLEGATIONS / UNKNOWNS)</span>
          </button>
          <button
            onClick={() => setActiveTab("THREE_WAY_MATCH")}
            className={`py-12 border-b-2 font-bold transition-colors flex items-center gap-6 ${
              activeTab === "THREE_WAY_MATCH"
                ? "border-emerald text-emerald"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>3-WAY MATCH PROTOCOL (OMIG / OASAS)</span>
          </button>
          <button
            onClick={() => setActiveTab("LEGAL_ROUTES")}
            className={`py-12 border-b-2 font-bold transition-colors flex items-center gap-6 ${
              activeTab === "LEGAL_ROUTES"
                ? "border-gold text-gold"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>WHISTLEBLOWER & QUI TAM ROUTES</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto p-16 md:p-24 space-y-24 w-full">
        {/* TAB 1: Chronological Case Timeline */}
        {activeTab === "TIMELINE" && (
          <div className="space-y-16">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-14 font-mono font-bold text-primary uppercase">
                  Chronological Event Stream & Witness Attribution
                </h2>
                <p className="text-11 font-mono text-muted mt-2">
                  Each event strictly separates firsthand observation from hearsay and documents plausible innocent explanations.
                </p>
              </div>
            </div>

            <div className="relative pl-7 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[1px] before:bg-white/10">
              {events.length === 0 && (
                <div className="relative rounded-lg border border-dashed border-white/[0.12] bg-[#18181B] p-12 text-center">
                  <div className="absolute -left-[23px] top-6 w-2 h-2 rounded-full bg-zinc-600 ring-4 ring-[#0A0A0C]" />
                  <h3 className="font-sans font-semibold text-[#EDECE9]">No chronological events logged</h3>
                  <p className="mt-2 text-xs font-mono text-zinc-500 max-w-md mx-auto">
                    Start by logging a dated, attributed account. Sourced records from public databases and personal witness notes are strictly segregated.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-3 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    + Log Initial Observation
                  </button>
                </div>
              )}
              {events.map((evt, idx) => (
                <div 
                  key={evt.id} 
                  className="relative p-5 border border-white/[0.08] bg-[#18181B] hover:border-white/[0.16] rounded-lg space-y-3 transition-all shadow-xl group"
                >
                  {/* Spine Node Marker */}
                  <div 
                    className={`absolute -left-[23px] top-6 w-2 h-2 rounded-full ring-4 ring-[#0A0A0C] transition-transform group-hover:scale-125 ${
                      evt.observer_role === "DOCUMENTED_RECORD"
                        ? "bg-blue-400"
                        : evt.observer_role === "FIRSTHAND_WORKER"
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`} 
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-[10px] text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                        #{idx + 1}
                      </span>
                      {/* Monospaced UTC Timestamp */}
                      <span className="font-mono text-xs font-semibold text-[#EDECE9] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                        {evt.event_date.includes(":") ? evt.event_date : `${evt.event_date} 00:00 UTC`}
                      </span>
                      <span className="text-xs font-medium text-[#EDECE9] font-sans">
                        {evt.facility_name || "Unspecified Facility"}
                      </span>
                      {evt.transport_company && (
                        <span className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          <Car className="w-3 h-3" /> {evt.transport_company}
                        </span>
                      )}
                    </div>

                    {/* Attribution Badges: Sourced Record vs Personal Note */}
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      {evt.observer_role === "DOCUMENTED_RECORD" ? (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-medium">
                          SOURCED RECORD
                        </span>
                      ) : evt.observer_role === "FIRSTHAND_WORKER" ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-medium">
                          FIRSTHAND WITNESS
                        </span>
                      ) : (
                        <span className="bg-zinc-800 text-zinc-400 border border-zinc-700/50 px-2 py-0.5 rounded uppercase font-medium">
                          PERSONAL NOTE / HEARSAY
                        </span>
                      )}
                      <span className="bg-[#141416] px-2 py-0.5 rounded border border-white/[0.06] text-zinc-500">
                        {evt.evidence_level}
                      </span>
                    </div>
                  </div>

                  {/* Cash Incentive & Alleged Purpose */}
                  {evt.cash_amount_offered && evt.cash_amount_offered > 0 && (
                    <div className="p-2.5 bg-[#141416] rounded border border-amber-500/20 flex items-start gap-2.5 font-mono text-xs">
                      <DollarSign className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-400 uppercase text-[10px]">Alleged Cash Remuneration:</span>{" "}
                        <span className="font-bold text-[#EDECE9]">${evt.cash_amount_offered.toLocaleString()}</span>
                        <div className="text-zinc-400 text-[11px] mt-0.5">{evt.cash_purpose_alleged}</div>
                      </div>
                    </div>
                  )}

                  {/* Observation Narrative */}
                  <div className="text-xs text-zinc-300 font-mono leading-relaxed bg-[#141416] p-3 rounded border border-white/[0.06]">
                    <div className="text-[9px] uppercase text-zinc-500 font-bold mb-1">Observation Statement:</div>
                    {evt.observation_notes}
                  </div>

                  {/* Claimed Code vs Innocent Explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px] pt-1">
                    <div className="p-2.5 bg-[#141416] rounded border border-white/[0.06]">
                      <div className="text-zinc-500 uppercase text-[9px]">Procedure Code Target</div>
                      <div className="text-[#EDECE9] font-semibold mt-1">{evt.claimed_service_code || "Unspecified"}</div>
                    </div>
                    <div className="p-2.5 bg-[#141416] rounded border border-white/[0.06]">
                      <div className="text-zinc-500 uppercase text-[9px]">Plausible Innocent Explanation</div>
                      <div className="text-zinc-400 mt-1">{evt.innocent_explanation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Four-Quadrant Analysis */}
        {activeTab === "DOSSIER" && (
          <div className="space-y-20">
            <div>
              <h2 className="text-14 font-mono font-bold text-primary uppercase">
                Four-Quadrant Forensic Matrix
              </h2>
              <p className="text-11 font-mono text-muted mt-2">
                Mandatory standing instruction: Separate observed facts from hearsay. Give the strongest innocent explanation. Identify next lawful verification step. Never invent claims or witnesses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Quadrant 1: FACTS */}
              <div className="p-16 rounded-lg border border-emerald/40 bg-emerald/5 space-y-12">
                <div className="flex items-center gap-8 font-mono text-12 font-bold text-emerald uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Quadrant I: Verified Facts</span>
                </div>
                <ul className="space-y-8 font-mono text-11 text-primary">
                  {dossier.facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-8 leading-relaxed">
                      <span className="text-emerald font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quadrant 2: INFERENCES */}
              <div className="p-16 rounded-lg border border-steel-blue/40 bg-steel-blue/5 space-y-12">
                <div className="flex items-center gap-8 font-mono text-12 font-bold text-steel-blue uppercase">
                  <AlertCircle className="w-4 h-4" />
                  <span>Quadrant II: Working Inferences</span>
                </div>
                <ul className="space-y-8 font-mono text-11 text-primary">
                  {dossier.inferences.map((inf, i) => (
                    <li key={i} className="flex items-start gap-8 leading-relaxed">
                      <span className="text-steel-blue font-bold">•</span>
                      <span>{inf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quadrant 3: ALLEGATIONS */}
              <div className="p-16 rounded-lg border border-crimson/40 bg-crimson/5 space-y-12">
                <div className="flex items-center gap-8 font-mono text-12 font-bold text-crimson uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Quadrant III: Statutory Allegations</span>
                </div>
                <ul className="space-y-8 font-mono text-11 text-primary">
                  {dossier.allegations.map((a, i) => (
                    <li key={i} className="flex items-start gap-8 leading-relaxed">
                      <span className="text-crimson font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quadrant 4: UNKNOWNS & INNOCENT HYPOTHESES */}
              <div className="p-16 rounded-lg border border-amber/40 bg-amber/5 space-y-12">
                <div className="flex items-center gap-8 font-mono text-12 font-bold text-amber uppercase">
                  <HelpCircle className="w-4 h-4" />
                  <span>Quadrant IV: Unknowns & Innocent Explanations</span>
                </div>
                <div className="space-y-10 font-mono text-11">
                  <div>
                    <div className="text-9 uppercase text-muted font-bold mb-4">Critical Unknowns:</div>
                    <ul className="space-y-6 text-primary">
                      {dossier.unknowns.map((u, i) => (
                        <li key={i} className="flex items-start gap-6">
                          <span className="text-amber font-bold">?</span>
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8 border-t border-amber/20">
                    <div className="text-9 uppercase text-muted font-bold mb-4">Innocent Explanations to Disprove:</div>
                    <ul className="space-y-6 text-secondary">
                      {dossier.innocent_explanations.map((e, i) => (
                        <li key={i} className="flex items-start gap-6">
                          <span className="text-amber font-bold">~</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Lawful Steps Card */}
            <div className="p-16 border border-border bg-surface rounded-lg space-y-12 font-mono text-11">
              <div className="text-12 font-bold text-primary uppercase flex items-center gap-8">
                <ChevronRight className="w-4 h-4 text-emerald" />
                <span>Next Lawful Verification Steps (Before Counsel or Filing)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-secondary">
                {dossier.next_lawful_verification_steps.map((s, i) => (
                  <div key={i} className="p-10 bg-inset rounded-md border border-border">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Whistleblower & Qui Tam Routes */}
        {activeTab === "LEGAL_ROUTES" && (
          <div className="space-y-20 font-mono text-11">
            <div>
              <h2 className="text-14 font-mono font-bold text-primary uppercase">
                Statutory Reporting Routes & Recovery Shares
              </h2>
              <p className="text-11 font-mono text-muted mt-2">
                There is no automatic 1% tip commission. Compare the statutory standards between New York State False Claims Act and the new DOJ Criminal Tip Pilot.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Route 1: NY False Claims Act */}
              <div className="p-20 rounded-lg border border-border bg-surface space-y-16">
                <div className="flex items-center justify-between border-b border-border pb-12">
                  <div className="text-13 font-bold text-emerald uppercase">
                    New York False Claims Act
                  </div>
                  <span className="text-9 bg-emerald/15 text-emerald px-6 py-1 rounded-sm border border-emerald/30 font-bold">
                    NYS FIN LAW § 190
                  </span>
                </div>

                <div className="space-y-10 text-secondary leading-relaxed">
                  <div>
                    <span className="text-primary font-bold">Potential Relator Share:</span>{" "}
                    <span className="text-emerald font-bold">15% – 25%</span> of recovered proceeds if NY Attorney General intervenes;{" "}
                    <span className="text-emerald font-bold">25% – 30%</span> if action proceeds without intervention.
                  </div>
                  <div>
                    <span className="text-primary font-bold">Filing Procedure:</span> Must be filed confidentially under seal in NY State Supreme Court with a written disclosure statement of substantially all material evidence to the Attorney General.
                  </div>
                  <div>
                    <span className="text-primary font-bold">Key Distinction:</span> A $1M billing outlier is not a case. Relator recovery requires proven false claims, government intervention or settlement, and actual recovered funds.
                  </div>
                </div>

                <div className="p-10 bg-inset rounded-sm border border-border text-10 text-muted">
                  Counsel Requirement: Qui tam actions cannot be filed pro se in corporate cases; retention of specialized whistleblower counsel is mandatory.
                </div>
              </div>

              {/* Route 2: DOJ Criminal Tip Rewards Pilot */}
              <div className="p-20 rounded-lg border border-border bg-surface space-y-16">
                <div className="flex items-center justify-between border-b border-border pb-12">
                  <div className="text-13 font-bold text-steel-blue uppercase">
                    DOJ Criminal Tip Rewards Pilot
                  </div>
                  <span className="text-9 bg-steel-blue/15 text-steel-blue px-6 py-1 rounded-sm border border-steel-blue/30 font-bold">
                    DOJ NFED PILOT
                  </span>
                </div>

                <div className="space-y-10 text-secondary leading-relaxed">
                  <div>
                    <span className="text-primary font-bold">Discretionary Award Range:</span>{" "}
                    <span className="text-steel-blue font-bold">$10,000 – $30,000</span> (At DOJ discretion; no guaranteed percentage or 1% commission).
                  </div>
                  <div>
                    <span className="text-primary font-bold">Eligibility Standard:</span> Requires original, truthful, nonpublic information from personal conversations or independent analysis that leads directly to unsealed federal criminal charges.
                  </div>
                  <div>
                    <span className="text-primary font-bold">Submission Rule:</span> Duplicate tips do not earn two awards; first-in-time rule applies. Must submit via signed intake at America.gov/fraud.
                  </div>
                </div>

                <a
                  href="https://www.america.gov/fraud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-10 bg-steel-blue/10 rounded-sm border border-steel-blue/30 text-10 text-steel-blue hover:bg-steel-blue/20 transition-colors"
                >
                  <span>Official Intake Portal: America.gov/fraud</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Direct Enforcement Intake */}
            <div className="p-16 border border-border bg-surface rounded-lg space-y-12">
              <div className="text-12 font-bold text-primary uppercase">
                Official Government Complaint Hotlines
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-10">
                <a
                  href="https://ag.ny.gov/medicaid-fraud-complaint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-12 bg-inset rounded-md border border-border hover:border-emerald/40 transition-colors flex items-center justify-between text-secondary hover:text-primary"
                >
                  <div>
                    <div className="font-bold text-primary">NY AG Medicaid Fraud Control Unit (MFCU)</div>
                    <div className="text-muted mt-1">Direct complaint form for Medicaid provider overbilling & kickbacks</div>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 text-muted" />
                </a>

                <a
                  href="https://apps.omig.ny.gov/bmfa/bmfa.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-12 bg-inset rounded-md border border-border hover:border-steel-blue/40 transition-colors flex items-center justify-between text-secondary hover:text-primary"
                >
                  <div>
                    <div className="font-bold text-primary">NYS Office of the Medicaid Inspector General (OMIG)</div>
                    <div className="text-muted mt-1">Official allegation portal for fraud, waste, and program abuse</div>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 text-muted" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Three-Way Match Forensic Audit Protocol */}
        {activeTab === "THREE_WAY_MATCH" && (
          <div className="space-y-20 font-mono text-11">
            <div className="border border-border bg-surface p-20 rounded-lg space-y-12">
              <div className="flex items-center gap-8 text-emerald font-bold text-12">
                <Car className="w-5 h-5 text-emerald" />
                <span className="uppercase">Three-Way Match Audit Architecture: The Core Forensic Test</span>
              </div>
              <p className="text-secondary text-12 leading-relaxed">
                Parked ambulettes outside a clinic alone do not establish fraud. A legally viable Medicaid False Claims Act or OMIG audit case tests a specific three-way match: <strong className="text-primary">Authorized Transportation → Documented Clinic Visit → Corroborated Billed Counseling</strong>. If the records conflict on the same service date, investigate the discrepancy. A mismatch alone does not establish that a claim was false.
              </p>
            </div>

            {/* Three Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {/* Leg 1: Transportation */}
              <div className="border border-border bg-surface p-16 rounded-lg space-y-12">
                <div className="flex items-center justify-between border-b border-border pb-8">
                  <span className="text-11 font-bold text-steel-blue uppercase flex items-center gap-6">
                    <Car className="w-4 h-4 text-steel-blue" />
                    <span>Leg 1: Authorized Ride</span>
                  </span>
                  <span className="text-9 px-6 py-1 bg-steel-blue/15 border border-steel-blue/30 text-steel-blue rounded-sm">
                    NEMT / MAS
                  </span>
                </div>
                <div className="space-y-6 text-11">
                  <div>
                    <span className="text-muted block text-9 uppercase">Applicable Billing Codes</span>
                    <span className="text-primary font-bold">T2003 (Encounter), A0130 (Van), A0425 (Mileage)</span>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Mandatory OMIG Documentation</span>
                    <ul className="text-secondary list-disc list-inside space-y-3 mt-2 text-10">
                      <li>Prior Authorization # via MAS (Medical Answering Services)</li>
                      <li>Pickup & drop-off exact timestamps</li>
                      <li>Vehicle license plate & driver signature</li>
                      <li>Recipient pickup attestation / signature</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Forensic Discrepancy Tested</span>
                    <p className="text-amber text-10 leading-relaxed mt-1">
                      Did the vehicle physically arrive? Does GPS telematics corroborate drop-off? Were trips billed for riders who took public transit or walked?
                    </p>
                  </div>
                </div>
              </div>

              {/* Leg 2: Clinic Attendance */}
              <div className="border border-border bg-surface p-16 rounded-lg space-y-12">
                <div className="flex items-center justify-between border-b border-border pb-8">
                  <span className="text-11 font-bold text-emerald uppercase flex items-center gap-6">
                    <CheckCircle2 className="w-4 h-4 text-emerald" />
                    <span>Leg 2: Clinic Attendance</span>
                  </span>
                  <span className="text-9 px-6 py-1 bg-emerald/15 border border-emerald/30 text-emerald rounded-sm">
                    OASAS Part 822
                  </span>
                </div>
                <div className="space-y-6 text-11">
                  <div>
                    <span className="text-muted block text-9 uppercase">Operating Certificate</span>
                    <span className="text-primary font-bold">Certified OASAS Outpatient Facility (e.g. #51310)</span>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Mandatory Facility Records</span>
                    <ul className="text-secondary list-disc list-inside space-y-3 mt-2 text-10">
                      <li>Dated facility visitor / sign-in roster</li>
                      <li>Intake desk arrival timestamp</li>
                      <li>Certified location verification (e.g. 63-36 99th St)</li>
                      <li>Staff duty schedule matching operating hours</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Forensic Discrepancy Tested</span>
                    <p className="text-amber text-10 leading-relaxed mt-1">
                      Was the clinic open? Did arriving passengers enter the counseling rooms or linger outside? Did attendees leave immediately after receiving cash?
                    </p>
                  </div>
                </div>
              </div>

              {/* Leg 3: Billed Clinical Session */}
              <div className="border border-border bg-surface p-16 rounded-lg space-y-12">
                <div className="flex items-center justify-between border-b border-border pb-8">
                  <span className="text-11 font-bold text-gold uppercase flex items-center gap-6">
                    <Scale className="w-4 h-4 text-gold" />
                    <span>Leg 3: Billed Session</span>
                  </span>
                  <span className="text-9 px-6 py-1 bg-gold/15 border border-gold/30 text-gold rounded-sm">
                    APG / CMS Manual
                  </span>
                </div>
                <div className="space-y-6 text-11">
                  <div>
                    <span className="text-muted block text-9 uppercase">Applicable Billing Codes</span>
                    <span className="text-primary font-bold">H0005 (Group Session), 90853 (Group Psychotherapy), H0004+U5 (Brief Session)</span>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Mandatory Clinical Standard</span>
                    <ul className="text-secondary list-disc list-inside space-y-3 mt-2 text-10">
                      <li>H0005 / 90853: Minimum 60 minutes clinical duration</li>
                      <li>H0004 + U5 modifier: 8–14 minute brief intervention allowable under OASAS rules</li>
                      <li>Signed clinician progress note in EHR supporting medical necessity</li>
                      <li>Operating certificate certified capacity rules apply</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Forensic Discrepancy Tested</span>
                    <p className="text-amber text-10 leading-relaxed mt-1">
                      Did an authorized investigator identify 10–15 minute check-ins billed under full 60-minute H0005 codes? Was attendance induced with $20–$30 cash?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Field Observation Protocol for 9 A.M. Scan */}
            <div className="border border-border bg-surface p-20 rounded-lg space-y-14">
              <div className="flex items-center gap-8 text-primary font-bold text-12">
                <AlertCircle className="w-5 h-5 text-steel-blue" />
                <span className="uppercase">Field Observation Protocol: Next 9 A.M. Sweep Checklist</span>
              </div>
              <p className="text-secondary text-11 leading-relaxed">
                When conducting lawful observations from a publicly accessible street location, log only objective, verifiable facts. Public street observations and NPPES records alone cannot perform a three-way match; that remains an investigative lead for authorized investigators with subpoena access to claims, dispatch, and clinical records.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border">
                <div className="space-y-8">
                  <div className="font-bold text-emerald uppercase text-10">What to Log Lawfully:</div>
                  <ul className="text-secondary space-y-4 list-disc list-inside text-11">
                    <li><strong className="text-primary">Exact Date & Timestamp:</strong> Arrival and departure windows (e.g., 08:52 – 09:18).</li>
                    <li><strong className="text-primary">Vehicle Identifier:</strong> License plate number, TLC/USDOT registration, and company name on door.</li>
                    <li><strong className="text-primary">Passenger Movement:</strong> Number of passengers dropped off; whether they entered the building or remained outside.</li>
                    <li><strong className="text-primary">Contemporaneous Notes:</strong> Save notes with original device timestamps (do not reconstruct later).</li>
                  </ul>
                </div>

                <div className="space-y-8">
                  <div className="font-bold text-amber uppercase text-10">What Cannot Be Established From the Street:</div>
                  <ul className="text-secondary space-y-4 list-disc list-inside text-11">
                    <li><strong className="text-primary">Medicaid Billing:</strong> Parked vans do not prove Medicaid was billed for those specific individuals.</li>
                    <li><strong className="text-primary">Alternative Medical Destination:</strong> Vans may serve co-located physical therapy or internal medicine practices in the building (CitiMedical Services P.C.).</li>
                    <li><strong className="text-primary">Duration vs Billing Code:</strong> Short visits do not prove fraud; brief treatment (H0004+U5) and single 15-min therapy units (97110) are legitimate codes.</li>
                    <li><strong className="text-primary">Patient Diagnoses:</strong> Cannot assume SUD diagnosis or medical necessity from physical appearance.</li>
                    <li><strong className="text-primary">Cash Transactions:</strong> Unless directly witnessed, attendee payment remains unverified report/hearsay.</li>
                    <li><strong className="text-primary">Strict Zero-PHI & No Patient Tracking:</strong> Never follow, photograph, or attempt to identify patients from the street.</li>
                  </ul>
                </div>
              </div>

              {/* Official Citations */}
              <div className="pt-12 border-t border-border flex flex-wrap gap-12 font-mono text-10">
                <a
                  href="https://www.health.ny.gov/health_care/medicaid/members/faqs.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-steel-blue hover:text-primary flex items-center gap-4 underline"
                >
                  <span>NY DOH Transportation FAQ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://omig.ny.gov/media/92261/download?attachment="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-steel-blue hover:text-primary flex items-center gap-4 underline"
                >
                  <span>OMIG Ambulette Audit Protocol</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://oasas.ny.gov/node/28196"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-steel-blue hover:text-primary flex items-center gap-4 underline"
                >
                  <span>OASAS APG Billing Guidance (H0005 & 90853)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Dated Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-16">
          <div className="bg-surface border border-border rounded-lg max-w-xl w-full p-20 space-y-16 shadow-2xl font-mono text-11">
            <div className="flex items-center justify-between border-b border-border pb-12">
              <div className="text-13 font-bold text-primary uppercase flex items-center gap-8">
                <Plus className="w-4 h-4 text-emerald" />
                <span>Log New Chronological Event</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-primary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-12">
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <label className="block text-9 uppercase text-muted mb-2">Event Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.event_date}
                    onChange={e => setNewEvent(s => ({ ...s, event_date: e.target.value }))}
                    className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                  />
                </div>
                <div>
                  <label className="block text-9 uppercase text-muted mb-2">Cash Offer / Amount ($)</label>
                  <input
                    type="number"
                    value={newEvent.cash_amount_offered}
                    onChange={e => setNewEvent(s => ({ ...s, cash_amount_offered: Number(e.target.value) }))}
                    className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-9 uppercase text-muted mb-2">Facility Name</label>
                <input
                  type="text"
                  required
                  value={newEvent.facility_name}
                  onChange={e => setNewEvent(s => ({ ...s, facility_name: e.target.value }))}
                  className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                />
              </div>

              <div>
                <label className="block text-9 uppercase text-muted mb-2">Transport Company (Ambulette / Van)</label>
                <input
                  type="text"
                  value={newEvent.transport_company}
                  onChange={e => setNewEvent(s => ({ ...s, transport_company: e.target.value }))}
                  className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div>
                  <label className="block text-9 uppercase text-muted mb-2">Observer Role</label>
                  <select
                    value={newEvent.observer_role}
                    onChange={e => setNewEvent(s => ({ ...s, observer_role: e.target.value as InvestigativeTimelineEvent["observer_role"] }))}
                    className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                  >
                    <option value="FIRSTHAND_WORKER">FIRSTHAND WORKER</option>
                    <option value="FIRSTHAND_PARTICIPANT">FIRSTHAND PARTICIPANT</option>
                    <option value="DOCUMENTED_RECORD">DOCUMENTED RECORD</option>
                    <option value="SECONDHAND_HEARSAY">SECONDHAND HEARSAY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-9 uppercase text-muted mb-2">Claimed Service Code</label>
                  <input
                    type="text"
                    value={newEvent.claimed_service_code}
                    onChange={e => setNewEvent(s => ({ ...s, claimed_service_code: e.target.value }))}
                    className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-9 uppercase text-muted mb-2">Factual Observation Notes (No Patient Names)</label>
                <textarea
                  required
                  rows={3}
                  value={newEvent.observation_notes}
                  onChange={e => setNewEvent(s => ({ ...s, observation_notes: e.target.value }))}
                  placeholder="Detail exactly what was seen or heard: who offered cash, what was distributed, duration of session, etc."
                  className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                />
              </div>

              <div>
                <label className="block text-9 uppercase text-muted mb-2">Plausible Innocent Explanation (To Disprove)</label>
                <input
                  type="text"
                  value={newEvent.innocent_explanation}
                  onChange={e => setNewEvent(s => ({ ...s, innocent_explanation: e.target.value }))}
                  placeholder="e.g. Authorized transportation grant or peer stipend"
                  className="w-full bg-inset border border-border rounded-md px-10 py-6 text-primary"
                />
              </div>

              <div className="flex justify-end gap-10 pt-10 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-14 py-8 rounded-md bg-inset border border-border text-muted hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-16 py-8 rounded-md bg-emerald text-canvas font-bold hover:bg-emerald/90"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
