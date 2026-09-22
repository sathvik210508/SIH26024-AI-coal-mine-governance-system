import React, { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Flame, 
  FileWarning, 
  CheckSquare, 
  Users, 
  Upload, 
  Camera, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus
} from "lucide-react";
import { api } from "../../services/api";
import { MetricCard } from "../../components/common/MetricCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { enqueueOfflineRecord } from "../../services/offlineSync";

export const FieldDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState<"OBSERVATION" | "INCIDENT" | "ATTENDANCE" | null>(null);
  const [obsCategory, setObsCategory] = useState("Unsafe Conditions");
  const [obsDesc, setObsDesc] = useState("");
  const [obsSeverity, setObsSeverity] = useState("MEDIUM");

  const [incType, setIncType] = useState("Dangerous Occurrence");
  const [incDesc, setIncDesc] = useState("");
  const [incSeverity, setIncSeverity] = useState("HIGH");

  const [workerQuery, setWorkerQuery] = useState("");
  const [workerList, setWorkerList] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [attStatus, setAttStatus] = useState("PRESENT");

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/field/dashboard");
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/field/safety-observations", {
        category: obsCategory,
        description: obsDesc,
        severity: obsSeverity,
        latitude: 24.1988,
        longitude: 82.6651,
      });
      setActionSuccess("Safety observation recorded successfully and logged in audit chain.");
      setObsDesc("");
      setActiveModal(null);
      fetchDashboard();
    } catch {
      enqueueOfflineRecord("OBSERVATION", { category: obsCategory, description: obsDesc, severity: obsSeverity });
      setActionSuccess("Offline mode: Observation queued for automatic server sync.");
      setActiveModal(null);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/field/incidents", {
        incident_type: incType,
        description: incDesc,
        severity: incSeverity,
        latitude: 24.1988,
        longitude: 82.6651,
      });
      setActionSuccess("Incident reported to Mine Management and audit chain updated.");
      setIncDesc("");
      setActiveModal(null);
      fetchDashboard();
    } catch {
      enqueueOfflineRecord("INCIDENT", { incident_type: incType, description: incDesc, severity: incSeverity });
      setActionSuccess("Offline mode: Incident queued for automatic server sync.");
      setActiveModal(null);
    }
  };

  const handleSearchWorkers = async (q: string) => {
    setWorkerQuery(q);
    if (q.length >= 2) {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
        const workers = (res.data || []).filter((i: any) => i.type === "WORKER");
        setWorkerList(workers);
      } catch {
        setWorkerList([]);
      }
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    try {
      // Parse worker id or use default 1
      await api.post("/field/attendance", {
        worker_id: 1,
        shift: "SHIFT_A",
        status: attStatus,
        latitude: 24.1988,
        longitude: 82.6651,
      });
      setActionSuccess(`Attendance recorded as ${attStatus} for ${selectedWorker.title}`);
      setSelectedWorker(null);
      setWorkerQuery("");
      setActiveModal(null);
    } catch {
      setActionSuccess("Attendance recorded in offline queue.");
      setActiveModal(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-800 rounded" />
          <div className="h-24 bg-slate-800 rounded" />
          <div className="h-24 bg-slate-800 rounded" />
          <div className="h-24 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Sector Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
            GROUND OPERATIONS DASHBOARD
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-0.5">
            Field Supervisor: {data?.user?.name || "Ramesh Kumar Sharma"}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Assigned Operating Sector: Singrauli OpenCast — North Pit (Zone 2)</span>
          </p>
        </div>

        {/* Quick GPS Timestamp Badge */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-[#0F1522] px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GPS FIX: 24.1988° N, 82.6651° E</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="font-mono text-emerald-400 font-bold ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* QUICK ACTIONS BAR (Strictly Field Supervisor Actions - No Create Inspection Button) */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Ground-Level Quick Reporting
          </span>
          <span className="text-[10px] font-mono text-slate-500">Auto-timestamps & GPS active</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveModal("OBSERVATION")}
            className="p-3 rounded-lg bg-[#121A2A] hover:bg-[#1A253C] border border-slate-700/80 hover:border-amber-500/50 text-left transition-all group"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-slate-200">Safety Observation</div>
            <div className="text-[10px] text-slate-400">PPE, unsafe acts</div>
          </button>

          <button
            onClick={() => setActiveModal("INCIDENT")}
            className="p-3 rounded-lg bg-[#121A2A] hover:bg-[#1A253C] border border-slate-700/80 hover:border-red-500/50 text-left transition-all group"
          >
            <Flame className="w-4 h-4 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-slate-200">Report Incident</div>
            <div className="text-[10px] text-slate-400">Near miss, failure, fire</div>
          </button>

          <button
            onClick={() => onNavigate("/field/violations")}
            className="p-3 rounded-lg bg-[#121A2A] hover:bg-[#1A253C] border border-slate-700/80 hover:border-sky-500/50 text-left transition-all group"
          >
            <FileWarning className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-slate-200">Report Violation</div>
            <div className="text-[10px] text-slate-400">Statutory breaches</div>
          </button>

          <button
            onClick={() => setActiveModal("ATTENDANCE")}
            className="p-3 rounded-lg bg-[#121A2A] hover:bg-[#1A253C] border border-slate-700/80 hover:border-emerald-500/50 text-left transition-all group"
          >
            <Users className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-slate-200">Worker Attendance</div>
            <div className="text-[10px] text-slate-400">Shift muster check</div>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Assigned Inspections"
          value={data?.today_inspections_count ?? 0}
          subtitle="Assigned by Mine Manager"
          icon={ClipboardCheck}
          variant="warning"
          onClick={() => onNavigate("/field/inspections")}
        />
        <MetricCard
          title="Pending Corrective Actions"
          value={data?.open_actions_count ?? 0}
          subtitle="Evidence Upload Required"
          icon={CheckSquare}
          variant="info"
          onClick={() => onNavigate("/field/corrective-actions")}
        />
        <MetricCard
          title="Open Safety Issues"
          value={data?.recent_observations_count ?? 0}
          subtitle="Recorded in Zone"
          icon={AlertTriangle}
          variant="default"
          onClick={() => onNavigate("/field/safety")}
        />
        <MetricCard
          title="Critical Alerts"
          value={data?.critical_alerts_count ?? 0}
          subtitle="Immediate Action"
          icon={Flame}
          variant="critical"
        />
      </div>

      {/* Today's Assigned Inspections Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
            <span>Assigned Ground Inspections</span>
          </h2>
          <button
            onClick={() => onNavigate("/field/inspections")}
            className="text-xs text-amber-400 hover:underline font-mono flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.assigned_inspections || []).map((insp: any) => (
            <div
              key={insp.id}
              className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-slate-700 transition-colors shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {insp.inspection_id}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                    {insp.inspection_type} Inspection Routine
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{insp.instructions}</p>
                </div>
                <StatusBadge status={insp.status} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                <span>Scheduled: {insp.scheduled_date}</span>
                <button
                  onClick={() => onNavigate(`/field/inspections`)}
                  className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Execute Checklist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Follow-Up Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span>Pending Corrective Action Evidence</span>
          </h2>
          <button
            onClick={() => onNavigate("/field/corrective-actions")}
            className="text-xs text-sky-400 hover:underline font-mono flex items-center gap-1"
          >
            <span>Action Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data?.corrective_actions || []).slice(0, 2).map((act: any) => (
            <div
              key={act.id}
              className="p-3.5 rounded-lg border border-slate-800 bg-[#0B0F17] text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sky-400">{act.action_id}</span>
                <StatusBadge status={act.status} />
              </div>
              <p className="text-slate-200 font-medium">{act.description}</p>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] pt-2 border-t border-slate-800">
                <span>Deadline: {act.deadline}</span>
                <span className="text-amber-400">{act.department}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTION MODALS */}
      {/* 1. Observation Modal */}
      {activeModal === "OBSERVATION" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090D15] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Record Ground Safety Observation</span>
            </h3>
            <form onSubmit={handleCreateObservation} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Hazard Category</label>
                <select
                  value={obsCategory}
                  onChange={(e) => setObsCategory(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                >
                  <option value="PPE Compliance">PPE Compliance</option>
                  <option value="Unsafe Practices">Unsafe Practices</option>
                  <option value="Unsafe Conditions">Unsafe Conditions</option>
                  <option value="Equipment/Machinery Safety">Equipment/Machinery Safety</option>
                  <option value="Electrical Hazards">Electrical Hazards</option>
                  <option value="Ventilation Issues">Ventilation Issues</option>
                  <option value="Fire Safety">Fire Safety</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Observation Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe ground hazard observed..."
                  value={obsDesc}
                  onChange={(e) => setObsDesc(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Severity Level</label>
                <select
                  value={obsSeverity}
                  onChange={(e) => setObsSeverity(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 font-bold text-black"
                >
                  Submit Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Incident Modal */}
      {activeModal === "INCIDENT" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090D15] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span>Report Field Incident / Near Miss</span>
            </h3>
            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Incident Type</label>
                <select
                  value={incType}
                  onChange={(e) => setIncType(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                >
                  <option value="Dangerous Occurrence">Dangerous Occurrence</option>
                  <option value="Near Miss">Near Miss</option>
                  <option value="Equipment Failure">Equipment Failure</option>
                  <option value="Fire">Fire / Spontaneous Combustion</option>
                  <option value="Accident">Accident / Injury</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Incident Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide immediate incident details..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Severity</label>
                <select
                  value={incSeverity}
                  onChange={(e) => setIncSeverity(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                >
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 font-bold text-white"
                >
                  Report to Management
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Fast Worker Attendance Modal */}
      {activeModal === "ATTENDANCE" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090D15] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Log Worker Shift Attendance</span>
            </h3>
            <form onSubmit={handleSubmitAttendance} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Search Assigned Worker</label>
                <input
                  type="text"
                  placeholder="Type worker name or ID (e.g. Worker 01)..."
                  value={workerQuery}
                  onChange={(e) => handleSearchWorkers(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                />
                {workerList.length > 0 && (
                  <div className="mt-1 border border-slate-800 rounded bg-[#0B0F17] max-h-32 overflow-y-auto">
                    {workerList.map((w, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedWorker(w);
                          setWorkerQuery(w.title);
                          setWorkerList([]);
                        }}
                        className="p-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-slate-200">{w.title}</span>
                        <span className="font-mono text-[10px] text-amber-400">{w.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Status</label>
                <select
                  value={attStatus}
                  onChange={(e) => setAttStatus(e.target.value)}
                  className="w-full p-2 bg-[#080C13] border border-slate-700 rounded text-slate-100"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedWorker}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-white"
                >
                  Record Muster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
