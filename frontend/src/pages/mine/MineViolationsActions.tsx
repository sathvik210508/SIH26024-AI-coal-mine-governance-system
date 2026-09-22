import React, { useState, useEffect } from "react";
import { FileWarning, CheckSquare, CheckCircle2, XCircle, ShieldCheck, Camera, Clock, ArrowRight } from "lucide-react";
import { api } from "../../services/api";
import { Violation, CorrectiveAction } from "../../types";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";

export const MineViolationsActions: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification modal state
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [decision, setDecision] = useState<"ACCEPTED" | "RETURNED_FOR_CORRECTION">("ACCEPTED");
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [vRes, aRes] = await Promise.all([
        api.get("/mine/violations"),
        api.get("/mine/corrective-actions"),
      ]);
      setViolations(vRes.data || []);
      setActions(aRes.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;
    setVerifying(true);
    try {
      await api.patch(`/mine/corrective-actions/${selectedAction.id}`, {
        decision,
        remarks: verifyRemarks || "Inspected submitted engineering photo proof and verified remediation.",
      });
      setSuccessMsg(
        `Action ${selectedAction.action_id} verification processed: ${decision === "ACCEPTED" ? "VERIFIED & CLOSED" : "RETURNED FOR REWORK"}.`
      );
      setSelectedAction(null);
      setVerifyRemarks("");
      fetchData();
    } catch {
      alert("Failed to record verification decision.");
    } finally {
      setVerifying(false);
    }
  };

  const actionColumns = [
    {
      header: "Action ID",
      accessor: "action_id" as keyof CorrectiveAction,
      render: (row: CorrectiveAction) => (
        <span className="font-mono font-bold text-sky-400">{row.action_id}</span>
      ),
    },
    {
      header: "Description",
      accessor: "description" as keyof CorrectiveAction,
      render: (row: CorrectiveAction) => <span className="line-clamp-2">{row.description}</span>,
    },
    {
      header: "Department",
      accessor: "department" as keyof CorrectiveAction,
    },
    {
      header: "Deadline",
      accessor: "deadline" as keyof CorrectiveAction,
      render: (row: CorrectiveAction) => (
        <span className={`font-mono ${row.is_overdue ? "text-red-400 font-bold" : ""}`}>
          {row.deadline}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status" as keyof CorrectiveAction,
      render: (row: CorrectiveAction) => <StatusBadge status={row.status} />,
    },
    {
      header: "Verification Action",
      render: (row: CorrectiveAction) => {
        if (row.status === "AWAITING_VERIFICATION") {
          return (
            <button
              onClick={() => setSelectedAction(row)}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review & Verify</span>
            </button>
          );
        }
        if (row.status === "CLOSED" || row.status === "VERIFIED") {
          return (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Closed
            </span>
          );
        }
        return <span className="text-xs text-slate-500 font-mono">Field executing</span>;
      },
    },
  ];

  const violationColumns = [
    {
      header: "Violation ID",
      accessor: "violation_id" as keyof Violation,
      render: (row: Violation) => (
        <span className="font-mono font-bold text-amber-400">{row.violation_id}</span>
      ),
    },
    {
      header: "Category",
      accessor: "category" as keyof Violation,
    },
    {
      header: "Severity",
      accessor: "severity" as keyof Violation,
      render: (row: Violation) => <StatusBadge status={row.severity} />,
    },
    {
      header: "Department",
      accessor: "department" as keyof Violation,
    },
    {
      header: "Status",
      accessor: "status" as keyof Violation,
      render: (row: Violation) => <StatusBadge status={row.status} />,
    },
    {
      header: "Recurring Pattern",
      render: (row: Violation) =>
        row.is_recurring ? (
          <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-300 font-mono text-[10px] font-bold">
            RECURRING ({row.recurrence_count || 2}x)
          </span>
        ) : (
          <span className="text-slate-500 text-xs">Isolated</span>
        ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
          COMPLIANCE REMEDIATION LIFECYCLE
        </span>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-0.5">
          Violations & Corrective Action Verification
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review ground evidence uploads, perform statutory verification, and manage closing workflows
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

      {/* Corrective Actions Section (With Verification Trigger) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span>Corrective Actions Oversight & Verification</span>
          </h2>
          <span className="text-xs font-mono text-amber-400">
            {actions.filter((a) => a.status === "AWAITING_VERIFICATION").length} Pending Manager Verification
          </span>
        </div>

        <DataTable
          columns={actionColumns}
          data={actions}
          searchKey="action_id"
          searchPlaceholder="Filter corrective actions..."
          loading={loading}
        />
      </div>

      {/* Violations Registry Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
          <FileWarning className="w-4 h-4 text-amber-400" />
          <span>Statutory Violations Registry</span>
        </h2>

        <DataTable
          columns={violationColumns}
          data={violations}
          searchKey="violation_id"
          searchPlaceholder="Filter violations by ID..."
          loading={loading}
        />
      </div>

      {/* Review & Verify Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090D15] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs text-amber-400 font-bold">{selectedAction.action_id}</span>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">Manager Verification Review</h3>
              </div>
              <StatusBadge status={selectedAction.status} />
            </div>

            <div className="space-y-2 bg-[#0E1420] p-3 rounded-lg border border-slate-800 text-xs">
              <p className="text-slate-200 font-medium">{selectedAction.description}</p>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] pt-1">
                <span>Department: {selectedAction.department}</span>
                <span>Deadline: {selectedAction.deadline}</span>
              </div>
            </div>

            {/* Field Uploaded Proof Inspection */}
            <div className="p-3 rounded-lg border border-slate-800 bg-[#080C13] space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Field Evidence Dossier</span>
              </span>
              <p className="text-xs text-slate-300 italic">
                "Replaced crushed 6.6kV trailing cable section with armored conduit and elevated crossing bridge. Insulation resistance tested 150 MOhm."
              </p>
              <div className="text-[11px] font-mono text-amber-400">
                Attached Photo: photo_evidence_repaired_conduit.jpg
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Verification Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("ACCEPTED")}
                    className={`p-2 rounded-lg border font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      decision === "ACCEPTED"
                        ? "bg-emerald-950 border-emerald-700 text-emerald-300"
                        : "bg-[#080C13] border-slate-700 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Approve & Close</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision("RETURNED_FOR_CORRECTION")}
                    className={`p-2 rounded-lg border font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      decision === "RETURNED_FOR_CORRECTION"
                        ? "bg-amber-950 border-amber-700 text-amber-300"
                        : "bg-[#080C13] border-slate-700 text-slate-400"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-amber-400" />
                    <span>Return for Correction</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Verification Audit Remarks *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State formal findings of evidence verification..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                />
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
                  disabled={verifying}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 font-bold text-black"
                >
                  {verifying ? "Logging to Audit Chain..." : "Confirm Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
