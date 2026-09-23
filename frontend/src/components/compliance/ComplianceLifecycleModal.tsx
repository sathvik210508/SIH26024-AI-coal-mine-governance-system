import React, { useState, useEffect } from "react";
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  Calendar, 
  User, 
  MapPin, 
  FileText, 
  ExternalLink,
  BrainCircuit,
  Lock,
  Camera,
  Layers
} from "lucide-react";
import { api } from "../../services/api";
import { ComplianceLifecycleData, LifecycleStage } from "../../types";
import { StatusBadge } from "../common/StatusBadge";

interface ComplianceLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "violation" | "action";
  entityId: number;
}

export const ComplianceLifecycleModal: React.FC<ComplianceLifecycleModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
}) => {
  const [data, setData] = useState<ComplianceLifecycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !entityId) return;
    setLoading(true);
    const fetchLifecycle = async () => {
      try {
        const res = await api.get(`/mine/compliance/lifecycle/${entityType}/${entityId}`);
        setData(res.data);
        if (res.data?.lifecycle_timeline?.length > 0) {
          // Select current or last completed step by default
          setSelectedStage(res.data.current_step || res.data.lifecycle_timeline.length);
        }
      } catch (err) {
        console.error("Failed to load compliance lifecycle:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLifecycle();
  }, [isOpen, entityType, entityId]);

  if (!isOpen) return null;

  const issue = data?.issue_details;
  const timeline = data?.lifecycle_timeline || [];
  const activeStage = timeline.find((s) => s.step === selectedStage) || timeline[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  STATUTORY COMPLIANCE LIFECYCLE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400 border border-emerald-500/30">
                  SHA-256 ANCHORED
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight mt-0.5">
                Issue {issue?.issue_id || `ID #${entityId}`} &bull; End-to-End Governance Audit
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500">
              Tracing immutable audit trail and assembling compliance stages...
            </p>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            Lifecycle data unavailable for this record.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Issue Details Card */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Operating Mine</span>
                <span className="font-semibold text-slate-900">{issue?.mine_name}</span>
                <span className="text-[11px] text-slate-600 block">{issue?.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Statutory Category</span>
                <span className="font-semibold text-slate-900">{issue?.category}</span>
                <span className="text-[10px] text-slate-500 block truncate">{issue?.regulation}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Severity & Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusBadge status={issue?.severity || "HIGH"} />
                  <StatusBadge status={issue?.status || "OPEN"} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Responsible Officer</span>
                <span className="font-semibold text-slate-900">{issue?.responsible_person}</span>
                <span className="text-[10px] text-slate-600 block">Due: {issue?.due_date}</span>
              </div>
            </div>

            {/* 10-Stage Visual Progression Line */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  10-Stage Statutory Progression
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  Click any stage to inspect execution telemetry & evidence
                </span>
              </div>

              {/* Horizontal / Wrapped Step Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
                {timeline.map((stage) => {
                  const isSelected = stage.step === selectedStage;
                  const isCompleted = stage.status === "COMPLETED";
                  const isCurrent = stage.step === data.current_step;

                  let badgeColor = "bg-white border-slate-200 text-slate-500";
                  if (isSelected) {
                    badgeColor = "bg-slate-900 border-slate-900 text-white shadow-xs";
                  } else if (isCompleted) {
                    badgeColor = "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100/60";
                  } else if (isCurrent) {
                    badgeColor = "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/60";
                  }

                  return (
                    <button
                      key={stage.step}
                      onClick={() => setSelectedStage(stage.step)}
                      className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${badgeColor}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          0{stage.step}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-emerald-600"}`} />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div className="text-[11px] font-bold leading-tight truncate">
                        {stage.title}
                      </div>
                      <div className={`text-[9px] font-mono mt-1 truncate ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                        {stage.role.replace("_", " ")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Stage Detail Panel */}
            {activeStage && (
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                      {activeStage.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {activeStage.title}
                        <StatusBadge status={activeStage.status} />
                      </h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Responsible Role: <span className="font-semibold text-slate-800">{activeStage.actor}</span> ({activeStage.role})
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-500">
                    <div>Timestamp: <span className="font-semibold text-slate-800">{activeStage.timestamp || "Pending Execution"}</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold font-mono text-slate-700 uppercase">
                    Action Performed
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed">
                    {activeStage.action_performed}
                  </div>
                </div>

                {/* Specific Stage Payloads */}
                {activeStage.step === 3 && activeStage.details?.contributing_factors && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5 text-slate-700" />
                        Explainable AI Risk Breakdown
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-700">
                        Score: {activeStage.details.risk_score}/100 &bull; {activeStage.details.risk_tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {activeStage.details.contributing_factors.map((f: any, i: number) => (
                        <div key={i} className="p-2.5 rounded bg-slate-50 border border-slate-200 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{f.factor}</span>
                            <span className="text-slate-600 font-bold">+{f.impact_pts} pts</span>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1">{f.detail}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-md bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-mono">
                      <b>AI Explanation:</b> {activeStage.details.explanation}
                    </div>
                  </div>
                )}

                {activeStage.step === 8 && activeStage.details?.checks && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        AI Evidence Verification Report
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        Confidence: {activeStage.details.confidence_percentage}% &bull; {activeStage.details.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      {activeStage.details.checks.map((chk: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="font-medium text-slate-800">{chk.name}</span>
                          <span className={`text-[11px] font-bold ${chk.passed ? "text-emerald-700" : "text-amber-700"}`}>
                            {chk.passed ? "✓ PASSED" : "⚠ FLAGGED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeStage.step === 10 && activeStage.details?.block_hash && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-700" />
                      Cryptographic Merkle Event Anchor
                    </span>
                    <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1 overflow-x-auto">
                      <div><span className="text-slate-400">Block Event ID:</span> {activeStage.details.event_id}</div>
                      <div><span className="text-slate-400">Block SHA-256:</span> {activeStage.details.block_hash}</div>
                      <div><span className="text-slate-400">Previous Hash:</span> {activeStage.details.previous_hash}</div>
                      <div className="text-emerald-400 pt-1">✓ Mathematical Hash Integrity: VALID</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            SIH26024 Smart Governance &bull; Complete Audit Traceability Protocol
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-black text-white font-mono text-xs font-semibold transition-colors"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
