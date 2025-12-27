import { apiRequest } from "./apiClient";
import type { Conference } from "@shared/types";
export const conferenceService = {
  getAllConferences: async (): Promise<Conference[]> => {
    return apiRequest("GET", "/api/conferences");
  },
  getActiveConference: async (): Promise<Conference> => {
    return apiRequest("GET", "/api/conferences/active");
  },
  getConferenceBySlug: async (slug: string): Promise<Conference> => {
    return apiRequest("GET", `/api/conferences/${slug}`);
  },
  activateConference: async (slug: string): Promise<any> => {
    return apiRequest("POST", `/api/conferences/${slug}/activate`);
  },
  deleteConference: async (slug: string): Promise<any> => {
    return apiRequest("DELETE", `/api/conferences/${slug}`);
  },
  cloneConference: async (fromSlug: string, newConferenceName: string): Promise<any> => {
    return apiRequest("POST", `/api/conferences/${fromSlug}/clone`, { newConferenceName });
  },
  updateConference: async (slug: string, data: any): Promise<Conference> => {
    return apiRequest("PUT", `/api/conferences/${slug}`, data);
  }
};
