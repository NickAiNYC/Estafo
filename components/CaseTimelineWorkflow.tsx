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
const DEFAULT_INITIAL_EVENTS: InvestigativeTimelineEvent[] = [
  {
    id: "EVT-2026-001",
    case_id: "CASE-QUEENS-OASAS-01",
    event_date: "2026-10-14",
    facility_name: "Queens Recovery & Wellness Center (OASAS Outpatient)",
    facility_npi: "1487629085",
    transport_company: "Metro Ambulette & Livery Services Inc.",
    transport_npi: "1821094328",
    cash_amount_offered: 25,
    cash_purpose_alleged: "Cash envelope handed to participant upon arrival in exchange for signing group counseling roster",
    observer_role: "FIRSTHAND_WORKER",
    observation_notes: "Observed facility intake worker handing white envelopes containing $25 cash to 8 individuals arriving via Metro Ambulette. Sign-in sheet titled 'Part 822 Group Counseling Roster' was signed prior to any clinical session.",
    claimed_service_code: "H0005 (OASAS Group Counseling, 60-Min Minimum)",
    evidence_level: "DIRECT_WITNESS",
    innocent_explanation: "Facility staff may claim cash was an authorized transportation assistance subsidy or OASAS grant stipend for peer support.",
    verification_status: "UNVERIFIED",
    created_at: "2026-10-27T14:30:00Z"
  },
  {
    id: "EVT-2026-002",
    case_id: "CASE-QUEENS-OASAS-01",
    event_date: "2026-10-16",
    facility_name: "Queens Recovery & Wellness Center (OASAS Outpatient)",
    facility_npi: "1487629085",
    transport_company: "Metro Ambulette & Livery Services Inc.",
    transport_npi: "1821094328",
    cash_amount_offered: 30,
    cash_purpose_alleged: "Ambulette driver distributed $30 cash bonus to passengers during morning pickup route",
    observer_role: "SECONDHAND_HEARSAY",
    observation_notes: "Worker was told by a regular attendee that the ambulette driver gives passengers $30 per completed round trip if they attend 3 sessions in a week.",
    claimed_service_code: "T2003 (NEMT Round Trip Encounter) + A0425 (Billed Mileage)",
    evidence_level: "INFERENCE",
    innocent_explanation: "Driver may have been providing personal tips or cash assistance unrelated to Medicaid billing authorization.",
    verification_status: "UNVERIFIED",
    created_at: "2026-10-27T15:00:00Z"
  },
  {
    id: "EVT-2026-003",
    case_id: "CASE-QUEENS-OASAS-01",
    event_date: "2026-10-21",
    facility_name: "Queens Recovery & Wellness Center (OASAS Outpatient)",
    facility_npi: "1487629085",
    transport_company: "Metro Ambulette & Livery Services Inc.",
    transport_npi: "1821094328",
    cash_amount_offered: 25,
    cash_purpose_alleged: "Attendance roster signed, but group session lasted only 15 minutes before attendees were dismissed",
    observer_role: "FIRSTHAND_WORKER",
    observation_notes: "Participant group gathered at 10:15 AM, dismissed at 10:30 AM (15 minutes duration). OASAS Part 822 mandates a 60-minute clinical minimum for H0005 group billing. Roster logged as full session.",
    claimed_service_code: "H0005 (OASAS Group Counseling, 60-Min Minimum)",
    evidence_level: "DIRECT_WITNESS",
    innocent_explanation: "Clinician may have documented an abbreviated crisis session or rescheduled individual sessions under separate codes.",
    verification_status: "UNVERIFIED",
    created_at: "2026-10-27T16:15:00Z"
  }
];

export default function CaseTimelineWorkflow() {
  const [events, setEvents] = useState<InvestigativeTimelineEvent[]>(DEFAULT_INITIAL_EVENTS);
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "DOSSIER" | "THREE_WAY_MATCH" | "LEGAL_ROUTES">("TIMELINE");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    event_date: new Date().toISOString().slice(0, 10),
    facility_name: "Queens Recovery & Wellness Center",
    facility_npi: "1487629085",
    transport_company: "Metro Ambulette & Livery Services Inc.",
    transport_npi: "",
    cash_amount_offered: 25,
    cash_purpose_alleged: "",
    observer_role: "FIRSTHAND_WORKER" as InvestigativeTimelineEvent["observer_role"],
    observation_notes: "",
    claimed_service_code: "H0005 (OASAS Outpatient Group)",
    evidence_level: "DIRECT_WITNESS" as InvestigativeTimelineEvent["evidence_level"],
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
      facility_name: "Queens Recovery & Wellness Center",
      facility_npi: "1487629085",
      transport_company: "Metro Ambulette & Livery Services Inc.",
      transport_npi: "",
      cash_amount_offered: 25,
      cash_purpose_alleged: "",
      observer_role: "FIRSTHAND_WORKER",
      observation_notes: "",
      claimed_service_code: "H0005 (OASAS Outpatient Group)",
      evidence_level: "DIRECT_WITNESS",
      innocent_explanation: ""
    });
  };

  // Generate 4-Quadrant Dossier
  const dossier: FourQuadrantDossier = {
    case_title: "Queens OASAS Chemical Dependence Outpatient & Ambulette Kickback Investigation",
    target_entities: {
      facility: "Queens Recovery & Wellness Center",
      facility_npi: "1487629085",
      transport: "Metro Ambulette & Livery Services Inc.",
      transport_npi: "1821094328"
    },
    facts: [
      "Observed facility staff distributing $25 cash envelopes to arriving individuals on 2026-10-14 and 2026-10-21.",
      "Individuals signed 'Part 822 Group Counseling Roster' prior to participating in clinical services.",
      "Group session on 2026-10-21 terminated after 15 minutes, whereas NYS OASAS Part 822 requires a 60-minute clinical minimum for H0005 reimbursement.",
      "Metro Ambulette vehicles regularly transport passengers directly to the facility on scheduled counseling days."
    ],
    inferences: [
      "Cash payments of $20–$30 serve as an illegal inducement/kickback to recruit Medicaid recipients and secure attendance signatures.",
      "Ambulette company and outpatient facility operate in coordinated referral synergy, billing both round-trip NEMT (T2003/A0425) and clinical counseling (H0005) for the same encounter.",
      "Abbreviated 15-minute group sessions suggest phantom or truncated clinical services billed as full group counseling encounters."
    ],
    allegations: [
      "Violation of New York False Claims Act (NYS Finance Law § 189) by submitting claims for services rendered pursuant to unlawful remuneration.",
      "Violation of Federal Anti-Kickback Statute (42 U.S.C. § 1320a-7b(b)) for offering and paying remuneration to induce Medicaid beneficiary patronage.",
      "Submitting claims for services not rendered as described under NYS OASAS Part 822 regulations (billing H0005 for 15-minute sessions)."
    ],
    unknowns: [
      "Were Medicaid claims actually submitted for the specific dates (2026-10-14, 2026-10-16, 2026-10-21), and what specific HCPCS/CPT codes were billed?",
      "Does the facility maintain documented clinical progress notes signed by a licensed clinician for each attendee on those dates?",
      "Did cash payments originate from facility operational funds, clinician discretionary funds, or an authorized grant stipending program?",
      "Did ambulette drivers receive dispatch payment authorization through the NYS Medicaid transportation broker (e.g. Modivcare / Medical Answering Services)?"
    ],
    innocent_explanations: [
      "Transportation Stipend: Cash payments may be accounted for as lawful travel assistance subsidies under an approved pilot program.",
      "Crisis Intervention: Abbreviated meeting may have been billed under an individual crisis psychotherapy code rather than a full group session.",
      "Independent Driver Misconduct: Ambulette driver actions may be unauthorized independent misconduct not coordinated with the treatment center."
    ],
    next_lawful_verification_steps: [
      "1. Lawful Member EOB Review: Have a willing Medicaid beneficiary request their own official Explanation of Benefits (EOB) from NY DOH for the dates in question.",
      "2. OASAS Directory Verification: Inspect public OASAS provider registry to verify licensed capacity, certified operating certificates, and clinical director of record.",
      "3. Retention of Legal Counsel: Present factual timeline and witness statements to an experienced New York False Claims Act qui tam attorney.",
      "4. Confidential Filing Assessment: Counsel evaluates filing a sealed qui tam complaint under NYS Finance Law § 190 vs. submitting an original tip to the DOJ Criminal Tip Rewards Pilot Program."
    ],
    legal_framework: {
      nys_fca: {
        citation: "NY State Finance Law § 190",
        relator_share_intervened: "15% – 25%",
        relator_share_declined: "25% – 30%",
        sealed_filing_required: true
      },
      doj_criminal_tip_pilot: {
        program: "DOJ Criminal Tip Rewards Pilot Program",
        reward_range: "$10,000 – $30,000 (Discretionary)",
        trigger: "Unsealed federal criminal charges resulting from original tip",
        intake_url: "https://www.america.gov/fraud"
      }
    },
    confidentiality_notice: "STRICT ZERO-PHI NOTICE (42 CFR PART 2 & HIPAA): Substance use disorder patient records are subject to strict federal confidentiality protections. No patient names, medical charts, or Medicaid recipient IDs may be recorded or transmitted. This dossier contains purely operational observations and corporate billing assertions."
  };

  const handleDownloadMarkdown = () => {
    const md = `# ${dossier.case_title}
**Date Generated:** ${new Date().toLocaleDateString()}
**Status:** CONFIDENTIAL INVESTIGATIVE DOSSIER // ATTORNEY-CLIENT PRIVILEGED WORK PRODUCT DRAFT

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

            <div className="space-y-12">
              {events.map((evt, idx) => (
                <div 
                  key={evt.id} 
                  className="p-16 border border-border bg-surface rounded-lg space-y-12 transition-all hover:border-border-highlight"
                >
                  <div className="flex flex-wrap items-start justify-between gap-12">
                    <div className="flex items-center gap-8">
                      <span className="font-mono text-10 font-bold text-muted bg-inset px-6 py-2 rounded-md border border-border">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-12 font-bold text-emerald bg-emerald/15 px-8 py-2 rounded-md border border-emerald/30">
                        {evt.event_date}
                      </span>
                      <span className="text-12 font-bold text-primary font-jakarta">
                        {evt.facility_name}
                      </span>
                      {evt.transport_company && (
                        <span className="flex items-center gap-4 text-11 font-mono text-steel-blue bg-steel-blue/15 px-6 py-1 rounded-sm border border-steel-blue/30">
                          <Car className="w-3 h-3" /> {evt.transport_company}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 font-mono text-10">
                      <span className={`px-6 py-2 rounded-sm border font-bold ${
                        evt.observer_role === "FIRSTHAND_WORKER"
                          ? "bg-emerald/15 border-emerald/40 text-emerald"
                          : evt.observer_role === "DOCUMENTED_RECORD"
                          ? "bg-steel-blue/15 border-steel-blue/40 text-steel-blue"
                          : "bg-amber/15 border-amber/40 text-amber"
                      }`}>
                        {evt.observer_role.replace("_", " ")}
                      </span>
                      <span className="bg-inset px-6 py-2 rounded-sm border border-border text-muted">
                        {evt.evidence_level}
                      </span>
                    </div>
                  </div>

                  {/* Cash Incentive & Alleged Purpose */}
                  {evt.cash_amount_offered && evt.cash_amount_offered > 0 && (
                    <div className="p-10 bg-inset rounded-md border border-border flex items-start gap-10 font-mono text-11">
                      <DollarSign className="w-4 h-4 text-gold shrink-0 mt-2" />
                      <div>
                        <span className="font-bold text-gold uppercase text-10">Alleged Remuneration / Cash Offer:</span>{" "}
                        <span className="font-bold text-primary">${evt.cash_amount_offered}</span>
                        <div className="text-secondary mt-1">{evt.cash_purpose_alleged}</div>
                      </div>
                    </div>
                  )}

                  {/* Observation Narrative */}
                  <div className="text-12 text-primary font-mono leading-relaxed bg-surface-elevated/40 p-12 rounded-md border border-border">
                    <div className="text-9 uppercase text-muted font-bold mb-4">Firsthand Statement / Logged Detail:</div>
                    {evt.observation_notes}
                  </div>

                  {/* Claimed Code vs Innocent Explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-mono text-10 pt-4 border-t border-border">
                    <div className="p-8 bg-inset rounded-sm border border-border">
                      <div className="text-muted uppercase text-9">Claimed Service Code Target</div>
                      <div className="text-primary font-bold mt-2">{evt.claimed_service_code || "Unspecified"}</div>
                    </div>
                    <div className="p-8 bg-inset rounded-sm border border-border">
                      <div className="text-muted uppercase text-9">Plausible Innocent Explanation (To Disprove)</div>
                      <div className="text-secondary mt-2">{evt.innocent_explanation}</div>
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
                Parked ambulettes outside a clinic alone do not establish fraud. A legally viable Medicaid False Claims Act or OMIG audit case tests a specific three-way match: <strong className="text-primary">Authorized Transportation → Documented Clinic Visit → Corroborated Billed Counseling</strong>. If any leg fails to corroborate the others on the exact same service date, the resulting Medicaid claims constitute false claims.
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
                    <span className="text-primary font-bold">H0005 (Group Session) & 90853 (Group Psychotherapy)</span>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Mandatory Clinical Standard</span>
                    <ul className="text-secondary list-disc list-inside space-y-3 mt-2 text-10">
                      <li>Minimum 60 minutes clinical duration (OASAS rule)</li>
                      <li>Maximum 15 participants per group encounter</li>
                      <li>Signed clinician progress note in EHR</li>
                      <li>Documented SUD diagnosis & medical necessity</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-muted block text-9 uppercase">Forensic Discrepancy Tested</span>
                    <p className="text-amber text-10 leading-relaxed mt-1">
                      Were 10–15 minute check-ins billed as full 60-minute H0005 sessions? Were sessions billed without licensed clinician notes? Was attendance induced with $20–$30 cash?
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
                When conducting lawful observations from a publicly accessible street location, log only objective, verifiable facts. Do not photograph patient faces, record conversations without consent, or approach attendees.
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
                    <li><strong className="text-primary">Patient Diagnoses:</strong> Cannot assume SUD diagnosis or medical necessity from physical appearance.</li>
                    <li><strong className="text-primary">Cash Transactions:</strong> Unless directly witnessed, attendee payment remains unverified report/hearsay.</li>
                    <li><strong className="text-primary">Strict Zero-PHI:</strong> Never record patient names or identifiable clinical attributes.</li>
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
