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
  Gavel
} from "lucide-react";
import { MedicaidProviderRecord } from "@/types";

export type DossierPackType = 
  | "NYS_FCA_QUI_TAM" 
  | "RESEARCH_DOSSIER" 
  | "DOJ_WHIP_TIP" 
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
      : initialTrack === "DOJ_WHIP"
      ? "DOJ_WHIP_TIP"
      : initialTrack === "RESEARCH_DOSSIER"
      ? "RESEARCH_DOSSIER"
      : "NYS_FCA_QUI_TAM"
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

  // NYS FCA Qui Tam Parameters
  const [relatorRole, setRelatorRole] = useState<"INSIDE_EMPLOYEE" | "TRANSPORT_DRIVER" | "CO_LOCATED_TENANT" | "INDEPENDENT_ANALYST">("INSIDE_EMPLOYEE");
  const [taintedClaimsRate, setTaintedClaimsRate] = useState<number>(35); // 35%
  const [kickbackPerParticipant, setKickbackPerParticipant] = useState<number>(20); // $20 cash
  const [annualMedicaidBase, setAnnualMedicaidBase] = useState<number>(5670000); // $5.67M
  const [ambulettePartner, setAmbulettePartner] = useState<string>("Metro Ambulette Logistics LLC (Co-Located Hub)");

  // Calculations for NY FCA § 190
  const taintedAmount = Math.round(annualMedicaidBase * (taintedClaimsRate / 100));
  const trebleDamages = taintedAmount * 3;
  const estimatedTaintedClaimLines = Math.round(totalClaims * (taintedClaimsRate / 100));
  const civilPenaltiesMin = estimatedTaintedClaimLines * 6000;
  const civilPenaltiesMax = estimatedTaintedClaimLines * 12000;
  const totalExposureMin = trebleDamages + civilPenaltiesMin;
  const totalExposureMax = trebleDamages + civilPenaltiesMax;
  const relatorIntervenedMin = Math.round(totalExposureMin * 0.15);
  const relatorIntervenedMax = Math.round(totalExposureMax * 0.25);
  const relatorDeclinedMin = Math.round(totalExposureMin * 0.25);
  const relatorDeclinedMax = Math.round(totalExposureMax * 0.30);

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
          setAnnualMedicaidBase(match.total_claims * 85);
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

  // NYS FCA Qui Tam Relator Disclosure Generator
  const generateNYSFCAQuiTamText = () => {
    const isSigned = reviewerSignedOff && reviewerName.trim().length > 0;
    const relatorRoleLabel = 
      relatorRole === "INSIDE_EMPLOYEE" ? "Inside Facility Staff / Program Coordinator" :
      relatorRole === "TRANSPORT_DRIVER" ? "Ambulette / Medical Transportation Driver" :
      relatorRole === "CO_LOCATED_TENANT" ? "Co-Located Commercial Suite Tenant / Eyewitness" :
      "Independent Data Forensic Investigator (Original Source Standing)";

    return `================================================================================
SUPREME COURT OF THE STATE OF NEW YORK
COUNTY OF NEW YORK: COMMERCIAL DIVISION
--------------------------------------------------------------------------------
STATE OF NEW YORK ex rel. [PROSPECTIVE RELATOR],
                                 Plaintiffs/Relators,
             - against -
${providerName || "[TARGET HEALTHCARE ENTITY]"},
${ambulettePartner}, and
JOHN DOES 1-10 and ABC CORPS. 1-10,
                                 Defendants.
--------------------------------------------------------------------------------
CONFIDENTIAL DISCLOSURE STATEMENT OF MATERIAL EVIDENCE AND INFORMATION
SUBMITTED UNDER SEAL TO THE NEW YORK STATE ATTORNEY GENERAL
PURSUANT TO NEW YORK STATE FINANCE LAW § 190(2)
--------------------------------------------------------------------------------
WARNING: FILED STRICTLY UNDER SEAL WITH THE COURT AND ATTORNEY GENERAL ONLY.
DO NOT SERVE DEFENDANTS. PREMATURE DISCLOSURE INVALIDATES QUI TAM JURISDICTION.
================================================================================

I. JURISDICTION, VENUE & STATUTORY BASIS
--------------------------------------------------------------------------------
1. This disclosure statement is submitted pursuant to the New York False Claims Act
   ("NY FCA"), N.Y. State Finance Law §§ 187–194, specifically § 190(2), on behalf
   of the prospective Relator.
2. The State of New York is the real party in interest. Medicaid funds improperly
   disbursed to Defendants originated in part from the New York State Medicaid Program,
   administered by the New York State Department of Health (DOH) in conjunction with
   local social services districts.
3. Violations asserted arise under N.Y. State Finance Law § 189(1):
   a. § 189(1)(a): Knowingly presenting, or causing to be presented, false or
      fraudulent claims for payment or approval;
   b. § 189(1)(b): Knowingly making, using, or causing to be made or used, a false
      record or statement material to a false or fraudulent claim;
   c. § 189(1)(c): Conspiring to commit a violation of subsection (a), (b), or (g);
   d. § 189(1)(g): Knowingly concealing or improperly avoiding an obligation to pay
      or transmit money or property to the State (Reverse False Claims Act).

II. RELATOR IDENTITY, DIRECT STANDING & ORIGINAL SOURCE DEMONSTRATION
--------------------------------------------------------------------------------
Relator Classification:   ${relatorRoleLabel}
Relator Knowledge Base:   Direct, independent, and contemporaneous observations.
Original Source Status:   Relator qualifies as an "original source" under N.Y. State
                          Finance Law § 190(9)(b). Prior to any public disclosure of
                          the allegations, Relator voluntarily disclosed the information
                          to the State, possessing knowledge that is independent of and
                          materially adds to any publicly disclosed information.

III. DEFENDANTS & CORRIDOR ENTERPRISE STRUCTURE
--------------------------------------------------------------------------------
Primary Target Entity:    ${providerName || "[Target Entity Name]"}
National Provider ID:     ${providerNPI || "[10-Digit NPI]"}
Billing Scope / Taxonomy: ${taxonomyCode}
Practice Site Address:    ${address ? `${address} (${borough})` : "[Physical Practice Address]"}
Co-Conspirator Network:   ${ambulettePartner}
Cohort Selection Rule:    ${selectionRule}

IV. THE FRAUDULENT OPERATIONAL SCHEME (CONCURRENCY & THREE-WAY MATCH FAILURE)
--------------------------------------------------------------------------------
Defendants orchestrated an unlawful billing pattern characterized by:
1. GHOST ATTENDANCE BILLING:
   Billing Medicaid under HCPCS Code T2024 / H0005 for intensive full-day sessions
   where beneficiaries were either not physically present, departed within 15 minutes,
   or attended exclusively for cash kickback distributions.
2. UNLAWFUL REMUNERATION & PATIENT INDUCEMENT (KICKBACK VECTOR):
   Defendants routinely offered and paid direct cash remuneration averaging
   $${kickbackPerParticipant}.00 per visit to Medicaid beneficiaries to induce attendance and
   monopolize Medicaid identification numbers, violating N.Y. Social Services Law
   § 366-d and the federal Anti-Kickback Statute, 42 U.S.C. § 1320a-7b(b).
3. TRANSPORTATION CONCURRENCY DISCREPANCIES (THE THREE-WAY MATCH PROTOCOL):
   A systematic audit of three independent data tiers reveals irreconcilable discrepancies:
   - Tier 1: Medical Answering Services (MAS) prior authorizations and ambulette GPS drops;
   - Tier 2: Physical facility sign-in rosters and badge reception records;
   - Tier 3: Medicaid Management Information System (MMIS) claims paid.

V. PRELIMINARY DAMAGES ESTIMATE & STATUTORY CIVIL PENALTIES
--------------------------------------------------------------------------------
Baseline Annual Medicaid Billing:    $${annualMedicaidBase.toLocaleString()}
Estimated Tainted Claim Ratio:       ${taintedClaimsRate}%
Actual Single Loss to State:         $${taintedAmount.toLocaleString()}
MANDATORY TREBLE DAMAGES (3X):       $${trebleDamages.toLocaleString()} (N.Y. State Finance Law § 189(1))
Estimated Tainted Claim Lines:       ${estimatedTaintedClaimLines.toLocaleString()} claim lines
Statutory Penalties ($6,000–$12,000): $${civilPenaltiesMin.toLocaleString()} – $${civilPenaltiesMax.toLocaleString()}
TOTAL STATE STATUTORY RECOVERY:      $${totalExposureMin.toLocaleString()} – $${totalExposureMax.toLocaleString()}

VI. STATUTORY RELATOR RECOVERY VALUATION
--------------------------------------------------------------------------------
Under N.Y. State Finance Law § 190(6):
1. INTERVENED ACTION (15% to 25% Share):
   If the Attorney General elects to intervene and proceed with the action:
   Projected Relator Bounty: $${relatorIntervenedMin.toLocaleString()} – $${relatorIntervenedMax.toLocaleString()}
2. DECLINED ACTION (25% to 30% Share):
   If the Attorney General declines and Relator conducts the action through counsel:
   Projected Relator Bounty: $${relatorDeclinedMin.toLocaleString()} – $${relatorDeclinedMax.toLocaleString()}
3. Mandatory Costs & Attorney Fees:
   Relator is entitled to reasonable expenses, attorneys' fees, and costs under § 190(6).

VII. STRICT UNDER-SEAL PROTOCOL & WHISTLEBLOWER PROTECTIONS
--------------------------------------------------------------------------------
1. SEAL REQUIREMENT (N.Y. State Finance Law § 190(2)(b)):
   The Summons and Complaint must be filed in camera and remain under seal for at
   least 60 days. No service shall be made on the Defendants until the seal is lifted.
2. STATUTORY ANTI-RETALIATION (N.Y. State Finance Law § 191):
   Relators are protected by state law against discharge, demotion, suspension,
   threats, harassment, or discrimination. Relief includes reinstatement, two times
   back pay, interest, special damages, and attorneys' fees.
3. ZERO-PHI BOUNDARY:
   In strict compliance with 42 CFR Part 2 and HIPAA, this memorandum contains zero
   protected health information (PHI) or patient names.

VIII. ATTESTATION & REVIEW STATUS
--------------------------------------------------------------------------------
Review Status:            ${isSigned ? "FORMALLY VERIFIED BY COUNSEL / REVIEWER" : "PRELIMINARY DRAFT // PENDING COUNSEL REVIEW"}
Executing Reviewer:       ${reviewerName.trim() || "[Unassigned Whistleblower Counsel]"}
Attestation Timestamp:    ${new Date().toISOString()}
Filing Division:          NYS Attorney General MFCU // 28 Liberty St, New York, NY
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

  const generateDOJTipText = () => {
    const isSigned = reviewerSignedOff && reviewerName.trim().length > 0;
    return `================================================================================
DOJ CRIMINAL FRAUD ENFORCEMENT DIVISION // CONFIDENTIAL TIP SUBMISSION DRAFT
PILOT PROGRAM REWARD INTAKE MEMORANDUM // 31 U.S.C. § 3730 / AMERICA.GOV/FRAUD
================================================================================
NOTICE TO WHISTLEBLOWER COUNSEL & INVESTIGATIVE EVALUATORS:
This document is a confidential research and tip preparation intake memorandum formatted
for submission to the U.S. Department of Justice Criminal Fraud Enforcement Division.
It establishes an original-source factual baseline for review under the DOJ Whistleblower
Rewards Pilot Program (discretionary $10,000–$30,000 fee upon filing of unsealed criminal charges).
================================================================================

I. TARGET HEALTHCARE PROVIDER & OPERATIONAL IDENTITY
--------------------------------------------------------------------------------
Subject Legal Entity:    ${providerName || "[Not Specified / Pending Input]"}
National Provider ID:    ${providerNPI || "[Enter 10-Digit NPI]"}
Billing Taxonomy:        ${taxonomyCode}
Primary Practice Site:   ${address ? `${address} (${borough})` : "[Enter Corridor / Address]"}
Cohort Selection Rule:   ${selectionRule}

II. VERIFIED PUBLIC SPENDING BASELINE & INTENSITY ANOMALIES
--------------------------------------------------------------------------------
Total Reported Claims:   ${totalClaims ? totalClaims.toLocaleString() : "Pending Ingestion"}
Total Beneficiaries:     ${totalBeneficiaries ? totalBeneficiaries.toLocaleString() : "Pending Ingestion"}
Spend Per Beneficiary:   $${spendPerBeneficiary ? spendPerBeneficiary.toLocaleString() : "N/A"}
Claims Per Beneficiary:  ${claimsPerBeneficiary ? claimsPerBeneficiary.toFixed(1) : "N/A"} claims/ben
Peer Cohort Context:     ${peerCohortSize}
Observed Peer Deviation: ${deviationSigma}

III. CONCURRENCY & THREE-WAY CROSS-VERIFICATION STANDARD
--------------------------------------------------------------------------------
To clear the False Claims Act Public Disclosure Bar and establish criminal intent,
investigators must review non-public contemporaneous records across three independent tiers:
  1. Transportation Authorization Tier: Medical Answering Services (MAS) prior authorizations.
  2. Physical Attendance Tier: Daily clinic sign-in rosters and badge reception records.
  3. Submitted Medicaid Claim Tier: MMIS claim lines for T2024 or group counseling.

PRIMARY DISCREPANCY HYPOTHESIS FOR OFFICIAL INQUIRY:
Determine whether Medicaid reimbursed transportation claims and clinical sessions
for individuals who were either not physically present, present for under 15 minutes,
or visiting co-located commercial entities.

IV. BLINDED INVESTIGATOR REVIEW STATUS
--------------------------------------------------------------------------------
Review Status:           ${isSigned ? "COMPLETED REVIEW" : "DRAFT — PENDING HUMAN REVIEW"}
Reviewer Name:           ${reviewerName.trim() || "[Unassigned]"}
Attestation Date:        ${new Date().toISOString().slice(0, 10)}
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
      case "NYS_FCA_QUI_TAM":
        return generateNYSFCAQuiTamText();
      case "RESEARCH_DOSSIER":
        return generateResearchDossierText();
      case "DOJ_WHIP_TIP":
        return generateDOJTipText();
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
      packType === "NYS_FCA_QUI_TAM"
        ? "NYS_FCA_Section190_QuiTam_Disclosure"
        : packType === "DOJ_WHIP_TIP" 
        ? "DOJ_WHIP_Tip_Intake" 
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
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <span>Legal Weaponizer // Qui Tam & Enforcement Studio</span>
                <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded">
                  NYS FINANCE LAW § 190
                </span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-[#EDECE9] font-sans">
                Qui Tam Disclosure & Enforcement Filing Studio
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
                  onClick={() => setPackType("NYS_FCA_QUI_TAM")}
                  className={`p-2.5 rounded border text-left transition-colors col-span-2 ${
                    packType === "NYS_FCA_QUI_TAM"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-sm"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-medium text-xs">NY FCA § 190 Qui Tam</span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30">
                      15%–30% Share
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">MFCU Sealed Relator Disclosure Memo</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPackType("RESEARCH_DOSSIER")}
                  className={`p-2 rounded border text-left transition-colors ${
                    packType === "RESEARCH_DOSSIER"
                      ? "bg-white/[0.1] border-white/[0.2] text-[#EDECE9] font-semibold"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-sans text-xs">Healthcare Screening</div>
                  <div className="text-[10px] text-zinc-500">Research Dossier</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPackType("DOJ_WHIP_TIP")}
                  className={`p-2 rounded border text-left transition-colors ${
                    packType === "DOJ_WHIP_TIP"
                      ? "bg-white/[0.1] border-white/[0.2] text-[#EDECE9] font-semibold"
                      : "bg-[#18181B] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-sans text-xs">DOJ Criminal Tip</div>
                  <div className="text-[10px] text-zinc-500">Pilot Reward Memo</div>
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
                  <div className="text-[10px] text-zinc-500">Track 1 Citizen Aff.</div>
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
                  <div className="text-[10px] text-zinc-500">Track 5 Citizen Aff.</div>
                </button>
              </div>
            </div>

            {/* NYS FCA QUI TAM DEDICATED CONTROLS */}
            {packType === "NYS_FCA_QUI_TAM" && (
              <div className="p-3.5 rounded-lg bg-[#18181B] border border-amber-500/20 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-semibold uppercase">
                    <Gavel className="w-3.5 h-3.5" />
                    <span>NYS Qui Tam Bounty Calculator</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    TREBLE DAMAGES
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#141416] border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-500 block">Treble Damages (3x)</span>
                    <span className="text-sm font-semibold text-[#EDECE9]">${(trebleDamages / 1_000_000).toFixed(2)}M</span>
                  </div>
                  <div className="p-2 rounded bg-[#141416] border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-500 block">Civil Penalties</span>
                    <span className="text-sm font-semibold text-[#EDECE9]">${(civilPenaltiesMin / 1_000_000).toFixed(1)}M–${(civilPenaltiesMax / 1_000_000).toFixed(1)}M</span>
                  </div>
                </div>

                {/* Relator Bounty Range Badge */}
                <div className="p-2.5 rounded bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 font-mono">
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                    <span>Intervened Share (15%–25%):</span>
                    <span className="text-amber-300 font-bold">${(relatorIntervenedMin / 1_000_000).toFixed(2)}M – ${(relatorIntervenedMax / 1_000_000).toFixed(2)}M</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>Declined Share (25%–30%):</span>
                    <span className="text-emerald-400 font-bold">${(relatorDeclinedMin / 1_000_000).toFixed(2)}M – ${(relatorDeclinedMax / 1_000_000).toFixed(2)}M</span>
                  </div>
                </div>

                {/* Relator Category Input */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                    Prospective Relator Standing / Position
                  </label>
                  <select
                    value={relatorRole}
                    onChange={(e) => setRelatorRole(e.target.value as typeof relatorRole)}
                    className="w-full bg-[#141416] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  >
                    <option value="INSIDE_EMPLOYEE">Inside Facility Staff / Program Coordinator</option>
                    <option value="TRANSPORT_DRIVER">Ambulette / Medical Transportation Driver</option>
                    <option value="CO_LOCATED_TENANT">Co-Located Commercial Suite Tenant</option>
                    <option value="INDEPENDENT_ANALYST">Independent Data Forensic Investigator (Original Source)</option>
                  </select>
                </div>

                {/* Tainted Claims Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>Estimated Tainted Claims Ratio</span>
                    <span className="text-amber-300 font-semibold">{taintedClaimsRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={taintedClaimsRate}
                    onChange={(e) => setTaintedClaimsRate(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Kickback per Participant and Annual Base Billing */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                      Cash Kickback / Visit ($)
                    </label>
                    <input
                      type="number"
                      value={kickbackPerParticipant}
                      onChange={(e) => setKickbackPerParticipant(Number(e.target.value))}
                      className="w-full bg-[#141416] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                      Annual Medicaid Base ($)
                    </label>
                    <input
                      type="number"
                      value={annualMedicaidBase}
                      onChange={(e) => setAnnualMedicaidBase(Number(e.target.value))}
                      className="w-full bg-[#141416] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Co-Conspirator Ambulette Fleet */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                    Named Ambulette / Transport Co-Conspirator
                  </label>
                  <input
                    type="text"
                    value={ambulettePartner}
                    onChange={(e) => setAmbulettePartner(e.target.value)}
                    placeholder="e.g. Metro Ambulette Logistics LLC"
                    className="w-full bg-[#141416] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Target Healthcare Provider Inputs */}
            {(packType === "NYS_FCA_QUI_TAM" || packType === "RESEARCH_DOSSIER" || packType === "DOJ_WHIP_TIP") && (
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
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">NPI (10 Digits)</label>
                    <input
                      type="text"
                      value={providerNPI}
                      onChange={(e) => setProviderNPI(e.target.value)}
                      placeholder="e.g. 1948291024"
                      className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Borough</label>
                    <input
                      type="text"
                      value={borough}
                      onChange={(e) => setBorough(e.target.value)}
                      placeholder="e.g. Queens"
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
                    placeholder="e.g. 136-20 Roosevelt Ave, Flushing, NY 11354"
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Annual Medicaid Base Billing ($)</label>
                  <input
                    type="number"
                    value={annualMedicaidBase}
                    onChange={(e) => setAnnualMedicaidBase(Number(e.target.value))}
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
                </div>

                {/* Reviewer Sign-Off Box */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Investigator Attestation
                  </div>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Reviewer Name / Bar # / Investigator ID"
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded p-2 text-xs font-mono text-[#EDECE9] focus:outline-none"
                  />
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
                {packType === "NYS_FCA_QUI_TAM" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    SEALED RELATOR DISCLOSURE
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
              {packType === "NYS_FCA_QUI_TAM" 
                ? "NEW YORK FALSE CLAIMS ACT § 190 RELATOR DISCLOSURE STATEMENT" 
                : "ESTAFO INVESTIGATIVE COMPLIANCE RESEARCH MEMORANDUM"}
            </div>
            <div className="text-xs font-semibold text-gray-700 tracking-wider uppercase mt-1">
              {packType === "NYS_FCA_QUI_TAM"
                ? "CONFIDENTIAL UNDER SEAL // SUBMITTED TO NYS ATTORNEY GENERAL MFCU"
                : "PRELIMINARY SCREENING SUMMARY // COMPLIANCE AID"}
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
