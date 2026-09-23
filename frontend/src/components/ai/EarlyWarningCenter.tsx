import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Filter, 
  Flame, 
  Building2, 
  Search,
  ExternalLink
} from "lucide-react";
import { api } from "../../services/api";
import { EarlyWarning } from "../../types";
import { StatusBadge } from "../common/StatusBadge";

interface EarlyWarningCenterProps {
  mineId?: number;
  onSelectRecord?: (entityType: string, entityId: string) => void;
}

export const EarlyWarningCenter: React.FC<EarlyWarningCenterProps> = ({
  mineId,
  onSelectRecord,
}) => {
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const url = mineId ? `/ai/early-warnings?mine_id=${mineId}` : "/ai/early-warnings";
      const res = await api.get(url);
      setWarnings(res.data || []);
    } catch (err) {
      console.error("Failed to load early warnings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, [mineId]);

  const filteredWarnings = warnings.filter((w) => {
    if (selectedFilter !== "ALL" && w.risk_level !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.title.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.mine_name.toLowerCase().includes(q) ||
        w.detected_pattern.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-900 text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold font-mono text-slate-900">
              AI Early Warning & Predictive Risk Center
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              PROACTIVE SURVEILLANCE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous multi-factor detection identifying latent operational risks before statutory breach escalation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWarnings}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refresh AI Models"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedFilter(lvl)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                selectedFilter === lvl
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lvl} {lvl === "ALL" ? `(${warnings.length})` : `(${warnings.filter((w) => w.risk_level === lvl).length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search pattern, mine, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
          />
        </div>
      </div>

      {/* Warnings List */}
      {loading ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500">Evaluating multi-mine sensory & violation telemetry...</p>
        </div>
      ) : filteredWarnings.length === 0 ? (
        <div className="p-8 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
          <div className="text-xs font-bold text-slate-800">No Active Early Warnings</div>
          <p className="text-[11px] text-slate-500 font-mono">
            All operational indicators, environmental sensors, and corrective remediation velocity are within safe limits.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWarnings.map((warn) => {
            const isCrit = warn.risk_level === "CRITICAL";
            return (
              <div
                key={warn.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCrit
                    ? "bg-rose-50/40 border-rose-200 hover:border-rose-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                } shadow-xs space-y-3`}
              >
                {/* Top card row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {warn.id}
                    </span>
                    <StatusBadge status={warn.risk_level} />
                    <span className="text-xs font-semibold text-slate-600 font-mono">
                      {warn.mine_name} &bull; {warn.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Risk Score</span>
                      <span className={`text-sm font-bold font-mono ${isCrit ? "text-rose-700" : "text-amber-700"}`}>
                        {warn.risk_score}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Title & Pattern */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{warn.title}</h3>
                  <div className="p-2.5 rounded-md bg-white border border-slate-200/80 mt-1.5 text-xs text-slate-700 font-mono space-y-1">
                    <div><b>Detected Pattern:</b> {warn.detected_pattern}</div>
                    <div className="text-slate-600"><b>Underlying Cause:</b> {warn.reason}</div>
                  </div>
                </div>

                {/* Factors & Recommended Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Contributing Factors
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {warn.contributing_factors.map((fac, idx) => (
                        <li key={idx} className="truncate">{fac}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 uppercase mb-1">
                        AI Recommended Governance Action
                      </div>
                      <div className="text-slate-800 text-[11px] font-medium leading-relaxed">
                        {warn.recommended_action}
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Authority: <b className="text-slate-800">{warn.responsible_role}</b></span>
                      {onSelectRecord && (
                        <button
                          onClick={() => onSelectRecord(warn.related_entity, warn.related_id)}
                          className="font-bold text-slate-900 hover:underline flex items-center gap-1"
                        >
                          Inspect Underlying Records <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
