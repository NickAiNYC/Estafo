"use client";

import { useState } from "react";
import { 
  Copy, 
  Check, 
  Download, 
  Scale, 
  FileText
} from "lucide-react";

interface LegalWeaponizerProps {
  initialTargetId?: string;
  initialTrack?: string;
}

export default function LegalWeaponizer({ initialTrack }: LegalWeaponizerProps) {
  const [packType, setPackType] = useState<"OATH_DUMPING" | "OATH_IDLING" | "NYFCA_QUI_TAM">(
    initialTrack === "TRACK_6_NYFCA_QUI_TAM"
      ? "NYFCA_QUI_TAM"
      : initialTrack === "TRACK_1_IDLING"
      ? "OATH_IDLING"
      : "OATH_DUMPING"
  );

  const [copied, setCopied] = useState(false);

  // Form parameters
  const [vehiclePlate, setVehiclePlate] = useState("NY-88291");
  const [vehicleState, setVehicleState] = useState("NY");
  const [targetLocation, setTargetLocation] = useState("Maspeth Creek Industrial Choke (40.7185, -73.9242)");
  const [targetDate, setTargetDate] = useState("2026-10-24 23:42:10");
  const [videoHash, setVideoHash] = useState("sha256:7f9a2b89c4d1e028b17409f9821a");
  const [providerName, setProviderName] = useState("Apex Community Care & Day Services");
  const [providerNPI, setProviderNPI] = useState("1942008812");
  const [relatorSharePct] = useState("25%");
  const [exposureEstimate, setExposureEstimate] = useState("$14,200,000");

  const generateOATHDumpingText = () => {
    return `================================================================================
NEW YORK CITY OFFICE OF ADMINISTRATIVE TRIALS AND HEARINGS (OATH)
ENVIRONMENTAL CONTROL BOARD / DSNY CITIZEN ENFORCEMENT AFFIDAVIT
================================================================================
PURSUANT TO: NYC Administrative Code § 16-119 (Unlawful Commercial Dumping)
STATUTORY PENALTY: Up to $18,000.00
STATUTORY BOUNTY CLAIM: 50% of Collected Fines (§ 16-119(e))

I. RESPONDENT & VEHICLE IDENTIFICATION
--------------------------------------------------------------------------------
Commercial Vehicle Plate: ${vehiclePlate} (State: ${vehicleState})
Vehicle Classification: Commercial Heavy Dump Body / Hauler
Corporate Shell / Registered Owner: Tri-Borough Transport Holdings LLC
Observed Incident Location: ${targetLocation}
Date & Time of Observation: ${targetDate} EDT

II. EVIDENTIARY SUBMISSION & INTEGRITY ATTESTATION
--------------------------------------------------------------------------------
1. Photographic and continuous video evidence was captured in real-time by a
   certified citizen observer without physical interaction or contact with the
   operator of the vehicle.
2. The continuous video record depicts the unauthorized unloading and dumping
   of commercial demolition debris onto NYC municipal property / vacant industrial zone.
3. DIGITAL FORENSIC HASH:
   ${videoHash}
   (Integrity validated; metadata headers intact; unaltered timestamp stream).

III. MANDATORY TELEPHONE STANDBY DECLARATION (48 RCNY § 6-08)
--------------------------------------------------------------------------------
Pursuant to OATH evidentiary guidelines, the citizen complainant hereby exercises
the right to APPEAR VIA TELEPHONE STANDBY on the scheduled hearing date.
Direct contact information has been verified with DSNY Enforcement Unit.

IV. AFFIRMATION UNDER PENALTY OF PERJURY
--------------------------------------------------------------------------------
I affirm under penalty of perjury under the laws of the State of New York that
the foregoing statements are true and accurate based upon firsthand observation
and authenticated recording.

Date of Filing: ${new Date().toISOString().slice(0, 10)}
Vanguard Automated Evidence Packager // OMNI-NYC Operations
`;
  };

  const generateOATHIdlingText = () => {
    return `================================================================================
NEW YORK CITY DEPARTMENT OF ENVIRONMENTAL PROTECTION (DEP)
OATH CITIZEN AIR CONSERVATION ENFORCEMENT COMPLAINT
================================================================================
PURSUANT TO: NYC Administrative Code § 24-163 (Commercial Engine Idling > 3 Mins)
STATUTORY PENALTY: $350.00 – $2,000.00 (Escalating for Repeat Fleets)
STATUTORY BOUNTY CLAIM: 50% Citizen Reward (OATH Citizen Filing)

I. RESPONDENT COMMERCIAL VEHICLE
--------------------------------------------------------------------------------
Commercial Vehicle Plate: ${vehiclePlate} (State: ${vehicleState})
Fleet / Markings: Commercial Transport Hauler
Location: ${targetLocation}
Time of Continuous Idling: ${targetDate} EDT
Duration Recorded: 3 minutes 42 seconds (Unbroken Video Record)

II. CERTIFICATION OF ENGINE NOISE & EXHAUST
--------------------------------------------------------------------------------
1. Video file clearly captures continuous audible engine sound and visible exhaust.
2. No active loading or unloading was occurring during the observation period.
3. Forensically Authenticated SHA-256 Hash:
   ${videoHash}

III. TELEPHONE STANDBY ELECTION
--------------------------------------------------------------------------------
Complainant certifies telephone standby availability pursuant to 48 RCNY § 6-08.
Direct testimony will be provided by phone if respondent contests violation.

Filing Source: Vanguard Tactical Enforcement Unit
`;
  };

  const generateNYFCAQuiTamText = () => {
    return `================================================================================
CONFIDENTIAL RELATOR DISCLOSURE MEMORANDUM
SUBMITTED PURSUANT TO:
  - New York State False Claims Act (NYS State Finance Law § 189 et seq.)
  - Federal False Claims Act (31 U.S.C. § 3729 et seq.)
================================================================================
NOTICE: FILED UNDER SEAL // FOR EVALUATION BY NY ATTORNEY GENERAL & US DOJ ONLY
STATUTORY RELATOR RECOVERY: 15% to 30% of Total Recovery (§ 190(6))

I. TARGET HEALTHCARE ENTITY
--------------------------------------------------------------------------------
Entity Name: ${providerName}
National Provider Identifier (NPI): ${providerNPI}
Primary Address: 136-20 38th Ave, Flushing, NY 11354
Medicaid / Managed Care Network: New York State Medicaid & MLTC Networks

II. STATEMENT OF SYSTEMIC FRAUDULENT CLAIMS
--------------------------------------------------------------------------------
1. PHANTOM ATTENDANCE & KICKBACK SCHEMES:
   Target entity bills New York Medicaid for comprehensive adult day health care
   and CDPAP home care services while beneficiaries are either not present,
   hospitalized, or receiving cash rebates ($40-$60/day) in exchange for card swipes.
   
2. IMPOSSIBLE SHIFT PATTERNS (24-HR OVERLAP):
   Automated claim analysis identifies 48 individual personal assistants billing
   simultaneous 24-hour shifts across multiple fiscal intermediaries, generating
   over 30 billable hours in single 24-hour calendar days.

3. CORRELATION WITH COMMERCIAL FLEET & CORPORATE SHELL:
   Corporate registration records reveal common beneficial ownership between
   target healthcare entity and unlicensed freight logistics haulers cited for
   municipal code violations in industrial transit corridors.

III. STATUTORY DAMAGES & CIVIL PENALTIES ESTIMATE
--------------------------------------------------------------------------------
Total Identified False Claims Exposure: ${exposureEstimate}
Treble Damages (3x under NYFCA § 189(1)): $42,600,000.00
Civil Penalties ($13,508 – $27,018 per false claim): Est. $8,400,000.00
TOTAL STATUTORY DEMAND: $51,000,000.00
ESTIMATED RELATOR BOUNTY (${relatorSharePct}): ~$12,750,000.00

Submitted by: Confidential Whistleblower Relator Team
Under Counsel Representation (NYFCA § 190 Protocol)
`;
  };

  const getActiveText = () => {
    if (packType === "OATH_DUMPING") return generateOATHDumpingText();
    if (packType === "OATH_IDLING") return generateOATHIdlingText();
    return generateNYFCAQuiTamText();
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
    element.download = `${packType.toLowerCase()}_filing_pack.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-canvas text-primary overflow-hidden">
      {/* Left Form Editor */}
      <div className="w-full lg:w-[420px] border-b lg:border-b-0 lg:border-r border-border bg-surface p-20 flex flex-col overflow-y-auto shrink-0 space-y-16">
        <div>
          <div className="flex items-center gap-8 mb-4">
            <Scale className="w-4 h-4 text-amber" />
            <span className="text-11 font-mono text-muted uppercase tracking-wider">
              Automated Legal Weaponizer
            </span>
          </div>
          <h2 className="text-18 font-bold font-jakarta text-primary">
            Citizen & Qui Tam Filing Studio
          </h2>
          <p className="text-12 font-outfit text-muted mt-2">
            Auto-generate legally authenticated OATH citizen summonses and DOJ False Claims Act relator memos with statutory citations.
          </p>
        </div>

        {/* Filing Type Tabs */}
        <div className="space-y-6">
          <label className="text-11 font-mono text-muted uppercase">Select Action Doctrine</label>
          <div className="grid grid-cols-3 gap-6">
            <button
              onClick={() => setPackType("OATH_DUMPING")}
              className={`py-8 px-6 text-11 font-mono rounded-sm border text-center transition-all ${
                packType === "OATH_DUMPING"
                  ? "bg-amber/20 border-amber text-amber font-bold"
                  : "bg-inset border-border text-muted hover:text-secondary"
              }`}
            >
              DSNY Dump ($9k)
            </button>
            <button
              onClick={() => setPackType("OATH_IDLING")}
              className={`py-8 px-6 text-11 font-mono rounded-sm border text-center transition-all ${
                packType === "OATH_IDLING"
                  ? "bg-steel-blue/20 border-steel-blue text-steel-blue font-bold"
                  : "bg-inset border-border text-muted hover:text-secondary"
              }`}
            >
              Idling (50%)
            </button>
            <button
              onClick={() => setPackType("NYFCA_QUI_TAM")}
              className={`py-8 px-6 text-11 font-mono rounded-sm border text-center transition-all ${
                packType === "NYFCA_QUI_TAM"
                  ? "bg-red/20 border-red text-red font-bold"
                  : "bg-inset border-border text-muted hover:text-secondary"
              }`}
            >
              NYFCA Qui Tam
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="space-y-12 font-mono text-12">
          {packType !== "NYFCA_QUI_TAM" ? (
            <>
              <div>
                <label className="text-11 text-muted uppercase block mb-4">Target Vehicle Plate</label>
                <div className="flex gap-8">
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="flex-1 bg-inset border border-border rounded-sm px-10 py-6 text-primary focus:outline-none focus:border-amber"
                  />
                  <input
                    type="text"
                    value={vehicleState}
                    onChange={(e) => setVehicleState(e.target.value)}
                    className="w-16 bg-inset border border-border rounded-sm px-10 py-6 text-center text-primary focus:outline-none focus:border-amber"
                  />
                </div>
              </div>

              <div>
                <label className="text-11 text-muted uppercase block mb-4">Observation Location</label>
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-primary focus:outline-none focus:border-amber"
                />
              </div>

              <div>
                <label className="text-11 text-muted uppercase block mb-4">Observation Timestamp</label>
                <input
                  type="text"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-primary focus:outline-none focus:border-amber"
                />
              </div>

              <div>
                <label className="text-11 text-muted uppercase block mb-4">Digital Hash (SHA-256)</label>
                <input
                  type="text"
                  value={videoHash}
                  onChange={(e) => setVideoHash(e.target.value)}
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 text-muted focus:outline-none focus:border-amber"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-11 text-muted uppercase block mb-4">Provider / Facility Name</label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-primary focus:outline-none focus:border-red"
                />
              </div>

              <div>
                <label className="text-11 text-muted uppercase block mb-4">National Provider ID (NPI)</label>
                <input
                  type="text"
                  value={providerNPI}
                  onChange={(e) => setProviderNPI(e.target.value)}
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-primary focus:outline-none focus:border-red"
                />
              </div>

              <div>
                <label className="text-11 text-muted uppercase block mb-4">Estimated Fraud Exposure</label>
                <input
                  type="text"
                  value={exposureEstimate}
                  onChange={(e) => setExposureEstimate(e.target.value)}
                  className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-primary focus:outline-none focus:border-red"
                />
              </div>
            </>
          )}
        </div>

        {/* Doctrine Notice Box */}
        <div className="p-12 rounded-sm bg-canvas border border-border text-11 font-outfit text-muted space-y-4">
          <div className="font-mono text-primary font-bold flex items-center gap-6">
            <Scale className="w-3.5 h-3.5 text-amber" />
            <span>VANGUARD GOLDEN RULE</span>
          </div>
          <p>
            Report to government only — never contact violators. Rewards pay only after fines are collected. Telephone standby election preserves time.
          </p>
        </div>
      </div>

      {/* Right: Live Formatted Legal Preview */}
      <div className="flex-1 flex flex-col bg-canvas overflow-hidden">
        {/* Preview Toolbar */}
        <div className="p-14 border-b border-border bg-surface/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8 text-12 font-mono">
            <FileText className="w-4 h-4 text-amber" />
            <span className="text-primary font-bold">Filing Draft Preview</span>
            <span className="text-muted">· Ready for OATH / AG Whistleblower Submission</span>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={handleCopy}
              className="px-12 py-6 bg-surface hover:bg-surface-hover border border-border text-11 font-mono rounded-sm flex items-center gap-6 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
              <span>{copied ? "Copied" : "Copy Formatted Text"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-12 py-6 bg-amber hover:bg-amber/90 text-canvas font-mono font-bold text-11 rounded-sm flex items-center gap-6 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Legal Packet</span>
            </button>
          </div>
        </div>

        {/* Document Editor / Preview Body */}
        <div className="flex-1 p-24 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-inset border border-border rounded-sm p-24 shadow-2xl">
            <pre className="font-mono text-12.5 text-secondary leading-relaxed whitespace-pre-wrap select-text">
              {getActiveText()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
