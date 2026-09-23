import React, { useState } from "react";
import { X, Sparkles, Send, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { CopilotResponse } from "../../types";

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_PROMPTS: Record<string, string[]> = {
  FIELD_SUPERVISOR: [
    "What inspections are assigned to me today?",
    "Which corrective actions are pending evidence?",
    "Show recent high-risk safety observations in my pit",
  ],
  MINE_MANAGER: [
    "Why is Zone North Pit assessed at High Risk?",
    "Which contractors have unresolved safety violations?",
    "Which heavy machines require predictive maintenance?",
    "Summarize root causes behind recent compliance decline",
  ],
  CORPORATE_EXECUTIVE: [
    "Compare compliance scores across all 6 mines",
    "Detect recurring violation patterns across subsidiaries",
    "Which mines have overdue high-severity corrective actions?",
    "Show contractor risk distribution across the enterprise",
  ],
  GOVERNMENT_REGULATOR: [
    "Which mines have repeated critical safety violations?",
    "Show open statutory regulatory directives awaiting response",
    "Which regions exhibit deteriorating compliance trends?",
    "Identify cross-organization recurring electrical hazard patterns",
  ],
};

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CopilotResponse | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setQuery(text);
    try {
      const res = await api.post("/ai/copilot", { query: text });
      setResponse(res.data);
    } catch {
      setResponse({
        answer: "Failed to fetch response from AI Risk Engine. Please verify server connectivity.",
        supporting_metrics: {},
        affected_records: [],
        trend: "Service unavailable",
        evidence: "Connection error",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultPrompts = ROLE_PROMPTS[user?.role_code || "MINE_MANAGER"] || ROLE_PROMPTS.MINE_MANAGER;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Statutory Intelligence Copilot
              </h2>
              <p className="text-[11px] text-slate-500">
                Explainable AI risk assessments & compliance queries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Prompts */}
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2 font-semibold">
              Statutory Inquiries for {user?.role_code?.replace("_", " ")}
            </span>
            <div className="space-y-1.5">
              {defaultPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(p)}
                  className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs text-slate-700 transition-colors flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{p}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Display */}
          {loading && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-5/6" />
            </div>
          )}

          {response && !loading && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3.5">
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Query Analysis & Findings
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-sans">
                  {response.answer}
                </p>
              </div>

              {/* Supporting Evidence */}
              {response.evidence && (
                <div className="p-2.5 rounded bg-white border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    Statutory Context & Ground Evidence:
                  </span>
                  <p className="text-slate-700">{response.evidence}</p>
                </div>
              )}

              {/* Supporting Metrics */}
              {response.supporting_metrics && Object.keys(response.supporting_metrics).length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  {Object.entries(response.supporting_metrics).map(([key, val]) => (
                    <div key={key} className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono uppercase block truncate">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Affected Records */}
              {response.affected_records && response.affected_records.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block mb-1.5">
                    Impacted Records ({response.affected_records.length})
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {response.affected_records.map((rec: any, i: number) => (
                      <div
                        key={i}
                        className="p-1.5 rounded bg-white border border-slate-200 text-[11px] flex items-center justify-between"
                      >
                        <span className="font-mono text-slate-800 font-medium">
                          {rec.code || rec.id || rec.name || `Record #${i + 1}`}
                        </span>
                        <span className="text-slate-500">{rec.type || rec.status || ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask statutory risk & compliance questions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="p-2 rounded-md bg-slate-900 hover:bg-black disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
