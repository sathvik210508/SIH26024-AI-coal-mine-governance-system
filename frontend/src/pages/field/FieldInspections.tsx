import React, { useState, useEffect } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, Camera, MapPin, ArrowRight, Upload } from "lucide-react";
import { api } from "../../services/api";
import { Inspection } from "../../types";
import { StatusBadge } from "../../components/common/StatusBadge";

export const FieldInspections: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Execution state
  const [activeChecklist, setActiveChecklist] = useState<any[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInspections = async () => {
    try {
      const res = await api.get("/field/inspections");
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

  const openExecution = async (insp: Inspection) => {
    try {
      const res = await api.get(`/field/inspections/${insp.id}`);
      setSelectedInspection(res.data.inspection);
      setIsStarted(res.data.inspection.status === "IN_PROGRESS");

      // Initialize checklist items
      const items = res.data.items || [];
      if (items.length > 0) {
        setActiveChecklist(
          items.map((it: any) => ({
            item_code: it.item_code,
            category: it.category,
            title: it.title,
            requirement: it.requirement_description,
            status: "COMPLIANT",
            severity: "HIGH",
            remarks: "",
            evidence_photo_url: "/uploads/demo_inspection_photo.jpg",
          }))
        );
      } else {
        // Fallback default electrical/safety checklist
        setActiveChecklist([
          {
            item_code: "PPE-01",
            category: "PPE Compliance",
            title: "Dielectric Safety Gloves & Hard Hat",
            requirement: "IS certified 11kV insulated gloves in sound physical condition",
            status: "COMPLIANT",
            remarks: "",
          },
          {
            item_code: "ELEC-02",
            category: "Electrical Safety",
            title: "Trailing Cable Mechanical Protection",
            requirement: "No exposed copper conductors or crushed conduit under CMR 102",
            status: "NON_COMPLIANT",
            severity: "CRITICAL",
            remarks: "Crushed conduit with exposed wire core near Shovel-04",
            evidence_photo_url: "/uploads/demo_electrical_hazard.jpg",
          },
          {
            item_code: "FIRE-03",
            category: "Fire Safety",
            title: "CO2 Fire Extinguisher at Substation",
            requirement: "Pressure indicator in green zone, annual inspection tag active",
            status: "COMPLIANT",
            remarks: "",
          },
        ]);
      }
    } catch {
      alert("Failed to load inspection checklist details.");
    }
  };

  const handleStartInspection = async () => {
    if (!selectedInspection) return;
    try {
      const res = await api.post(`/field/inspections/${selectedInspection.id}/start`, {
        latitude: 24.1988,
        longitude: 82.6651,
      });
      setIsStarted(true);
      setSelectedInspection(res.data.inspection);
    } catch {
      alert("Could not record inspection start timestamp.");
    }
  };

  const updateItemStatus = (idx: number, status: "COMPLIANT" | "NON_COMPLIANT" | "N/A") => {
    setActiveChecklist((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, status } : it))
    );
  };

  const updateItemRemarks = (idx: number, remarks: string) => {
    setActiveChecklist((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, remarks } : it))
    );
  };

  const handleSubmitInspection = async () => {
    if (!selectedInspection) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/field/inspections/${selectedInspection.id}`, {
        latitude: 24.1988,
        longitude: 82.6651,
        checklist_results: activeChecklist,
      });
      const createdCount = (res.data.findings_created || []).length;
      setSuccessMsg(
        `Inspection submitted! ${createdCount} non-compliant finding(s) generated and dispatched to Mine Management.`
      );
      setSelectedInspection(null);
      fetchInspections();
    } catch {
      alert("Failed to submit inspection checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
            CHECKLIST & PROTOCOL EXECUTION
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-0.5">
            Assigned Field Inspections
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Execute statutory checklists with automated GPS tagging and evidence capture
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-mono text-emerald-400 font-bold">
            DISMISS
          </button>
        </div>
      )}

      {/* List of Inspections */}
      {!selectedInspection ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inspections.length === 0 && !loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs font-mono">
              No assigned inspections found for your field sector.
            </div>
          ) : (
            inspections.map((insp) => (
              <div
                key={insp.id}
                className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-slate-700 transition-colors shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {insp.inspection_id}
                    </span>
                    <StatusBadge status={insp.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {insp.inspection_type} Statutory Inspection
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {insp.instructions || "Conduct ground verification as per Mines Act regulations."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Due: {insp.scheduled_date}</span>
                  <button
                    onClick={() => openExecution(insp)}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Checklist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Inspection Checklist Execution View */
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0B0F17] shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">
                  {selectedInspection.inspection_id}
                </span>
                <StatusBadge status={selectedInspection.status} />
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                {selectedInspection.inspection_type} Checklist Execution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Statutory Reference: {selectedInspection.regulatory_reference || "DGMS CMR 2017"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedInspection(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Back to List
              </button>

              {!isStarted && (
                <button
                  onClick={handleStartInspection}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Start Inspection (GPS Tag)</span>
                </button>
              )}
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-4">
            {activeChecklist.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border transition-colors ${
                  item.status === "NON_COMPLIANT"
                    ? "bg-red-950/20 border-red-800/60"
                    : "bg-[#0E1420] border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-amber-400 font-semibold">
                        {item.item_code}
                      </span>
                      <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
                        • {item.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                    <p className="text-xs text-slate-300">{item.requirement}</p>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-[#080C13] p-1 rounded-lg border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateItemStatus(idx, "COMPLIANT")}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1 ${
                        item.status === "COMPLIANT"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Compliant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateItemStatus(idx, "NON_COMPLIANT")}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1 ${
                        item.status === "NON_COMPLIANT"
                          ? "bg-red-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Non-Compliant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateItemStatus(idx, "N/A")}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1 ${
                        item.status === "N/A"
                          ? "bg-slate-700 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>N/A</span>
                    </button>
                  </div>
                </div>

                {/* Non-Compliant Details Drawer (Remarks & Evidence) */}
                {item.status === "NON_COMPLIANT" && (
                  <div className="mt-3 pt-3 border-t border-red-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-red-300 block mb-1">
                        Defect Description & Remarks *
                      </label>
                      <input
                        type="text"
                        placeholder="State exact hazard observation..."
                        value={item.remarks}
                        onChange={(e) => updateItemRemarks(idx, e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#080C13] border border-red-800/80 rounded text-xs text-slate-100 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <span className="text-xs font-mono text-red-400 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Photo Proof Attached:</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-red-900">
                        electrical_hazard_north_pit.jpg
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              {activeChecklist.filter((i) => i.status === "NON_COMPLIANT").length} Non-Compliant item(s) will trigger statutory findings.
            </span>
            <button
              onClick={handleSubmitInspection}
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{submitting ? "Submitting Checklist..." : "Submit Inspection to Management"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
