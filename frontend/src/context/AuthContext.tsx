import React, { createContext, useContext, useState, useEffect } from "react";
import { User, RoleCode } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: RoleCode) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<RoleCode, { email: string; pass: string; label: string; portal: string }> = {
  FIELD_SUPERVISOR: {
    email: "supervisor@bharatcoal.in",
    pass: "Field@2026",
    label: "Field Supervisor",
    portal: "/field/dashboard",
  },
  MINE_MANAGER: {
    email: "manager@bharatcoal.in",
    pass: "Manager@2026",
    label: "Mine Manager",
    portal: "/mine/dashboard",
  },
  CORPORATE_EXECUTIVE: {
    email: "executive@bharatcoal.in",
    pass: "Corporate@2026",
    label: "Corporate Executive",
    portal: "/corporate/dashboard",
  },
  GOVERNMENT_REGULATOR: {
    email: "regulator@gov.in",
    pass: "Gov@2026",
    label: "Government Regulator",
    portal: "/government/dashboard",
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("sih26024_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sih26024_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMe = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
          localStorage.setItem("sih26024_user", JSON.stringify(res.data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    checkMe();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.post("/auth/login", { email, password: pass });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem("sih26024_token", access_token);
    localStorage.setItem("sih26024_user", JSON.stringify(userData));

    // Redirect to assigned portal
    const target = DEMO_CREDENTIALS[userData.role_code as RoleCode]?.portal || "/field/dashboard";
    window.location.hash = target;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sih26024_token");
    localStorage.removeItem("sih26024_user");
    window.location.hash = "/login";
  };

  const quickSwitchRole = async (role: RoleCode) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        quickSwitchRole,
        isAuthenticated: !!user && !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
