import React, { useEffect, useState } from "react";
import { 
  Building2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckSquare, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Download, 
  RefreshCw,
  Sparkles,
  Flame,
  Clock,
  ArrowRight
} from "lucide-react";
import { api } from "../../services/api";
import { MetricCard } from "../../components/common/MetricCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";

export const CorporateDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [submittingInit, setSubmittingInit] = useState(false);

  const [initForm, setInitForm] = useState({
    title: "",
    description: "",
    lead_executive_name: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    inspections_target: 60,
    compliance_target_pct: 95.0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/corporate/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load corporate dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInit(true);
    try {
      await api.post("/corporate/safety-initiatives", initForm);
      setShowInitiativeModal(false);
      setInitForm({
        title: "",
        description: "",
        lead_executive_name: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
        inspections_target: 60,
        compliance_target_pct: 95.0,
      });
      fetchData();
    } catch (err) {
      console.error("Failed to create initiative:", err);
    } finally {
      setSubmittingInit(false);
    }
  };

  const downloadReport = async () => {
    try {
      const res = await api.post("/reports/generate", {
        report_type: "CORPORATE_EXECUTIVE_SUMMARY",
        file_format: "PDF",
      });
      if (res.data?.download_url) {
        window.open(res.data.download_url, "_blank");
      }
    } catch (err) {
      console.error("Export report error:", err);
    }
  };

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono text-slate-100 uppercase tracking-tight">
              Corporate Executive Governance
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PORTFOLIO COMMAND
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise multi-mine safety oversight, recurring hazard intelligence, and statutory compliance status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded bg-[#101726] border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowInitiativeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Safety Campaign</span>
          </button>

          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111827] border border-slate-700 hover:border-slate-500 text-slate-200 text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Command Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total Mines Portfolio"
          value={`${metrics.operational_mines || 0}/${metrics.total_mines || 0}`}
          subtitle={`${metrics.mines_under_review || 0} Under Elevated Watch`}
          icon={Building2}
          variant="default"
        />
        <MetricCard
          label="Portfolio Compliance"
          value={`${metrics.overall_compliance || 0}%`}
          subtitle="Statutory target >= 90%"
          icon={TrendingUp}
          variant={(metrics.overall_compliance || 0) >= 85 ? "success" : "warning"}
        />
        <MetricCard
          label="Enterprise Safety Risk"
          value={`${metrics.overall_safety_risk || 0}/100`}
          subtitle="Weighted risk index"
          icon={ShieldAlert}
          variant={(metrics.overall_safety_risk || 0) > 50 ? "danger" : "warning"}
        />
        <MetricCard
          label="Critical Violations"
          value={metrics.critical_violations || 0}
          subtitle={`${metrics.open_violations || 0} Total Active`}
          icon={AlertTriangle}
          variant={(metrics.critical_violations || 0) > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Overdue Actions"
          value={metrics.overdue_corrective_actions || 0}
          subtitle={`${metrics.open_corrective_actions || 0} Open Actions`}
          icon={CheckSquare}
          variant={(metrics.overdue_corrective_actions || 0) > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="High Risk Mines"
          value={metrics.high_risk_mines_count || 0}
          subtitle={`${metrics.recurring_patterns_count || 0} Recurring Patterns`}
          icon={Flame}
          variant={(metrics.high_risk_mines_count || 0) > 0 ? "danger" : "default"}
        />
      </div>

      {/* AI Recurring Pattern Detection Banner */}
      {data?.recurring_patterns && data.recurring_patterns.length > 0 && (
        <div className="rounded-lg border border-red-500/40 bg-gradient-to-r from-red-950/40 via-[#101422] to-[#0D121F] p-4">
          <div className="flex items-center justify-between gap-2 border-b border-red-900/40 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <h2 className="text-xs font-bold font-mono text-red-300 uppercase tracking-wide">
                AI Cross-Mine Recurring Hazard Pattern Alerts
              </h2>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
              {data.recurring_patterns.length} SYSTEMIC PATTERNS DETECTED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recurring_patterns.map((pat: any, idx: number) => (
              <div key={idx} className="p-3 rounded bg-[#090D17] border border-red-900/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-300">{pat.pattern_type}</span>
                    <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/40">
                      {pat.count} Repeat Occurrences
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{pat.description}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">Affects: {pat.mine_names?.join(", ") || "Multiple Operations"}</span>
                  <span className="text-amber-400 font-mono font-medium shrink-0 ml-2">Action: Directive Required</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: High Risk Mines & Active Initiatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Mines Attention Board */}
        <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase">
                Elevated Risk Operations Watchlist
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Risk Score &gt;= 50.0
            </span>
          </div>

          <div className="space-y-2.5">
            {(!data?.high_risk_mines || data.high_risk_mines.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No mines currently in High or Critical risk tiers.
              </div>
            ) : (
              data.high_risk_mines.map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 rounded bg-[#101726] border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-100">{m.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">[{m.code}]</span>
                      <StatusBadge status={m.risk_tier} />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 font-mono">
                      <span>Risk: <b className="text-amber-400">{m.risk_score}</b></span>
                      <span>Compliance: <b className="text-emerald-400">{m.compliance_score}%</b></span>
                      <span>Type: {m.mine_type}</span>
                    </div>
                  </div>
                  <a
                    href={`#`}
                    className="p-2 rounded bg-[#0B0F17] hover:bg-[#151F33] text-slate-300 hover:text-amber-400 transition-colors"
                    title="Inspect Mine"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Corporate Safety Campaigns / Initiatives */}
        <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase">
                Active Corporate Safety Campaigns
              </h3>
            </div>
            <button
              onClick={() => setShowInitiativeModal(true)}
              className="text-[11px] font-mono text-amber-400 hover:underline"
            >
              + New Initiative
            </button>
          </div>

          <div className="space-y-3">
            {(!data?.active_initiatives || data.active_initiatives.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No active safety campaigns. Launch one to establish mandatory corporate targets.
              </div>
            ) : (
              data.active_initiatives.map((init: any) => (
                <div key={init.id} className="p-3 rounded bg-[#101726] border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{init.title}</span>
                    <StatusBadge status={init.status} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{init.description}</p>
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Lead: {init.lead_executive_name}</span>
                    <span>Target: {init.inspections_target} Insp | {init.compliance_target_pct}% Comp</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Incidents across Portfolio */}
      <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase">
              Recent High-Priority Safety Incidents
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Last 5 Reported</span>
        </div>

        <DataTable
          columns={[
            {
              header: "Incident ID",
              accessor: (row: any) => <span className="font-mono font-bold text-amber-400">{row.incident_id}</span>,
            },
            {
              header: "Title & Details",
              accessor: (row: any) => (
                <div>
                  <div className="font-medium text-slate-200 text-xs">{row.title}</div>
                  <div className="text-[11px] text-slate-400">{row.incident_type}</div>
                </div>
              ),
            },
            {
              header: "Severity",
              accessor: (row: any) => <StatusBadge status={row.severity} />,
            },
            {
              header: "Status",
              accessor: (row: any) => <StatusBadge status={row.status} />,
            },
            {
              header: "Date Occurred",
              accessor: (row: any) => (
                <span className="font-mono text-xs text-slate-300">
                  {row.occurred_at ? new Date(row.occurred_at).toLocaleDateString() : "N/A"}
                </span>
              ),
            },
          ]}
          data={data?.recent_incidents || []}
          emptyMessage="No recent incidents registered."
        />
      </div>

      {/* Launch Safety Campaign Modal */}
      {showInitiativeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-sm text-slate-100 uppercase">
                Launch Enterprise Safety Campaign
              </h3>
              <button
                onClick={() => setShowInitiativeModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                [ESC / CLOSE]
              </button>
            </div>

            <form onSubmit={handleCreateInitiative} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-mono">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zero Electrical Hazard & Cable Integrity Drive"
                  value={initForm.title}
                  onChange={(e) => setInitForm({ ...initForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101726] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-mono">Directive Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mandatory inspection protocols, special audit checkpoints, and contractor safety certification..."
                  value={initForm.description}
                  onChange={(e) => setInitForm({ ...initForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101726] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-mono">Lead Executive</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Director (Technical & Safety)"
                    value={initForm.lead_executive_name}
                    onChange={(e) => setInitForm({ ...initForm, lead_executive_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101726] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-mono">Target Compliance (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={initForm.compliance_target_pct}
                    onChange={(e) => setInitForm({ ...initForm, compliance_target_pct: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#101726] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-mono">Start Date</label>
                  <input
                    type="date"
                    value={initForm.start_date}
                    onChange={(e) => setInitForm({ ...initForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101726] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-mono">Target End Date</label>
                  <input
                    type="date"
                    value={initForm.end_date}
                    onChange={(e) => setInitForm({ ...initForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101726] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInitiativeModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInit}
                  className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-mono flex items-center gap-1.5"
                >
                  {submittingInit ? "Publishing..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
