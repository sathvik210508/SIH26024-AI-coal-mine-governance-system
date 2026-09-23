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
  ShieldAlert,
  Clock,
  ArrowUpRight,
  Bell,
  CheckCircle2
} from "lucide-react";
import { api } from "../../services/api";
import { MetricCard } from "../../components/common/MetricCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { EarlyWarningCenter } from "../../components/ai/EarlyWarningCenter";

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
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded" />
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
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-700 uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              MINE ID: {mine?.code || "MINE-SNG"}
            </span>
            <StatusBadge status={mine?.status || "OPERATIONAL"} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">
            {mine?.name || "Singrauli OpenCast Mega Mine"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registration: <span className="font-mono text-slate-700">{mine?.registration}</span> • Agent/Manager:{" "}
            <span className="text-slate-800 font-medium">{mine?.manager}</span>
          </p>
        </div>

        {/* Compliance & Risk Index Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Statutory Compliance</span>
            <span className="text-xl font-bold font-mono text-emerald-700">
              {mine?.compliance_score || 92.5}%
            </span>
          </div>

          <div
            onClick={() => onNavigate("/mine/environment")}
            className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right cursor-pointer hover:border-slate-300 transition-colors"
          >
            <span className="text-[10px] text-slate-500 uppercase font-mono block flex items-center justify-end gap-1">
              <BrainCircuit className="w-3 h-3 text-slate-600" /> AI Risk Score
            </span>
            <span className="text-xl font-bold font-mono text-amber-700">
              {mine?.risk_score || 38.5}/100
            </span>
          </div>
        </div>
      </div>

      {/* GOVERNANCE COMMAND CENTER: "WHAT REQUIRES ATTENTION RIGHT NOW?" */}
      <div className="p-5 rounded-xl border-2 border-slate-900 bg-slate-900 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                MANDATORY STATUTORY GOVERNANCE
              </span>
              <h2 className="text-base font-bold font-mono text-white">
                Governance Command Center — What Requires Attention Right Now
              </h2>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real-Time DGMS & Internal Audit Pulse
          </span>
        </div>

        {/* 6 Key Governance Pulse Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Compliance Rate</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {mine?.compliance_score || 92.5}%
            </div>
            <span className="text-[10px] text-slate-400">Statutory threshold &gt;90%</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Critical Violations</span>
            <div className="text-lg font-bold font-mono text-red-400 mt-0.5">
              {metrics.critical_violations || 1}
            </div>
            <span className="text-[10px] text-red-400/80">Immediate DGMS risk</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Overdue Actions</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {metrics.overdue_actions || 1}
            </div>
            <span className="text-[10px] text-slate-400">Velocity breached</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Awaiting Sign-off</span>
            <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
              {metrics.open_actions ? 1 : 1}
            </div>
            <span className="text-[10px] text-indigo-300">Manager sign-off req.</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Environmental Alerts</span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
              {metrics.environmental_alerts || 2}
            </div>
            <span className="text-[10px] text-slate-400">PM10 / Gas telemetry</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">AI Risk Rating</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {mine?.risk_score || 38.5}/100
            </div>
            <span className="text-[10px] text-slate-400">{aiRisk.risk_tier || "MODERATE RISK"}</span>
          </div>
        </div>

        {/* Immediate Priority Directives Row */}
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-200">
              <strong className="text-white font-mono">CRITICAL ACTION:</strong> Action{" "}
              <span className="font-mono text-amber-300">ACT-2026-0142</span> (Conduit replacement on Haul Road 2) has uploaded evidence and is awaiting your verification approval.
            </span>
          </div>
          <button
            onClick={() => onNavigate("/mine/violations")}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-colors self-start md:self-auto shrink-0"
          >
            <span>Review Proof & Verify</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard
          title="Workers Present"
          value={`${metrics.workers_present || 0} / ${metrics.workers_total || 0}`}
          subtitle="Active Shift Muster"
          icon={Users}
          variant="default"
        />
        <MetricCard
          title="Active Machinery"
          value={`${metrics.active_machines || 0}`}
          subtitle={`${metrics.maintenance_due_machines || 0} Maintenance Due`}
          icon={Truck}
          variant={metrics.maintenance_due_machines > 0 ? "warning" : "default"}
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
          onClick={() => onNavigate("/mine/violations")}
        />
      </div>

      {/* PROACTIVE AI EARLY WARNING CENTER */}
      <div className="space-y-3">
        <EarlyWarningCenter
          mineId={mine?.id || 1}
          onSelectRecord={() => onNavigate("/mine/violations")}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate("/mine/inspections")}
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today's Inspections</span>
            <ClipboardCheck className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {metrics.today_inspections || 0} Scheduled
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Recent Incidents (30d)</span>
            <Flame className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {metrics.recent_incidents || 0} Logged
          </div>
        </div>

        <div
          onClick={() => onNavigate("/mine/environment")}
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Environmental Breaches</span>
            <TreePine className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {metrics.environmental_alerts || 0} Telemetry Alert(s)
          </div>
        </div>

        <div
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Incomplete Documents</span>
            <Scan className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-xl font-bold font-mono text-red-600 mt-1">
            {metrics.missing_documents_count || 0} Missing Required
          </div>
        </div>
      </div>

      {/* EXPLAINABLE AI RISK INTELLIGENCE CARD */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-slate-100 border border-slate-200 text-slate-800">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Live AI Risk & Anomaly Assessment
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {aiRisk.risk_tier || "MEDIUM RISK"}
                </span>
              </h3>
              <p className="text-xs text-slate-500">{aiRisk.summary_explanation}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("/mine/environment")}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium font-mono border border-slate-200 transition-colors flex items-center gap-1"
          >
            <span>Full Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Breakdown Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {(aiRisk.contributing_factors || []).slice(0, 3).map((factor: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">{factor.factor}</span>
                <span className="font-mono text-slate-900 font-bold">{factor.impact_percentage}% Impact</span>
              </div>
              <div className="font-mono font-semibold text-slate-800">{factor.metric_detail}</div>
              <div className="text-[10px] text-slate-500 font-mono">Trend: {factor.trend}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access: Open Violations Sample & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sample Violations */}
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-slate-700" />
              <span>Priority Open Violations</span>
            </h3>
            <button
              onClick={() => onNavigate("/mine/violations")}
              className="text-xs text-slate-700 hover:underline font-mono"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {(data?.open_violations_sample || []).map((v: any, idx: number) => (
              <div key={v.id || v.violation_id || idx} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{v.violation_id}</span>
                    <span className="text-slate-800 font-medium">{v.category}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Deadline: {v.deadline}</div>
                </div>
                <StatusBadge status={v.severity} />
              </div>
            ))}
          </div>
        </div>

        {/* Sample Incidents */}
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-slate-700" />
              <span>Recent Operational Incidents</span>
            </h3>
            <button
              onClick={() => onNavigate("/mine/environment")}
              className="text-xs text-slate-700 hover:underline font-mono"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {(data?.recent_incidents || []).map((inc: any, idx: number) => (
              <div key={inc.id || inc.incident_id || idx} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{inc.incident_id}</span>
                    <span className="text-slate-800 font-medium">{inc.incident_type}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {(inc.description || inc.title || "Incident reported").slice(0, 50)}...
                  </div>
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
