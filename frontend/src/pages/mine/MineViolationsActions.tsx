import React, { useState, useEffect } from "react";
import { FileWarning, CheckSquare, CheckCircle2, XCircle, ShieldCheck, Camera } from "lucide-react";
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
        <span className="font-mono font-semibold text-slate-900">{row.action_id}</span>
      ),
    },
    {
      header: "Description",
      accessor: "description" as keyof CorrectiveAction,
      render: (row: CorrectiveAction) => <span className="line-clamp-2 text-slate-800">{row.description}</span>,
    },
    {
      header: "Department",
      accessor: "department" as keyof CorrectiveAction,
      render: (row: CorrectiveAction) => <span className="text-slate-700">{row.department}</span>,
    },
    {
      header: "Deadline",
      accessor: "deadline" as keyof CorrectiveAction,
      render: (row: CorrectiveAction) => (
        <span className={`font-mono ${row.is_overdue ? "text-red-600 font-bold" : "text-slate-700"}`}>
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
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-black text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review & Verify</span>
            </button>
          );
        }
        if (row.status === "CLOSED" || row.status === "VERIFIED") {
          return (
            <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Closed
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
        <span className="font-mono font-semibold text-slate-900">{row.violation_id}</span>
      ),
    },
    {
      header: "Category",
      accessor: "category" as keyof Violation,
      render: (row: Violation) => <span className="text-slate-800">{row.category}</span>,
    },
    {
      header: "Severity",
      accessor: "severity" as keyof Violation,
      render: (row: Violation) => <StatusBadge status={row.severity} />,
    },
    {
      header: "Department",
      accessor: "department" as keyof Violation,
      render: (row: Violation) => <span className="text-slate-700">{row.department}</span>,
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
          <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-mono text-[10px] font-semibold">
            RECURRING ({row.recurrence_count || 2}x)
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Isolated</span>
        ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
          COMPLIANCE REMEDIATION LIFECYCLE
        </span>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5">
          Violations & Corrective Action Verification
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Review ground evidence uploads, perform statutory verification, and manage closing workflows
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-mono text-emerald-700 font-bold ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* Corrective Actions Section (With Verification Trigger) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-slate-700" />
            <span>Corrective Actions Oversight & Verification</span>
          </h2>
          <span className="text-xs font-mono text-slate-600">
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
        <h2 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
          <FileWarning className="w-4 h-4 text-slate-700" />
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-slate-900 font-bold">{selectedAction.action_id}</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">Manager Verification Review</h3>
              </div>
              <StatusBadge status={selectedAction.status} />
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <p className="text-slate-800 font-medium">{selectedAction.description}</p>
              <div className="flex items-center justify-between text-slate-500 font-mono text-[11px] pt-1">
                <span>Department: {selectedAction.department}</span>
                <span>Deadline: {selectedAction.deadline}</span>
              </div>
            </div>

            {/* Field Uploaded Proof Inspection */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Field Evidence Dossier</span>
              </span>
              <p className="text-xs text-slate-600 italic">
                "Replaced crushed 6.6kV trailing cable section with armored conduit and elevated crossing bridge. Insulation resistance tested 150 MOhm."
              </p>
              <div className="text-[11px] font-mono text-slate-600">
                Attached Photo: photo_evidence_repaired_conduit.jpg
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Verification Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("ACCEPTED")}
                    className={`p-2 rounded-md border font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      decision === "ACCEPTED"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve & Close</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision("RETURNED_FOR_CORRECTION")}
                    className={`p-2 rounded-md border font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      decision === "RETURNED_FOR_CORRECTION"
                        ? "bg-amber-50 border-amber-400 text-amber-800 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-amber-600" />
                    <span>Return for Correction</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Verification Audit Remarks *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State formal findings of evidence verification..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-black font-medium text-white shadow-xs"
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
