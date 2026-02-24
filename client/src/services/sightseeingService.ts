import { apiRequest } from "./apiClient";
import type { Sightseeing, InsertSightseeing } from "@shared/types";

export const sightseeingService = {
  getSightseeings: async (slug: string): Promise<Sightseeing[]> => {
    return apiRequest("GET", `/api/sightseeing/slug/${slug}`);
  },
  getSightseeingById: async (id: string, slug?: string): Promise<Sightseeing> => {
    const url = slug ? `/api/sightseeing/${slug}/${id}` : `/api/sightseeing/${id}`;
    return apiRequest("GET", url);
  },
  createSightseeing: async (data: InsertSightseeing): Promise<Sightseeing> => {
    return apiRequest("POST", "/api/sightseeing", data);
  },
  updateSightseeing: async (id: string, data: InsertSightseeing): Promise<Sightseeing> => {
    return apiRequest("PUT", `/api/sightseeing/${id}`, data);
  },
  deleteSightseeing: async (id: string): Promise<void> => {
    return apiRequest("DELETE", `/api/sightseeing/${id}`);
  },
  deleteAllSightseeing: async (): Promise<void> => {
    return apiRequest("DELETE", "/api/admin/sightseeing/all");
  }
};
