import React, { useState, useEffect } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { api } from "../../services/api";
import { Inspection } from "../../types";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";

export const MineInspections: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [type, setType] = useState("ELECTRICAL");
  const [priority, setPriority] = useState("HIGH");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInspections = async () => {
    try {
      const res = await api.get("/mine/inspections");
      setInspections(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/mine/inspections", {
        inspection_type: type,
        priority,
        scheduled_date: scheduledDate,
        assigned_supervisor_id: 1, // Ramesh Kumar Sharma
        instructions,
        regulatory_reference: "DGMS Coal Mines Regulations 2017",
      });
      setSuccessMsg(`Inspection ${res.data.inspection_id} scheduled and assigned to Field Supervisor.`);
      setShowCreateModal(false);
      setInstructions("");
      fetchInspections();
    } catch {
      alert("Failed to schedule inspection.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: "Inspection ID",
      accessor: "inspection_id" as keyof Inspection,
      render: (row: Inspection) => (
        <span className="font-mono font-semibold text-slate-900">{row.inspection_id}</span>
      ),
    },
    {
      header: "Type",
      accessor: "inspection_type" as keyof Inspection,
      render: (row: Inspection) => (
        <span className="font-medium text-slate-800">{row.inspection_type}</span>
      ),
    },
    {
      header: "Priority",
      accessor: "priority" as keyof Inspection,
      render: (row: Inspection) => <StatusBadge status={row.priority} />,
    },
    {
      header: "Scheduled Date",
      accessor: "scheduled_date" as keyof Inspection,
      render: (row: Inspection) => <span className="font-mono text-slate-700">{row.scheduled_date}</span>,
    },
    {
      header: "Status",
      accessor: "status" as keyof Inspection,
      render: (row: Inspection) => <StatusBadge status={row.status} />,
    },
    {
      header: "Findings & Audit",
      render: (row: Inspection) => (
        <span className="font-mono text-xs text-slate-700">
          {row.status === "COMPLETED" ? (
            <span className="text-emerald-700 font-semibold">1 Finding Logged (FND-2026-0012)</span>
          ) : (
            <span className="text-slate-400">Assigned to Field</span>
          )}
        </span>
      ),
    },
    {
      header: "Assigned Role",
      render: () => <span className="font-mono text-slate-600">FIELD_SUPERVISOR</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
            STATUTORY INSPECTION MANAGEMENT
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5">
            Mine Inspections & Protocols
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Create, schedule, assign, and audit ground compliance checklists
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-md bg-slate-900 hover:bg-black text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Inspection</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-mono text-emerald-700 font-bold ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* Inspections Table */}
      <DataTable
        columns={columns}
        data={inspections}
        searchKey="inspection_id"
        searchPlaceholder="Filter by inspection ID..."
        loading={loading}
      />

      {/* Schedule Inspection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-slate-800" />
              <span>Schedule Statutory Inspection</span>
            </h3>

            <form onSubmit={handleCreateInspection} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Inspection Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="SAFETY">General Safety</option>
                    <option value="PPE">PPE Protocols</option>
                    <option value="ELECTRICAL">Electrical & Substation</option>
                    <option value="MACHINERY">Machinery & Haulage</option>
                    <option value="VENTILATION">Ventilation & Gases</option>
                    <option value="FIRE">Fire Protection</option>
                    <option value="ENVIRONMENT">Environmental Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Instructions for Assigned Supervisor *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specific focus areas, equipment tag numbers, or regulatory directives..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-black font-medium text-white shadow-xs"
                >
                  {submitting ? "Assigning..." : "Assign to Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
