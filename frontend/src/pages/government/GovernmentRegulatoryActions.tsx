import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";

export const GovernmentRegulatoryActions: React.FC = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Verification modal for government review
  const [verifyTarget, setVerifyTarget] = useState<any | null>(null);
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const [form, setForm] = useState({
    mine_id: 1,
    organization_id: 1,
    action_type: "REGULATORY_DIRECTION",
    description: "",
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    required_evidence: "Photographic proof of rectification, calibrated sensor telemetry logs, and Mine Manager statutory compliance undertaking.",
  });

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/government/regulatory-actions");
      setActions(res.data || []);
    } catch (err) {
      console.error("Failed to load regulatory actions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIssue(true);
    try {
      await api.post("/government/regulatory-actions", form);
      setShowIssueModal(false);
      setForm({
        mine_id: 1,
        organization_id: 1,
        action_type: "REGULATORY_DIRECTION",
        description: "",
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        required_evidence: "Photographic proof of rectification, calibrated sensor telemetry logs, and Mine Manager statutory compliance undertaking.",
      });
      fetchActions();
    } catch (err) {
      console.error("Failed to issue regulatory action:", err);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleVerify = async (decision: "ACCEPTED" | "RETURNED_FOR_CORRECTION") => {
    if (!verifyTarget) return;
    setSubmittingVerify(true);
    try {
      await api.post(`/government/corrective-actions/${verifyTarget.id}/verify`, {
        decision,
        remarks: verifyRemarks || (decision === "ACCEPTED" ? "Statutory evidence verified and accepted by DGMS." : "Evidence inadequate. Remedial work required."),
      });
      setVerifyTarget(null);
      setVerifyRemarks("");
      fetchActions();
    } catch (err) {
      console.error("Failed to verify action:", err);
    } finally {
      setSubmittingVerify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Statutory Directives & Enforcement Orders
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              DGMS Powers (Sec 22)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Issue formal regulatory directions, stop-work notices, and statutory compliance orders directly enforceable under the Mines Act.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchActions}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Statutory Directive</span>
          </button>
        </div>
      </div>

      {/* Regulatory Actions List */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <DataTable
          columns={[
            {
              header: "Directive ID",
              accessor: (row: any) => (
                <div>
                  <span className="font-mono font-bold text-slate-900 text-xs">{row.action_id}</span>
                  <div className="text-[10px] font-mono text-slate-500">{row.action_type}</div>
                </div>
              ),
            },
            {
              header: "Target Mine",
              accessor: (row: any) => (
                <span className="font-mono text-xs text-slate-700">Mine ID: {row.mine_id}</span>
              ),
            },
            {
              header: "Statutory Order Details",
              accessor: (row: any) => (
                <div className="max-w-md">
                  <div className="text-xs text-slate-800 font-medium line-clamp-2">{row.description}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Required: {row.required_evidence}
                  </div>
                </div>
              ),
            },
            {
              header: "Status",
              accessor: (row: any) => <StatusBadge status={row.status} />,
            },
            {
              header: "Deadline",
              accessor: (row: any) => {
                const isOverdue = new Date(row.deadline) < new Date() && row.status !== "CLOSED";
                return (
                  <div className="font-mono text-xs">
                    <span className={isOverdue ? "text-rose-700 font-bold" : "text-slate-700"}>
                      {row.deadline}
                    </span>
                    {isOverdue && (
                      <span className="block text-[10px] text-rose-700 font-bold uppercase tracking-wider">
                        EXPIRED
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              header: "Actions",
              accessor: (row: any) => (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setVerifyTarget(row);
                      setVerifyRemarks("");
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
                  >
                    Verify
                  </button>
                </div>
              ),
            },
          ]}
          data={actions}
          emptyMessage="No statutory regulatory directives on record."
        />
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Issue Statutory Regulatory Directive (DGMS)
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            <form onSubmit={handleIssue} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Target Mine Operation</label>
                <select
                  value={form.mine_id}
                  onChange={(e) => setForm({ ...form, mine_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                >
                  <option value={1}>Jharia Open Cast Pit 04 (JHA-OCP-04)</option>
                  <option value={2}>Raniganj Deep Underground Block A (RAN-UG-01)</option>
                  <option value={3}>Korba West Seam Sector 2 (KOR-OCP-02)</option>
                  <option value={4}>Singrauli Open Cast Area B (SIN-OCP-01)</option>
                  <option value={5}>Talcher Thermal Pit 1 (TAL-OCP-01)</option>
                  <option value={6}>Godavari Valley Incline 5 (GOD-UG-05)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Statutory Order Type</label>
                <select
                  value={form.action_type}
                  onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                >
                  <option value="REGULATORY_DIRECTION">REGULATORY DIRECTION (Sec 22/1)</option>
                  <option value="PROHIBITION_ORDER">PROHIBITION ORDER / STOP WORK (Sec 22/3)</option>
                  <option value="IMPROVEMENT_NOTICE">IMPROVEMENT NOTICE (Sec 22A)</option>
                  <option value="PENALTY_WARNING">PENALTY WARNING</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Order Content & Mandatory Rectification</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify statutory provisions violated and mandatory steps to be enforced immediately..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Required Evidence for Closure</label>
                <input
                  type="text"
                  required
                  value={form.required_evidence}
                  onChange={(e) => setForm({ ...form, required_evidence: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Compliance Deadline</label>
                <input
                  type="date"
                  required
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs shadow-xs"
                >
                  {submittingIssue ? "Transmitting Order..." : "Issue Statutory Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Verification Modal */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Statutory Action Verification & Review
              </h3>
              <button
                onClick={() => setVerifyTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{verifyTarget.action_id}</span>
                  <StatusBadge status={verifyTarget.status} />
                </div>
                <div className="text-slate-800 mt-1 text-xs">{verifyTarget.description}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Required: {verifyTarget.required_evidence}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Regulator Evaluation & Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Record formal statutory findings, sensor confirmation, or reasons for rejection..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={submittingVerify}
                  onClick={() => handleVerify("RETURNED_FOR_CORRECTION")}
                  className="px-4 py-2 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <XCircle className="w-4 h-4 text-amber-600" />
                  <span>Return for Correction</span>
                </button>
                <button
                  type="button"
                  disabled={submittingVerify}
                  onClick={() => handleVerify("ACCEPTED")}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept & Close Directive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
