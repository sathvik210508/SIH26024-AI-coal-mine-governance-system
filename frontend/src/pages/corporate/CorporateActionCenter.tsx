import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, RefreshCw, AlertTriangle, Filter, Calendar, ExternalLink } from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";

export const CorporateActionCenter: React.FC = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    mine_id: 1,
    description: "",
    assigned_person: "Chief Safety Officer",
    department: "Operations & Safety",
    priority: "HIGH",
    severity: "HIGH",
  });

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/corporate/actions");
      setActions(res.data || []);
    } catch (err) {
      console.error("Failed to load actions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCreateDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/corporate/actions", form);
      setShowModal(false);
      setForm({
        mine_id: 1,
        description: "",
        assigned_person: "Chief Safety Officer",
        department: "Operations & Safety",
        priority: "HIGH",
        severity: "HIGH",
      });
      fetchActions();
    } catch (err) {
      console.error("Failed to create corporate action:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = actions.filter((a) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "OVERDUE") {
      const isOverdue = new Date(a.deadline) < new Date() && a.status !== "CLOSED";
      return isOverdue;
    }
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Corporate Action & Directive Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              Directive Escalation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally issue, enforce, and track corrective action items and corporate compliance mandates across all mines.
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
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Corporate Directive</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {["ALL", "ASSIGNED", "IN_PROGRESS", "AWAITING_VERIFICATION", "CLOSED", "OVERDUE"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === s
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Actions Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <DataTable
          columns={[
            {
              header: "Action ID",
              accessor: (row: any) => (
                <div>
                  <span className="font-mono font-bold text-slate-900 text-xs">{row.action_id}</span>
                  <div className="text-[10px] font-mono text-slate-500">{row.source_type}</div>
                </div>
              ),
            },
            {
              header: "Description & Scope",
              accessor: (row: any) => (
                <div className="max-w-md">
                  <div className="text-xs text-slate-800 font-medium line-clamp-2">{row.description}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Assigned: {row.assigned_person} ({row.department})
                  </div>
                </div>
              ),
            },
            {
              header: "Priority",
              accessor: (row: any) => <StatusBadge status={row.priority} />,
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
                        OVERDUE
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              header: "Evidence",
              accessor: (row: any) => {
                if (!row.evidence_urls || row.evidence_urls.length === 0) {
                  return <span className="text-[10px] text-slate-400 font-mono">None</span>;
                }
                return (
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]">
                    {row.evidence_urls.length} Attached
                  </span>
                );
              },
            },
          ]}
          data={filtered}
          emptyMessage="No corporate directives or actions matching this filter."
        />
      </div>

      {/* Issue Corporate Directive Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Issue Corporate Safety Directive
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            <form onSubmit={handleCreateDirective} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Target Mine Operation</label>
                <select
                  value={form.mine_id}
                  onChange={(e) => setForm({ ...form, mine_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
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
                <label className="block text-slate-700 mb-1 font-semibold">Directive Mandate & Remedial Requirement</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the mandatory remedial action to be taken by the Mine Manager and technical staff..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Assigned Official</label>
                  <input
                    type="text"
                    value={form.assigned_person}
                    onChange={(e) => setForm({ ...form, assigned_person: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                >
                  {submitting ? "Transmitting Directive..." : "Issue Directive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
