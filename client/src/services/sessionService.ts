import { apiRequest } from "./apiClient";
import type { Session } from "@shared/types";
export const sessionService = {
  getSessions: async (slug?: string): Promise<Session[]> => {
    const url = slug ? `/api/sessions/${slug}` : "/api/sessions";
    return apiRequest("GET", url);
  },
  getSessionCapacities: async (): Promise<Array<{
    sessionId: string;
    sessionTitle: string;
    capacity: number | null;
    registered: number;
    available: number | null;
    isFull: boolean;
  }>> => {
    return apiRequest("GET", "/api/sessions/capacity");
  },
};
