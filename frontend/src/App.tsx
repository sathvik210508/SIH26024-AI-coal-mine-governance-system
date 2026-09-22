import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { AICopilotDrawer } from "./components/ai/AICopilotDrawer";
import { AuditModal } from "./components/audit/AuditModal";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Auth
import { Login } from "./pages/auth/Login";

// Field Portal
import { FieldDashboard } from "./pages/field/FieldDashboard";
import { FieldInspections } from "./pages/field/FieldInspections";
import { FieldCorrectiveActions } from "./pages/field/FieldCorrectiveActions";

// Mine Manager Portal
import { MineDashboard } from "./pages/mine/MineDashboard";
import { MineInspections } from "./pages/mine/MineInspections";
import { MineViolationsActions } from "./pages/mine/MineViolationsActions";
import { MineEnvironmentGIS } from "./pages/mine/MineEnvironmentGIS";

// Corporate Executive Portal
import { CorporateDashboard } from "./pages/corporate/CorporateDashboard";
import { CorporateComparison } from "./pages/corporate/CorporateComparison";
import { CorporateActionCenter } from "./pages/corporate/CorporateActionCenter";

// Government Regulator Portal
import { GovernmentDashboard } from "./pages/government/GovernmentDashboard";
import { GovernmentRegulatoryActions } from "./pages/government/GovernmentRegulatoryActions";
import { GovernmentRiskMap } from "./pages/government/GovernmentRiskMap";

const getDefaultPathForRole = (role?: string) => {
  switch (role) {
    case "FIELD_SUPERVISOR":
      return "/field/dashboard";
    case "MINE_MANAGER":
      return "/mine/dashboard";
    case "CORPORATE_EXECUTIVE":
      return "/corporate/dashboard";
    case "GOVERNMENT_REGULATOR":
      return "/government/dashboard";
    default:
      return "/login";
  }
};

const MainLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  // Initialize path from hash or default for role
  const getInitialPath = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && hash.startsWith("/")) return hash;
    return getDefaultPathForRole(user?.role_code);
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);

  // Sync with role changes
  useEffect(() => {
    if (user?.role_code) {
      const defaultPath = getDefaultPathForRole(user.role_code);
      const hash = window.location.hash.replace("#", "");
      if (!hash || !hash.startsWith(defaultPath.split("/")[1])) {
        navigate(defaultPath);
      }
    }
  }, [user?.role_code]);

  // Sync with window hash changes (back/forward or external click)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash.startsWith("/")) {
        setCurrentPath(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActivePage = () => {
    // 1. Field Supervisor Routes
    if (currentPath === "/field/dashboard") return <FieldDashboard onNavigate={navigate} />;
    if (currentPath === "/field/inspections") return <FieldInspections />;
    if (currentPath === "/field/corrective-actions") return <FieldCorrectiveActions />;
    if (currentPath.startsWith("/field/")) return <FieldDashboard onNavigate={navigate} />;

    // 2. Mine Manager Routes
    if (currentPath === "/mine/dashboard") return <MineDashboard onNavigate={navigate} />;
    if (currentPath === "/mine/inspections") return <MineInspections />;
    if (currentPath === "/mine/violations" || currentPath === "/mine/corrective-actions") {
      return <MineViolationsActions />;
    }
    if (currentPath === "/mine/environment" || currentPath === "/mine/gis") {
      return <MineEnvironmentGIS />;
    }
    if (currentPath.startsWith("/mine/")) return <MineDashboard onNavigate={navigate} />;

    // 3. Corporate Executive Routes
    if (currentPath === "/corporate/dashboard") return <CorporateDashboard />;
    if (currentPath === "/corporate/comparison" || currentPath === "/corporate/mines") {
      return <CorporateComparison />;
    }
    if (currentPath === "/corporate/actions") return <CorporateActionCenter />;
    if (currentPath.startsWith("/corporate/")) return <CorporateDashboard />;

    // 4. Government Regulator Routes
    if (currentPath === "/government/dashboard") return <GovernmentDashboard />;
    if (currentPath === "/government/regulatory-actions" || currentPath === "/government/corrective-actions") {
      return <GovernmentRegulatoryActions />;
    }
    if (currentPath === "/government/risk-map" || currentPath === "/government/mines") {
      return <GovernmentRiskMap />;
    }
    if (currentPath.startsWith("/government/")) return <GovernmentDashboard />;

    // Fallback default for role
    return <MineDashboard onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col antialiased">
      {/* Top Universal Command Header */}
      <Header
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenAudit={() => setAuditOpen(true)}
      />

      {/* Main Operational Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Role-Specific Navigation Sidebar */}
        <Sidebar currentPath={currentPath} onNavigate={navigate} />

        {/* Dynamic Portal Page Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {renderActivePage()}
        </main>
      </div>

      {/* Slide-over Contextual AI Copilot Drawer */}
      <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* Cryptographic SHA-256 Hash Chain Live Verification Modal */}
      <AuditModal isOpen={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <MainLayout />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
