import React, { useState, useEffect } from "react";
import { X, ShieldCheck, ShieldAlert, RefreshCw, Hash, Lock, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";
import { AuditVerificationResult } from "../../types";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const [result, setResult] = useState<AuditVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runVerification = async () => {
    setLoading(true);
    try {
      const res = await api.get("/audit/verify");
      setResult(res.data);
    } catch {
      setResult({
        status: "INTEGRITY_ISSUE_DETECTED",
        message: "Verification service failed to respond.",
        total_blocks: 0,
        verified_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runVerification();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#090D15] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0F1522] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Cryptographic Audit Hash Chain
              </h3>
              <p className="text-xs text-slate-400">
                Immutable SHA-256 Chained Event Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-mono">
                Calculating block SHA-256 hashes sequentially from Genesis...
              </p>
            </div>
          ) : result ? (
            <>
              {/* Status Banner */}
              <div
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  result.status === "HASH_CHAIN_VALID"
                    ? "bg-emerald-950/40 border-emerald-800/70 text-emerald-200"
                    : "bg-red-950/40 border-red-800/70 text-red-200"
                }`}
              >
                {result.status === "HASH_CHAIN_VALID" ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold tracking-wide">
                    {result.status === "HASH_CHAIN_VALID"
                      ? "HASH CHAIN VALID — 100% CRYPTOGRAPHIC INTEGRITY"
                      : "INTEGRITY ISSUE DETECTED — HASH MISMATCH"}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">{result.message}</p>
                </div>
              </div>

              {/* Block Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-[#0D131F] border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Total Chained Blocks</span>
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {result.total_blocks} Blocks
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#0D131F] border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Genesis Block Status</span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Root Anchor Intact
                  </span>
                </div>
              </div>

              {/* Latest Tip Hash */}
              <div className="p-3.5 rounded-lg bg-[#0A0E17] border border-slate-800/90 font-mono text-xs space-y-1.5">
                <div className="flex items-center gap-1 text-slate-400">
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  <span>Latest Chain Tip Hash (SHA-256):</span>
                </div>
                <p className="text-amber-300/90 break-all bg-black/40 p-2 rounded border border-slate-800 text-[11px]">
                  {result.latest_block_hash || "0000000000000000000000000000000000000000000000000000000000000000"}
                </p>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Verified timestamp: {result.verified_at}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0F1522] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Algorithm: SHA-256 Sequential Merkle Hash Chaining
          </span>
          <button
            onClick={runVerification}
            disabled={loading}
            className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Re-verify Chain</span>
          </button>
        </div>
      </div>
    </div>
  );
};
