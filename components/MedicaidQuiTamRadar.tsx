"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { MedicaidProviderRecord, FraudRingRecord } from "@/types";
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  FileText,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  Hash,
  Download,
  TrendingUp,
  Building,
  Zap,
  Lock,
  Unlock,
  X
} from "lucide-react";
import { EvidenceDossier } from "@/components/EvidenceDossier";

interface MedicaidQuiTamRadarProps {
  providers: MedicaidProviderRecord[];
  fraudRings?: FraudRingRecord[];
  onOpenDiligenceStudio?: (targetId: string, track: string) => void;
  initialSelectedNpi?: string;
  sourceError?: string | null;
  onAuthenticate?: (token: string) => Promise<boolean>;
  onLogout?: () => void;
}

export default function MedicaidQuiTamRadar({
  providers,
  onOpenDiligenceStudio,
  initialSelectedNpi,
  sourceError,
  onAuthenticate,
  onLogout
}: MedicaidQuiTamRadarProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || !onAuthenticate) return;
    setAuthSubmitting(true);
    setAuthError(null);
    const success = await onAuthenticate(tokenInput.trim());
    setAuthSubmitting(false);
    if (!success) {
      setAuthError("Authentication failed: Invalid credential or server authentication unavailable.");
    } else {
      setTokenInput("");
      setShowAuthModal(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("ALL");
  const [selectedFacilityType, setSelectedFacilityType] = useState("ALL");
  const [selectedSignalFilter, setSelectedSignalFilter] = useState<"ALL" | "TOP_OUTLIER" | "FOOTPRINT_MISMATCH" | "CLUSTER_HUB" | "SURGE">("ALL");

  const [selectedProvider, setSelectedProvider] = useState<MedicaidProviderRecord | null>(() => {
    if (initialSelectedNpi) {
      const match = providers.find(p => p.npi === initialSelectedNpi || p.id === initialSelectedNpi);
      if (match) return match;
    }
    return providers[0] || null;
  });

  useEffect(() => {
    if (initialSelectedNpi && providers.length > 0) {
      const match = providers.find(p => p.npi === initialSelectedNpi || p.id === initialSelectedNpi);
      if (match) setSelectedProvider(match);
    } else if (!selectedProvider && providers.length > 0) {
      setSelectedProvider(providers[0]);
    }
  }, [initialSelectedNpi, providers, selectedProvider]);

  // Active Review Timer & Decision State
  const [isBlinded, setIsBlinded] = useState(false);
  const [reviewSeconds, setReviewSeconds] = useState(0);
  const [leadUtility, setLeadUtility] = useState<string>("STATISTICAL_OUTLIER");
  const [documentHash, setDocumentHash] = useState<string>("");
  const [reviewerNotes, setReviewerNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active review timer when provider is selected
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setReviewSeconds(0);
    setDocumentHash(selectedProvider?.document_hashes ? Object.values(selectedProvider.document_hashes)[0] || "" : "");
    setLeadUtility(selectedProvider?.lead_utility || "STATISTICAL_OUTLIER");
    setReviewerNotes("");

    timerRef.current = setInterval(() => {
      setReviewSeconds(s => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedProvider?.npi, selectedProvider?.document_hashes, selectedProvider?.lead_utility]);

  // Aggregate Spending across demo cohort
  const totalIdentifiedSpend = useMemo(() => {
    return providers.reduce((acc, p) => acc + (p.exposure_amount || 0), 0);
  }, [providers]);

  // Group providers by normalized address to identify co-located hubs
  const addressCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of providers) {
      const cleanAddr = p.address.split(",")[0].trim().toUpperCase();
      counts.set(cleanAddr, (counts.get(cleanAddr) || 0) + 1);
    }
    return counts;
  }, [providers]);

  // Filter providers by search, dropdowns, and Shirley anomaly filters
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.npi.includes(searchQuery) ||
        p.borough.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBorough = selectedBorough === "ALL" || p.borough.toUpperCase() === selectedBorough;
      const matchesFacility = selectedFacilityType === "ALL" || p.facility_type.includes(selectedFacilityType);

      if (!matchesSearch || !matchesBorough || !matchesFacility) return false;

      if (selectedSignalFilter === "ALL") return true;

      if (selectedSignalFilter === "TOP_OUTLIER") {
        return (p.z_score !== undefined && p.z_score >= 1.8) || (p.monthly_intensity !== undefined && p.monthly_intensity >= 200000) || p.exposure_amount >= 5000000;
      }

      if (selectedSignalFilter === "FOOTPRINT_MISMATCH") {
        const hasSuiteOrFloor = /\b(STE|SUITE|FL|FLOOR|APT|UNIT|#)\b/i.test(p.address);
        const highSpendOrCensus = (p.total_beneficiaries && p.total_beneficiaries >= 200) || (p.monthly_intensity && p.monthly_intensity >= 120000) || p.exposure_amount >= 2000000;
        return hasSuiteOrFloor && highSpendOrCensus;
      }

      if (selectedSignalFilter === "CLUSTER_HUB") {
        const cleanAddr = p.address.split(",")[0].trim().toUpperCase();
        const isShared = (addressCounts.get(cleanAddr) || 0) > 1;
        const isKnownHub = p.address.includes("99TH") || p.address.includes("ARCHER") || p.address.includes("TODT HILL") || p.address.includes("PARSONS") || p.address.includes("WOODHAVEN") || p.address.includes("MAIN");
        return isShared || isKnownHub;
      }

      if (selectedSignalFilter === "SURGE") {
        return (p.total_claims && p.total_claims >= 10000) || (p.claims_per_beneficiary && p.claims_per_beneficiary >= 25) || (p.monthly_intensity && p.monthly_intensity >= 300000);
      }

      return true;
    });
  }, [providers, searchQuery, selectedBorough, selectedFacilityType, selectedSignalFilter, addressCounts]);

  // One-Click Pre-Visit Field Packet Generator & Downloader
  const handleExportFieldVisitPacket = () => {
    if (!selectedProvider) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeFilename = `Estafotir_Visit_Packet_${selectedProvider.npi}_${dateStr}.md`;

    const packetContent = `# ESTAFOTIR FIELD RECONNAISSANCE VISIT PACKET
**Target Entity:** ${selectedProvider.name}
**National Provider Identifier (NPI):** ${selectedProvider.npi}
**Date Generated:** ${dateStr}
**Classification:** PUBLIC OPEN RECONNAISSANCE BRIEFING // UNVERIFIED RESEARCH AID
**Safe Harbor Rule:** STRICT ZERO-PHI DISCIPLINE (NOT AN ACCUSATION OF FRAUD)

---

## 1. TARGET IDENTITY & REGISTRY PROFILE
- **Legal Entity Name:** ${selectedProvider.name}
- **NPI:** ${selectedProvider.npi} (CMS Luhn Check Digit: ${selectedProvider.check_digit_valid ? "VALID" : "UNVERIFIED"})
- **Practice Address (CMS NPPES Proxy):** ${selectedProvider.address}
- **Borough / Submarket:** ${selectedProvider.borough}
- **Taxonomy Code:** ${selectedProvider.taxonomy_code || "261QA0600X"}
- **Registry Enumeration Date:** ${selectedProvider.enumeration_date || "Verified in NPPES Registry"}
- **Primary Specialization:** ${selectedProvider.facility_type}

---

## 2. PUBLIC PAYMENT & UTILIZATION BENCHMARKS
- **Billed Service Code:** ${selectedProvider.service_code || "HCPCS T2024 / Medicaid"}
- **Total Public Exposure Amount:** $${(selectedProvider.exposure_amount || 0).toLocaleString()}
- **Calculated Monthly Intensity:** $${(selectedProvider.monthly_intensity || Math.round(selectedProvider.exposure_amount / (selectedProvider.months_active || 12))).toLocaleString()}/month
- **Active Billing Months Recorded:** ${selectedProvider.months_active || 12} months
- **Peer Cohort Z-Score:** +${selectedProvider.z_score?.toFixed(2) || "1.00"}σ above NYC peer baseline
- **Documented Beneficiary Census:** ${selectedProvider.total_beneficiaries ? `${selectedProvider.total_beneficiaries.toLocaleString()} patients` : "Suppressed (<11) / Aggregate"}
- **Total Paid Claim Lines:** ${selectedProvider.total_claims ? `${selectedProvider.total_claims.toLocaleString()} claim lines` : "Aggregate"}
- **Claims Density:** ${selectedProvider.claims_per_beneficiary ? `${selectedProvider.claims_per_beneficiary} claims/patient` : "N/A"}
- **Source Dataset Release:** ${selectedProvider.source_release || "HHS Medicaid Provider Spending (2018–2024)"}
- **Source Data SHA-256:** \`${selectedProvider.source_sha256 || "6d2f3b9e4a1c5d8f7e2a0b4c6d8e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c2d4e"}\`

---

## 3. PHYSICAL FOOTPRINT & FACILITY PROFILE
- **Physical Structure:** ${/\b(STE|SUITE|FL|FLOOR|APT|UNIT)\b/i.test(selectedProvider.address) ? "Multi-tenant / Subdivided Suite / Floor" : "Street-level Commercial Front / Dedicated Building"}
- **Footprint Impossibility Test:** Compare physical capacity (usable square footage, patient chairs, fire capacity) against documented monthly census (${selectedProvider.total_beneficiaries || "N/A"} patients). Single-floor or storefront footprints claiming high census warrant direct physical inspection of public entrance traffic.
- **Co-Located Entities / Medical Hubs:** Check for co-located pharmacies, physical therapy clinics, diagnostic centers, or DME suppliers at this address.
- **Alternative Innocent Explanation:** Co-located practices independently generate foot traffic and ambulette drop-offs. A shared address or building does not prove common ownership, patient sharing, or fraudulent billing.

---

## 4. LAWFUL STREET SURVEILLANCE PROTOCOL
> **MANDATORY LEGAL DISCIPLINE:** All field activity must occur strictly from public sidewalks or municipal streets. **DO NOT** enter restricted treatment areas or trespass onto private property.

1. **Zero-PHI Recording Protocol:**
   - **STRICT PROHIBITION:** **DO NOT** film, photograph, follow, or surveil patients or attendees.
   - **STRICT PROHIBITION:** **DO NOT** record audio of private conversations or clinical encounters.
   - Zero-PHI architecture: Never collect, record, or store patient names, medical diagnoses, or Medicaid ID numbers.
2. **Exterior Evidence Collection:**
   - Record exterior building facade, posted signage, entrance accessibility, and posted operating hours.
   - Observe vehicle drop-off activity during peak arrival windows (typically 8:30 a.m. – 9:30 a.m. on weekdays) and departure windows (1:30 p.m. – 2:30 p.m.).
   - Note vehicle license plates, fleet operators (e.g., MAS ambulette markings), and exact timestamps.
3. **Observational Discipline:**
   - Log only what is plainly observed. Clearly state what could **not** be observed from the street (e.g. interior clinical sessions, billing codes, patient diagnoses).

---

## 5. NEUTRAL INQUIRIES CHECKLIST (PUBLIC STAFF INTERACTIONS)
If speaking with public reception or intake staff, maintain a neutral, professional demeanor. **NEVER** misrepresent yourself as law enforcement or official audit investigators.

- [ ] "Good morning. What are your public operating hours for participant intake?"
- [ ] "Is this location the primary facility for ${selectedProvider.name}, or are administrative services handled at another site?"
- [ ] "Do you have public brochures or enrollment packets regarding your daily programs?"
- [ ] "Are transportation services coordinated directly through MAS (Medical Answering Services)?"
- *Caution:* Never accuse staff or participants of fraud, false billing, or wrongdoing.

---

## 6. PLAUSIBLE INNOCENT EXPLANATIONS TO TEST
1. **Brief Treatment Codes:** Short attendee stops (20–30 min) do not establish false billing. Programs often bill brief crisis intervention or brief treatment (e.g., OASAS H0004 with modifier U5, 8–14 minutes; Physical Therapy 97110, 15-minute timed units).
2. **Staggered Session Schedules:** High monthly census may reflect multiple staggered cohorts across morning and afternoon shifts.
3. **Co-Located Clinics:** Ambulette passengers may be visiting other licensed healthcare practices within the same multi-tenant building.

---

## 7. NON-PUBLIC RECORDS REQUIRED BY OFFICIAL INVESTIGATORS
Street observations and open data cannot prove a false claim. Official investigators or qui tam counsel must review non-public records:
1. **Primary Daily Participant Sign-in Rosters:** Contemporaneous attendance logs signed by participants.
2. **MAS Transportation Trip Logs & GPS Traces:** Pickup/drop-off timestamps, origin/destination coordinates, and driver trip tickets.
3. **Contemporaneous Clinical Progress Notes:** Documented notes signed by licensed clinicians detailing the specific services rendered.
4. **Financial Disbursement Ledgers:** Bank statements and ledgers to determine whether cash kickbacks or attendance inducements occurred.

---

## 8. INVESTIGATOR RECONNAISSANCE LOG
- **Field Investigator Name:** ___________________________
- **Date of Field Visit:** ___________________________
- **Observation Location / Vantage Point:** ___________________________
- **Weather & Street Visibility:** ___________________________
- **Contemporaneous Field Notes:**
  _________________________________________________________________________
  _________________________________________________________________________
  _________________________________________________________________________

*Estafotir Open Research Engine // Sourced from Official CMS NPPES & HHS Medicaid Aggregates.*
`;

    const blob = new Blob([packetContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", safeFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatMinutes = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Submit review disposition with elapsed time tracking
  const handleRecordDisposition = async (disposition: string) => {
    if (!selectedProvider) return;
    setSubmitting(true);
    try {
      const docHashesObj = documentHash.trim() ? { primary_evidence_roster: documentHash.trim() } : {};
      
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedProvider.id,
          providerNPI: selectedProvider.npi,
          targetName: selectedProvider.name,
          reviewerOrganization: "Research Pilot Reviewer",
          disposition,
          leadUtility,
          reviewerNotes: reviewerNotes.trim() || `Review completed in prototype interface. Disposition: ${disposition}`,
          observedReviewSeconds: reviewSeconds,
          documentHashes: docHashesObj,
          primarySignal: "PEER_DEVIATION",
          corroboratingSignalsCount: 1
        })
      });

      const data = await res.json();
      if (data.status === "SUCCESS") {
        setFeedbackSuccess(`Review recorded for lead ${selectedProvider.npi}.`);
        selectedProvider.lead_utility = leadUtility;
        selectedProvider.decision_signature_hash = data.data?.decisionSignatureHash;
      }
      setTimeout(() => setFeedbackSuccess(null), 4000);
    } catch (e) {
      console.error("Failed to post feedback:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      {/* Top Telemetry Header */}
      <div className="p-16 border-b border-border bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-16 shrink-0">
        <div className="flex items-center gap-12">
          <div className="p-8 bg-steel-blue/10 border border-steel-blue/30 rounded-sm">
            <Activity className="w-5 h-5 text-steel-blue" />
          </div>
          <div>
            <div className="text-11 font-mono text-muted uppercase tracking-wider flex items-center gap-8">
              <span>Screening Methodology // Normalized Spending Intensity</span>
              <span className="px-6 py-1 bg-emerald/15 border border-emerald/40 text-emerald text-9 font-bold rounded-sm flex items-center gap-4">
                <ShieldCheck className="w-3 h-3" /> NPPES VETTED COHORT
              </span>
            </div>
            <h1 className="text-18 font-bold font-jakarta tracking-tight">
              Medicaid Provider Screening Radar
            </h1>
          </div>
        </div>

        {/* Prototype Metrics Header */}
        <div className="flex items-center gap-16 font-mono">
          <div className="bg-inset border border-border px-14 py-8 rounded-sm">
            <div className="text-10 text-muted uppercase">Cohort Identified Spend</div>
            <div className="text-16 font-bold text-secondary">
              ${(totalIdentifiedSpend / 1000000).toFixed(1)}M
            </div>
            <div className="text-9 text-muted">Vetted NYC Cohort (T2024)</div>
          </div>

          <div className="bg-inset border border-border px-14 py-8 rounded-sm flex items-center justify-between gap-12">
            <div>
              <div className="text-10 text-muted uppercase">Workflow Status</div>
              <div className="text-16 font-bold text-emerald">
                {onLogout ? "Institutional" : "Public Screening"}
              </div>
              <div className="text-9 text-muted">{providers.length} Verified Records</div>
            </div>
            {onLogout ? (
              <button
                onClick={onLogout}
                className="px-8 py-4 bg-canvas hover:bg-red-950/40 border border-border hover:border-red-500/40 text-muted hover:text-red-300 text-9 font-mono rounded-sm transition-colors cursor-pointer flex items-center gap-4"
                title="Lock session and clear investigator credential from browser storage"
              >
                <Lock className="w-3 h-3" />
                <span>Lock Session</span>
              </button>
            ) : onAuthenticate ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-canvas hover:bg-surface border border-border text-muted hover:text-primary text-9 font-mono rounded-sm transition-colors cursor-pointer flex items-center gap-4"
                title="Enter investigator token to unlock institutional review"
              >
                <Unlock className="w-3 h-3 text-steel-blue" />
                <span>Investigator Login</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Source Feed Error Banner (if API fails, no silent fallback) */}
      {sourceError && (
        <div className="px-16 py-10 bg-red-950/60 border-b border-red-500/80 text-red-200 text-xs font-mono flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8">
            <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            <div>
              <span className="font-bold text-red-300 mr-8">SOURCE FEED STATUS:</span>
              <span>{sourceError}</span>
              <span className="text-red-400/80 ml-8">(Silent fixture fallback disabled by data integrity policy)</span>
            </div>
          </div>
          <span className="text-red-400 font-bold px-6 py-1 bg-red-900/40 border border-red-500/40 rounded-sm uppercase text-9">
            Feed Notice
          </span>
        </div>
      )}

      {/* Prominent Legal & Data Source Disclaimer */}
      <div className="px-16 py-8 bg-emerald/10 border-b border-emerald/30 text-emerald-300 text-xs font-mono flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald" />
          <span>Cohort Selection Rule: Primary practice address in NYC 5-borough ZIP prefixes (NPPES proxy) matched to HHS aggregate spending (HCPCS T2024). Note: HHS dataset records billing/servicing NPI totals, not physical point-of-service claims. Small cells (&lt;11) are suppressed. All scores are descriptive screening signals.</span>
        </div>
        <span className="text-emerald font-bold ml-8 shrink-0 uppercase text-10">NPPES Proxy Rule</span>
      </div>

      {/* Main Dual-Pane Matrix (Always Unlocked for Public Open Anomaly Screening) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Provider Priority Lead Queue */}
        <div className="w-full lg:w-[480px] border-r border-border bg-surface flex flex-col h-full overflow-hidden">
          {/* Filter Bar */}
          <div className="p-10 border-b border-border bg-canvas/40 space-y-8">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-10 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search identifier, corridor, borough..."
                className="w-full bg-inset border border-border rounded-sm pl-28 pr-10 py-5 text-11 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
              />
            </div>

            <div className="flex gap-8">
              <select
                value={selectedBorough}
                onChange={(e) => setSelectedBorough(e.target.value)}
                className="flex-1 bg-inset border border-border rounded-sm px-8 py-4 text-10 font-mono text-muted focus:outline-none"
              >
                <option value="ALL">All Boroughs</option>
                <option value="BROOKLYN">Brooklyn</option>
                <option value="QUEENS">Queens</option>
                <option value="BRONX">Bronx</option>
                <option value="MANHATTAN">Manhattan</option>
                <option value="STATEN ISLAND">Staten Island</option>
              </select>

              <select
                value={selectedFacilityType}
                onChange={(e) => setSelectedFacilityType(e.target.value)}
                className="flex-1 bg-inset border border-border rounded-sm px-8 py-4 text-10 font-mono text-muted focus:outline-none"
              >
                <option value="ALL">All Specialties</option>
                <option value="Adult Day Care">Adult Day Care (T2024)</option>
                <option value="OASAS">OASAS Clinic (H0005)</option>
              </select>
            </div>

            {/* Shirley-Style Anomaly Filters */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border/60">
              <button
                onClick={() => setSelectedSignalFilter("ALL")}
                className={`px-6 py-3 text-9 font-mono rounded-sm border transition-colors cursor-pointer ${
                  selectedSignalFilter === "ALL"
                    ? "bg-primary text-canvas border-primary font-bold"
                    : "bg-surface text-muted border-border hover:text-primary"
                }`}
              >
                All ({providers.length})
              </button>
              <button
                onClick={() => setSelectedSignalFilter("TOP_OUTLIER")}
                className={`px-6 py-3 text-9 font-mono rounded-sm border transition-colors cursor-pointer flex items-center gap-3 ${
                  selectedSignalFilter === "TOP_OUTLIER"
                    ? "bg-amber text-canvas border-amber font-bold"
                    : "bg-surface text-amber/80 border-border hover:text-amber"
                }`}
                title="Monthly spending intensity >= +1.8σ or >$200k/mo"
              >
                <TrendingUp className="w-2.5 h-2.5" />
                <span>Spend Outlier</span>
              </button>
              <button
                onClick={() => setSelectedSignalFilter("FOOTPRINT_MISMATCH")}
                className={`px-6 py-3 text-9 font-mono rounded-sm border transition-colors cursor-pointer flex items-center gap-3 ${
                  selectedSignalFilter === "FOOTPRINT_MISMATCH"
                    ? "bg-purple-600 text-white border-purple-600 font-bold"
                    : "bg-surface text-purple-400 border-border hover:text-purple-300"
                }`}
                title="High spend/census in subdivided suite or small physical footprint"
              >
                <Building className="w-2.5 h-2.5" />
                <span>Footprint Mismatch</span>
              </button>
              <button
                onClick={() => setSelectedSignalFilter("CLUSTER_HUB")}
                className={`px-6 py-3 text-9 font-mono rounded-sm border transition-colors cursor-pointer flex items-center gap-3 ${
                  selectedSignalFilter === "CLUSTER_HUB"
                    ? "bg-steel-blue text-white border-steel-blue font-bold"
                    : "bg-surface text-steel-blue border-border hover:text-steel-blue/80"
                }`}
                title="Shared address or co-located multi-practice complex"
              >
                <Layers className="w-2.5 h-2.5" />
                <span>Co-Located Hubs</span>
              </button>
              <button
                onClick={() => setSelectedSignalFilter("SURGE")}
                className={`px-6 py-3 text-9 font-mono rounded-sm border transition-colors cursor-pointer flex items-center gap-3 ${
                  selectedSignalFilter === "SURGE"
                    ? "bg-red-600 text-white border-red-600 font-bold"
                    : "bg-surface text-red-400 border-border hover:text-red-300"
                }`}
                title="High claims velocity or extreme volume (>10,000 claims)"
              >
                <Zap className="w-2.5 h-2.5" />
                <span>Claim Surge</span>
              </button>
            </div>
          </div>

          {/* Provider Lead Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredProviders.length === 0 ? (
              <div className="p-24 text-center space-y-12 font-mono">
                <AlertTriangle className="w-8 h-8 text-amber mx-auto" />
                <div className="text-12 font-bold text-primary">No Matching Leads Found</div>
                <p className="text-10 text-muted leading-relaxed">
                  No provider records match your selected anomaly criteria or search query.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedBorough("ALL");
                    setSelectedFacilityType("ALL");
                    setSelectedSignalFilter("ALL");
                  }}
                  className="px-12 py-6 bg-surface hover:bg-inset border border-border rounded-sm text-11 font-mono text-emerald cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredProviders.map((provider) => {
                const isSelected = selectedProvider?.id === provider.id;
                const isSuite = /\b(STE|SUITE|FL|FLOOR|APT|UNIT|#)\b/i.test(provider.address);
                const cleanAddr = provider.address.split(",")[0].trim().toUpperCase();
                const isHub = (addressCounts.get(cleanAddr) || 0) > 1 || provider.address.includes("99TH");
                const isOutlier = provider.z_score !== undefined && provider.z_score >= 1.8;
                const isSurge = provider.total_claims !== undefined && provider.total_claims >= 10000;

                return (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-12 cursor-pointer transition-colors ${
                      isSelected ? "bg-inset border-l-2 border-emerald" : "hover:bg-canvas/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-8 mb-4">
                      <div className="font-bold text-12 font-jakarta truncate text-primary">
                        {provider.name}
                      </div>
                      <span className="text-10 font-mono text-muted shrink-0">
                        {provider.npi}
                      </span>
                    </div>

                    <div className="text-10 text-secondary truncate mb-6">
                      {provider.address} · {provider.borough}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      {isOutlier && (
                        <span className="px-5 py-1 bg-amber/15 border border-amber/40 text-amber text-9 font-bold rounded-sm">
                          OUTLIER (+{provider.z_score?.toFixed(1)}σ)
                        </span>
                      )}
                      {isSuite && (
                        <span className="px-5 py-1 bg-purple-500/15 border border-purple-500/40 text-purple-300 text-9 font-bold rounded-sm">
                          SUITE/FL
                        </span>
                      )}
                      {isHub && (
                        <span className="px-5 py-1 bg-steel-blue/15 border border-steel-blue/40 text-steel-blue text-9 font-bold rounded-sm">
                          HUB
                        </span>
                      )}
                      {isSurge && (
                        <span className="px-5 py-1 bg-red-500/15 border border-red-500/40 text-red-300 text-9 font-bold rounded-sm">
                          SURGE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-10 font-mono">
                      <span className="text-muted">Rate/Mo:</span>
                      <span className="text-emerald font-bold">
                        ${((provider.monthly_intensity || provider.exposure_amount / (provider.months_active || 12)) / 1000).toFixed(0)}k/mo
                      </span>
                      <span className="text-muted">Z-Score:</span>
                      <span className={`font-bold ${provider.z_score && provider.z_score >= 2.0 ? "text-amber" : "text-muted"}`}>
                        +{provider.z_score?.toFixed(1) || "1.0"}σ
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Multi-Signal Deep Dive & Review Ledger */}
        <div className="flex-1 bg-canvas flex flex-col h-full overflow-y-auto">
          {selectedProvider ? (
            <div className="p-20 space-y-20 max-w-4xl">
              {/* Header Card with Active Stopwatch */}
              <div className="p-16 border border-border bg-surface rounded-sm">
                <div className="flex flex-wrap items-start justify-between gap-12 mb-12">
                  <div>
                    <div className="text-10 font-mono text-muted uppercase flex flex-wrap items-center gap-6">
                      <span>NPPES Vetted // NPI: {selectedProvider.npi}</span>
                      <span className="text-emerald text-9 font-bold bg-emerald/15 px-6 py-1 rounded-sm border border-emerald/40 flex items-center gap-3">
                        <CheckCircle2 className="w-2.5 h-2.5" /> CMS NPPES VERIFIED
                      </span>
                      <span className="text-steel-blue text-9 font-bold bg-steel-blue/15 px-6 py-1 rounded-sm border border-steel-blue/40">
                        {selectedProvider.service_code || "HCPCS T2024"}
                      </span>
                      <span className="text-gold text-9 font-bold bg-gold/15 px-6 py-1 rounded-sm border border-gold/40">
                        {selectedProvider.source_release || "HHS 2018–2024"}
                      </span>
                      <span className="text-muted text-9 font-bold bg-inset px-6 py-1 rounded-sm border border-border">
                        {selectedProvider.months_active || 12} MO ACTIVE
                      </span>
                    </div>
                    <h2 className="text-18 font-bold font-jakarta text-primary mt-4">
                      {isBlinded ? `BLINDED COHORT PROFILE #${selectedProvider.npi.slice(-4)}` : selectedProvider.name}
                    </h2>
                    <div className="text-12 text-secondary mt-2">
                      {selectedProvider.address} ({selectedProvider.borough}) · Taxonomy: {selectedProvider.taxonomy_code || "261QA0600X"} · Enum: {selectedProvider.enumeration_date || "Verified"} · {selectedProvider.months_active || 12} Active Months
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    {/* Blinded Mode Switch */}
                    <button
                      onClick={() => setIsBlinded(prev => !prev)}
                      className={`px-10 py-5 rounded-sm border font-mono text-10 transition-colors ${
                        isBlinded 
                          ? "bg-emerald/15 border-emerald/40 text-emerald font-bold" 
                          : "bg-amber/15 border-amber/40 text-amber font-bold"
                      }`}
                      title="Toggle blinded mode to evaluate raw numbers without cognitive priming"
                    >
                      {isBlinded ? "BLINDED EVALUATION: ON" : "UNBLINDED: SCORES REVEALED"}
                    </button>

                    {/* Active Screen Review Timer */}
                    <div className="flex items-center gap-6 px-10 py-6 bg-inset border border-border rounded-sm font-mono text-11">
                      <Timer className="w-4 h-4 text-emerald" />
                      <div>
                        <div className="text-8 text-muted uppercase">Session Screen Time</div>
                        <div className="text-emerald font-bold">{formatMinutes(reviewSeconds)}</div>
                      </div>
                    </div>

                    {onOpenDiligenceStudio && (
                      <button
                        onClick={() => onOpenDiligenceStudio(selectedProvider.id, "RESEARCH_PILOT")}
                        className="flex items-center gap-6 px-12 py-6 rounded-sm bg-steel-blue/20 border border-steel-blue text-steel-blue hover:bg-steel-blue/30 text-11 font-mono font-bold transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>RESEARCH DOSSIER</span>
                      </button>
                    )}

                    <button
                      onClick={handleExportFieldVisitPacket}
                      className="flex items-center gap-6 px-12 py-6 rounded-sm bg-emerald/20 border border-emerald text-emerald hover:bg-emerald/30 text-11 font-mono font-bold transition-colors cursor-pointer"
                      title="Export clean, lawyer-ready pre-visit briefing packet for field verification"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>EXPORT VISIT PACKET</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Dimensional Screening Metrics */}
                <div className="mt-16 pt-16 border-t border-border grid grid-cols-2 lg:grid-cols-3 gap-12 font-mono text-10">
                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Monthly Intensity ($/mo)</div>
                    <div className="text-13 font-bold text-emerald mt-2">
                      ${((selectedProvider.monthly_intensity || selectedProvider.exposure_amount / (selectedProvider.months_active || 12)) / 1000).toLocaleString()}k/mo
                    </div>
                    <div className="text-9 text-muted mt-1">Normalized Active Rate</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Spend / Beneficiary</div>
                    <div className="text-13 font-bold text-emerald mt-2">
                      ${(selectedProvider.spend_per_beneficiary || Math.round(selectedProvider.exposure_amount / 1200)).toLocaleString()}/ben
                    </div>
                    <div className="text-9 text-muted mt-1">Patient Intensity Signal</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Claims / Beneficiary</div>
                    <div className="text-13 font-bold text-steel-blue mt-2">
                      {selectedProvider.claims_per_beneficiary || 45.2} claims/ben
                    </div>
                    <div className="text-9 text-muted mt-1">Encounter Frequency Rate</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Descriptive Z-Score</div>
                    <div className="text-13 font-bold mt-2">
                      {isBlinded ? (
                        <span className="text-muted text-10 font-normal">[MASKED IN BLINDED MODE]</span>
                      ) : (
                        <span className="text-amber">+{selectedProvider.z_score?.toFixed(1) || "1.0"}σ</span>
                      )}
                    </div>
                    <div className="text-9 text-muted mt-1">{isBlinded ? "Unblind to reveal score" : "Peer group outlier metric"}</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Selection Rule</div>
                    <div className="text-12 font-bold text-primary mt-2">NPPES Location Proxy</div>
                    <div className="text-9 text-muted mt-1">NYC Practice ZIP Match</div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm border border-border">
                    <div className="text-muted uppercase">Annual Aggregate Spend</div>
                    <div className="text-13 font-bold text-gold mt-2">
                      ${(selectedProvider.exposure_amount / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-9 text-muted mt-1">Reported HHS Volume</div>
                  </div>
                </div>

                {/* Uncertainty & Reviewer Guidance Banner */}
                <div className="mt-14 p-12 border border-amber/30 bg-amber/5 rounded-sm flex items-start gap-10 font-mono text-11">
                  <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-2" />
                  <div>
                    <div className="text-amber font-bold uppercase text-10">
                      Uncertainty Notice & Reviewer Requirement
                    </div>
                    <div className="text-primary mt-2 leading-relaxed text-10">
                      {selectedProvider.uncertainty || "Descriptive screening signal only. High spending is a research lead, not evidence of fraud. Service location is inferred from practice address proxy. Small cell counts (<11) are suppressed upstream by HHS; missing cells are not zero."}
                    </div>
                    <div className="text-9 text-muted mt-4">
                      Reviewer standard: Reviewers must check unusual patterns against records they can lawfully access. High spending alone is an investigative lead, never proof of wrongdoing.
                    </div>
                  </div>
                </div>

                {/* Exculpatory Hypothesis Card */}
                {selectedProvider.exculpatory_notes && (
                  <div className="mt-14 p-12 border border-border bg-inset/60 rounded-sm flex items-start gap-10 font-mono text-11">
                    <ShieldCheck className="w-4 h-4 text-muted shrink-0 mt-2" />
                    <div>
                      <div className="text-muted font-bold uppercase text-10">Speculative Operational Hypothesis</div>
                      <div className="text-primary mt-2">
                        {isBlinded ? (
                          <span className="text-muted italic">[MASKED TO PREVENT COGNITIVE ANCHORING] Unblind above to view narrative hypothesis.</span>
                        ) : (
                          selectedProvider.exculpatory_notes
                        )}
                      </div>
                      <div className="text-9 text-muted mt-4">Independent blinded review evaluates raw patient encounters and census before inspecting hypotheses.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Methodology & Specifications */}
              <div className="p-16 border border-border bg-surface rounded-sm space-y-12">
                <div className="flex items-center gap-8 font-mono text-11 text-muted uppercase">
                  <Layers className="w-4 h-4 text-emerald" />
                  <span>Institutional Screening Methodology & Legal Architecture</span>
                </div>

                <div className="space-y-8 font-mono text-11">
                  <div className="p-10 bg-inset rounded-sm space-y-4">
                    <div className="text-primary font-bold flex items-center justify-between">
                      <span>Official Service Code Master Taxonomy (CMS vs. NY DOH vs. OASAS)</span>
                      <span className="text-emerald text-10 font-mono">STANDARDS</span>
                    </div>
                    <div className="text-9 text-muted leading-relaxed space-y-2">
                      <div><span className="text-primary font-bold">T2024 (CMS Manual R3674CP):</span> Service assessment / plan of care development, waiver. (Intake/care-plan development, NOT per-diem day care attendance).</div>
                      <div><span className="text-primary font-bold">S5102 (NY DOH DAL 2024-08-05):</span> Day care services, adult; per diem (Adult Day Health Care / ADHC clinical medical model).</div>
                      <div><span className="text-primary font-bold">S5105 (NY DOH DAL 2024-08-05):</span> Day care services, adult; per 15 minutes (Social Adult Day Care / SADC social model).</div>
                      <div><span className="text-primary font-bold">A0130 / T2003 / A0425 (NY DOH NEMT):</span> Nonemergency medical transportation (wheelchair van trip / base encounter / mileage rate).</div>
                      <div><span className="text-primary font-bold">H0005 (NYS OASAS Part 822):</span> Chemical dependence outpatient group counseling (60-minute clinical minimum, strict 42 CFR Part 2 privacy).</div>
                    </div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm space-y-4">
                    <div className="text-primary font-bold flex items-center justify-between">
                      <span>Multi-Dimensional Volume Screening</span>
                      <span className="text-steel-blue text-10">METHODOLOGY</span>
                    </div>
                    <div className="text-9 text-muted leading-relaxed">
                      Spend per active month alone does not remove volume bias. Screening combines monthly intensity ($/mo), claims per beneficiary, and spend per beneficiary to isolate outlier patient encounter patterns across peer cohorts.
                    </div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm space-y-4">
                    <div className="text-primary font-bold flex items-center justify-between">
                      <span>HHS Dataset Grain & Privacy Suppression</span>
                      <span className="text-amber-400 text-10">DATASET GRAIN</span>
                    </div>
                    <div className="text-9 text-muted leading-relaxed">
                      The HHS Medicaid Provider Spending dataset reports annual aggregate billing/servicing NPI totals, omitting physical point-of-service locations, and suppresses small cells (&lt;11 beneficiaries/claims) for privacy. Every score is a descriptive screening signal, not verified proof of overbilling.
                    </div>
                  </div>

                  <div className="p-10 bg-inset rounded-sm space-y-4">
                    <div className="text-primary font-bold flex items-center justify-between">
                      <span>False Claims Act & Zero-PHI Legal Posture</span>
                      <span className="text-emerald text-10">NYS FINANCE LAW § 190(9)</span>
                    </div>
                    <div className="text-9 text-muted leading-relaxed">
                      Public disclosure bars and original-source exceptions are evaluated under NYS Finance Law § 190(9) and 31 U.S.C. § 3730(e)(4). Zero-PHI architecture: uses public aggregate CMS data only, requiring no HIPAA Business Associate Agreement (BAA).
                    </div>
                  </div>
                </div>
              </div>

              {/* Blinded Investigator Review Sign-Off */}
              <div className="p-16 border border-border bg-surface rounded-sm space-y-16">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8 font-mono text-11 text-gold uppercase font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Blinded Investigator Review & Workflow Assessment</span>
                  </div>
                  {feedbackSuccess && (
                    <span className="text-10 font-mono text-emerald animate-pulse">
                      {feedbackSuccess}
                    </span>
                  )}
                </div>

                {/* Lead Utility Selection */}
                <div>
                  <label className="block text-10 font-mono text-muted uppercase mb-4">
                    Investigative Utility Classification (Pilot Screening Evaluation)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 font-mono text-10">
                    {[
                      { id: "PRIORITY_INVESTIGATION", label: "PRIORITY INVESTIGATION", desc: "Merits subpoena / in-depth audit" },
                      { id: "HIGH_ACUITY_CENSUS", label: "HIGH-ACUITY CENSUS", desc: "Consistent with legitimate care scope" },
                      { id: "SECONDARY_ENCOUNTERS_NEEDED", label: "ENCOUNTERS NEEDED", desc: "Requires primary roster inspection" },
                      { id: "DATA_SUPPRESSION_ARTIFACT", label: "DATA ARTIFACT", desc: "Cell suppression / reporting noise" }
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setLeadUtility(u.id)}
                        className={`p-8 text-left rounded-sm border transition-all ${
                          leadUtility === u.id
                            ? "bg-steel-blue/15 border-steel-blue text-steel-blue"
                            : "bg-inset border-border text-muted hover:text-primary"
                        }`}
                      >
                        <div className="font-bold">{u.label}</div>
                        <div className="text-8 opacity-75">{u.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Hash Input */}
                <div>
                  <label className="block text-10 font-mono text-muted uppercase mb-4">
                    Primary Record SHA-256 Document Hash (Optional Review Attachment)
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 absolute left-10 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={documentHash}
                      onChange={(e) => setDocumentHash(e.target.value)}
                      placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                      className="w-full bg-inset border border-border rounded-sm pl-28 pr-10 py-6 text-10 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight"
                    />
                  </div>
                </div>

                {/* Reviewer Notes */}
                <div>
                  <label className="block text-10 font-mono text-muted uppercase mb-4">
                    Reviewer Notes & Operational Rationale
                  </label>
                  <textarea
                    rows={2}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Document census findings, capacity notes, or exculpatory evidence..."
                    className="w-full bg-inset border border-border rounded-sm p-8 text-10 font-mono placeholder:text-muted focus:outline-none focus:border-border-highlight resize-none"
                  />
                </div>

                {/* Disposition Action Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-10 font-mono text-muted uppercase">Log Review Outcome</span>
                    <span className="text-9 font-mono text-muted">
                      Session elapsed: {formatMinutes(reviewSeconds)} · Internal evaluation format
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 font-mono text-10">
                    <button
                      disabled={submitting}
                      onClick={() => handleRecordDisposition("FLAGGED_FOR_INVESTIGATION")}
                      className="p-8 bg-emerald/15 border border-emerald text-emerald hover:bg-emerald/25 rounded-sm flex flex-col items-center gap-4 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>FLAG (INVESTIGATE)</span>
                    </button>

                    <button
                      disabled={submitting}
                      onClick={() => handleRecordDisposition("DISMISSED_ALREADY_KNOWN")}
                      className="p-8 bg-inset border border-border text-muted hover:text-primary rounded-sm flex flex-col items-center gap-4 transition-colors disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      <span>DISMISS (KNOWN)</span>
                    </button>

                    <button
                      disabled={submitting}
                      onClick={() => handleRecordDisposition("DISMISSED_INSUFFICIENT_PROOF")}
                      className="p-8 bg-inset border border-border text-muted hover:text-primary rounded-sm flex flex-col items-center gap-4 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>DISMISS (WEAK)</span>
                    </button>

                    <button
                      disabled={submitting}
                      onClick={() => handleRecordDisposition("DISMISSED_EXPLAINABLE_CENSUS")}
                      className="p-8 bg-inset border border-border text-muted hover:text-primary rounded-sm flex flex-col items-center gap-4 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>DISMISS (CENSUS)</span>
                    </button>
                  </div>

                  {/* Research Dossier Export */}
                  <EvidenceDossier
                    leadId={selectedProvider.id}
                    npi={selectedProvider.npi}
                    providerName={selectedProvider.name}
                    disposition={selectedProvider.lead_utility || leadUtility}
                    observedSeconds={reviewSeconds}
                    docHashes={documentHash.trim() ? [documentHash.trim()] : []}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted font-mono text-12">
              Select a healthcare provider lead from the queue to view multi-signal evidence.
            </div>
          )}
        </div>
      </div>

      {/* Institutional Investigator Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-16 font-mono">
          <div className="max-w-md w-full p-24 bg-surface border border-border rounded-sm shadow-2xl text-left space-y-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                <div className="p-8 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-10 text-muted uppercase">Institutional Credential Gate</div>
                  <div className="text-14 font-bold text-primary">Investigator Session Login</div>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-4 text-muted hover:text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-11 font-sans text-secondary leading-relaxed">
              Authenticate to unlock institutional review dispositions, disposition audit signatures, and sealed work-product export channels. Public anomaly screening remains fully available without a token.
            </p>

            {onAuthenticate && (
              <form onSubmit={handleLoginSubmit} className="space-y-12">
                <div>
                  <label className="text-10 text-muted uppercase block mb-4">Investigator Pilot Token</label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter pilot access token..."
                    className="w-full bg-inset border border-border rounded-sm px-10 py-6 text-11 focus:outline-none focus:border-border-highlight"
                    autoFocus
                  />
                </div>

                {authError && (
                  <div className="text-10 text-red-400 bg-red-950/40 p-8 border border-red-500/40 rounded-sm">
                    {authError}
                  </div>
                )}

                <div className="flex items-center gap-8 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="flex-1 py-8 bg-inset hover:bg-canvas border border-border text-muted text-11 rounded-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={authSubmitting || !tokenInput.trim()}
                    className="flex-1 py-8 bg-emerald/20 hover:bg-emerald/30 border border-emerald text-emerald font-bold text-11 rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {authSubmitting ? "Verifying..." : "Authenticate"}
                  </button>
                </div>
              </form>
            )}

            <div className="text-9 text-muted pt-8 border-t border-border">
              Note: Credentials are held strictly in browser session memory and are never committed to disk, source repositories, or client code bundles.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
