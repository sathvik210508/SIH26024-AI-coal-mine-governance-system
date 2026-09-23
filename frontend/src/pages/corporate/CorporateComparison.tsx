import React, { useEffect, useState } from "react";
import { BarChart3, RefreshCw, Trophy, AlertTriangle, ShieldCheck, Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";

export const CorporateComparison: React.FC = () => {
  const [mines, setMines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/corporate/comparison");
      setMines(res.data || []);
    } catch (err) {
      console.error("Failed to load comparison:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = mines.map((m) => ({
    name: m.code || m.mine_name.split(" ")[0],
    fullName: m.mine_name,
    Compliance: m.compliance_score,
    Risk: m.risk_score,
    SafetyIndex: m.safety_index,
  }));

  // Sort by compliance descending to find top performer
  const sortedMines = [...mines].sort((a, b) => b.compliance_score - a.compliance_score);
  const bestMine = sortedMines[0];
  const lowestMine = sortedMines[sortedMines.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              6-Mine Operations Comparison Matrix
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              Cross-Portfolio Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparative performance, safety indices, and compliance disparity benchmarks across all operating mines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top vs Bottom Mine Quick Insights */}
      {mines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Top Safety & Compliance Leader
                </div>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {bestMine?.mine_name} <span className="text-xs font-mono font-medium text-slate-500">[{bestMine?.code}]</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Safety Index: <b className="text-emerald-700 font-semibold">{bestMine?.safety_index}/100</b> &bull; Compliance: <b className="text-emerald-700 font-semibold">{bestMine?.compliance_score}%</b>
                </div>
              </div>
            </div>
            <StatusBadge status="LOW" />
          </div>

          <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                  Priority Intervention Required
                </div>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {lowestMine?.mine_name} <span className="text-xs font-mono font-medium text-slate-500">[{lowestMine?.code}]</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Risk Score: <b className="text-rose-700 font-semibold">{lowestMine?.risk_score}</b> &bull; Overdue Actions: <b className="text-rose-700 font-semibold">{lowestMine?.overdue_actions}</b>
                </div>
              </div>
            </div>
            <StatusBadge status={lowestMine?.risk_tier || "HIGH"} />
          </div>
        </div>
      )}

      {/* Comparative Visual Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Portfolio Compliance vs AI Risk Score (Side-by-Side)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Real-Time Operational Sync</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                  color: "#0F172A",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="Compliance" fill="#059669" name="Compliance Score (%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Risk" fill="#E11D48" name="AI Risk Score" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SafetyIndex" fill="#4F46E5" name="Safety Index" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Comprehensive Operations Matrix Table
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">6 Operating Entities</span>
        </div>

        <DataTable
          columns={[
            {
              header: "Mine & Code",
              accessor: (row: any) => (
                <div>
                  <div className="font-bold text-xs text-slate-900">{row.mine_name}</div>
                  <span className="font-mono text-[11px] font-medium text-slate-500">{row.code}</span>
                </div>
              ),
            },
            {
              header: "Safety Index",
              accessor: (row: any) => (
                <div className="font-mono text-xs">
                  <span className={`font-bold ${row.safety_index >= 70 ? "text-emerald-700" : "text-amber-700"}`}>
                    {row.safety_index}
                  </span>
                  <span className="text-slate-400 text-[11px]"> / 100</span>
                </div>
              ),
            },
            {
              header: "AI Risk Tier",
              accessor: (row: any) => (
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.risk_tier} />
                  <span className="font-mono text-xs text-slate-600">({row.risk_score})</span>
                </div>
              ),
            },
            {
              header: "Compliance",
              accessor: (row: any) => (
                <div className="w-32">
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-700 font-semibold">{row.compliance_score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.compliance_score >= 85 ? "bg-emerald-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${row.compliance_score}%` }}
                    />
                  </div>
                </div>
              ),
            },
            {
              header: "Open Violations",
              accessor: (row: any) => (
                <span className={`font-mono text-xs font-bold ${row.open_violations > 3 ? "text-rose-700" : "text-slate-700"}`}>
                  {row.open_violations}
                </span>
              ),
            },
            {
              header: "Overdue Actions",
              accessor: (row: any) => (
                <span className={`font-mono text-xs font-bold ${row.overdue_actions > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {row.overdue_actions}
                </span>
              ),
            },
            {
              header: "Incidents Logged",
              accessor: (row: any) => (
                <span className="font-mono text-xs text-slate-700">{row.incidents}</span>
              ),
            },
          ]}
          data={mines}
          emptyMessage="No comparative mine data found."
        />
      </div>
    </div>
  );
};
