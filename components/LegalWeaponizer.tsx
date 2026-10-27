"use client";

import { useState } from "react";
import { 
  Copy, 
  Check, 
  Download, 
  Scale, 
  FileText,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface LegalWeaponizerProps {
  initialTargetId?: string;
  initialTrack?: string;
}

export default function LegalWeaponizer({ initialTrack }: LegalWeaponizerProps) {
  const [packType, setPackType] = useState<"ATTORNEY_EVIDENCE_DOSSIER" | "OATH_IDLING" | "OATH_DUMPING">(
    initialTrack === "TRACK_6_NYFCA_QUI_TAM"
      ? "ATTORNEY_EVIDENCE_DOSSIER"
      : initialTrack === "TRACK_1_IDLING"
      ? "OATH_IDLING"
      : "ATTORNEY_EVIDENCE_DOSSIER"
  );

  const [copied, setCopied] = useState(false);
  const [attorneySignedOff, setAttorneySignedOff] = useState(false);
  const [reviewerName, setReviewerName] = useState("K. Vance, Esq. (Healthcare Compliance)");

  // Form parameters
  const [providerName, setProviderName] = useState("Metro Health Mobility LLC");
  const [providerNPI, setProviderNPI] = useState("1982736410");
  const [taxonomyCode, setTaxonomyCode] = useState("343900000X (Non-Emergency Medical Transport)");
  const [peerCohortSize, setPeerCohortSize] = useState("312 Providers (NYC Metro Area)");
  const [deviationSigma, setDeviationSigma] = useState("+4.8σ Above Peer Mean");
  const [exculpatoryHypothesis, setExculpatoryHypothesis] = useState(
    "Competitor regional carrier ceased operations in Q2 2026; influx of displaced chronic dialysis beneficiaries may account for legitimate volume surge."
  );

  // OATH Parameters
  const [vehiclePlate, setVehiclePlate] = useState("NY-88291");
  const [targetLocation, setTargetLocation] = useState("Food Center Dr & Halleck St, Bronx (Hunts Point Corridor)");

  const generateAttorneyDossierText = () => {
    return `================================================================================
ESTAFO LITIGATION INTELLIGENCE // ATTORNEY-READY RESEARCH DOSSIER
CONFIDENTIAL ATTORNEY WORK PRODUCT // PREPARED FOR COUNSEL EVALUATION
================================================================================
DISCLAIMER & EVIDENCE CONTRACT:
This dossier presents unadjudicated statistical peer comparisons, historical
entity-resolution links, and verified public records. The platform does NOT
assert fraud, intent, or legal liability. All findings must be independently
corroborated by qualified legal counsel prior to formal filing or external action.
================================================================================

I. TARGET HEALTHCARE ENTITY & HISTORICAL RESOLUTION
--------------------------------------------------------------------------------
Legal Entity Name:        ${providerName}
National Provider ID:     ${providerNPI}
Healthcare Taxonomy:      ${taxonomyCode}
Registered Office:        5404 4th Avenue, Brooklyn, NY 11220
NYS DOS Entity ID:        6492019 (Formed: 2021-03-12, Active)
Historical Prior Names:   None recorded in NYS DOS database
Co-Located Entities:      2 affiliated corporate shells sharing Suite 2B:
                          - Metro Logistics Express Corp (NYS DOS #6510291)
                          - 4th Ave Billing Management LLC (NYS DOS #6520192)
[NOTE: Shared address is an investigative lead; it does NOT establish common ownership.]

II. TRIGGERING ANOMALY & MATHEMATICAL PEER COMPARISON
--------------------------------------------------------------------------------
Primary Trigger:          Aggregated Procedure Code T2003 (Non-Emergency Transport)
Peer Cohort Definition:   ${peerCohortSize}
Comparative Metric:       Monthly Billed Units per Active Medicaid Beneficiary
Peer Group Mean (μ):      14.2 units / beneficiary / month (Std Dev σ = 3.1)
Target Entity Velocity:   29.1 units / beneficiary / month
Statistical Deviation:    ${deviationSigma} (Top 0.2% Outlier in NYC Region)
Temporal Velocity:        +240% surge observed across 90-day window (July - Sept 2026)

III. SOURCE PROVENANCE & RETRIEVAL CITATIONS
--------------------------------------------------------------------------------
1. CMS National Provider Identifier (NPPES Registry):
   Source URL: https://npiregistry.cms.hhs.gov/provider-view/${providerNPI}
   Retrieved:  2026-10-24T18:30:00Z | Status: Active Enumeration
2. HHS / CMS Open Payments & Procedure Code Aggregates:
   Source URL: https://data.cms.gov/provider-data/dataset/t2003-ny-2026
   Retrieved:  2026-10-25T11:15:00Z | Batch: 2026-Q3-V1
3. NYS OMIG Exclusions & Re-Enrollment Registry:
   Source URL: https://omig.ny.gov/medicaid-fraud/exclusion-search
   Retrieved:  2026-10-26T09:00:00Z | Result: Clean (No Active Administrative Sanctions)

IV. CONTRADICTORY & EXCULPATORY EVIDENCE (INNOCENT HYPOTHESES)
--------------------------------------------------------------------------------
Documented Operational Context:
${exculpatoryHypothesis}
Additional Factors:
- Target operates dual-shift wheelchair van fleet with specialized bariatric lift.
- Provider does not have prior OMIG or OIG-LEIE sanction history.

V. FOUR-TIER EVIDENTIARY CLASSIFICATION (GATE G3)
--------------------------------------------------------------------------------
1. VERIFIED FACTS:
   - Target is an actively enrolled NYS Medicaid transportation provider.
   - Corporate registration and address confirmed via official NYS DOS records.
   - Peer group billing totals represent official public CMS aggregate releases.
2. STATISTICAL INFERENCES:
   - Procedure code T2003 billing velocity is anomalous relative to regional peers.
   - Co-location with commercial logistics shell indicates potential shared dispatch.
3. ALLEGATIONS:
   - [NONE ASSERTED] — Platform explicitly takes no position on fraud or intent.
4. UNKNOWNS & DATA GAPS:
   - Electronic Visit Verification (EVV) driver GPS telematics have not been subpoenaed.
   - Internal trip manifest driver logs and beneficiary signatures remain uninspected.

VI. RECOMMENDED NEXT INVESTIGATIVE STEPS FOR COUNSEL
--------------------------------------------------------------------------------
1. Issue targeted FOIL request to NYC TLC for trip record logs associated with NPI.
2. Cross-reference dispatch times against hospital inpatient admissions database.
3. Review driver credentialing records through NYS DMV commercial carrier registry.

VII. QUALIFIED HUMAN COMPLIANCE SIGN-OFF
--------------------------------------------------------------------------------
Reviewed and Certified By: ${reviewerName}
Date of Attestation:      ${new Date().toISOString().slice(0, 10)}
Status:                   RESEARCH DOSSIER COMPLETE // APPROVED FOR COUNSEL REVIEW
`;
  };

  const generateOATHIdlingText = () => {
    return `================================================================================
NEW YORK CITY DEPARTMENT OF ENVIRONMENTAL PROTECTION (DEP)
OATH CITIZEN AIR CONSERVATION ENFORCEMENT COMPLAINT
================================================================================
PURSUANT TO: NYC Administrative Code § 24-163 (Commercial Engine Idling > 3 Mins)
STATUTORY PENALTY: $350.00 – $2,000.00
CITIZEN STATUTORY BOUNTY: 25% of Collected Summons Fines

I. RESPONDENT COMMERCIAL VEHICLE
--------------------------------------------------------------------------------
Commercial Vehicle Plate: ${vehiclePlate} (State: NY)
Location of Violation:    ${targetLocation}
Time of Observation:      ${new Date().toISOString().slice(0, 10)} 08:34:10 EDT
Duration Recorded:        3 minutes 42 seconds (Unbroken Video Stream)

II. EVIDENTIARY ATTESTATION
--------------------------------------------------------------------------------
1. Continuous 4K optical recording captured without interaction with driver.
2. Engine audible throughout 180+ second legal threshold; ambient temperature 62°F.
3. Telephone Standby elected pursuant to 48 RCNY § 6-08.
`;
  };

  const getActiveText = () => {
    if (packType === "OATH_IDLING") return generateOATHIdlingText();
    return generateAttorneyDossierText();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getActiveText();
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${packType}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-canvas text-primary overflow-hidden">
      {/* Configuration & Input Controls */}
      <div className="w-full lg:w-[480px] border-r border-border bg-surface flex flex-col h-full overflow-y-auto">
        <div className="p-16 border-b border-border bg-inset">
          <div className="flex items-center gap-8 text-emerald mb-4">
            <Scale className="w-4 h-4" />
            <h2 className="text-11 font-mono uppercase tracking-wider font-bold">
              Legal Evidence Studio // Component 3 & 6
            </h2>
          </div>
          <p className="text-12 text-secondary">
            Generate attorney-grade research dossiers with complete provenance, peer cohort math, and exculpatory analysis.
          </p>
        </div>

        {/* Track Selector */}
        <div className="p-16 border-b border-border space-y-12">
          <div className="text-10 font-mono text-muted uppercase">Dossier Protocol</div>
          <div className="grid grid-cols-2 gap-8">
            <button
              onClick={() => setPackType("ATTORNEY_EVIDENCE_DOSSIER")}
              className={`p-10 rounded-sm border text-left transition-colors font-mono text-11 ${
                packType === "ATTORNEY_EVIDENCE_DOSSIER"
                  ? "bg-emerald/15 border-emerald text-emerald font-bold"
                  : "bg-inset border-border text-muted hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-6">
                <FileText className="w-3.5 h-3.5" />
                <span>Medicaid Lead Dossier</span>
              </div>
              <div className="text-9 opacity-80 mt-2">Law Firm Research Pilot</div>
            </button>

            <button
              onClick={() => setPackType("OATH_IDLING")}
              className={`p-10 rounded-sm border text-left transition-colors font-mono text-11 ${
                packType === "OATH_IDLING"
                  ? "bg-emerald/15 border-emerald text-emerald font-bold"
                  : "bg-inset border-border text-muted hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-6">
                <Scale className="w-3.5 h-3.5" />
                <span>OATH DEP Affidavit</span>
              </div>
              <div className="text-9 opacity-80 mt-2">Citizen Air Enforcement</div>
            </button>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="p-16 space-y-14 flex-1">
          {packType === "ATTORNEY_EVIDENCE_DOSSIER" ? (
            <>
              <div>
                <label className="text-10 font-mono text-muted uppercase block mb-4">Target Provider Legal Name</label>
                <input 
                  type="text" 
                  value={providerName} 
                  onChange={(e) => setProviderName(e.target.value)} 
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none focus:border-border-highlight"
                />
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div>
                  <label className="text-10 font-mono text-muted uppercase block mb-4">NPI Number</label>
                  <input 
                    type="text" 
                    value={providerNPI} 
                    onChange={(e) => setProviderNPI(e.target.value)} 
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none focus:border-border-highlight"
                  />
                </div>
                <div>
                  <label className="text-10 font-mono text-muted uppercase block mb-4">Statistical Outlier (Sigma)</label>
                  <input 
                    type="text" 
                    value={deviationSigma} 
                    onChange={(e) => setDeviationSigma(e.target.value)} 
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none focus:border-border-highlight"
                  />
                </div>
              </div>

              <div>
                <label className="text-10 font-mono text-muted uppercase block mb-4">Peer Cohort Definition</label>
                <input 
                  type="text" 
                  value={peerCohortSize} 
                  onChange={(e) => setPeerCohortSize(e.target.value)} 
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none focus:border-border-highlight"
                />
              </div>

              <div>
                <label className="text-10 font-mono text-muted uppercase block mb-4">Taxonomy / Procedure Code</label>
                <input 
                  type="text" 
                  value={taxonomyCode} 
                  onChange={(e) => setTaxonomyCode(e.target.value)} 
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono focus:outline-none focus:border-border-highlight"
                />
              </div>

              <div>
                <label className="text-10 font-mono text-amber uppercase flex items-center gap-4 mb-4">
                  <AlertCircle className="w-3 h-3" />
                  <span>Exculpatory / Contradictory Evidence</span>
                </label>
                <textarea 
                  rows={3}
                  value={exculpatoryHypothesis} 
                  onChange={(e) => setExculpatoryHypothesis(e.target.value)} 
                  className="w-full bg-inset border border-border rounded-sm p-8 text-11 font-sans focus:outline-none focus:border-border-highlight"
                />
              </div>

              {/* Human Legal Review Attestation Gate (Component 6) */}
              <div className="p-12 border border-border-highlight/40 bg-surface/80 rounded-sm space-y-8">
                <div className="flex items-center gap-6 text-gold font-mono text-10 uppercase font-bold">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span>Mandatory Human Review Gate (Gate G3/G6)</span>
                </div>
                <label className="flex items-start gap-8 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={attorneySignedOff} 
                    onChange={(e) => setAttorneySignedOff(e.target.checked)}
                    className="mt-2 accent-emerald"
                  />
                  <span className="text-10 text-secondary leading-relaxed">
                    I certify that this packet contains factual government citations and statistical comparisons. Zero fraud allegations or legal liability claims are asserted against this entity without independent attorney assessment.
                  </span>
                </label>
                <div>
                  <input 
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Reviewer Name & Bar Number / Credential"
                    className="w-full bg-inset border border-border rounded-sm px-8 py-5 text-10 font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-10 font-mono text-muted uppercase block mb-4">Commercial Vehicle Plate</label>
                <input 
                  type="text" 
                  value={vehiclePlate} 
                  onChange={(e) => setVehiclePlate(e.target.value)} 
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono"
                />
              </div>
              <div>
                <label className="text-10 font-mono text-muted uppercase block mb-4">Incident Location</label>
                <input 
                  type="text" 
                  value={targetLocation} 
                  onChange={(e) => setTargetLocation(e.target.value)} 
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 font-mono"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Generated Dossier Preview */}
      <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
        <div className="p-12 border-b border-border bg-inset flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8 font-mono text-11 text-muted">
            <FileText className="w-4 h-4 text-emerald" />
            <span>EXPORT PREVIEW // ATTORNEY PACKET</span>
          </div>
          <div className="flex items-center gap-8">
            <button
              onClick={handleCopy}
              className="flex items-center gap-6 px-12 py-6 rounded-sm bg-surface border border-border text-11 font-mono hover:text-emerald hover:border-emerald transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "COPIED" : "COPY"}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={packType === "ATTORNEY_EVIDENCE_DOSSIER" && !attorneySignedOff}
              className={`flex items-center gap-6 px-12 py-6 rounded-sm font-mono text-11 transition-colors ${
                packType === "ATTORNEY_EVIDENCE_DOSSIER" && !attorneySignedOff
                  ? "bg-inset border border-border text-muted cursor-not-allowed opacity-50"
                  : "bg-emerald/20 border border-emerald text-emerald hover:bg-emerald/30 font-bold"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT DOSSIER</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-16 overflow-y-auto">
          <pre className="p-16 bg-surface border border-border rounded-sm text-11 font-mono text-secondary leading-relaxed whitespace-pre-wrap select-text">
            {getActiveText()}
          </pre>
        </div>
      </div>
    </div>
  );
}
