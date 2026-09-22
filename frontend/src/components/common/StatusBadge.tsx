import React from "react";

interface StatusBadgeProps {
  status?: string | null;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "sm" }) => {
  const safeStatus = status || "UNKNOWN";
  const norm = safeStatus.toUpperCase().replace(/\s+/g, "_");

  let colorClass = "bg-slate-800 text-slate-300 border-slate-700";

  // Critical / Red
  if (["CRITICAL", "OVERDUE", "ESCALATED", "NON_COMPLIANT", "FAILED", "SUSPENDED", "EXPIRED"].includes(norm)) {
    colorClass = "bg-red-950/60 text-red-400 border-red-800/60";
  }
  // Warning / Amber / Orange
  else if (["HIGH", "WARNING", "MAINTENANCE_DUE", "AWAITING_VERIFICATION", "PENDING_VERIFICATION", "DUE_SOON", "EXPIRING_SOON"].includes(norm)) {
    colorClass = "bg-amber-950/60 text-amber-400 border-amber-800/60";
  }
  // Active / Informational / Blue
  else if (["MEDIUM", "IN_PROGRESS", "ASSIGNED", "ACCEPTED", "IN_REMEDIATION", "UNDER_INVESTIGATION", "SUBMITTED", "PENDING"].includes(norm)) {
    colorClass = "bg-sky-950/60 text-sky-400 border-sky-800/60";
  }
  // Success / Green
  else if (["LOW", "COMPLIANT", "VERIFIED", "CLOSED", "RESOLVED", "OPERATIONAL", "ACTIVE", "COMPLETED", "APPROVED", "VALID", "PRESENT"].includes(norm)) {
    colorClass = "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border ${padding} ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {safeStatus.replace(/_/g, " ")}
    </span>
  );
};
