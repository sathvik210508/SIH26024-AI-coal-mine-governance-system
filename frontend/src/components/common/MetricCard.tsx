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

  const accentBorder = {
    default: "border-slate-200 hover:border-slate-300",
    critical: "border-slate-200 hover:border-red-300 border-l-4 border-l-red-500",
    warning: "border-slate-200 hover:border-amber-300 border-l-4 border-l-amber-500",
    success: "border-slate-200 hover:border-emerald-300 border-l-4 border-l-emerald-500",
    info: "border-slate-200 hover:border-sky-300 border-l-4 border-l-sky-500",
  };

  const iconClasses = {
    default: "text-slate-500 bg-slate-50 border-slate-200",
    critical: "text-red-700 bg-red-50 border-red-200",
    warning: "text-amber-700 bg-amber-50 border-amber-200",
    success: "text-emerald-700 bg-emerald-50 border-emerald-200",
    info: "text-sky-700 bg-sky-50 border-sky-200",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-lg border transition-all duration-150 shadow-xs ${accentBorder[normalizedVariant]} ${
        onClick ? "cursor-pointer hover:shadow-sm" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {displayTitle}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {value}
            </span>
            {trend && (
              <span className="text-xs font-mono font-medium text-slate-600 flex items-center">
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-md border ${iconClasses[normalizedVariant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
