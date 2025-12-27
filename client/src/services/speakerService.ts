import { apiRequest } from "./apiClient";
import type { Speaker, InsertSpeaker } from "@shared/types";

export const speakerService = {
  getSpeakers: async (slug?: string): Promise<Speaker[]> => {
    const url = slug ? `/api/speakers/${slug}` : "/api/speakers";
    return apiRequest("GET", url);
  },
  createSpeaker: async (data: InsertSpeaker): Promise<Speaker> => {
    return apiRequest("POST", "/api/speakers", data);
  },
  updateSpeaker: async (id: string, data: InsertSpeaker): Promise<Speaker> => {
    return apiRequest("PUT", `/api/speakers/${id}`, data);
  },
  deleteSpeaker: async (id: string): Promise<void> => {
    return apiRequest("DELETE", `/api/speakers/${id}`);
  },
  deleteAllSpeakers: async (): Promise<void> => {
    return apiRequest("DELETE", "/api/admin/speakers/all");
  }
};
