import { apiRequest } from "./apiClient";
import type { Announcement, InsertAnnouncement } from "@shared/types";
export const announcementService = {
  getAnnouncements: async (slug?: string, limit?: number): Promise<Announcement[]> => {
    const url = slug ? `/api/announcements/slug/${slug}` : "/api/announcements";
    return apiRequest("GET", limit ? `${url}?limit=${limit}` : url);
  },
  getAnnouncementById: async (id: string, slug?: string): Promise<Announcement> => {
    const url = slug ? `/api/announcements/${slug}/${id}` : `/api/announcements/active/${id}`;
    return apiRequest("GET", url);
  },
  incrementAnnouncementView: async (id: string, slug?: string): Promise<void> => {
    const url = slug ? `/api/announcements/${slug}/${id}/view` : `/api/announcements/${id}/view`;
    return apiRequest("POST", url);
  },
  createAnnouncement: async (data: InsertAnnouncement): Promise<Announcement> => {
    return apiRequest("POST", "/api/announcements", data);
  },
  updateAnnouncement: async (id: string, data: InsertAnnouncement): Promise<Announcement> => {
    return apiRequest("PUT", `/api/announcements/${id}`, data);
  },
  deleteAnnouncement: async (id: string): Promise<void> => {
    return apiRequest("DELETE", `/api/announcements/${id}`);
  },
  deleteAllAnnouncements: async (): Promise<void> => {
    return apiRequest("DELETE", "/api/admin/announcements/all");
  },
};
