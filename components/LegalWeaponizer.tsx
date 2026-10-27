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
  ArrowLeft,
  Printer
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
License Plate:        ${vehiclePlate || "[Enter Plate, e.g. NY-99214A]"}
Jurisdiction:         New York Commercial Freight Registry
Observation Location: ${targetLocation || "[Enter Location, e.g. Hunts Point Market]"}

II. STATUTORY BASIS
--------------------------------------------------------------------------------
Ordinance:            NYC Administrative Code § 24-163
Allowed Idle Time:    Maximum 3 continuous minutes (1 minute adjacent to schools)
Statutory Penalty:    $350 – $2,000 per violation
Citizen Payout Rate:  25% of collected civil penalties (payable via NYC DEP)

III. EVIDENTIARY SUBMISSION CHECKLIST
--------------------------------------------------------------------------------
[ ] Continuous timestamped video documenting engine idling (>180 seconds).
[ ] Legible capture of vehicle commercial license plate and USDOT markings.
[ ] Audible engine sound and exhaust emission clearly visible.
[ ] Proximity verification to address / street cross-streets.
`;
  };

  const generateOATHDumpingText = () => {
    return `================================================================================
COMMERCIAL ILLEGAL DUMPING COMPLAINT DRAFT (NYC ADMIN CODE § 16-119)
OATH ADJUDICATION WORKSHEET
================================================================================
NOTICE: Commercial dumping complaints must be submitted to the NYC DSNY Bureau of
Legal Affairs with contemporaneous photographic or video evidence.
================================================================================

I. INCIDENT LOCATION & SUBJECT VEHICLE
--------------------------------------------------------------------------------
Incident Location:    ${targetLocation || "[Enter Tax Lot / Address]"}
Vehicle Identifier:   ${vehiclePlate || "[Enter Commercial Plate]"}
Statutory Authority:  NYC Administrative Code § 16-119 (Unlawful Dumping)

II. STATUTORY PENALTIES & CITIZEN REWARD
--------------------------------------------------------------------------------
Fine Range:           $4,000 (first offense) up to $18,000 (repeat commercial offense)
Statutory Bounty:     50% of collected fine paid to citizen informant
Forfeiture Risk:      Vehicle subject to impoundment by NYC Sheriff / DSNY

III. REQUIRED PROOF
--------------------------------------------------------------------------------
[ ] Photographic evidence showing material deposited from commercial vehicle.
[ ] Timestamp, location geotag, and license plate clearly legible.
[ ] DSNY confirmation of unpermitted commercial waste transfer.
`;
  };

  const getActiveText = () => {
    switch (packType) {
      case "RESEARCH_DOSSIER":
        return generateResearchDossierText();
      case "OATH_IDLING":
        return generateOATHIdlingText();
      case "OATH_DUMPING":
        return generateOATHDumpingText();
    }
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

  const handlePrint = () => {
    window.print();
  };

  const isSigned = reviewerSignedOff && reviewerName.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      {/* On-Screen Interactive Studio (Hidden when printing) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden print:hidden">
        {/* Top Header */}
        <div className="p-16 border-b border-border bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-16 shrink-0">
          <div className="flex items-center gap-12">
            {onBackToRadar && (
              <button
                onClick={onBackToRadar}
                className="px-10 py-5 bg-inset border border-border rounded-sm text-11 font-mono text-muted hover:text-primary hover:border-border-highlight flex items-center gap-6 transition-colors cursor-pointer"
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
                <span>Investigation Studio // Research Memorandum</span>
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
              className="flex items-center gap-6 px-12 py-6 rounded-sm bg-inset border border-border text-muted hover:text-primary text-11 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "COPIED" : "COPY TEXT"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-6 px-12 py-6 rounded-sm bg-steel-blue/20 border border-steel-blue text-steel-blue hover:bg-steel-blue/30 text-11 font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT TXT</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-6 px-12 py-6 rounded-sm bg-emerald/20 border border-emerald/60 text-emerald hover:bg-emerald/30 text-11 font-bold transition-colors cursor-pointer"
              title="Print or export research dossier as formal legal brief PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT / SAVE PDF</span>
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
                </div>

                {/* Exculpatory Hypothesis Input */}
                <div className="space-y-10 pt-10 border-t border-border">
                  <label className="block text-9 font-mono text-muted uppercase mb-4">Exculpatory / Innocent Explanations</label>
                  <textarea
                    rows={3}
                    value={exculpatoryHypothesis}
                    onChange={(e) => setExculpatoryHypothesis(e.target.value)}
                    className="w-full bg-inset border border-border rounded-sm p-8 text-10 font-mono text-secondary focus:outline-none"
                  />
                </div>

                {/* Reviewer Sign-Off Box */}
                <div className="space-y-10 pt-10 border-t border-border">
                  <div className="text-11 font-mono text-secondary uppercase font-bold flex items-center gap-6">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
                    <span>Human Reviewer Attestation</span>
                  </div>

                  <div>
                    <label className="block text-9 font-mono text-muted uppercase mb-4">Reviewer Full Name</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Jane Doe, Compliance Officer"
                      className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-8">
                    <input
                      type="checkbox"
                      id="signoffCheck"
                      checked={reviewerSignedOff}
                      onChange={(e) => setReviewerSignedOff(e.target.checked)}
                      className="rounded bg-inset border-border text-steel-blue focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="signoffCheck" className="text-10 font-mono text-muted select-none cursor-pointer">
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

      {/* Dedicated Print Layout (Active during window.print() / Save as PDF) */}
      <div className="hidden print:block print:p-24 print:bg-white print:text-black font-sans leading-relaxed text-11 max-w-4xl mx-auto">
        {/* Print Header */}
        <div className="border-b-2 border-black pb-12 mb-16 flex justify-between items-start">
          <div>
            <div className="text-18 font-bold tracking-tight uppercase">ESTAFO INVESTIGATIVE RESEARCH INTELLIGENCE</div>
            <div className="text-12 font-bold text-gray-700 tracking-wider uppercase mt-2">
              PRELIMINARY SCREENING SUMMARY // COMPLIANCE RESEARCH MEMORANDUM
            </div>
            <div className="text-10 text-gray-500 mt-2">Internal Work Product // Not an Official Legal Filing or Affidavit</div>
          </div>
          <div className="text-right text-10 font-mono">
            <div>Ref: <span className="font-bold">EST-{providerNPI || "DRAFT"}-{new Date().toISOString().slice(0, 10)}</span></div>
            <div>Date: <span className="font-bold">{new Date().toISOString().slice(0, 10)}</span></div>
            <div className="mt-4 px-6 py-2 bg-gray-100 border border-gray-300 font-bold inline-block">
              {isSigned ? "INTERNAL REVIEW COMPLETED" : "DRAFT — PENDING REVIEW"}
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="border border-gray-400 bg-gray-50 p-10 mb-16 text-10">
          <div className="font-bold uppercase tracking-wider mb-4 text-gray-900">STATUTORY NOTICE & METHODOLOGICAL LIMITATIONS</div>
          <p className="text-gray-700 leading-normal">
            This memorandum is an investigative screening draft compiled solely for internal compliance evaluation. The platform does NOT assert fraud, legal liability, or regulatory non-compliance against any named provider. Sourced claims require running the official MediFraudy ingestion engine and inspecting primary participant attendance rosters. Statistical outliers indicate volume variance, NOT intent or unlawful billing.
          </p>
        </div>

        {/* Section I: Target Healthcare Entity Table */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-8">
            I. Target Healthcare Entity Identifiers
          </div>
          <table className="w-full border-collapse border border-gray-300 text-10">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100 w-1/3">Entity Legal Name</td>
                <td className="p-6">{providerName || "Pending input / unassigned"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">National Provider Identifier (NPI)</td>
                <td className="p-6 font-mono">{providerNPI || "DEMO-NPI-XXX"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Specialty / Taxonomy</td>
                <td className="p-6">{taxonomyCode}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Facility Location / Corridor</td>
                <td className="p-6">{address ? `${address} (${borough})` : "Unspecified"}</td>
              </tr>
              <tr>
                <td className="p-6 font-bold bg-gray-100">Data Source State</td>
                <td className="p-6">Screening Prototype (Requires official CMS/NPPES ingestion run)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section II: Statistical Anomaly & Peer Comparison */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-8">
            II. Screening Anomaly & Statistical Peer Comparison
          </div>
          <table className="w-full border-collapse border border-gray-300 text-10">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100 w-1/3">Primary Detection Metric</td>
                <td className="p-6">Normalized Monthly Spending Intensity ($/active reported month)</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Comparison Peer Cohort</td>
                <td className="p-6">{peerCohortSize}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Observed Peer Deviation</td>
                <td className="p-6 font-bold text-gray-900">{deviationSigma}</td>
              </tr>
              <tr>
                <td className="p-6 font-bold bg-gray-100">Analytical Finding</td>
                <td className="p-6 text-gray-700">
                  Entity billing intensity falls in upper quartile relative to specialty peer mean. Does NOT establish liability without licensed participant capacity analysis.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section III: Exculpatory Explanations */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-6">
            III. Documented Exculpatory Hypotheses (Innocent Explanations)
          </div>
          <div className="border border-gray-300 p-8 text-10 bg-gray-50 text-gray-800 leading-normal">
            {exculpatoryHypothesis || "None entered."}
          </div>
        </div>

        {/* Section IV: Four-Tier Evidentiary Classification */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-8">
            IV. Four-Tier Evidentiary Classification
          </div>
          <div className="grid grid-cols-2 gap-8 text-10">
            <div className="border border-gray-300 p-8">
              <div className="font-bold uppercase text-gray-900 mb-4">1. Verified Facts</div>
              <p className="text-gray-700">Zero verified facts asserted by the automated screening platform. All sourced claims require batch ingestion through MediFraudy.</p>
            </div>
            <div className="border border-gray-300 p-8">
              <div className="font-bold uppercase text-gray-900 mb-4">2. Statistical Inferences</div>
              <p className="text-gray-700">Billing intensity is statistically elevated (+2.4σ) relative to the adult day care demonstration specialty cohort.</p>
            </div>
            <div className="border border-gray-300 p-8">
              <div className="font-bold uppercase text-gray-900 mb-4">3. Allegations</div>
              <p className="text-gray-700">[NONE ASSERTED] — Platform takes no position on intent, regulatory non-compliance, or False Claims Act culpability.</p>
            </div>
            <div className="border border-gray-300 p-8">
              <div className="font-bold uppercase text-gray-900 mb-4">4. Unknowns & Data Gaps</div>
              <p className="text-gray-700">Patient attendance rosters, electronic visit verification (EVV) driver logs, and participant medical necessity records remain uninspected.</p>
            </div>
          </div>
        </div>

        {/* Section V: Recommended Field Next Steps */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-6">
            V. Recommended Next Investigative Steps
          </div>
          <ol className="list-decimal pl-16 text-10 text-gray-700 space-y-4">
            <li>Verify licensed participant capacity through the NYS Department of Health provider registry.</li>
            <li>Conduct lawful on-site physical verification of facility operations and participant transport fleet.</li>
            <li>Obtain certified entity registration and ownership history from the NYS Department of State Division of Corporations.</li>
          </ol>
        </div>

        {/* Section VI: Reviewer Attestation & Signature Box */}
        <div className="border-t-2 border-black pt-12 mt-20">
          <div className="text-12 font-bold uppercase tracking-wide mb-8">
            VI. Human Reviewer Attestation & Formal Sign-Off
          </div>
          <div className="grid grid-cols-2 gap-16 text-10">
            <div>
              <div className="mb-8">Reviewer Name: <span className="font-bold">{reviewerName.trim() || "[Unassigned]"}</span></div>
              <div className="mb-8">Review Status: <span className="font-bold">{isSigned ? "COMPLETED INTERNAL REVIEW" : "DRAFT — PENDING SIGN-OFF"}</span></div>
              <div>Attestation Date: <span className="font-bold">{new Date().toISOString().slice(0, 10)}</span></div>
            </div>
            <div className="border border-gray-300 p-12 bg-gray-50 flex flex-col justify-between h-32">
              <div className="text-9 text-gray-500 uppercase tracking-wider">Authorized Investigator Signature</div>
              <div className="border-b border-black w-full mb-2"></div>
              <div className="flex justify-between text-9 text-gray-600">
                <span>Signature / Bar / License #</span>
                <span>Date</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
