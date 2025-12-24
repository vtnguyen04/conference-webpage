import { apiRequest } from "./apiClient";
import type { Speaker } from "@shared/types";

export const speakerService = {
  getSpeakers: async (slug?: string): Promise<Speaker[]> => {
    const url = slug ? `/api/speakers/${slug}` : "/api/speakers";
    return apiRequest("GET", url);
  },
};