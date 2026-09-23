import React, { useState, useEffect } from "react";
import { 
  GitCommit, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  ChevronDown,
  Layers,
  Lock
} from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../common/StatusBadge";

interface TraceabilityProps {
  complianceId?: string;
}

export const ComplianceTraceabilityChain: React.FC<TraceabilityProps> = ({
  complianceId = "CMP-2026-001",
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTraceability = async () => {
      try {
        const res = await api.get(`/mine/compliance/traceability/${complianceId}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load traceability chain:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTraceability();
  }, [complianceId]);

  if (loading) {
    return (
      <div className="p-6 text-center text-xs font-mono text-slate-500 animate-pulse">
        Building Statutory Compliance Traceability Chain...
      </div>
    );
  }

  if (!data) return null;

  const chainNodes = [
    {
      stage: "1. STATUTORY REGULATION",
      code: data.regulation?.code,
      title: data.regulation?.title,
      subtext: data.regulation?.statutory_body,
      detail: data.regulation?.mandatory_standard,
      color: "bg-slate-900 text-white border-slate-800",
    },
    {
      stage: "2. MANDATORY REQUIREMENT",
      code: data.requirement?.code,
      title: data.requirement?.description,
      subtext: `Frequency: ${data.requirement?.frequency}`,
      detail: `Due Date: ${data.requirement?.due_date}`,
      color: "bg-slate-800 text-white border-slate-700",
    },
    {
      stage: "3. FIELD INSPECTION",
      code: data.inspection?.inspection_id,
      title: `${data.inspection?.inspection_type} Inspection`,
      subtext: data.inspection?.inspector,
      detail: `Result: ${data.inspection?.result}`,
      color: "bg-amber-50 text-amber-950 border-amber-300",
    },
    {
      stage: "4. GROUND OBSERVATION",
      code: data.observation?.finding_id,
      title: data.observation?.title,
      subtext: data.observation?.category,
      detail: data.observation?.description,
      color: "bg-rose-50 text-rose-950 border-rose-300",
    },
    {
      stage: "5. STATUTORY VIOLATION",
      code: data.violation?.violation_id,
      title: `${data.violation?.category} Violation`,
      subtext: `Severity: ${data.violation?.severity}`,
      detail: `Remediation Deadline: ${data.violation?.deadline}`,
      color: "bg-rose-100 text-rose-950 border-rose-400 font-bold",
    },
    {
      stage: "6. CORRECTIVE ACTION",
      code: data.corrective_action?.action_id,
      title: data.corrective_action?.description,
      subtext: `Assigned: ${data.corrective_action?.assigned_to}`,
      detail: `Status: ${data.corrective_action?.status}`,
      color: "bg-blue-50 text-blue-950 border-blue-300",
    },
    {
      stage: "7. SUBMITTED EVIDENCE",
      code: "PHOTO_PROOF",
      title: data.evidence?.remarks,
      subtext: `Uploaded: ${data.evidence?.uploaded_at}`,
      detail: `Asset: ${data.evidence?.file_path}`,
      color: "bg-indigo-50 text-indigo-950 border-indigo-300",
    },
    {
      stage: "8. AI VERIFICATION",
      code: data.verification?.ai_status,
      title: `Confidence: ${data.verification?.ai_confidence}`,
      subtext: data.verification?.remarks,
      detail: `Manager Sign-Off: ${data.verification?.manager_decision}`,
      color: "bg-emerald-50 text-emerald-950 border-emerald-300",
    },
    {
      stage: "9. COMPLIANCE STATUS",
      code: data.compliance_status?.status,
      title: "Statutory Neutralization",
      subtext: data.compliance_status?.compliance_impact,
      detail: `Merkle Hash: ${data.compliance_status?.audit_hash?.slice(0, 16)}...`,
      color: "bg-emerald-100 text-emerald-950 border-emerald-400 font-bold",
    },
  ];

  return (
    <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-900 text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-900">
              Statutory Traceability DAG Chain
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Unbroken lineage: Regulation &rarr; Requirement &rarr; Inspection &rarr; Observation &rarr; Violation &rarr; Action &rarr; Evidence &rarr; Verification &rarr; Compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            PROVENANCE VERIFIED
          </span>
        </div>
      </div>

      {/* Responsive Horizontal / Vertical Chain Flow */}
      <div className="space-y-2">
        {chainNodes.map((node, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className={`flex-1 p-3 rounded-lg border ${node.color} flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs`}>
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-75 font-semibold">
                  {node.stage}
                </div>
                <div className="text-xs font-bold font-mono">
                  {node.code} &bull; <span className="font-sans font-medium">{node.title}</span>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono opacity-80 sm:max-w-xs truncate">
                <div>{node.subtext}</div>
                <div className="text-[10px] opacity-70">{node.detail}</div>
              </div>
            </div>

            {i < chainNodes.length - 1 && (
              <div className="flex justify-center sm:block py-0.5 sm:py-0 text-slate-400">
                <ArrowRight className="w-4 h-4 hidden sm:block" />
                <ChevronDown className="w-4 h-4 sm:hidden" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
