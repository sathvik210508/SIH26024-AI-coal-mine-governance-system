import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearAndLogin = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06090F] flex items-center justify-center p-4 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-[#0B0F17] border border-red-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono text-red-400 uppercase tracking-tight">
                  Runtime Exception Recovered
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  The dashboard caught an operational render error.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#080C13] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 break-words max-h-48 overflow-y-auto">
              <p className="text-red-400 font-bold mb-1">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <pre className="text-[10px] text-slate-500 whitespace-pre-wrap">
                  {this.state.error.stack.split("\n").slice(0, 4).join("\n")}
                </pre>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleClearAndLogin}
                className="py-2 px-3 rounded-lg bg-[#111827] border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
