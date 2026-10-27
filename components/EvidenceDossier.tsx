"use client";

import React, { useState, useEffect } from "react";

interface EvidenceDossierProps {
  leadId: string;
  npi: string;
  providerName: string;
  disposition: string;
  observedSeconds: number;
  docHashes: string[];
  allowlistChecksum?: string;
}

export function EvidenceDossier({
  leadId,
  npi,
  providerName,
  disposition,
  observedSeconds,
  docHashes
}: EvidenceDossierProps) {
  const [contentDigest, setContentDigest] = useState<string>("");

  // Compute SHA-256 digest of review fields for content integrity checking
  useEffect(() => {
    async function generateDigest() {
      const timestamp = new Date().toISOString();
      const rawString = `${leadId}:${npi}:${disposition}:${observedSeconds}:${docHashes.join(",")}:${timestamp}`;
      const msgBuffer = new TextEncoder().encode(rawString);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setContentDigest(hashHex);
    }
    generateDigest();
  }, [leadId, npi, disposition, observedSeconds, docHashes]);

  const handleExportJSON = () => {
    const dossierData = {
      protocol: "ESTAFO_RESEARCH_DOSSIER_PREVIEW_V1",
      status: "UNVERIFIED_RESEARCH_PREVIEW",
      notice: "RESEARCH AID ONLY. This export is an unauthenticated research summary and does not constitute a signed legal complaint, subpoena, proof of fraud, or official relator disclosure. All assertions require independent evidentiary verification.",
      timestamp: new Date().toISOString(),
      provider: {
        leadId,
        npi,
        providerName,
      },
      reviewSession: {
        disposition,
        observedSessionMinutes: (observedSeconds / 60).toFixed(2),
        elapsedSeconds: observedSeconds,
      },
      provenance: {
        documentHashesSha256: docHashes,
        contentIntegrityDigestSha256: contentDigest,
      },
    };

    const blob = new Blob([JSON.stringify(dossierData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Estafo_Research_Dossier_Preview_${npi}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#12161f] p-6 text-[#f0f3f6] shadow-xl font-sans mt-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#8b949e] font-semibold">Investigative Workflow Preview</span>
          <h3 className="text-lg font-bold text-white mt-0.5">Research Dossier Export (Draft Preview)</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            SHA-256 Content Digest
          </span>
        </div>
      </div>

      {/* Prominent Legal & Verification Disclaimer */}
      <div className="p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
        <strong>Research Aid Only:</strong> This export generates a draft JSON research summary for internal evaluation. It is not an authenticated legal filing, signed attorney complaint, or evidence of fraud.
      </div>

      {/* Core Metadata Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="bg-[#0b0e14] p-3 rounded-lg border border-white/5">
          <span className="text-[#8b949e] block text-xs">Target Lead (Identifier)</span>
          <span className="font-mono font-medium text-white">{npi}</span>
          <span className="text-xs text-[#8b949e] block truncate mt-0.5">{providerName}</span>
        </div>
        <div className="bg-[#0b0e14] p-3 rounded-lg border border-white/5">
          <span className="text-[#8b949e] block text-xs">Reviewer Disposition</span>
          <span className="font-semibold text-emerald-400">{disposition}</span>
          <span className="text-xs text-[#8b949e] block mt-0.5">Session Elapsed: {(observedSeconds / 60).toFixed(1)}m</span>
        </div>
      </div>

      {/* Content Digest */}
      <div className="space-y-2 mb-4">
        <div>
          <label className="text-xs text-[#8b949e] block mb-1">Dossier Content Integrity Digest (SHA-256)</label>
          <div className="font-mono text-xs bg-[#0b0e14] p-2 rounded border border-white/5 text-cyan-400 truncate">
            {contentDigest || "Computing digest..."}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-xs text-[#8b949e]">Internal review summary format</span>
        <button
          onClick={handleExportJSON}
          disabled={!contentDigest}
          className="px-4 py-2 rounded-lg bg-[#0052ff] hover:bg-[#0040cc] text-white text-xs font-semibold transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          <span>Export Research Summary (JSON)</span>
        </button>
      </div>
    </div>
  );
}
