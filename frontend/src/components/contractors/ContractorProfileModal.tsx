import React, { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  FileText, 
  BrainCircuit, 
  Phone, 
  Mail,
  Calendar
} from "lucide-react";
import { api } from "../../services/api";
import { ContractorGovernanceProfile } from "../../types";
import { StatusBadge } from "../common/StatusBadge";

interface ContractorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: number;
}

export const ContractorProfileModal: React.FC<ContractorProfileModalProps> = ({
  isOpen,
  onClose,
  contractorId,
}) => {
  const [data, setData] = useState<ContractorGovernanceProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !contractorId) return;
    setLoading(true);
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/mine/contractors/${contractorId}/profile`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load contractor profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isOpen, contractorId]);

  if (!isOpen) return null;

  const cont = data?.contractor;
  const comp = data?.compliance_profile;
  const ai = data?.ai_risk_assessment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                CONTRACTOR GOVERNANCE & AI RISK PROFILE
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight mt-0.5">
                {cont?.company_name || `Contractor #${contractorId}`} [{cont?.code}]
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500">
              Auditing vendor safety records, labor clearances, and training certifications...
            </p>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            Contractor profile records unavailable.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Operating Department</span>
                <span className="font-bold text-slate-900">{cont?.department}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Contract Period</span>
                <span className="font-semibold text-slate-800 truncate block">{cont?.contract_period}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Compliance Score</span>
                <span className="font-bold text-emerald-700 text-sm">{comp?.compliance_score}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">AI Risk Level</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <StatusBadge status={ai?.risk_tier || "LOW"} />
                  <span className="font-bold text-slate-800">({ai?.risk_score}/100)</span>
                </div>
              </div>
            </div>

            {/* Compliance Matrix Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Statutory Governance & Workforce Indicators
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Open Violations</span>
                  <span className={`font-bold text-sm ${comp?.open_violations_count ? "text-red-600" : "text-slate-800"}`}>
                    {comp?.open_violations_count}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Safety Observations</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {comp?.safety_observations_count}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Training Currency</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {comp?.training_compliance_pct}%
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Attendance Compliance</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {comp?.attendance_compliance_pct}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
                <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-200 text-emerald-900">
                  <b>{comp?.valid_statutory_documents} Statutory Clearances Active</b>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Labor license, insurance policy, and safety permits verified</div>
                </div>
                <div className={`p-2.5 rounded border text-xs font-mono ${
                  comp?.expired_missing_documents ? "bg-rose-50 border-rose-200 text-rose-900" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <b>{comp?.expired_missing_documents} Clearance Flag(s)</b>
                  <div className="text-[10px] opacity-75 mt-0.5">
                    {comp?.expired_missing_documents ? "Mandatory document renewal required immediately" : "Zero expired regulatory documents"}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Risk Assessment */}
            {ai && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-900 flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-slate-800" />
                    AI Vendor Risk Assessment
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-900">
                    Calculated Risk: {ai.risk_score}/100 &bull; {ai.risk_tier}
                  </span>
                </div>

                <div className="text-xs font-mono space-y-1">
                  <div className="text-[10px] font-bold text-slate-600 uppercase">Primary Contributing Drivers:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                    {ai.contributing_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs font-mono text-slate-900">
                  <b>Recommended Management Action:</b> {ai.recommended_action}
                </div>
              </div>
            )}

            {/* Contact Details */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 gap-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" /> Lead Contact: <b className="text-slate-900">{cont?.contact_person}</b>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> {cont?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> {cont?.phone}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            DGMS Contractor Oversight Directive 2024
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-black text-white font-mono text-xs font-semibold transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
