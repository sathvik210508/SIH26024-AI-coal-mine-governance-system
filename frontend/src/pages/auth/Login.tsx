import React, { useState } from "react";
import { ShieldCheck, HardHat, Building, Landmark, Lock, Layers, AlertCircle } from "lucide-react";
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 relative">
      <div className="w-full max-w-md z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center p-2.5 rounded-lg bg-slate-900 text-white mb-1 shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-slate-900 uppercase">
            SIH26024 // Smart Governance & Compliance
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            AI-Driven Mining Operations Command Center & Regulatory Oversight Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          {error && (
            <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Official Enterprise / Government Email
              </label>
              <input
                type="text"
                required
                placeholder="name@bharatcoal.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? "Authenticating Session..." : "Sign In to Operations Portal"}</span>
            </button>
          </form>

          {/* Instant Demo Accounts Switcher */}
          <div className="pt-3.5 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Demo Evaluation Roles</span>
              <span className="text-slate-700 font-medium">Click to fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoClick("FIELD_SUPERVISOR")}
                className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold mb-0.5">
                  <HardHat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Field Supervisor</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">supervisor@bharatcoal.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("MINE_MANAGER")}
                className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mine Manager</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">manager@bharatcoal.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("CORPORATE_EXECUTIVE")}
                className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold mb-0.5">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Corporate Exec</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">executive@bharatcoal.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("GOVERNMENT_REGULATOR")}
                className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold mb-0.5">
                  <Landmark className="w-3.5 h-3.5 text-red-600" />
                  <span>DGMS Regulator</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">regulator@gov.in</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security / Audit Guarantee Footer */}
        <div className="text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cryptographic SHA-256 Chained Audit Trail Active</span>
        </div>
      </div>
    </div>
  );
};
