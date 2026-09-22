import React from "react";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title?: string;
  label?: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "critical" | "warning" | "success" | "info" | "danger";
  trend?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  label,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
  onClick,
}) => {
  const displayTitle = title || label || "Metric";
  const normalizedVariant = variant === "danger" ? "critical" : variant;

  const borderVariants = {
    default: "border-slate-800 hover:border-slate-700 bg-[#0D131F]",
    critical: "border-red-900/40 hover:border-red-700/60 bg-gradient-to-b from-[#180C10] to-[#0D131F]",
    warning: "border-amber-900/40 hover:border-amber-700/60 bg-gradient-to-b from-[#19130A] to-[#0D131F]",
    success: "border-emerald-900/40 hover:border-emerald-700/60 bg-gradient-to-b from-[#0B1713] to-[#0D131F]",
    info: "border-sky-900/40 hover:border-sky-700/60 bg-gradient-to-b from-[#091522] to-[#0D131F]",
  };

  const iconVariants = {
    default: "text-slate-400 bg-slate-800/60",
    critical: "text-red-400 bg-red-950/80 border border-red-800/50",
    warning: "text-amber-400 bg-amber-950/80 border border-amber-800/50",
    success: "text-emerald-400 bg-emerald-950/80 border border-emerald-800/50",
    info: "text-sky-400 bg-sky-950/80 border border-sky-800/50",
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-lg border transition-all duration-200 shadow-sm ${borderVariants[normalizedVariant]} ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{displayTitle}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{value}</span>
            {trend && (
              <span className="text-xs font-mono font-semibold text-amber-400 flex items-center">
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconVariants[normalizedVariant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
