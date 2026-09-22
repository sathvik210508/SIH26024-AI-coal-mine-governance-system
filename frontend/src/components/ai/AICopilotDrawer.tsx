import React, { useState } from "react";
import { X, Sparkles, Send, ArrowRight, Activity, ShieldAlert, CheckCircle2 } from "lucide-react";
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

  const suggested = user ? ROLE_PROMPTS[user.role_code] || [] : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-[#090D15] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 bg-[#0F1522] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Mining AI Copilot
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 uppercase">
                  {user?.role_code.replace("_", " ")}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Context-Aware Compliance & Risk Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Suggested Prompts */}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Suggested Contextual Inquiries
            </p>
            <div className="space-y-1.5">
              {suggested.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(prompt)}
                  className="w-full text-left p-2 rounded border border-slate-800 bg-[#0E1420] hover:bg-[#141C2C] hover:border-slate-700 text-xs text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Card */}
          {loading && (
            <div className="p-4 rounded-lg border border-slate-800 bg-[#0E1420] space-y-3 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-16 bg-slate-800/60 rounded" />
            </div>
          )}

          {response && !loading && (
            <div className="p-4 rounded-lg border border-slate-800 bg-[#0D131F] space-y-4 shadow-sm">
              {/* Answer */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  AI Assessment & Findings
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">{response.answer}</p>
              </div>

              {/* Supporting Metrics */}
              {Object.keys(response.supporting_metrics || {}).length > 0 && (
                <div className="p-3 rounded bg-[#080C13] border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block mb-2">
                    Supporting Data Points
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(response.supporting_metrics).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="text-slate-400 block capitalize">
                          {k.replace(/_/g, " ")}:
                        </span>
                        <span className="font-mono font-semibold text-slate-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Records */}
              {response.affected_records?.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                    Targeted Live Database Records
                  </span>
                  <div className="space-y-1.5">
                    {response.affected_records.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-[#0A0E17] border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-semibold text-amber-400 mr-2">
                            {rec.id}
                          </span>
                          <span className="text-slate-300">{rec.title}</span>
                        </div>
                        {rec.status && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {rec.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend & Audit Evidence */}
              <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1 text-slate-400">
                <div className="flex items-center gap-1.5 text-amber-400/90">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Trend: {response.trend}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400/90 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Evidence: {response.evidence}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-[#0F1522]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask AI Copilot (${user?.role_code.toLowerCase()})...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#080C13] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
