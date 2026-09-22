import React, { useState } from "react";
import { ShieldCheck, HardHat, Building, Landmark, Lock, ArrowRight, Layers, AlertCircle } from "lucide-react";
import { useAuth, DEMO_CREDENTIALS } from "../../context/AuthContext";
import { RoleCode } from "../../types";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (role: RoleCode) => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.pass);
  };

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle industrial background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141B2B_1px,transparent_1px),linear-gradient(to_bottom,#141B2B_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-2 shadow-lg">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 uppercase">
            SIH26024 // Smart Governance & Compliance
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            AI-Driven Mining Operations Command Center & Regulatory Oversight Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0B0F17]/90 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg border border-red-800/80 bg-red-950/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Official Government / Enterprise Email
              </label>
              <input
                type="text"
                required
                placeholder="name@bharatcoal.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080C13] border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080C13] border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? "Authenticating Session..." : "Sign In to Operations Portal"}</span>
            </button>
          </form>

          {/* Instant Demo Accounts Switcher */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>DEMO EVALUATION ROLES</span>
              <span className="text-amber-400 font-semibold">CLICK TO PRE-FILL</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoClick("FIELD_SUPERVISOR")}
                className="p-2.5 rounded-lg border border-slate-800 bg-[#0E1420] hover:bg-[#151F30] hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-0.5">
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Field Supervisor</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">supervisor@bharatcoal.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("MINE_MANAGER")}
                className="p-2.5 rounded-lg border border-slate-800 bg-[#0E1420] hover:bg-[#151F30] hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mine Manager</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">manager@bharatcoal.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("CORPORATE_EXECUTIVE")}
                className="p-2.5 rounded-lg border border-slate-800 bg-[#0E1420] hover:bg-[#151F30] hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-0.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Corporate Exec</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">executive@bharatcoal.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("GOVERNMENT_REGULATOR")}
                className="p-2.5 rounded-lg border border-slate-800 bg-[#0E1420] hover:bg-[#151F30] hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-0.5">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>DGMS Regulator</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">regulator@gov.in</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security / Audit Guarantee Footer */}
        <div className="text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Cryptographic SHA-256 Chained Audit Trail Active</span>
        </div>
      </div>
    </div>
  );
};
