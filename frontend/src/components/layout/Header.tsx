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
    <header className="h-14 bg-[#090D16] border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-sm">
      {/* Left: Branding & Portal Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold font-mono">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
              SIH26024
              <span className="text-[10px] text-amber-400 font-normal">COMMAND CENTER</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              {user?.organization_name || "Ministry of Coal / Bharat Coal Ltd"}
            </span>
          </div>
        </div>

        {/* Active Role Switcher */}
        <div className="relative ml-2">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111827] border border-slate-700/80 hover:border-slate-600 text-xs text-slate-200 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-medium">
              {DEMO_CREDENTIALS[user?.role_code as RoleCode]?.label || user?.role_code}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-[#0B0F17] border border-slate-700 rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
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
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#151E2E] transition-colors ${
                      user?.role_code === rCode ? "text-amber-400 font-bold bg-[#111827]" : "text-slate-300"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{rCode.split("_")[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="relative w-80 hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Global Search (Mines, Violations, Actions, Machines)..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1 bg-[#05080E] border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 transition-colors"
        />

        {searchResults.length > 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-full bg-[#0B0F17] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="block px-3 py-2 text-xs border-b border-slate-800/60 hover:bg-[#151E2E] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-amber-400">{item.id}</span>
                  <span className="text-[10px] font-mono text-slate-500">{item.type}</span>
                </div>
                <div className="text-slate-200 mt-0.5">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</div>
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
                ? "bg-amber-950/70 border-amber-800/80 text-amber-400"
                : "bg-emerald-950/50 border-emerald-800/60 text-emerald-400"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            <span>{pendingSyncCount > 0 ? `${pendingSyncCount} Pending Sync` : "All Synced"}</span>
          </button>
        )}

        {/* Cryptographic Hash Chain Button */}
        <button
          onClick={onOpenAudit}
          className="p-1.5 rounded-md bg-[#111827] border border-slate-800 hover:border-emerald-700/60 text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Verify Cryptographic Hash Chain"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden lg:inline text-[11px]">HASH CHAIN VALID</span>
        </button>

        {/* AI Copilot Drawer Trigger */}
        <button
          onClick={onOpenCopilot}
          className="px-2.5 py-1 rounded-md bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-1.5 rounded-md bg-[#111827] border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold flex items-center justify-center ring-2 ring-[#090D16]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-[#0B0F17] border border-slate-700 rounded-lg shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">System Notifications</span>
                <span className="font-mono text-[10px] text-amber-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No new alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-2.5 text-xs hover:bg-[#151E2E] transition-colors cursor-pointer ${
                        !n.is_read ? "bg-[#111928]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {n.priority}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">{n.message}</p>
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
          className="p-1.5 rounded-md bg-[#111827] border border-slate-800 hover:border-red-800 text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
