import { apiRequest } from "./apiClient";
import type { Conference } from "@shared/types";
export const conferenceService = {
  getActiveConference: async (): Promise<Conference> => {
    return apiRequest("GET", "/api/conferences/active");
  },
  getConferenceBySlug: async (slug: string): Promise<Conference> => {
    return apiRequest("GET", `/api/conferences/${slug}`);
  },
};
