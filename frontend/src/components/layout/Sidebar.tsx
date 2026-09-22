import React from "react";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertTriangle, 
  Flame, 
  FileWarning, 
  CheckSquare, 
  Users, 
  Clock, 
  Activity, 
  Truck, 
  Building2, 
  FileText, 
  TreePine, 
  Map, 
  BrainCircuit, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldAlert, 
  ScrollText,
  Compass,
  FileCheck2,
  FolderGit2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<{ currentPath: string; onNavigate: (path: string) => void }> = ({
  currentPath,
  onNavigate,
}) => {
  const { user } = useAuth();
  const role = user?.role_code || "FIELD_SUPERVISOR";

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case "FIELD_SUPERVISOR":
        return [
          { label: "Dashboard", path: "/field/dashboard", icon: LayoutDashboard },
          { label: "My Inspections", path: "/field/inspections", icon: ClipboardCheck },
          { label: "Safety Observations", path: "/field/safety", icon: AlertTriangle },
          { label: "Report Incident", path: "/field/incidents", icon: Flame },
          { label: "Violations", path: "/field/violations", icon: FileWarning },
          { label: "Corrective Actions", path: "/field/corrective-actions", icon: CheckSquare },
          { label: "Worker Attendance", path: "/field/attendance", icon: Users },
          { label: "Recent Activity", path: "/field/activity", icon: Activity },
        ];

      case "MINE_MANAGER":
        return [
          { label: "Dashboard", path: "/mine/dashboard", icon: LayoutDashboard },
          { label: "Operations & Production", path: "/mine/operations", icon: Compass },
          { label: "Workers & Roster", path: "/mine/workers", icon: Users },
          { label: "Attendance Records", path: "/mine/attendance", icon: Clock },
          { label: "Heavy Machinery", path: "/mine/machinery", icon: Truck },
          { label: "Inspections", path: "/mine/inspections", icon: ClipboardCheck },
          { label: "Safety & Hazards", path: "/mine/safety", icon: AlertTriangle },
          { label: "Incidents Log", path: "/mine/incidents", icon: Flame },
          { label: "Violations Registry", path: "/mine/violations", icon: FileWarning },
          { label: "Corrective Actions", path: "/mine/corrective-actions", icon: CheckSquare },
          { label: "Contractors & Risk", path: "/mine/contractors", icon: Building2 },
          { label: "Compliance & Calendar", path: "/mine/compliance", icon: FileCheck2 },
          { label: "Document Vault & OCR", path: "/mine/documents", icon: FileText },
          { label: "Environmental Telemetry", path: "/mine/environment", icon: TreePine },
          { label: "Mine GIS Command", path: "/mine/gis", icon: Map },
          { label: "AI Risk Intelligence", path: "/mine/ai-risk", icon: BrainCircuit },
          { label: "Analytics & Trends", path: "/mine/analytics", icon: BarChart3 },
          { label: "Official Reports", path: "/mine/reports", icon: FileSpreadsheet },
          { label: "Audit Trail", path: "/mine/audit", icon: ScrollText },
        ];

      case "CORPORATE_EXECUTIVE":
        return [
          { label: "Executive Dashboard", path: "/corporate/dashboard", icon: LayoutDashboard },
          { label: "Mines Portfolio", path: "/corporate/mines", icon: Building2 },
          { label: "6-Mine Comparison", path: "/corporate/comparison", icon: BarChart3 },
          { label: "Action Center", path: "/corporate/actions", icon: CheckSquare },
          { label: "Safety Campaigns", path: "/corporate/initiatives", icon: FolderGit2 },
          { label: "Contractor Oversight", path: "/corporate/contractors", icon: Users },
          { label: "Workforce Analytics", path: "/corporate/workforce", icon: Clock },
          { label: "Enterprise AI Risk", path: "/corporate/ai-risk", icon: BrainCircuit },
          { label: "GIS Operations Map", path: "/corporate/gis", icon: Map },
          { label: "Training Programs", path: "/corporate/training", icon: FileCheck2 },
          { label: "Corporate Reports", path: "/corporate/reports", icon: FileSpreadsheet },
          { label: "Audit Hash Trail", path: "/corporate/audit", icon: ScrollText },
        ];

      case "GOVERNMENT_REGULATOR":
        return [
          { label: "Regulatory Dashboard", path: "/government/dashboard", icon: LayoutDashboard },
          { label: "Jurisdiction Mines", path: "/government/mines", icon: Building2 },
          { label: "Regional Monitoring", path: "/government/regions", icon: Compass },
          { label: "Statutory Inspections", path: "/government/inspections", icon: ClipboardCheck },
          { label: "Incident Investigations", path: "/government/investigations", icon: Flame },
          { label: "Violations Oversight", path: "/government/violations", icon: FileWarning },
          { label: "Regulatory Directives", path: "/government/regulatory-actions", icon: ShieldAlert },
          { label: "Action Verifications", path: "/government/corrective-actions", icon: CheckSquare },
          { label: "Permits & Approvals", path: "/government/applications", icon: FileCheck2 },
          { label: "National Risk Map", path: "/government/risk-map", icon: Map },
          { label: "Predictive Analytics", path: "/government/analytics", icon: BarChart3 },
          { label: "Regulatory Reports", path: "/government/reports", icon: FileSpreadsheet },
          { label: "Audit Hash Verification", path: "/government/audit", icon: ScrollText },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-60 bg-[#080C14] border-r border-slate-800/80 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      {/* Scope Header */}
      <div className="p-3 border-b border-slate-800/60 bg-[#0B0F18]">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Active Operating Layer
        </div>
        <div className="text-xs font-bold font-mono text-amber-400 mt-0.5 truncate">
          {user?.mine_name || user?.jurisdiction_code || "Enterprise Wide"}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? "bg-amber-600/15 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#101726]"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0A0E17] text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SYS ONLINE</span>
        </span>
        <span className="text-[10px] text-slate-400">DGMS v1.0</span>
      </div>
    </aside>
  );
};
