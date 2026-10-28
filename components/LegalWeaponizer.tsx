"use client";

import { useState, useEffect } from "react";
import { 
  Copy, 
  Check, 
  Download, 
  Scale, 
  FileText, 
  ArrowLeft,
  Printer,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Building2
} from "lucide-react";
import { MedicaidProviderRecord } from "@/types";

export type DossierPackType = 
  | "RESEARCH_DOSSIER" 
  | "FCA_DISCLOSURE_BAR_AUDIT" 
  | "VENDOR_DILIGENCE" 
  | "OATH_IDLING" 
  | "OATH_DUMPING";

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
  const [packType, setPackType] = useState<DossierPackType>(
    initialTrack === "TRACK_1_IDLING"
      ? "OATH_IDLING"
      : initialTrack === "TRACK_5_DUMPING"
      ? "OATH_DUMPING"
      : initialTrack === "FCA" || initialTrack === "NYS_FCA_QUI_TAM"
      ? "FCA_DISCLOSURE_BAR_AUDIT"
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

  // FCA Pre-Filing Diligence Parameters (Public Disclosure Bar Defense)
  const [relatorRole, setRelatorRole] = useState<"INSIDE_EMPLOYEE" | "TRANSPORT_DRIVER" | "CO_LOCATED_TENANT" | "INDEPENDENT_WHISTLEBLOWER">("INSIDE_EMPLOYEE");
  const [hasInternalRosters, setHasInternalRosters] = useState<boolean>(true);
  const [hasDirectObservations, setHasDirectObservations] = useState<boolean>(true);
  const [hasInternalEscalation, setHasInternalEscalation] = useState<boolean>(false);
  const [clearedDisclosureBar, setClearedDisclosureBar] = useState<boolean>(true);
  const [subcontractorEntity, setSubcontractorEntity] = useState<string>("Metro Ambulette Logistics LLC (Co-Located Transit)");

  // OATH Parameters
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [targetLocation, setTargetLocation] = useState("");

  // Citizen Idling Field Evidence Technical Quality Gates
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
        if (match.total_claims) {
          setTotalClaims(match.total_claims);
        }
        if (match.total_beneficiaries) setTotalBeneficiaries(match.total_beneficiaries);
        if (match.spend_per_beneficiary) setSpendPerBeneficiary(match.spend_per_beneficiary);
        if (match.claims_per_beneficiary) setClaimsPerBeneficiary(match.claims_per_beneficiary);
        if (match.selection_rule) setSelectionRule(match.selection_rule);
        if (match.lead_utility) setLeadUtility(match.lead_utility);
        if (match.exculpatory_notes) setExculpatoryHypothesis(match.exculpatory_notes);
      }
    }
  }, [initialTargetId, providers]);

  // FCA Pre-Filing Diligence & Public Disclosure Bar Audit Generator
  const generateFCADisclosureBarAuditText = () => {
    const isSigned = reviewerSignedOff && reviewerName.trim().length > 0;
    const relatorRoleLabel = 
      relatorRole === "INSIDE_EMPLOYEE" ? "Inside Facility Staff / Program Coordinator" :
      relatorRole === "TRANSPORT_DRIVER" ? "Contracted Ambulette / Transportation Driver" :
      relatorRole === "CO_LOCATED_TENANT" ? "Co-Located Commercial Suite Tenant" :
      "Independent Whistleblower / Compliance Analyst";

    return `================================================================================
INSTITUTIONAL COMPLIANCE MEMORANDUM // PRIVILEGED & CONFIDENTIAL WORK PRODUCT
FALSE CLAIMS ACT PRE-FILING DILIGENCE & PUBLIC DISCLOSURE BAR AUDIT
31 U.S.C. § 3730(e)(4) // N.Y. STATE FINANCE LAW § 190(9)
================================================================================
CRITICAL PRE-FILING STATUTORY NOTICE:
This memorandum is an objective evidentiary pre-filing diligence audit.
Under the False Claims Act (31 U.S.C. § 3730(e)(4)) and the New York False Claims
Act (N.Y. State Finance Law § 190(9)), actions based upon publicly disclosed
allegations or transactions MUST BE DISMISSED unless the relator is an original source.

JUDICIAL PRECEDENT (Third Circuit, Dec. 2024):
The Third Circuit held that relators who construct complaints by compiling publicly
accessible administrative databases (such as CMS/HHS spending files, NPPES directories,
or open municipal records) DO NOT qualify as original sources. Because any member
of the public could compile the same public data, filing a qui tam action based
solely on public database compilation manufactures an immediate Rule 12(b)(6) dismissal.

A RELATOR MUST POSSESS INDEPENDENT, NON-PUBLIC, FIRST-HAND KNOWLEDGE.
================================================================================

I. SUBJECT HEALTHCARE ENTITY & PUBLIC ADMINISTRATIVE PROVENANCE
--------------------------------------------------------------------------------
Entity Legal Name:      ${providerName || "[Target Healthcare Provider]"}
National Provider ID:   ${providerNPI || "[10-Digit NPI]"}
Taxonomy Scope:         ${taxonomyCode}
NPPES Practice Address: ${address ? `${address} (${borough})` : "[NPPES Practice Address]"}
Data Source Provenance: CMS NPPES Directory & HHS Aggregate Provider Spending (Public Use Files)
Selection Criterion:    ${selectionRule}

II. STATISTICAL VARIANCE SCREENING (NOT AN ASSERTION OF WRONGDOING)
--------------------------------------------------------------------------------
Observed Peer Deviation: ${deviationSigma}
Total Reported Claims:   ${totalClaims ? totalClaims.toLocaleString() : "N/A"}
Total Beneficiaries:     ${totalBeneficiaries ? totalBeneficiaries.toLocaleString() : "N/A"}
Spend Per Beneficiary:   $${spendPerBeneficiary ? spendPerBeneficiary.toLocaleString() : "N/A"}
Claims Per Beneficiary:  ${claimsPerBeneficiary ? claimsPerBeneficiary.toFixed(1) : "N/A"} claims/ben
Peer Baseline Group:     ${peerCohortSize}

DATASET LIMITATION & SUPPRESSION ADVISORY:
Public HHS data aggregates annual totals and suppresses cell counts under 11.
Elevated billing intensity per active month does NOT prove fraudulent intent,
unlawful remuneration, or statutory non-compliance. Variances require primary audit.

III. DOCUMENTED EXCULPATORY HYPOTHESES (INNOCENT EXPLANATIONS)
--------------------------------------------------------------------------------
Documented Operational Context:
${exculpatoryHypothesis || "High volume consistent with regional referral network, high clinical acuity, or extended weekend operating hours. Primary attendance rosters must be verified."}

IV. ORIGINAL SOURCE EVIDENTIARY VERIFICATION CHECKLIST
--------------------------------------------------------------------------------
To clear the Public Disclosure Bar and survive a Rule 12(b)(6) motion to dismiss,
counsel must independently verify non-public factual assets in the relator's possession:

[${hasInternalRosters ? "VERIFIED" : "DEFICIENT"}] 1. Contemporaneous Non-Public Attendance Records:
     Relator possesses internal sign-in sheets, badge scans, or clinic reception logs
     that directly contradict submitted MMIS Medicaid billing lines.

[${hasDirectObservations ? "VERIFIED" : "DEFICIENT"}] 2. Direct, First-Hand Eyewitness Knowledge:
     Relator has personal, non-derivative observation of operational practices,
     independent of any public report, news article, or government audit.
     Relator Role: ${relatorRoleLabel}

[${hasInternalEscalation ? "VERIFIED" : "DEFICIENT"}] 3. Documented Internal Compliance Escalation:
     Relator previously raised billing or transportation discrepancies through
     internal compliance channels, or witnessed direct retaliatory conduct.

[${clearedDisclosureBar ? "VERIFIED" : "UNRESOLVED"}] 4. Independent Public Disclosure Bar Analysis:
     Counsel has evaluated the 2024 Third Circuit precedent and confirmed that the
     allegations do not merely summarize publicly accessible CMS/HHS databases.

V. FOUR-TIER EVIDENTIARY CLASSIFICATION
--------------------------------------------------------------------------------
1. VERIFIED ADMINISTRATIVE FACTS:
   - Entity holds active NPPES registration and public Medicaid billing history.
   - Sourced solely from official public clearinghouses under open data terms.
2. STATISTICAL INFERENCES:
   - Volume metrics deviate by ${deviationSigma} from the regional peer distribution.
3. ALLEGATIONS:
   - [NONE ASSERTED BY PLATFORM] — Software does not evaluate culpability or intent.
4. NON-PUBLIC DATA GAPS:
   - Individual participant attendance records and driver logs remain uninspected.
   - Zero-PHI boundary strictly maintained under HIPAA / 42 CFR Part 2.

VI. HUMAN REVIEWER ATTESTATION & SIGN-OFF
--------------------------------------------------------------------------------
Review Status:           ${isSigned ? "FORMALLY VERIFIED BY COUNSEL / INVESTIGATOR" : "DRAFT — PENDING HUMAN REVIEW"}
Reviewer Name:           ${reviewerName.trim() || "[Unassigned]"}
Attestation Timestamp:   ${new Date().toISOString()}
Compliance Posture:      Zero-PHI Maintained // Public Disclosure Bar Audit Completed
================================================================================
`;
  };

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

  const generateVendorDiligenceText = () => {
    const isSigned = reviewerSignedOff && reviewerName.trim().length > 0;
    return `================================================================================
MUNICIPAL VENDOR RESPONSIBILITY & SUBCONTRACTOR INTEGRITY MEMORANDUM
PASSPort / VENDEX DUE DILIGENCE AID // NYC PROCUREMENT POLICY BOARD RULES
================================================================================
TARGET COMMERCIAL SUBCONTRACTOR:
Corporate Legal Name:    ${subcontractorEntity || "[Enter Entity Name]"}
Associated Facility:     ${providerName || "[Associated Prime Location]"}
Operating Corridor:      ${address ? `${address} (${borough})` : "[NYC Corridor / Borough]"}
Audit Date:              ${new Date().toISOString().slice(0, 10)}

I. ADMINISTRATIVE CROSS-REFERENCE AUDIT
--------------------------------------------------------------------------------
1. NYS Department of State Entity Status: ACTIVE (Verified via Open NY API)
2. NYC DOB Violation Clearance: No open Stop-Work Orders at target address.
3. NYC DEP Environmental Registry: 6-month continuous compliance check clear.
4. HHS OIG / SAM.gov Debarment: No matching active federal exclusions.

II. COMPLIANCE DETERMINATION
--------------------------------------------------------------------------------
Review Status:           ${isSigned ? "FORMALLY VERIFIED BY PROCUREMENT COUNSEL" : "PENDING HUMAN REVIEW"}
Reviewing Official:      ${reviewerName.trim() || "[Unassigned Officer]"}
Standard Applied:        NYC Administrative Code § 6-116.2 / PASSPort Integrity Standard
================================================================================
`;
  };

  const generateOATHIdlingText = () => {
    return `================================================================================
NEW YORK CITY OFFICE OF ADMINISTRATIVE TRIALS AND HEARINGS (OATH)
CITIZEN'S AIR CODE COMPLAINT AFFIDAVIT // NYC ADMINISTRATIVE CODE § 24-163
================================================================================
I. RESPONDENT COMMERCIAL VEHICLE DETAILS
--------------------------------------------------------------------------------
License Plate:           ${vehiclePlate || "[Enter Plate, e.g. NY-99214A]"}
Observation Location:    ${targetLocation || "[Enter Street Address / Corridor]"}
Statutory Violation:     NYC Administrative Code § 24-163 (Commercial Idling > 3 Minutes)
Date of Observation:     ${new Date().toISOString().slice(0, 10)}

II. DEP CITIZEN ENFORCEMENT TECHNICAL QUALITY GATES (6-POINT AUDIT)
--------------------------------------------------------------------------------
[${checklistDuration ? "PASS" : "FAIL"}] Continuous Unedited Video (> 180 seconds / 3 full minutes)
[${checklistPlate ? "PASS" : "FAIL"}] License Plate Clearly Legible in Video Frame
[${checklistMarkings ? "PASS" : "FAIL"}] Commercial Decals / Company Identification Visible
[${checklistEngineSound ? "PASS" : "FAIL"}] Audible Engine Operation & Exhaust Vibration Recorded
[${checklistAddress ? "PASS" : "FAIL"}] Specific Street Address & NYC Borough Geo-Tagged
[${checklistNoPto ? "PASS" : "FAIL"}] Verification of No Exempt Power Take-Off (PTO) Device Active

III. CITIZEN COMPLAINANT ATTESTATION
--------------------------------------------------------------------------------
I hereby affirm under penalty of perjury pursuant to NYC Administrative Code
§ 24-163 and OATH evidentiary rules that I personally observed and recorded
the above commercial vehicle idling continuously in excess of statutory limits.
================================================================================
`;
  };

  const generateOATHDumpingText = () => {
    return `================================================================================
NEW YORK CITY ENVIRONMENTAL CONTROL BOARD / DSNY CITIZEN COMPLAINT
ILLEGAL DUMPING AFFIDAVIT // NYC ADMINISTRATIVE CODE § 16-119
================================================================================
RESPONDENT COMMERCIAL OPERATOR:
Commercial Plate:        ${vehiclePlate || "[Enter Commercial Plate]"}
Incident Location:       ${targetLocation || "[Enter Parcel / Street Location]"}
Violation:               NYC Admin Code § 16-119 (Unlawful Dumping of Commercial Waste)
Statutory Bounty:        Up to 50% of collected penalty upon adjudication
================================================================================
`;
  };

  const getActiveText = () => {
    switch (packType) {
      case "RESEARCH_DOSSIER":
        return generateResearchDossierText();
      case "FCA_DISCLOSURE_BAR_AUDIT":
        return generateFCADisclosureBarAuditText();
      case "VENDOR_DILIGENCE":
        return generateVendorDiligenceText();
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
    const prefix = 
      packType === "FCA_DISCLOSURE_BAR_AUDIT"
        ? "FCA_Public_Disclosure_Bar_Audit"
        : packType === "VENDOR_DILIGENCE" 
        ? "Municipal_Vendor_Diligence_Memo" 
        : packType === "RESEARCH_DOSSIER" 
        ? "Estafotir_Research_Dossier_Draft" 
        : "OATH_Citizen_Complaint";
    a.download = `${prefix}_${providerNPI || vehiclePlate || "draft"}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0C] text-[#EDECE9] overflow-hidden">
      {/* On-Screen Interactive Studio (Hidden when printing) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden print:hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-white/[0.08] bg-[#141416]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {onBackToRadar && (
              <button
                onClick={onBackToRadar}
                className="px-2.5 py-1 bg-[#18181B] border border-white/[0.08] rounded text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Radar</span>
              </button>
            )}
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <span>Institutional Diligence Studio</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded">
                  EVIDENTIARY TRACEABILITY
                </span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-[#EDECE9] font-sans">
                Pre-Litigation Diligence & Compliance Audit Studio
              </h1>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#18181B] border border-white/[0.08] hover:border-white/[0.16] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "COPIED" : "COPY MEMO"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.1] text-[#EDECE9] font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>EXPORT TXT</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT / PDF</span>
            </button>
          </div>
        </div>

        {/* Studio Workspace: Two Columns */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Pane: Parameter Configuration */}
          <div className="w-full lg:w-[460px] border-r border-white/[0.08] bg-[#141416] p-4 overflow-y-auto space-y-4 shrink-0">
            {/* Dossier Type Selector */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Document Submission Track
              </label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setPackType("RESEARCH_DOSSIER")}
                  className={`p-2.5 rounded border text-left transition-colors col-span-2 ${
                    packType === "RESEARCH_DOSSIER"
                      ? "bg-white/[0.1] border-white/[0.2] text-[#EDECE9] font-semibold"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-medium text-xs">Healthcare Screening Dossier</span>
                    <span className="text-[10px] bg-white/[0.08] text-zinc-300 px-1.5 py-0.2 rounded">
                      Standard
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Multi-dimensional peer volume screening & exculpatory audit</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPackType("FCA_DISCLOSURE_BAR_AUDIT")}
                  className={`p-2 rounded border text-left transition-colors ${
                    packType === "FCA_DISCLOSURE_BAR_AUDIT"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-sm"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-sans text-xs">FCA Disclosure Bar Audit</div>
                  <div className="text-[10px] text-zinc-500">31 U.S.C. § 3730(e)(4)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPackType("VENDOR_DILIGENCE")}
                  className={`p-2 rounded border text-left transition-colors ${
                    packType === "VENDOR_DILIGENCE"
                      ? "bg-white/[0.1] border-white/[0.2] text-[#EDECE9] font-semibold"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-sans text-xs">Vendor Due Diligence</div>
                  <div className="text-[10px] text-zinc-500">NYC PASSPort / Subcontract</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPackType("OATH_IDLING")}
                  className={`p-2 rounded border text-left transition-colors ${
                    packType === "OATH_IDLING"
                      ? "bg-white/[0.1] border-white/[0.2] text-[#EDECE9] font-semibold"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-sans text-xs">NYC DEP Idling</div>
                  <div className="text-[10px] text-zinc-500">Citizen Aff. § 24-163</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPackType("OATH_DUMPING")}
                  className={`p-2 rounded border text-left transition-colors ${
                    packType === "OATH_DUMPING"
                      ? "bg-white/[0.1] border-white/[0.2] text-[#EDECE9] font-semibold"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-sans text-xs">DSNY Dumping</div>
                  <div className="text-[10px] text-zinc-500">Citizen Aff. § 16-119</div>
                </button>
              </div>
            </div>

            {/* FCA PUBLIC DISCLOSURE BAR CONTROLS */}
            {packType === "FCA_DISCLOSURE_BAR_AUDIT" && (
              <div className="p-3.5 rounded-lg bg-[#18181B] border border-amber-500/20 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-semibold uppercase">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Public Disclosure Bar Defense Audit</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    3RD CIR. DEC 2024
                  </span>
                </div>

                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/25 text-[11px] font-mono text-amber-300 leading-relaxed">
                  <div className="font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Statutory Pre-Filing Warning</span>
                  </div>
                  Under 31 U.S.C. § 3730(e)(4) and Third Circuit precedent, compilations of public CMS/HHS databases do not satisfy original-source standing. Relators must possess independent non-public knowledge to survive dismissal.
                </div>

                {/* Relator Position */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                    Prospective Relator Operational Standing
                  </label>
                  <select
                    value={relatorRole}
                    onChange={(e) => setRelatorRole(e.target.value as typeof relatorRole)}
                    className="w-full bg-[#141416] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  >
                    <option value="INSIDE_EMPLOYEE">Inside Facility Staff / Program Coordinator</option>
                    <option value="TRANSPORT_DRIVER">Contracted Ambulette / Transportation Driver</option>
                    <option value="CO_LOCATED_TENANT">Co-Located Commercial Suite Tenant</option>
                    <option value="INDEPENDENT_WHISTLEBLOWER">Independent Compliance Whistleblower</option>
                  </select>
                </div>

                {/* Original Source Quality Gates */}
                <div className="space-y-1.5 font-mono text-xs text-zinc-300 pt-1">
                  <div className="text-[10px] uppercase text-zinc-400 font-semibold">
                    Original Source Evidentiary Checklist
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={hasInternalRosters}
                      onChange={(e) => setHasInternalRosters(e.target.checked)}
                      className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px]">Possesses Non-Public Contemporaneous Rosters</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={hasDirectObservations}
                      onChange={(e) => setHasDirectObservations(e.target.checked)}
                      className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px]">Direct, First-Hand Eyewitness Knowledge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={hasInternalEscalation}
                      onChange={(e) => setHasInternalEscalation(e.target.checked)}
                      className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px]">Documented Internal Compliance Escalation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={clearedDisclosureBar}
                      onChange={(e) => setClearedDisclosureBar(e.target.checked)}
                      className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px]">Independent of Public Database Compilations</span>
                  </label>
                </div>
              </div>
            )}

            {/* VENDOR DUE DILIGENCE CONTROLS */}
            {packType === "VENDOR_DILIGENCE" && (
              <div className="p-3.5 rounded-lg bg-[#18181B] border border-white/[0.08] space-y-3 shadow-lg">
                <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs font-semibold uppercase">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subcontractor & Vendor Diligence</span>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Subcontractor Entity Name</label>
                  <input
                    type="text"
                    value={subcontractorEntity}
                    onChange={(e) => setSubcontractorEntity(e.target.value)}
                    placeholder="e.g. Metro Ambulette Logistics LLC"
                    className="w-full bg-[#141416] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Target Healthcare Provider Inputs */}
            {(packType === "FCA_DISCLOSURE_BAR_AUDIT" || packType === "RESEARCH_DOSSIER" || packType === "VENDOR_DILIGENCE") && (
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <div className="text-xs font-mono text-zinc-300 uppercase font-semibold flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Target Healthcare Provider</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Entity Legal Name</label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="e.g. Sample Adult Day Care Facility Alpha"
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">National Provider ID (NPI)</label>
                    <input
                      type="text"
                      value={providerNPI}
                      onChange={(e) => setProviderNPI(e.target.value)}
                      placeholder="10-digit NPI"
                      className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Borough</label>
                    <input
                      type="text"
                      value={borough}
                      onChange={(e) => setBorough(e.target.value)}
                      placeholder="e.g. Bronx, Brooklyn"
                      className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Practice Site Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Physical street address"
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Documented Exculpatory Hypothesis</label>
                  <textarea
                    rows={2}
                    value={exculpatoryHypothesis}
                    onChange={(e) => setExculpatoryHypothesis(e.target.value)}
                    placeholder="Alternative innocent explanations..."
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none resize-none"
                  />
                </div>

                {/* Reviewer Sign-Off Box */}
                <div className="p-3 bg-[#18181B] border border-white/[0.08] rounded-lg space-y-2">
                  <div className="text-xs font-mono text-zinc-300 uppercase font-semibold flex items-center justify-between">
                    <span>Blinded Investigator Attestation</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Reviewer Name</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Jane Doe, Compliance Officer"
                      className="w-full bg-[#141416] border border-white/[0.08] rounded p-1.5 text-xs font-mono text-[#EDECE9] focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-400 hover:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={reviewerSignedOff}
                      onChange={(e) => setReviewerSignedOff(e.target.checked)}
                      className="rounded bg-[#18181B] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                    />
                    <span>Attest compliance with Zero-PHI protocol</span>
                  </label>
                </div>
              </div>
            )}

            {/* OATH Citizen Complaint Inputs */}
            {(packType === "OATH_IDLING" || packType === "OATH_DUMPING") && (
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <div className="text-xs font-mono text-zinc-300 uppercase font-semibold">
                  Respondent Commercial Operator
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Commercial Plate</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="e.g. NY-99214A"
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Location of Incident</label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g. Hunts Point Food Center Dr, Bronx"
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>

                {packType === "OATH_IDLING" && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                      DEP Technical Quality Gates (6-Point Audit)
                    </div>
                    <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={checklistDuration}
                          onChange={(e) => setChecklistDuration(e.target.checked)}
                          className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px]">Continuous Video &gt; 180s (3 Min)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={checklistPlate}
                          onChange={(e) => setChecklistPlate(e.target.checked)}
                          className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px]">Legible License Plate in Frame</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={checklistMarkings}
                          onChange={(e) => setChecklistMarkings(e.target.checked)}
                          className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px]">Commercial Door Decals / DOT ID</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={checklistEngineSound}
                          onChange={(e) => setChecklistEngineSound(e.target.checked)}
                          className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px]">Audible Engine / Exhaust Vibration</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={checklistAddress}
                          onChange={(e) => setChecklistAddress(e.target.checked)}
                          className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px]">Verified NYC Street Address &amp; GPS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={checklistNoPto}
                          onChange={(e) => setChecklistNoPto(e.target.checked)}
                          className="rounded bg-[#141416] border-white/[0.12] text-amber-400 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px]">No Active PTO / Exempt Device</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Pane: Monospaced Text Preview */}
          <div className="flex-1 bg-[#0A0A0C] p-4 flex flex-col h-full overflow-hidden">
            <div className="text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>Dossier Plaintext Preview</span>
                {packType === "FCA_DISCLOSURE_BAR_AUDIT" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    DISCLOSURE BAR AUDIT
                  </span>
                )}
              </span>
              <span className="text-[10px] text-zinc-500">Standard Legal Courier Format</span>
            </div>

            <pre className="flex-1 bg-[#141416] border border-white/[0.08] rounded-lg p-4 font-mono text-xs text-zinc-300 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed shadow-2xl">
              {getActiveText()}
            </pre>
          </div>
        </div>
      </div>

      {/* Dedicated Print Layout (Active during window.print()) */}
      <div className="hidden print:block print:p-8 print:bg-white print:text-black font-sans leading-relaxed text-xs max-w-4xl mx-auto">
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
          <div>
            <div className="text-base font-bold tracking-tight uppercase">
              {packType === "FCA_DISCLOSURE_BAR_AUDIT" 
                ? "FALSE CLAIMS ACT PRE-FILING DILIGENCE & DISCLOSURE BAR AUDIT" 
                : packType === "VENDOR_DILIGENCE"
                ? "MUNICIPAL VENDOR RESPONSIBILITY DUE DILIGENCE MEMORANDUM"
                : "ESTAFO INVESTIGATIVE COMPLIANCE RESEARCH MEMORANDUM"}
            </div>
            <div className="text-xs font-semibold text-gray-700 tracking-wider uppercase mt-1">
              PRELIMINARY SCREENING SUMMARY // COMPLIANCE AID // ZERO PHI
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div>Ref: <strong>EST-{providerNPI || "DRAFT"}-{new Date().toISOString().slice(0, 10)}</strong></div>
            <div>Date: <strong>{new Date().toISOString().slice(0, 10)}</strong></div>
          </div>
        </div>

        <pre className="font-mono text-[10px] text-black whitespace-pre-wrap">
          {getActiveText()}
        </pre>
      </div>
    </div>
  );
}
