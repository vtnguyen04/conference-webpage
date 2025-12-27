import { apiRequest } from "./apiClient";
import type { Session, InsertSession } from "@shared/types";

export const sessionService = {
  getSessions: async (slug?: string): Promise<Session[]> => {
    const url = slug ? `/api/sessions/${slug}` : "/api/sessions";
    return apiRequest("GET", url);
  },
  getSessionCapacities: async (): Promise<any[]> => {
    return apiRequest("GET", "/api/sessions/capacity");
  },
  createSession: async (data: InsertSession): Promise<Session> => {
    return apiRequest("POST", "/api/sessions", data);
  },
  updateSession: async (id: string, data: InsertSession): Promise<Session> => {
    return apiRequest("PUT", `/api/sessions/${id}`, data);
  },
  deleteSession: async (id: string): Promise<void> => {
    return apiRequest("DELETE", `/api/sessions/${id}`);
  },
  deleteAllSessions: async (): Promise<void> => {
    return apiRequest("DELETE", "/api/admin/sessions/all");
  }
};