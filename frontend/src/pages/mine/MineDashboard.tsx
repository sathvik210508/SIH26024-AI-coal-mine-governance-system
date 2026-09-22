import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  Truck, 
  AlertTriangle, 
  CheckSquare, 
  FileWarning, 
  ClipboardCheck, 
  TreePine, 
  BrainCircuit, 
  Flame, 
  Scan, 
  ArrowRight,
  ShieldCheck,
  Activity,
  Plus
} from "lucide-react";
import { api } from "../../services/api";
import { MetricCard } from "../../components/common/MetricCard";
import { StatusBadge } from "../../components/common/StatusBadge";

export const MineDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/mine/dashboard");
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

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const mine = data?.mine;
  const metrics = data?.metrics || {};
  const aiRisk = data?.ai_risk || {};

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Mine Overview */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0B0F17] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
              MINE ID: {mine?.code || "MINE-SNG"}
            </span>
            <StatusBadge status={mine?.status || "OPERATIONAL"} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
            {mine?.name || "Singrauli OpenCast Mega Mine"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registration: <span className="font-mono text-slate-300">{mine?.registration}</span> • Agent/Manager:{" "}
            <span className="text-slate-200">{mine?.manager}</span>
          </p>
        </div>

        {/* Compliance & Risk Index Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-lg bg-[#0E1420] border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Statutory Compliance</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {mine?.compliance_score || 92.5}%
            </span>
          </div>

          <div
            onClick={() => onNavigate("/mine/ai-risk")}
            className="px-4 py-2.5 rounded-lg bg-[#180C10] border border-red-900/60 text-right cursor-pointer hover:border-red-600 transition-colors"
          >
            <span className="text-[10px] text-red-400 uppercase font-mono block flex items-center justify-end gap-1">
              <BrainCircuit className="w-3 h-3" /> AI Risk Score
            </span>
            <span className="text-xl font-bold font-mono text-red-400">
              {mine?.risk_score || 38.5}/100
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (All Database Driven) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard
          title="Workers Present"
          value={`${metrics.workers_present || 0} / ${metrics.workers_total || 0}`}
          subtitle="Active Shift Muster"
          icon={Users}
          variant="default"
          onClick={() => onNavigate("/mine/workers")}
        />
        <MetricCard
          title="Active Machinery"
          value={`${metrics.active_machines || 0}`}
          subtitle={`${metrics.maintenance_due_machines || 0} Maintenance Due`}
          icon={Truck}
          variant={metrics.maintenance_due_machines > 0 ? "warning" : "default"}
          onClick={() => onNavigate("/mine/machinery")}
        />
        <MetricCard
          title="Open Violations"
          value={metrics.open_violations || 0}
          subtitle={`${metrics.critical_violations || 0} Critical Violations`}
          icon={FileWarning}
          variant={metrics.critical_violations > 0 ? "critical" : "warning"}
          onClick={() => onNavigate("/mine/violations")}
        />
        <MetricCard
          title="Overdue Corrective Actions"
          value={metrics.overdue_actions || 0}
          subtitle={`Total: ${metrics.open_actions || 0} in progress`}
          icon={CheckSquare}
          variant={metrics.overdue_actions > 0 ? "critical" : "info"}
          onClick={() => onNavigate("/mine/corrective-actions")}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate("/mine/inspections")}
          className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Inspections</span>
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {metrics.today_inspections || 0} Scheduled
          </div>
        </div>

        <div
          onClick={() => onNavigate("/mine/safety")}
          className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recent Incidents (30d)</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {metrics.recent_incidents || 0} Logged
          </div>
        </div>

        <div
          onClick={() => onNavigate("/mine/environment")}
          className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Environmental Breaches</span>
            <TreePine className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {metrics.environmental_alerts || 0} Telemetry Alert(s)
          </div>
        </div>

        <div
          onClick={() => onNavigate("/mine/documents")}
          className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Incomplete Documents</span>
            <Scan className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">
            {metrics.missing_documents_count || 0} Missing Required
          </div>
        </div>
      </div>

      {/* EXPLAINABLE AI RISK INTELLIGENCE CARD */}
      <div className="p-5 rounded-xl border border-amber-900/40 bg-gradient-to-b from-[#14100B] to-[#0B0F17] shadow-md space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Live AI Risk & Anomaly Assessment
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                  {aiRisk.risk_tier || "MEDIUM RISK"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{aiRisk.summary_explanation}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("/mine/ai-risk")}
            className="px-3 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold font-mono border border-amber-500/30 transition-colors flex items-center gap-1"
          >
            <span>Full Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Breakdown Factors (Never single unexplained numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {(aiRisk.contributing_factors || []).slice(0, 3).map((factor: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-[#090D15] border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>{factor.factor}</span>
                <span className="font-mono text-amber-400 font-bold">{factor.impact_percentage}% Impact</span>
              </div>
              <div className="font-mono font-semibold text-slate-200">{factor.metric_detail}</div>
              <div className="text-[10px] text-slate-500 font-mono">Trend: {factor.trend}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access: Open Violations Sample & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sample Violations */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-amber-400" />
              <span>Priority Open Violations</span>
            </h3>
            <button
              onClick={() => onNavigate("/mine/violations")}
              className="text-xs text-amber-400 hover:underline font-mono"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {(data?.open_violations_sample || []).map((v: any, idx: number) => (
              <div key={v.id || v.violation_id || idx} className="p-2.5 rounded bg-[#0E1420] border border-slate-800/80 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{v.violation_id}</span>
                    <span className="text-slate-300 font-medium">{v.category}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Deadline: {v.deadline}</div>
                </div>
                <StatusBadge status={v.severity} />
              </div>
            ))}
          </div>
        </div>

        {/* Sample Incidents */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0B0F17] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span>Recent Operational Incidents</span>
            </h3>
            <button
              onClick={() => onNavigate("/mine/incidents")}
              className="text-xs text-red-400 hover:underline font-mono"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {(data?.recent_incidents || []).map((inc: any, idx: number) => (
              <div key={inc.id || inc.incident_id || idx} className="p-2.5 rounded bg-[#0E1420] border border-slate-800/80 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-400">{inc.incident_id}</span>
                    <span className="text-slate-300 font-medium">{inc.incident_type}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{(inc.description || inc.title || "Incident reported").slice(0, 50)}...</div>
                </div>
                <StatusBadge status={inc.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
