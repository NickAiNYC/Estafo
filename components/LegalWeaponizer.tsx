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
  const [peerCohortSize] = useState("Vetted NYC Peer Cohort (NYC 5 Boroughs)");
  const [deviationSigma, setDeviationSigma] = useState("+2.3σ Above Peer Mean");
  const [totalClaims, setTotalClaims] = useState<number>(79000);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState<number>(1650);
  const [spendPerBeneficiary, setSpendPerBeneficiary] = useState<number>(7182);
  const [claimsPerBeneficiary, setClaimsPerBeneficiary] = useState<number>(47.9);
  const [selectionRule, setSelectionRule] = useState<string>(
    "NPPES practice address in NYC 5-borough ZIP prefixes (100–104, 111–114, 116) cross-referenced against HHS aggregate provider spending (HCPCS T2024). Service location is an inferred proxy."
  );
  const [leadUtility, setLeadUtility] = useState<string>("PRIORITY_INVESTIGATION");
  const [exculpatoryHypothesis, setExculpatoryHypothesis] = useState(
    "High volume consistent with extended weekend operating schedule and high-acuity dementia care programs. Primary attendance rosters must be verified."
  );

  // OATH Parameters
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [targetLocation, setTargetLocation] = useState("");

  // Citizen Idling Field Evidence Technical Quality Gates (to avoid OATH rejection)
  const [checklistDuration, setChecklistDuration] = useState(true);
  const [checklistPlate, setChecklistPlate] = useState(true);
  const [checklistMarkings, setChecklistMarkings] = useState(true);
  const [checklistEngineSound, setChecklistEngineSound] = useState(true);
  const [checklistAddress, setChecklistAddress] = useState(true);
  const [checklistNoPto, setChecklistNoPto] = useState(true);

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
        if (match.total_claims) setTotalClaims(match.total_claims);
        if (match.total_beneficiaries) setTotalBeneficiaries(match.total_beneficiaries);
        if (match.spend_per_beneficiary) setSpendPerBeneficiary(match.spend_per_beneficiary);
        if (match.claims_per_beneficiary) setClaimsPerBeneficiary(match.claims_per_beneficiary);
        if (match.selection_rule) setSelectionRule(match.selection_rule);
        if (match.lead_utility) setLeadUtility(match.lead_utility);
        if (match.exculpatory_notes) setExculpatoryHypothesis(match.exculpatory_notes);
      }
    }
  }, [initialTargetId, providers]);

  const generateResearchDossierText = () => {
    const isSigned = reviewerSignedOff && reviewerName.trim().length > 0;
    return `================================================================================
ESTAFO RESEARCH DOSSIER DRAFT // PRELIMINARY SCREENING SUMMARY
INTERNAL COMPLIANCE & RESEARCH AID // NOT AN OFFICIAL LEGAL FILING
================================================================================
NOTICE & METHODOLOGICAL CONTEXT:
This document is a preliminary screening research memorandum generated for institutional
compliance officers, law firm investigators, and government evaluators.
The platform does NOT assert fraud, legal liability, or regulatory non-compliance.
All scores and metrics are screening signals designed to prioritize investigative
review, NOT proof of overbilling or wrongdoing.
================================================================================

I. TARGET HEALTHCARE ENTITY & SELECTION RULE (PROXY IDENTIFIERS)
--------------------------------------------------------------------------------
Entity Legal Name:      ${providerName || "[Not Specified / Pending Input]"}
National Provider ID:   ${providerNPI || "[Enter 10-Digit NPI]"}
Taxonomy / Code Scope:  ${taxonomyCode}
NPPES Practice Address: ${address ? `${address} (${borough})` : "[Enter Corridor / Address]"}
Cohort Selection Rule:  ${selectionRule}

PROXY SELECTION NOTICE:
HHS Medicaid Provider Spending files record aggregate billing and servicing NPI totals,
omitting physical point-of-service locations. NPPES practice addresses do not establish
where a Medicaid service occurred. This cohort is labeled strictly by its actual selection
rule: NPPES practice location proxy in NYC 5-borough ZIP prefixes.

II. MULTI-DIMENSIONAL VOLUME SCREENING & PEER COMPARISON
--------------------------------------------------------------------------------
Primary Screening Signal: Normalized Monthly Spending Intensity ($/active month)
Observed Peer Deviation:  ${deviationSigma}
Total Reported Claims:    ${totalClaims ? totalClaims.toLocaleString() : "Pending Ingestion"}
Total Beneficiaries:      ${totalBeneficiaries ? totalBeneficiaries.toLocaleString() : "Pending Ingestion"}
Spend Per Beneficiary:    $${spendPerBeneficiary ? spendPerBeneficiary.toLocaleString() : "N/A"}
Claims Per Beneficiary:   ${claimsPerBeneficiary ? claimsPerBeneficiary.toFixed(1) : "N/A"} claims/ben
Comparison Peer Cohort:   ${peerCohortSize}

HHS DATASET GRAIN & SUPPRESSION NOTICE:
HHS Medicaid Provider Spending data aggregates annual figures and suppresses small cells
(<11 beneficiaries or claims) to protect beneficiary privacy. Spending intensity per active
month alone does NOT eliminate volume bias; comparisons must evaluate claims per beneficiary,
spend per beneficiary, and like HCPCS procedure codes across equivalent reporting periods.

III. CONTRADICTORY & EXCULPATORY HYPOTHESES (INNOCENT EXPLANATIONS)
--------------------------------------------------------------------------------
Documented Context & Alternative Explanations:
${exculpatoryHypothesis || "None entered."}

IV. FOUR-TIER EVIDENTIARY CLASSIFICATION
--------------------------------------------------------------------------------
1. VERIFIED FACTS:
   - Zero verified violations asserted by the automated screening platform.
   - Sourced claims require primary participant rosters and attendance audits.
2. STATISTICAL INFERENCES:
   - Provider exhibits statistically elevated volume metrics relative to regional
     adult day care peers in normalized monthly spend and beneficiary intensity.
3. ALLEGATIONS:
   - [NONE ASSERTED] — Platform takes no position on intent, regulatory non-compliance,
     or False Claims Act culpability.
4. UNKNOWNS & DATA GAPS:
   - Primary patient attendance sign-in sheets remain uninspected.
   - Electronic Visit Verification (EVV) driver GPS tracking logs have not been audited.
   - Individual patient clinical necessity certifications have not been examined.

V. QUI TAM LEGAL FRAMEWORK & ZERO-PHI ARCHITECTURE
--------------------------------------------------------------------------------
Statutory Bases:         New York False Claims Act (NYS Finance Law § 190(9))
                         Federal False Claims Act (31 U.S.C. § 3730(e)(4))
Public Disclosure Bar:   Case-specific assessment required under NYS Finance Law § 190(9)
                         and federal law. Legal counsel must evaluate specific fact patterns,
                         statutory exceptions, and independent original-source standing.
HIPAA & PHI Posture:     Zero-PHI Architecture. System operates exclusively on public
                         aggregate CMS/HHS data. No protected health information (PHI) is
                         accessed, ingested, or stored; therefore, a HIPAA Business
                         Associate Agreement (BAA) is not required as a matter of law.
Security & Compliance:   SOC 2 Type II is an enterprise buyer requirement for data security
                         and access control, not a statutory HIPAA mandate.
Enforcement Backtests:   Public regulatory and DOJ/OIG actions provide useful positive
                         examples for screening model calibration; however, providers without
                         public enforcement actions are NOT confirmed negatives. Model precision
                         cannot be claimed as real-world accuracy without blinded investigator review.

VI. RECOMMENDED NEXT INVESTIGATIVE STEPS
--------------------------------------------------------------------------------
1. Cross-reference licensed participant capacity with NYS Department of Health registries.
2. Perform lawful on-site physical observation of facility arrival and departure corridors.
3. Review certified corporate registration through the NYS Department of State Division of Corporations.
4. Request redacted billing summaries from primary managed long-term care (MLTC) plans.

VII. BLINDED INVESTIGATOR REVIEW STATUS
--------------------------------------------------------------------------------
Review Status:           ${isSigned ? "COMPLETED INTERNAL REVIEW" : "DRAFT — PENDING HUMAN REVIEW AND SIGN-OFF"}
Reviewer Name:           ${reviewerName.trim() || "[Unassigned]"}
Utility Classification:  ${leadUtility}
Attestation Date:        ${new Date().toISOString().slice(0, 10)}
Legal Work Product:      Confidential Internal Investigative Aid // Not an Affidavit
`;
  };

  const generateOATHIdlingText = () => {
    const verifiedGatesCount = [
      checklistDuration,
      checklistPlate,
      checklistMarkings,
      checklistEngineSound,
      checklistAddress,
      checklistNoPto,
    ].filter(Boolean).length;

    return `================================================================================
CITIZEN ENFORCEMENT COMPLAINT WORKSHEET (NYC ADMIN CODE § 24-163 & § 24-182)
COMMERCIAL VEHICLE ENGINE IDLING COMPLAINT DOSSIER
================================================================================
STATUTORY BASIS:
Prohibition:          NYC Administrative Code § 24-163 (Engine Idling Prohibited >3 Min)
Citizen Reward:       NYC Administrative Code § 24-182 (Citizen Air Complaint Program)
Statutory Bounty:     25% of collected civil fine (payable upon DEP/OATH recovery)
Statutory Penalty:    $350 (standard 1st offense) up to $2,000 (repeat offense)
Expected Citizen EV:  $87.50 to $250.00 per collected violation
================================================================================

I. RESPONDENT COMMERCIAL VEHICLE
--------------------------------------------------------------------------------
License Plate:        ${vehiclePlate || "[Enter Commercial Plate, e.g. NY-99214A]"}
Jurisdiction:         New York Commercial Freight / Carrier
Observation Location: ${targetLocation || "[Enter Location, e.g. Hunts Point Food Center Dr]"}
Observation Date:     ${new Date().toISOString().slice(0, 10)}

II. EVIDENTIARY AUDIT CHECKLIST (${verifiedGatesCount}/6 TECHNICAL GATES VERIFIED)
--------------------------------------------------------------------------------
[${checklistDuration ? "X" : " "}] 1. Continuous Timestamped Video: Full continuous recording >= 180s (>3 min)
       (or >= 60s if parked directly adjacent to a public/private school).
[${checklistPlate ? "X" : " "}] 2. Clear License Plate: Close-up capture of vehicle plate & state registration
       visible at beginning and conclusion of recording.
[${checklistMarkings ? "X" : " "}] 3. Commercial Lettering: Company name, logo, or USDOT / NYS DOT registration
       markings clearly legible on side door or trailer.
[${checklistEngineSound ? "X" : " "}] 4. Audible Engine & Exhaust: Continuous engine audio recorded without muting;
       visible vibration, tailpipe exhaust, or operating reefer unit documented.
[${checklistAddress ? "X" : " "}] 5. Physical Location Anchor: Street name sign, building address number, or GPS
       metadata clearly establishing physical NYC jurisdiction.
[${checklistNoPto ? "X" : " "}] 6. No Mechanical Exemption (PTO): Confirmed vehicle was not actively operating
       power takeoff (e.g. cement mixer revolving, lift-gate actively cycling).

III. CITIZEN DECLARATION
--------------------------------------------------------------------------------
I affirm under penalty of perjury that the attached video recording was taken
personally by the citizen informant, represents continuous unedited observation of the
commercial vehicle idling, and was not captured while driving a motor vehicle.
`;
  };

  const generateOATHDumpingText = () => {
    return `================================================================================
COMMERCIAL ILLEGAL DUMPING COMPLAINT WORKSHEET (NYC ADMIN CODE § 16-119)
OATH / DSNY CITIZEN COMPLAINT DOSSIER
================================================================================
STATUTORY BASIS:
Prohibition:          NYC Administrative Code § 16-119 (Unlawful Dumping Prohibited)
Enforcement Agency:   NYC Department of Sanitation (DSNY) / OATH Hearings Division
Statutory Penalty:    $1,500 – $4,000 (1st offense) up to $18,000 (commercial repeat)
Citizen Bounty Share: Up to 50% of fine collected upon conviction / OATH disposition
Vehicle Forfeiture:   Commercial vehicle subject to impoundment by NYC Sheriff/DSNY
================================================================================

I. INCIDENT LOCATION & SUBJECT VEHICLE
--------------------------------------------------------------------------------
Incident Location:    ${targetLocation || "[Enter Tax Lot / Address]"}
Vehicle Identifier:   ${vehiclePlate || "[Enter Commercial Plate]"}
Statutory Authority:  NYC Administrative Code § 16-119 (Unlawful Dumping)
Observation Date:     ${new Date().toISOString().slice(0, 10)}

II. EVIDENTIARY PROOF REQUIREMENTS
--------------------------------------------------------------------------------
[ ] Contemporaneous video or photographs documenting material dumped from vehicle.
[ ] Commercial license plate, state registration, and vehicle make/model legible.
[ ] Material deposited onto public sidewalk, street, or unpermitted private lot.
[ ] Exact street cross-streets or parcel address verified with date/time stamp.
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
    a.download = `Estafotir_Research_Dossier_Draft_${providerNPI || "draft"}_${Date.now()}.txt`;
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

                {/* 6 Technical Gates Checklist for Citizen Idling */}
                <div className="pt-12 border-t border-border space-y-8 font-mono text-10">
                  <div className="flex items-center justify-between text-secondary uppercase font-bold">
                    <span>Evidence Quality Checklist</span>
                    <span className="text-emerald text-9 font-bold bg-emerald/15 px-6 py-1 rounded-sm border border-emerald/40">
                      {[checklistDuration, checklistPlate, checklistMarkings, checklistEngineSound, checklistAddress, checklistNoPto].filter(Boolean).length}/6 GATES
                    </span>
                  </div>

                  <div className="space-y-6">
                    <label className="flex items-start gap-8 cursor-pointer text-muted hover:text-primary">
                      <input
                        type="checkbox"
                        checked={checklistDuration}
                        onChange={(e) => setChecklistDuration(e.target.checked)}
                        className="rounded bg-inset border-border text-emerald mt-1 focus:ring-0"
                      />
                      <span>Continuous Video &gt;= 180s (&gt;3 min continuous observation)</span>
                    </label>

                    <label className="flex items-start gap-8 cursor-pointer text-muted hover:text-primary">
                      <input
                        type="checkbox"
                        checked={checklistPlate}
                        onChange={(e) => setChecklistPlate(e.target.checked)}
                        className="rounded bg-inset border-border text-emerald mt-1 focus:ring-0"
                      />
                      <span>Commercial plate legible at start &amp; end of recording</span>
                    </label>

                    <label className="flex items-start gap-8 cursor-pointer text-muted hover:text-primary">
                      <input
                        type="checkbox"
                        checked={checklistMarkings}
                        onChange={(e) => setChecklistMarkings(e.target.checked)}
                        className="rounded bg-inset border-border text-emerald mt-1 focus:ring-0"
                      />
                      <span>Commercial lettering / USDOT registration clearly visible</span>
                    </label>

                    <label className="flex items-start gap-8 cursor-pointer text-muted hover:text-primary">
                      <input
                        type="checkbox"
                        checked={checklistEngineSound}
                        onChange={(e) => setChecklistEngineSound(e.target.checked)}
                        className="rounded bg-inset border-border text-emerald mt-1 focus:ring-0"
                      />
                      <span>Audible continuous engine sound &amp; exhaust vibration</span>
                    </label>

                    <label className="flex items-start gap-8 cursor-pointer text-muted hover:text-primary">
                      <input
                        type="checkbox"
                        checked={checklistAddress}
                        onChange={(e) => setChecklistAddress(e.target.checked)}
                        className="rounded bg-inset border-border text-emerald mt-1 focus:ring-0"
                      />
                      <span>Physical location anchor (street sign / address / GPS)</span>
                    </label>

                    <label className="flex items-start gap-8 cursor-pointer text-muted hover:text-primary">
                      <input
                        type="checkbox"
                        checked={checklistNoPto}
                        onChange={(e) => setChecklistNoPto(e.target.checked)}
                        className="rounded bg-inset border-border text-emerald mt-1 focus:ring-0"
                      />
                      <span>Confirmed no mechanical exemption / power takeoff (PTO) active</span>
                    </label>
                  </div>
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
            I. Target Healthcare Entity Identifiers & Cohort Selection Rule
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
                <td className="p-6 font-bold bg-gray-100">NPPES Practice Address</td>
                <td className="p-6">{address ? `${address} (${borough})` : "Unspecified"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Cohort Selection Rule</td>
                <td className="p-6 text-gray-700">{selectionRule}</td>
              </tr>
              <tr>
                <td className="p-6 font-bold bg-gray-100">Proxy Selection Limitation</td>
                <td className="p-6 text-gray-700">
                  The HHS Medicaid Provider Spending file reports billing/servicing NPI aggregates, not service locations. An NPPES practice address does not establish where a Medicaid service occurred.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section II: Multi-Dimensional Statistical Screening */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-8">
            II. Multi-Dimensional Screening Metrics & Peer Comparison
          </div>
          <table className="w-full border-collapse border border-gray-300 text-10">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100 w-1/3">Primary Detection Metric</td>
                <td className="p-6">Normalized Monthly Spending Intensity ($/active reported month)</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Observed Peer Deviation</td>
                <td className="p-6 font-bold text-gray-900">{deviationSigma}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Reported Claims / Beneficiaries</td>
                <td className="p-6">{totalClaims ? totalClaims.toLocaleString() : "N/A"} claim lines across {totalBeneficiaries ? totalBeneficiaries.toLocaleString() : "N/A"} beneficiaries</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Utilization Rates</td>
                <td className="p-6">${spendPerBeneficiary ? spendPerBeneficiary.toLocaleString() : "N/A"}/ben · {claimsPerBeneficiary ? claimsPerBeneficiary.toFixed(1) : "N/A"} claims/ben</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Comparison Peer Cohort</td>
                <td className="p-6">{peerCohortSize}</td>
              </tr>
              <tr>
                <td className="p-6 font-bold bg-gray-100">HHS Dataset Limitations</td>
                <td className="p-6 text-gray-700">
                  HHS data aggregates annual totals and suppresses small cells (&lt;11 beneficiaries/claims) for privacy. Spend per active month alone does not remove volume bias; metrics serve as investigative screening signals only.
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
              <p className="text-gray-700">Zero verified violations asserted by the automated screening platform. All sourced claims require batch ingestion through MediFraudy and roster audits.</p>
            </div>
            <div className="border border-gray-300 p-8">
              <div className="font-bold uppercase text-gray-900 mb-4">2. Statistical Inferences</div>
              <p className="text-gray-700">Billing intensity is statistically elevated ({deviationSigma}) relative to the regional adult day care peer group.</p>
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

        {/* Section V: Legal Framework & Qui Tam Standing */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-8">
            V. Qui Tam Legal Framework & Zero-PHI Architecture
          </div>
          <table className="w-full border-collapse border border-gray-300 text-10">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100 w-1/3">Statutory Bases</td>
                <td className="p-6">New York False Claims Act (NYS Finance Law § 190(9)) · Federal FCA (31 U.S.C. § 3730(e)(4))</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Public Disclosure Bar</td>
                <td className="p-6 text-gray-700">
                  Case-specific standing analysis required under NYS Finance Law § 190(9) and federal law. Legal counsel must assess specific fact patterns, state exceptions, and relator independent knowledge.
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-6 font-bold bg-gray-100">Zero-PHI Architecture</td>
                <td className="p-6 text-gray-700">
                  Operates exclusively on public aggregate CMS/HHS data. No PHI is ingested or stored; a HIPAA Business Associate Agreement (BAA) is not required. SOC 2 Type II is an enterprise buyer requirement.
                </td>
              </tr>
              <tr>
                <td className="p-6 font-bold bg-gray-100">Enforcement Backtesting</td>
                <td className="p-6 text-gray-700">
                  Public actions provide positive training examples; uncharged providers are NOT confirmed negatives. Top-K precision figures cannot be asserted as real-world accuracy without blinded investigator review.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section VI: Recommended Field Next Steps */}
        <div className="mb-16">
          <div className="text-12 font-bold uppercase tracking-wide border-b border-gray-300 pb-4 mb-6">
            VI. Recommended Next Investigative Steps
          </div>
          <ol className="list-decimal pl-16 text-10 text-gray-700 space-y-4">
            <li>Verify licensed participant capacity through the NYS Department of Health provider registry.</li>
            <li>Conduct lawful on-site physical verification of facility operations and participant transport fleet.</li>
            <li>Obtain certified entity registration and ownership history from the NYS Department of State Division of Corporations.</li>
            <li>Request primary encounter and attendance records from participating Managed Long-Term Care (MLTC) plans.</li>
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
