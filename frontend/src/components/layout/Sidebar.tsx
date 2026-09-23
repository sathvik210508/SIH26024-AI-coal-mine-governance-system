import React from "react";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  CheckSquare, 
  FileWarning, 
  Map, 
  BarChart3, 
  ShieldAlert
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
          { label: "Field Dashboard", path: "/field/dashboard", icon: LayoutDashboard },
          { label: "Statutory Inspections", path: "/field/inspections", icon: ClipboardCheck },
          { label: "Corrective Actions", path: "/field/corrective-actions", icon: CheckSquare },
        ];

      case "MINE_MANAGER":
        return [
          { label: "Mine Dashboard", path: "/mine/dashboard", icon: LayoutDashboard },
          { label: "Statutory Inspections", path: "/mine/inspections", icon: ClipboardCheck },
          { label: "Violations & Actions", path: "/mine/violations", icon: FileWarning },
          { label: "Environment & GIS Command", path: "/mine/environment", icon: Map },
        ];

      case "CORPORATE_EXECUTIVE":
        return [
          { label: "Executive Dashboard", path: "/corporate/dashboard", icon: LayoutDashboard },
          { label: "6-Mine Comparison Matrix", path: "/corporate/comparison", icon: BarChart3 },
          { label: "Corporate Action Center", path: "/corporate/actions", icon: CheckSquare },
        ];

      case "GOVERNMENT_REGULATOR":
        return [
          { label: "Regulatory Dashboard", path: "/government/dashboard", icon: LayoutDashboard },
          { label: "National Spatial Risk Map", path: "/government/risk-map", icon: Map },
          { label: "Statutory Directives", path: "/government/regulatory-actions", icon: ShieldAlert },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-60 bg-[#0F172A] border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      {/* Scope Header */}
      <div className="p-3 border-b border-slate-800 bg-[#0B1120]">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Active Operating Layer
        </div>
        <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
          {user?.mine_name || user?.jurisdiction_code || "Enterprise Wide"}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                isActive
                  ? "bg-slate-800 text-white font-medium shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-slate-100" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800 bg-[#0B1120] text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-300">SYSTEM ONLINE</span>
        </span>
        <span className="text-[10px] text-slate-500">DGMS v1.0</span>
      </div>
    </aside>
  );
};
