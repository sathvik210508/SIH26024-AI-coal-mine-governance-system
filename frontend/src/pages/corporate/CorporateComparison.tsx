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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono text-slate-100 uppercase tracking-tight">
              6-Mine Operations Comparison Matrix
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              CROSS-PORTFOLIO AUDIT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparative performance, safety indices, and compliance disparity benchmarks across all operating mines.
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
        </div>
      </div>

      {/* Top vs Bottom Mine Quick Insights */}
      {mines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[#0B0F19] border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                  Top Safety & Compliance Leader
                </div>
                <div className="font-bold text-sm text-slate-100 mt-0.5">
                  {bestMine?.mine_name} <span className="text-xs font-mono text-slate-400">[{bestMine?.code}]</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Safety Index: <b className="text-emerald-400">{bestMine?.safety_index}/100</b> | Compliance: <b className="text-emerald-400">{bestMine?.compliance_score}%</b>
                </div>
              </div>
            </div>
            <StatusBadge status="LOW" />
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F19] border border-red-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider">
                  Priority Intervention Required
                </div>
                <div className="font-bold text-sm text-slate-100 mt-0.5">
                  {lowestMine?.mine_name} <span className="text-xs font-mono text-slate-400">[{lowestMine?.code}]</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Risk Score: <b className="text-red-400">{lowestMine?.risk_score}</b> | Overdue Actions: <b className="text-red-400">{lowestMine?.overdue_actions}</b>
                </div>
              </div>
            </div>
            <StatusBadge status={lowestMine?.risk_tier || "HIGH"} />
          </div>
        </div>
      )}

      {/* Comparative Visual Chart */}
      <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold font-mono text-slate-200 uppercase">
              Portfolio Compliance vs AI Risk Score (Side-by-Side)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Real-Time Operational Sync</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <YAxis domain={[0, 100]} stroke="#6B7280" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0F19",
                  borderColor: "#374151",
                  borderRadius: "0.375rem",
                  fontSize: "12px",
                  color: "#F3F4F6",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="Compliance" fill="#10B981" name="Compliance Score (%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Risk" fill="#EF4444" name="AI Risk Score" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SafetyIndex" fill="#F59E0B" name="Safety Index" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold font-mono text-slate-200 uppercase">
              Comprehensive Operations Matrix Table
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">6 Operating Entities</span>
        </div>

        <DataTable
          columns={[
            {
              header: "Mine & Code",
              accessor: (row: any) => (
                <div>
                  <div className="font-bold text-xs text-slate-100">{row.mine_name}</div>
                  <span className="font-mono text-[10px] text-amber-400">{row.code}</span>
                </div>
              ),
            },
            {
              header: "Safety Index",
              accessor: (row: any) => (
                <div className="font-mono text-xs">
                  <span className={`font-bold ${row.safety_index >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                    {row.safety_index}
                  </span>
                  <span className="text-slate-500 text-[10px]"> / 100</span>
                </div>
              ),
            },
            {
              header: "AI Risk Tier",
              accessor: (row: any) => (
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.risk_tier} />
                  <span className="font-mono text-xs text-slate-300">({row.risk_score})</span>
                </div>
              ),
            },
            {
              header: "Compliance",
              accessor: (row: any) => (
                <div className="w-32">
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-slate-300">{row.compliance_score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        row.compliance_score >= 85 ? "bg-emerald-500" : "bg-amber-500"
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
                <span className={`font-mono text-xs font-bold ${row.open_violations > 3 ? "text-red-400" : "text-slate-300"}`}>
                  {row.open_violations}
                </span>
              ),
            },
            {
              header: "Overdue Actions",
              accessor: (row: any) => (
                <span className={`font-mono text-xs font-bold ${row.overdue_actions > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {row.overdue_actions}
                </span>
              ),
            },
            {
              header: "Incidents Logged",
              accessor: (row: any) => (
                <span className="font-mono text-xs text-slate-300">{row.incidents}</span>
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
