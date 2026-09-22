import React, { useState, useEffect } from "react";
import { CheckSquare, Upload, Camera, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";
import { CorrectiveAction } from "../../types";
import { StatusBadge } from "../../components/common/StatusBadge";

export const FieldCorrectiveActions: React.FC = () => {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [remarks, setRemarks] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      const res = await api.get("/field/corrective-actions");
      setActions(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;
    setUploading(true);
    try {
      await api.patch(`/field/corrective-actions/${selectedAction.id}`, {
        file_path: "/uploads/repaired_workfront_evidence.jpg",
        remarks: remarks || "Completed remedial works as per statutory guidelines.",
        latitude: 24.1988,
        longitude: 82.6651,
      });
      setSuccessMsg(
        `Evidence submitted for ${selectedAction.action_id}. Action is now AWAITING_VERIFICATION by Mine Manager. (Rule: Uploading evidence does not auto-close the action).`
      );
      setSelectedAction(null);
      setRemarks("");
      fetchActions();
    } catch {
      alert("Failed to submit corrective action evidence.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
          REMEDIATION & EVIDENCE UPLOAD
        </span>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-0.5">
          Assigned Corrective Actions
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload ground completion proof. Actions undergo mandatory management verification before closure.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-mono text-emerald-400 font-bold ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* Action List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((act) => (
          <div
            key={act.id}
            className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-slate-700 transition-colors shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-400">{act.action_id}</span>
                <StatusBadge status={act.status} />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{act.description}</h3>
              <div className="text-xs text-slate-400 font-mono space-y-0.5">
                <div>Department: <span className="text-slate-200">{act.department}</span></div>
                <div>Assigned: <span className="text-slate-200">{act.assigned_person}</span></div>
                <div>Deadline: <span className={act.is_overdue ? "text-red-400 font-bold" : "text-slate-300"}>{act.deadline}</span></div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-500/90 font-semibold">
                {act.requires_gov_verification ? "Requires DGMS Verification" : "Manager Verification"}
              </span>

              {act.status !== "CLOSED" && act.status !== "VERIFIED" ? (
                <button
                  onClick={() => setSelectedAction(act)}
                  className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Evidence</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Closed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Evidence Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090D15] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs text-amber-400 font-bold">{selectedAction.action_id}</span>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">Submit Remediation Proof</h3>
              </div>
              <StatusBadge status={selectedAction.status} />
            </div>

            <p className="text-xs text-slate-300 bg-[#0E1420] p-3 rounded border border-slate-800">
              {selectedAction.description}
            </p>

            <form onSubmit={handleSubmitEvidence} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Work Completed Description & Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail exact engineering or safety fixes performed..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-lg border border-dashed border-slate-700 bg-[#080C13] text-center space-y-1">
                <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                <span className="text-slate-300 font-semibold block">Proof of Execution (Simulated)</span>
                <span className="text-[11px] font-mono text-amber-400">photo_evidence_repaired_conduit.jpg</span>
              </div>

              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-300">
                <b>CRITICAL WORKFLOW RULE:</b> Uploading evidence sets status to <b>AWAITING_VERIFICATION</b>. It will not close until authorized Mine Management or DGMS verifies the proof.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  {uploading ? "Submitting Proof..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
