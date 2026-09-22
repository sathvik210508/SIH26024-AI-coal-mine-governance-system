import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification } from "../types";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  toastMessage: string | null;
  clearToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();

    // Setup SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === "CRITICAL_ALERT" || parsed.event === "ESCALATION") {
            setToastMessage(`[CRITICAL ALERT] ${parsed.data?.title || "New System Escalation"}`);
          }
          fetchNotifications();
        } catch {
          // ignore
        }
      };
    } catch {
      // fallback to 20s polling
    }

    const interval = setInterval(fetchNotifications, 20000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        refreshNotifications: fetchNotifications,
        toastMessage,
        clearToast: () => setToastMessage(null),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
