import React, { useState } from "react";
import { 
  ShieldCheck, 
  Bell, 
  Sparkles, 
  Search, 
  LogOut, 
  RefreshCw, 
  UserCheck, 
  ChevronDown,
  Layers
} from "lucide-react";
import { useAuth, DEMO_CREDENTIALS } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { RoleCode } from "../../types";
import { api } from "../../services/api";
import { getOfflineQueue, syncOfflineQueue } from "../../services/offlineSync";

interface HeaderProps {
  onOpenCopilot: () => void;
  onOpenAudit: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCopilot, onOpenAudit }) => {
  const { user, logout, quickSwitchRole } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  const offlineQueue = getOfflineQueue();
  const pendingSyncCount = offlineQueue.filter((i) => i.status === "PENDING_SYNC").length;

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length >= 2) {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(val)}`);
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncOfflineQueue();
    setSyncing(false);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: Branding & Role Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold font-mono">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold tracking-wider text-slate-900 flex items-center gap-1.5">
              SIH26024
              <span className="text-[10px] text-slate-500 font-medium">COMMAND CENTER</span>
            </div>
            <span className="text-[10px] text-slate-500 block -mt-0.5">
              {user?.organization_name || "Ministry of Coal / Bharat Coal Ltd"}
            </span>
          </div>
        </div>

        {/* Active Role Switcher */}
        <div className="relative ml-2">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-mono font-medium">
              {DEMO_CREDENTIALS[user?.role_code as RoleCode]?.label || user?.role_code}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Demo Role Switcher (Instant Jump)
              </div>
              {(Object.keys(DEMO_CREDENTIALS) as RoleCode[]).map((rCode) => {
                const item = DEMO_CREDENTIALS[rCode];
                return (
                  <button
                    key={rCode}
                    onClick={() => {
                      setRoleMenuOpen(false);
                      quickSwitchRole(rCode);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user?.role_code === rCode ? "text-slate-900 font-bold bg-slate-100" : "text-slate-600"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{rCode.split("_")[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="relative w-80 hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search Mines, Violations, Actions, Machines..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
        />

        {searchResults.length > 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="block px-3 py-2 text-xs border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900">{item.id}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.type}</span>
                </div>
                <div className="text-slate-800 mt-0.5">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Offline Sync Indicator */}
        {user?.role_code === "FIELD_SUPERVISOR" && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors ${
              pendingSyncCount > 0
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            <span>{pendingSyncCount > 0 ? `${pendingSyncCount} Pending Sync` : "All Synced"}</span>
          </button>
        )}

        {/* Cryptographic Hash Chain Button */}
        <button
          onClick={onOpenAudit}
          className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors flex items-center gap-1.5 text-xs font-mono font-semibold"
          title="Verify Cryptographic Hash Chain"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">HASH CHAIN VALID</span>
        </button>

        {/* AI Copilot Drawer Trigger */}
        <button
          onClick={onOpenCopilot}
          className="px-3 py-1 rounded-md bg-slate-900 hover:bg-black text-white transition-colors flex items-center gap-1.5 text-xs font-medium shadow-xs"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">System Notifications</span>
                <span className="font-mono text-[10px] text-slate-500">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No new alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-2.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.is_read ? "bg-slate-50/80 font-medium" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {n.priority}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / Logout */}
        <button
          onClick={logout}
          title="Logout"
          className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
