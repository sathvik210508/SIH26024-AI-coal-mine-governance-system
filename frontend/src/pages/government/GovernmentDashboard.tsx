import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Building2, 
  FileCheck2, 
  AlertTriangle, 
  Flame, 
  ClipboardCheck, 
  RefreshCw, 
  Download, 
  Plus, 
  CheckCircle2,
  FileWarning
} from "lucide-react";
import { api } from "../../services/api";
import { MetricCard } from "../../components/common/MetricCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";

export const GovernmentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [orderForm, setOrderForm] = useState({
    mine_id: 1,
    instructions: "Comprehensive statutory safety audit under Coal Mines Regulations 2017 (Reg 129 / Ventilation & Strata Control)",
    regulatory_reference: "DGMS / CMR-2017 / Sec-22(3)",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/government/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load regulator dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOrderInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOrder(true);
    try {
      await api.post("/government/inspections", orderForm);
      setShowOrderModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to order statutory inspection:", err);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const downloadReport = async () => {
    try {
      const res = await api.post("/reports/generate", {
        report_type: "GOVERNMENT_COMPLIANCE_SUMMARY",
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Directorate General of Mines Safety (DGMS)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              Statutory Regulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            National mining safety surveillance, statutory enforcement orders, accident investigations, and compliance audit hash verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Order Statutory Inspection</span>
          </button>

          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Regulatory Audit PDF</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Mines Under Jurisdiction"
          value={metrics.registered_mines || 0}
          subtitle={`${metrics.jurisdiction_regions || 0} Inspection Regions`}
          icon={Building2}
          variant="default"
        />
        <MetricCard
          label="National Compliance"
          value={`${metrics.national_compliance_avg || 0}%`}
          subtitle="Mandatory Floor: 85%"
          icon={FileCheck2}
          variant={(metrics.national_compliance_avg || 0) >= 85 ? "success" : "warning"}
        />
        <MetricCard
          label="Regulatory Directives"
          value={metrics.open_regulatory_actions || 0}
          subtitle={`${metrics.overdue_regulatory_actions || 0} Overdue`}
          icon={ShieldAlert}
          variant={(metrics.overdue_regulatory_actions || 0) > 0 ? "danger" : "warning"}
        />
        <MetricCard
          label="Critical Violations"
          value={metrics.critical_violations || 0}
          subtitle="Statutory Breach"
          icon={AlertTriangle}
          variant={(metrics.critical_violations || 0) > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Statutory Investigations"
          value={metrics.active_investigations || 0}
          subtitle={`${metrics.total_incidents || 0} Incidents Logged`}
          icon={Flame}
          variant={(metrics.active_investigations || 0) > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Pending Permits / Approvals"
          value={metrics.pending_applications_count || 0}
          subtitle="Awaiting DGMS Review"
          icon={CheckCircle2}
          variant="default"
        />
      </div>

      {/* Grid: High Risk Mines Watchlist & Statutory Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Mines Enforcement Watchlist */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Mines Subject to Enhanced Statutory Surveillance
              </h3>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase tracking-wider">
              Priority Enforcement
            </span>
          </div>

          <div className="space-y-2.5">
            {(!data?.high_risk_mines || data.high_risk_mines.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                No mines currently marked in HIGH or CRITICAL risk status.
              </div>
            ) : (
              data.high_risk_mines.map((m: any) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{m.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">[{m.code}]</span>
                      <StatusBadge status={m.risk_tier} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>Risk: <b className="text-rose-700 font-semibold">{m.risk_score}</b></span>
                      <span>Compliance: <b className="text-emerald-700 font-semibold">{m.compliance_score}%</b></span>
                      <span className="font-mono text-slate-400">Reg: {m.registration_number || "DGMS/REG/01"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOrderForm({ ...orderForm, mine_id: m.id });
                      setShowOrderModal(true);
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors shadow-xs"
                  >
                    Order Audit
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Regulatory Directives Issued */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Active Statutory Directives & Prohibition Orders
              </h3>
            </div>
            <a href="#/government/regulatory-actions" className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline">
              View All Directives &rarr;
            </a>
          </div>

          <div className="space-y-2.5">
            {(!data?.regulatory_actions || data.regulatory_actions.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                No active regulatory orders or notices.
              </div>
            ) : (
              data.regulatory_actions.map((act: any) => (
                <div key={act.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{act.action_id}</span>
                    <StatusBadge status={act.status} />
                  </div>
                  <p className="text-xs text-slate-700 mt-1 line-clamp-2">{act.description}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Deadline: {act.deadline}</span>
                    <span>Issued By: {act.issued_by}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Mining Applications & Statutory Approvals */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pending Statutory Applications & Permit Requests
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Awaiting Decision</span>
        </div>

        <DataTable
          columns={[
            {
              header: "Application ID",
              accessor: (row: any) => <span className="font-mono font-bold text-slate-900 text-xs">{row.application_id}</span>,
            },
            {
              header: "Type & Title",
              accessor: (row: any) => (
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{row.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{row.application_type}</div>
                </div>
              ),
            },
            {
              header: "Applicant / Mine",
              accessor: (row: any) => (
                <span className="text-xs text-slate-600 font-mono">Mine ID: {row.mine_id}</span>
              ),
            },
            {
              header: "Status",
              accessor: (row: any) => <StatusBadge status={row.review_status} />,
            },
            {
              header: "Submission Date",
              accessor: (row: any) => (
                <span className="font-mono text-xs text-slate-600">{row.submission_date}</span>
              ),
            },
          ]}
          data={data?.pending_applications || []}
          emptyMessage="No pending applications awaiting regulator review."
        />
      </div>

      {/* Order Statutory Inspection Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Order Statutory Regulatory Inspection
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            <form onSubmit={handleOrderInspection} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Target Mine Operation</label>
                <select
                  value={orderForm.mine_id}
                  onChange={(e) => setOrderForm({ ...orderForm, mine_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                >
                  <option value={1}>Jharia Open Cast Pit 04 (JHA-OCP-04)</option>
                  <option value={2}>Raniganj Deep Underground Block A (RAN-UG-01)</option>
                  <option value={3}>Korba West Seam Sector 2 (KOR-OCP-02)</option>
                  <option value={4}>Singrauli Open Cast Area B (SIN-OCP-01)</option>
                  <option value={5}>Talcher Thermal Pit 1 (TAL-OCP-01)</option>
                  <option value={6}>Godavari Valley Incline 5 (GOD-UG-05)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Statutory Regulatory Reference</label>
                <input
                  type="text"
                  required
                  value={orderForm.regulatory_reference}
                  onChange={(e) => setOrderForm({ ...orderForm, regulatory_reference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Special Inspection Instructions & Mandate</label>
                <textarea
                  required
                  rows={3}
                  value={orderForm.instructions}
                  onChange={(e) => setOrderForm({ ...orderForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs shadow-xs"
                >
                  {submittingOrder ? "Issuing Order..." : "Issue Statutory Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
