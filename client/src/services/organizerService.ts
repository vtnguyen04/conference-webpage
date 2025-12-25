import { apiRequest } from "./apiClient";
import type { Organizer } from "@shared/types";
export const organizerService = {
  getOrganizers: async (slug?: string): Promise<Organizer[]> => {
    const url = slug ? `/api/organizers/${slug}` : "/api/organizers";
    return apiRequest("GET", url);
  },
};
