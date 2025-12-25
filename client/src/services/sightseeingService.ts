import { apiRequest } from "./apiClient";
import type { Sightseeing } from "@shared/types";
export const sightseeingService = {
  getSightseeings: async (): Promise<Sightseeing[]> => {
    return apiRequest("GET", "/api/sightseeing");
  },
  getSightseeingById: async (id: string): Promise<Sightseeing> => {
    return apiRequest("GET", `/api/sightseeing/${id}`);
  },
};
