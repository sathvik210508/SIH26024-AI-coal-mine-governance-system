import React from "react";

interface StatusBadgeProps {
  status?: string | null;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "sm" }) => {
  const safeStatus = status || "UNKNOWN";
  const norm = safeStatus.toUpperCase().replace(/\s+/g, "_");

  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";

  // Critical / Red
  if (["CRITICAL", "OVERDUE", "ESCALATED", "NON_COMPLIANT", "FAILED", "SUSPENDED", "EXPIRED", "STOP_WORK"].includes(norm)) {
    colorClass = "bg-red-50 text-red-700 border-red-200";
  }
  // Warning / Amber
  else if (["HIGH", "WARNING", "MAINTENANCE_DUE", "AWAITING_VERIFICATION", "PENDING_VERIFICATION", "DUE_SOON", "EXPIRING_SOON"].includes(norm)) {
    colorClass = "bg-amber-50 text-amber-800 border-amber-200";
  }
  // Active / Informational / Sky
  else if (["MEDIUM", "IN_PROGRESS", "ASSIGNED", "ACCEPTED", "IN_REMEDIATION", "UNDER_INVESTIGATION", "SUBMITTED", "PENDING"].includes(norm)) {
    colorClass = "bg-sky-50 text-sky-700 border-sky-200";
  }
  // Success / Compliant / Emerald
  else if (["LOW", "COMPLIANT", "VERIFIED", "CLOSED", "RESOLVED", "OPERATIONAL", "ACTIVE", "COMPLETED", "APPROVED", "VALID", "PRESENT"].includes(norm)) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${padding} ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {safeStatus.replace(/_/g, " ")}
    </span>
  );
};
