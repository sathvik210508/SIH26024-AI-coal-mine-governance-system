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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cryptographic Audit Hash Chain
              </h3>
              <p className="text-xs text-slate-500">
                Immutable SHA-256 Merkle Chained Event Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Summary */}
        <div className="p-4 border-b border-slate-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-500 gap-2 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
              <span>Verifying SHA-256 Hash Tree from Genesis...</span>
            </div>
          ) : result?.status === "HASH_CHAIN_VALID" ? (
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold font-mono">
                    MATHEMATICAL INTEGRITY VERIFIED (100% VALID)
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {result.total_blocks} chained event blocks confirmed. Zero tampering detected.
                  </div>
                </div>
              </div>
              <button
                onClick={runVerification}
                className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-mono border border-emerald-300 font-semibold transition-colors"
              >
                Re-Verify
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold font-mono">HASH CHAIN INTEGRITY ALERT</div>
                  <div className="text-[11px] text-red-700 mt-0.5">
                    {result?.message || "Hash mismatch or block tampering detected."}
                  </div>
                </div>
              </div>
              <button
                onClick={runVerification}
                className="px-2.5 py-1 rounded bg-white hover:bg-red-100 text-red-800 text-xs font-mono border border-red-300 font-semibold transition-colors"
              >
                Re-Verify
              </button>
            </div>
          )}
        </div>

        {/* Recent Chained Blocks */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>AUDIT TRAIL EVENT BLOCKS</span>
            <span>VERIFIED: {result?.verified_at?.slice(0, 19).replace("T", " ") || "Live"}</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {result?.recent_blocks && result.recent_blocks.length > 0 ? (
              result.recent_blocks.map((b) => (
                <div
                  key={b.block_id}
                  className="p-2.5 rounded border border-slate-200 bg-white text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">
                      Block #{b.block_id} • {b.action}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {b.timestamp?.slice(11, 19)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Entity: <span className="font-medium text-slate-800">{b.entity_type}</span> • User:{" "}
                    <span className="font-mono">{b.user_email}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    Hash: <span className="text-slate-700 font-medium">{b.block_hash}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Verified block records anchored in database.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-black text-white text-xs font-medium transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
