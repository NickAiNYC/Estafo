"use client";

import { useState, useEffect } from "react";
import { 
  Copy, 
  Check, 
  Download, 
  Scale, 
  FileText,
  ShieldCheck,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { MedicaidProviderRecord } from "@/types";

interface LegalWeaponizerProps {
  initialTargetId?: string;
  initialTrack?: string;
  providers?: MedicaidProviderRecord[];
  onBackToRadar?: () => void;
}

export default function LegalWeaponizer({
  initialTargetId,
  initialTrack,
  providers = [],
  onBackToRadar
}: LegalWeaponizerProps) {
  const [packType, setPackType] = useState<"RESEARCH_DOSSIER" | "OATH_IDLING" | "OATH_DUMPING">(
    initialTrack === "TRACK_1_IDLING"
      ? "OATH_IDLING"
      : initialTrack === "TRACK_5_DUMPING"
      ? "OATH_DUMPING"
      : "RESEARCH_DOSSIER"
  );

  const [copied, setCopied] = useState(false);
  const [reviewerSignedOff, setReviewerSignedOff] = useState(false);
  const [reviewerName, setReviewerName] = useState("");

  // Target provider parameters
  const [providerName, setProviderName] = useState("");
  const [providerNPI, setProviderNPI] = useState("");
  const [borough, setBorough] = useState("");
  const [address, setAddress] = useState("");
  const [taxonomyCode, setTaxonomyCode] = useState("HCPCS T2024 (Adult Day Health Care)");
  const [peerCohortSize] = useState("Prototype Peer Cohort (NYC 5 Boroughs)");
  const [deviationSigma, setDeviationSigma] = useState("+2.4σ Above Prototype Mean");
  const [exculpatoryHypothesis, setExculpatoryHypothesis] = useState(
    "Capacity expansion or consolidation of nearby clinics may account for legitimate census growth. Primary attendance rosters must be verified."
  );

  // OATH Parameters
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [targetLocation, setTargetLocation] = useState("");

  // Hydrate from initialTargetId if provided
  useEffect(() => {
    if (initialTargetId && providers.length > 0) {
      const match = providers.find(p => p.id === initialTargetId || p.npi === initialTargetId);
      if (match) {
        setProviderName(match.name);
        setProviderNPI(match.npi);
        setBorough(match.borough);
        setAddress(match.address);
        setTaxonomyCode(`HCPCS T2024 (${match.facility_type})`);
        setDeviationSigma(`+${match.z_score?.toFixed(1) || "2.0"}σ vs Peer Distribution`);
      }
    }
  }, [initialTargetId, providers]);

  const generateResearchDossierText = () => {
    const isSigned = reviewerSignedOff && reviewerName.trim().length > 0;
    return `================================================================================
ESTAFO RESEARCH DOSSIER DRAFT // PRELIMINARY SCREENING SUMMARY
INTERNAL COMPLIANCE & RESEARCH AID // NOT AN OFFICIAL LEGAL FILING
================================================================================
NOTICE & LIMITATIONS:
This document is a preliminary research summary generated for internal evaluation.
The platform does NOT assert fraud, legal liability, or regulatory non-compliance.
All data is derived from statistical screening prototypes. This draft does NOT
constitute a signed complaint, affidavit, or court-ready disclosure.
================================================================================

I. TARGET HEALTHCARE ENTITY (IDENTIFIERS)
--------------------------------------------------------------------------------
Entity Name:          ${providerName || "[Not Specified / Pending Input]"}
Provider Identifier:  ${providerNPI || "[Enter NPI]"}
Specialty Scope:      ${taxonomyCode}
Location Corridor:    ${address ? `${address} (${borough})` : "[Enter Corridor / Address]"}
Data Source State:    Screening Prototype (Requires official HHS/NPPES ingestion)

II. SCREENING ANOMALY & STATISTICAL COMPARISON
--------------------------------------------------------------------------------
Primary Indicator:    Normalized Monthly Spending Intensity ($/active month)
Comparison Group:     ${peerCohortSize}
Descriptive Metric:   Spending Rate vs Specialty Peer Distribution
Observed Deviation:   ${deviationSigma}
Operational Note:     Statistical outliers indicate volume disparity, NOT fraud.

III. CONTRADICTORY & EXCULPATORY HYPOTHESES (INNOCENT EXPLANATIONS)
--------------------------------------------------------------------------------
Documented Context:
${exculpatoryHypothesis || "None entered."}

IV. FOUR-TIER EVIDENTIARY CLASSIFICATION
--------------------------------------------------------------------------------
1. VERIFIED FACTS:
   - Zero verified findings asserted by the platform.
   - Sourced claims require running the official MediFraudy batch importer.
2. STATISTICAL INFERENCES:
   - Monthly billing rate is anomalous relative to the screening cohort.
3. ALLEGATIONS:
   - [NONE ASSERTED] — Platform takes no position on intent or violation.
4. UNKNOWNS & DATA GAPS:
   - Underlying patient medical records and attendance rosters remain uninspected.
   - EVV driver GPS logs have not been obtained or verified.

V. RECOMMENDED NEXT INVESTIGATIVE STEPS
--------------------------------------------------------------------------------
1. Check state regulatory registry for licensed participant census limits.
2. Perform lawful on-site verification of facility operations.
3. Cross-reference corporate filings through official NYS Department of State.

VI. HUMAN REVIEWER STATUS
--------------------------------------------------------------------------------
Review Status:        ${isSigned ? "COMPLETED INTERNAL REVIEW" : "DRAFT — PENDING HUMAN REVIEW AND SIGN-OFF"}
Reviewer Name:        ${reviewerName.trim() || "[Unassigned]"}
Attestation Date:     ${new Date().toISOString().slice(0, 10)}
Disclaimer:           Internal research aid only. Not an affidavit or court filing.
`;
  };

  const generateOATHIdlingText = () => {
    return `================================================================================
CITIZEN ENFORCEMENT COMPLAINT DRAFT (NYC ADMIN CODE § 24-163)
COMMERCIAL ENGINE IDLING COMPLAINT WORKSHEET
================================================================================
NOTICE: This worksheet assists in organizing citizen complaints. Summonses must be
filed directly through the NYC DEP Citizen Air Conservation portal with valid video proof.
================================================================================

I. RESPONDENT COMMERCIAL VEHICLE
--------------------------------------------------------------------------------
Commercial Vehicle Plate: ${vehiclePlate || "[Enter Plate]"} (State: NY)
Location Observed:        ${targetLocation || "[Enter Location]"}
Time of Observation:      ${new Date().toISOString().slice(0, 10)}
Required Evidence:        3+ minutes of uninterrupted, timestamped video recording.

II. CHECKLIST BEFORE CITIZEN FILING
--------------------------------------------------------------------------------
[ ] Unbroken video clearly showing engine running / audible exhaust (> 180 seconds)
[ ] Clear optical capture of commercial vehicle license plate and company lettering
[ ] Ambient temperature verified if requesting exemption under DEP guidelines
`;
  };

  const getActiveText = () => {
    if (packType === "OATH_IDLING") return generateOATHIdlingText();
    return generateResearchDossierText();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getActiveText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Estafo_Research_Dossier_Draft_${providerNPI || "draft"}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      {/* Top Header */}
      <div className="p-16 border-b border-border bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-16 shrink-0">
        <div className="flex items-center gap-12">
          {onBackToRadar && (
            <button
              onClick={onBackToRadar}
              className="px-10 py-5 bg-inset border border-border rounded-sm text-11 font-mono text-muted hover:text-primary hover:border-border-highlight flex items-center gap-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Radar</span>
            </button>
          )}
          <div className="p-8 bg-steel-blue/10 border border-steel-blue/30 rounded-sm">
            <Scale className="w-5 h-5 text-steel-blue" />
          </div>
          <div>
            <div className="text-11 font-mono text-muted uppercase tracking-wider flex items-center gap-8">
              <span>Investigation Studio // Section 3 Evidence Contract</span>
              <span className="px-6 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-9 font-bold rounded-sm">
                DRAFT RESEARCH AID
              </span>
            </div>
            <h1 className="text-18 font-bold font-jakarta tracking-tight">
              Investigative Research Dossier Studio
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-12 font-mono">
          <button
            onClick={handleCopy}
            className="flex items-center gap-6 px-12 py-6 rounded-sm bg-inset border border-border text-muted hover:text-primary text-11 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED" : "COPY TEXT"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-6 px-12 py-6 rounded-sm bg-steel-blue/20 border border-steel-blue text-steel-blue hover:bg-steel-blue/30 text-11 font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT TXT</span>
          </button>
        </div>
      </div>

      {/* Prominent Legal Disclaimer Banner */}
      <div className="px-16 py-8 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Notice: DRAFT RESEARCH AID ONLY. This tool formats an unverified research dossier draft for evaluation. It does NOT generate signed court complaints, subpoenas, or official relator disclosures. All factual assertions require independent verification.</span>
        </div>
        <span className="text-amber-400 font-bold ml-8 shrink-0 uppercase text-10">Unverified Draft</span>
      </div>

      {/* Main Dual-Pane Matrix */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Parameter Configuration */}
        <div className="w-full lg:w-[440px] border-r border-border bg-surface p-16 overflow-y-auto space-y-16">
          {/* Dossier Type Selector */}
          <div>
            <label className="block text-10 font-mono text-muted uppercase mb-6">Dossier Category</label>
            <div className="grid grid-cols-2 gap-8 font-mono text-11">
              <button
                type="button"
                onClick={() => setPackType("RESEARCH_DOSSIER")}
                className={`p-8 rounded-sm border text-left transition-colors ${
                  packType === "RESEARCH_DOSSIER"
                    ? "bg-steel-blue/20 border-steel-blue text-steel-blue font-bold"
                    : "bg-inset border-border text-muted hover:text-primary"
                }`}
              >
                Healthcare Research
              </button>
              <button
                type="button"
                onClick={() => setPackType("OATH_IDLING")}
                className={`p-8 rounded-sm border text-left transition-colors ${
                  packType === "OATH_IDLING"
                    ? "bg-steel-blue/20 border-steel-blue text-steel-blue font-bold"
                    : "bg-inset border-border text-muted hover:text-primary"
                }`}
              >
                NYC DEP Idling
              </button>
            </div>
          </div>

          {packType === "RESEARCH_DOSSIER" ? (
            <>
              {/* Target Entity Parameters */}
              <div className="space-y-10">
                <div className="text-11 font-mono text-secondary uppercase font-bold flex items-center gap-6">
                  <FileText className="w-3.5 h-3.5 text-steel-blue" />
                  <span>Target Healthcare Entity</span>
                </div>

                <div>
                  <label className="block text-9 font-mono text-muted uppercase mb-4">Entity Legal Name</label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="e.g. Sample Adult Day Care Facility Alpha"
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
                  />
                </div>

                <div>
                  <label className="block text-9 font-mono text-muted uppercase mb-4">National Provider Identifier (NPI)</label>
                  <input
                    type="text"
                    value={providerNPI}
                    onChange={(e) => setProviderNPI(e.target.value)}
                    placeholder="e.g. DEMO-NPI-001"
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
                  />
                </div>

                <div>
                  <label className="block text-9 font-mono text-muted uppercase mb-4">Corridor / Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Flushing Corridor, Queens, NY"
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
                  />
                </div>
              </div>

              {/* Statistical Anomaly Parameters */}
              <div className="space-y-10 pt-10 border-t border-border">
                <div className="text-11 font-mono text-secondary uppercase font-bold flex items-center gap-6">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Statistical Screening Metric</span>
                </div>

                <div>
                  <label className="block text-9 font-mono text-muted uppercase mb-4">Procedure Code / Specialty</label>
                  <input
                    type="text"
                    value={taxonomyCode}
                    onChange={(e) => setTaxonomyCode(e.target.value)}
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono placeholder:text-muted focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-9 font-mono text-muted uppercase mb-4">Observed Deviation</label>
                  <input
                    type="text"
                    value={deviationSigma}
                    onChange={(e) => setDeviationSigma(e.target.value)}
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono placeholder:text-muted focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-9 font-mono text-muted uppercase mb-4">Exculpatory Operational Hypothesis</label>
                  <textarea
                    rows={3}
                    value={exculpatoryHypothesis}
                    onChange={(e) => setExculpatoryHypothesis(e.target.value)}
                    placeholder="Document clinical census, regional consolidation, or alternative explanations..."
                    className="w-full bg-inset border border-border rounded-sm p-8 text-10 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight resize-none"
                  />
                </div>
              </div>

              {/* Human Review Sign-Off */}
              <div className="space-y-10 pt-10 border-t border-border">
                <div className="text-11 font-mono text-gold uppercase font-bold flex items-center gap-6">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  <span>Reviewer Attestation</span>
                </div>

                <div>
                  <label className="block text-9 font-mono text-muted uppercase mb-4">Reviewer Name & Title</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter compliance analyst or reviewer name"
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
                  />
                </div>

                <div className="flex items-center gap-8">
                  <input
                    type="checkbox"
                    id="signoffCheck"
                    checked={reviewerSignedOff}
                    onChange={(e) => setReviewerSignedOff(e.target.checked)}
                    className="rounded bg-inset border-border text-steel-blue focus:ring-0"
                  />
                  <label htmlFor="signoffCheck" className="text-10 font-mono text-muted select-none">
                    Confirm review completed against source checklist
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-10">
              <div className="text-11 font-mono text-secondary uppercase font-bold">
                Respondent Vehicle Information
              </div>

              <div>
                <label className="block text-9 font-mono text-muted uppercase mb-4">Commercial Vehicle Plate</label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="e.g. NY-99214A"
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-9 font-mono text-muted uppercase mb-4">Observation Location</label>
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  placeholder="e.g. Hunts Point Food Center Dr, Bronx"
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Monospaced Text Preview */}
        <div className="flex-1 bg-canvas p-16 flex flex-col h-full overflow-hidden">
          <div className="text-10 font-mono text-muted uppercase mb-8 flex items-center justify-between">
            <span>Dossier Plaintext Preview</span>
            <span className="text-9 text-faint">Standard Monospaced Layout</span>
          </div>

          <pre className="flex-1 bg-inset border border-border rounded-sm p-16 font-mono text-11 text-secondary overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
            {getActiveText()}
          </pre>
        </div>
      </div>
    </div>
  );
}
