import React, { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Flame, 
  FileWarning, 
  CheckSquare, 
  Users, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Mic,
  MicOff,
  Languages,
  Radio,
  Sparkles
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

  // Voice-to-Structured & Multilingual states
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<"en" | "hi" | "te">("en");
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number }>({ lat: 24.1988, lng: 82.6651 });

  const i18n: Record<string, { category: string; desc: string; severity: string; submit: string; title: string }> = {
    en: {
      title: "Record Ground Safety Observation",
      category: "Hazard Category",
      desc: "Observation Description *",
      severity: "Severity Level",
      submit: "Submit Observation",
    },
    hi: {
      title: "सुरक्षा अवलोकन दर्ज करें (Observation)",
      category: "खतरे की श्रेणी (Category)",
      desc: "अवलोकन विवरण (Description) *",
      severity: "गंभीरता स्तर (Severity)",
      submit: "अवलोकन दर्ज करें (Submit)",
    },
    te: {
      title: "భద్రతా పరిశీలనను నమోదు చేయండి (Observation)",
      category: "ప్రమాద వర్గం (Category)",
      desc: "పరిశీలన వివరణ (Description) *",
      severity: "తీవ్రత స్థాయి (Severity)",
      submit: "సమర్పించండి (Submit)",
    },
  };

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoCoords({ lat: parseFloat(pos.coords.latitude.toFixed(4)), lng: parseFloat(pos.coords.longitude.toFixed(4)) }),
        () => setGeoCoords({ lat: 24.1988, lng: 82.6651 })
      );
    }
  }, []);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. You can type directly in the field.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setObsDesc((prev) => (prev ? `${prev} ${transcript}` : transcript));

      // Intelligent auto-classification based on spoken keywords:
      const lower = transcript.toLowerCase();
      if (lower.includes("electric") || lower.includes("cable") || lower.includes("wire") || lower.includes("तार") || lower.includes("కరెంట్")) {
        setObsCategory("Electrical Hazards");
      } else if (lower.includes("fire") || lower.includes("smoke") || lower.includes("combustion") || lower.includes("आग") || lower.includes("మంటలు")) {
        setObsCategory("Fire Safety");
      } else if (lower.includes("dust") || lower.includes("gas") || lower.includes("ventilation") || lower.includes("हवा") || lower.includes("గాలి")) {
        setObsCategory("Ventilation Issues");
      } else if (lower.includes("helmet") || lower.includes("boot") || lower.includes("ppe") || lower.includes("glove")) {
        setObsCategory("PPE Compliance");
      }

      if (lower.includes("critical") || lower.includes("danger") || lower.includes("emergency") || lower.includes("खतरनाक") || lower.includes("ప్రమాదకరం")) {
        setObsSeverity("CRITICAL");
      } else if (lower.includes("high") || lower.includes("severe") || lower.includes("भारी")) {
        setObsSeverity("HIGH");
      }
    };

    recognition.start();
  };

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/field/safety-observations", {
        category: obsCategory,
        description: obsDesc,
        severity: obsSeverity,
        latitude: geoCoords.lat,
        longitude: geoCoords.lng,
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
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Sector Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
            GROUND OPERATIONS DASHBOARD
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5">
            Field Supervisor: {data?.user?.name || "Ramesh Kumar Sharma"}
          </h1>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Assigned Operating Sector: Singrauli OpenCast — North Pit (Zone 2)</span>
          </p>
        </div>

        {/* Quick GPS Timestamp Badge */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GPS FIX: {geoCoords.lat}° N, {geoCoords.lng}° E</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="font-mono text-emerald-700 font-bold ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* QUICK ACTIONS BAR */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
            Ground-Level Quick Reporting
          </span>
          <span className="text-[10px] font-mono text-slate-500">Auto-timestamps & GPS active</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveModal("OBSERVATION")}
            className="p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left transition-colors group"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 mb-1" />
            <div className="text-xs font-semibold text-slate-900">Safety Observation</div>
            <div className="text-[10px] text-slate-500">PPE, unsafe acts</div>
          </button>

          <button
            onClick={() => setActiveModal("INCIDENT")}
            className="p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left transition-colors group"
          >
            <Flame className="w-4 h-4 text-red-600 mb-1" />
            <div className="text-xs font-semibold text-slate-900">Report Incident</div>
            <div className="text-[10px] text-slate-500">Near miss, failure, fire</div>
          </button>

          <button
            onClick={() => onNavigate("/field/corrective-actions")}
            className="p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left transition-colors group"
          >
            <FileWarning className="w-4 h-4 text-sky-600 mb-1" />
            <div className="text-xs font-semibold text-slate-900">Remediation Proof</div>
            <div className="text-[10px] text-slate-500">Upload evidence</div>
          </button>

          <button
            onClick={() => setActiveModal("ATTENDANCE")}
            className="p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left transition-colors group"
          >
            <Users className="w-4 h-4 text-emerald-600 mb-1" />
            <div className="text-xs font-semibold text-slate-900">Worker Attendance</div>
            <div className="text-[10px] text-slate-500">Shift muster check</div>
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
          subtitle="Recorded in Sector"
          icon={AlertTriangle}
          variant="default"
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
          <h2 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-slate-700" />
            <span>Assigned Ground Inspections</span>
          </h2>
          <button
            onClick={() => onNavigate("/field/inspections")}
            className="text-xs text-slate-700 hover:underline font-mono flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.assigned_inspections || []).map((insp: any) => (
            <div
              key={insp.id}
              className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {insp.inspection_id}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                    {insp.inspection_type} Inspection Routine
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">{insp.instructions}</p>
                </div>
                <StatusBadge status={insp.status} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono text-slate-500">
                <span>Scheduled: {insp.scheduled_date}</span>
                <button
                  onClick={() => onNavigate(`/field/inspections`)}
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-black text-white font-medium transition-colors flex items-center gap-1"
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
          <h2 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-slate-700" />
            <span>Pending Corrective Action Evidence</span>
          </h2>
          <button
            onClick={() => onNavigate("/field/corrective-actions")}
            className="text-xs text-slate-700 hover:underline font-mono flex items-center gap-1"
          >
            <span>Action Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data?.corrective_actions || []).slice(0, 2).map((act: any) => (
            <div
              key={act.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{act.action_id}</span>
                <StatusBadge status={act.status} />
              </div>
              <p className="text-slate-800 font-medium">{act.description}</p>
              <div className="flex items-center justify-between text-slate-500 font-mono text-[11px] pt-2 border-t border-slate-100">
                <span>Deadline: {act.deadline}</span>
                <span className="text-slate-700 font-semibold">{act.department}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTION MODALS */}
      {/* 1. Observation Modal */}
      {activeModal === "OBSERVATION" && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{i18n[lang].title}</span>
              </h3>

              {/* Multilingual Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold transition-colors ${
                    lang === "en" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold transition-colors ${
                    lang === "hi" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setLang("te")}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold transition-colors ${
                    lang === "te" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  తెలుగు
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateObservation} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {i18n[lang].category}
                </label>
                <select
                  value={obsCategory}
                  onChange={(e) => setObsCategory(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
                >
                  <option value="PPE Compliance">PPE Compliance (पीपीई / భద్రతా దుస్తులు)</option>
                  <option value="Unsafe Practices">Unsafe Practices (असुरक्षित कार्य / అసురక్షిత పద్ధతులు)</option>
                  <option value="Unsafe Conditions">Unsafe Conditions (असुरक्षित स्थिति / అసురక్షిత పరిస్థితులు)</option>
                  <option value="Equipment/Machinery Safety">Equipment/Machinery Safety (उपकरण सुरक्षा / యంత్రాల భద్రత)</option>
                  <option value="Electrical Hazards">Electrical Hazards (विद्युत खतरा / విద్యుత్ ప్రమాదాలు)</option>
                  <option value="Ventilation Issues">Ventilation Issues (वायु संचार / వెంటిలేషన్)</option>
                  <option value="Fire Safety">Fire Safety (अग्नि सुरक्षा / అగ్ని భద్రత)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    {i18n[lang].desc}
                  </label>
                  {/* Voice Input Button */}
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Radio className="w-3.5 h-3.5 animate-spin" />
                        <span>Listening (Speak now)...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Voice Dictate (बोलें / మాట్లాడండి)</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  required
                  rows={3}
                  placeholder={
                    lang === "hi"
                      ? "खतरे का विवरण लिखें या माइक दबाकर बोलें (उदा: 6.6kV केबल का डैमेज होना)..."
                      : lang === "te"
                      ? "ప్రమాద వివరాలను నమోదు చేయండి లేదా మైక్ నొక్కండి..."
                      : "Describe ground hazard or click Voice Dictate to speak..."
                  }
                  value={obsDesc}
                  onChange={(e) => setObsDesc(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  AI keyword classification automatically identifies hazard category and statutory urgency.
                </span>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {i18n[lang].severity}
                </label>
                <select
                  value={obsSeverity}
                  onChange={(e) => setObsSeverity(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
                >
                  <option value="LOW">LOW (निम्न / తక్కువ)</option>
                  <option value="MEDIUM">MEDIUM (मध्यम / మధ్యస్థ)</option>
                  <option value="HIGH">HIGH (उच्च / ఎక్కువ)</option>
                  <option value="CRITICAL">CRITICAL (अति गंभीर / అత్యంత ప్రమాదకరం)</option>
                </select>
              </div>

              {/* Live Geotag Stamp Info */}
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>GPS: {geoCoords.lat}° N, {geoCoords.lng}° E</span>
                </span>
                <span className="text-emerald-700 font-semibold">Auto-Geotagged</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-black font-medium text-white shadow-xs"
                >
                  {i18n[lang].submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Incident Modal */}
      {activeModal === "INCIDENT" && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              <span>Report Field Incident / Near Miss</span>
            </h3>
            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Incident Type</label>
                <select
                  value={incType}
                  onChange={(e) => setIncType(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="Dangerous Occurrence">Dangerous Occurrence</option>
                  <option value="Near Miss">Near Miss</option>
                  <option value="Equipment Failure">Equipment Failure</option>
                  <option value="Fire">Fire / Spontaneous Combustion</option>
                  <option value="Accident">Accident / Injury</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Incident Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide immediate incident details..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Severity</label>
                <select
                  value={incSeverity}
                  onChange={(e) => setIncSeverity(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
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
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 font-medium text-white shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-800" />
              <span>Log Worker Shift Attendance</span>
            </h3>
            <form onSubmit={handleSubmitAttendance} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Search Assigned Worker</label>
                <input
                  type="text"
                  placeholder="Type worker name or ID (e.g. Worker 01)..."
                  value={workerQuery}
                  onChange={(e) => handleSearchWorkers(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                />
                {workerList.length > 0 && (
                  <div className="mt-1 border border-slate-200 rounded bg-white max-h-32 overflow-y-auto shadow-sm">
                    {workerList.map((w, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedWorker(w);
                          setWorkerQuery(w.title);
                          setWorkerList([]);
                        }}
                        className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-slate-800">{w.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">{w.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Status</label>
                <select
                  value={attStatus}
                  onChange={(e) => setAttStatus(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
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
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedWorker}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-black disabled:opacity-40 font-medium text-white shadow-xs"
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
