import { apiRequest } from "./apiClient";
import type { Organizer, InsertOrganizer } from "@shared/types";

export const organizerService = {
  getOrganizers: async (slug?: string): Promise<Organizer[]> => {
    const url = slug ? `/api/organizers/${slug}` : "/api/organizers";
    return apiRequest("GET", url);
  },
  createOrganizer: async (data: InsertOrganizer): Promise<Organizer> => {
    return apiRequest("POST", "/api/organizers", data);
  },
  updateOrganizer: async (id: string, data: InsertOrganizer): Promise<Organizer> => {
    return apiRequest("PUT", `/api/organizers/${id}`, data);
  },
  deleteOrganizer: async (id: string): Promise<void> => {
    return apiRequest("DELETE", `/api/organizers/${id}`);
  },
  deleteAllOrganizers: async (): Promise<void> => {
    return apiRequest("DELETE", "/api/admin/organizers/all");
  }
};