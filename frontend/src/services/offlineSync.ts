import { api } from "./api";

export interface QueuedRecord {
  id: string;
  type: "OBSERVATION" | "INCIDENT" | "ATTENDANCE" | "CHECKLIST";
  data: any;
  timestamp: string;
  status: "PENDING_SYNC" | "SYNC_FAILED" | "SYNCED";
}

const STORAGE_KEY = "sih26024_offline_queue";

export const getOfflineQueue = (): QueuedRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const enqueueOfflineRecord = (type: QueuedRecord["type"], data: any): QueuedRecord => {
  const queue = getOfflineQueue();
  const record: QueuedRecord = {
    id: `QUEUE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    data,
    timestamp: new Date().toISOString(),
    status: "PENDING_SYNC",
  };
  queue.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return record;
};

export const syncOfflineQueue = async (): Promise<{ synced: number; failed: number }> => {
  const queue = getOfflineQueue();
  const pending = queue.filter((item) => item.status === "PENDING_SYNC" || item.status === "SYNC_FAILED");
  if (pending.length === 0) return { synced: 0, failed: 0 };

  try {
    const res = await api.post("/field/sync", {
      records: pending.map((p) => ({
        client_id: p.id,
        type: p.type,
        data: p.data,
      })),
    });

    const syncedIds: string[] = res.data.synced_ids || [];
    const updatedQueue = queue.map((item) => {
      if (syncedIds.includes(item.id)) {
        return { ...item, status: "SYNCED" as const };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
    return { synced: syncedIds.length, failed: pending.length - syncedIds.length };
  } catch {
    const updatedQueue = queue.map((item) => {
      if (item.status === "PENDING_SYNC") {
        return { ...item, status: "SYNC_FAILED" as const };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
    return { synced: 0, failed: pending.length };
  }
};
