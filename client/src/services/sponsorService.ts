import { apiRequest } from "./apiClient";
import type { Sponsor } from "@shared/types";
export const sponsorService = {
  getSponsors: async (slug?: string): Promise<Sponsor[]> => {
    const url = slug ? `/api/sponsors/${slug}` : "/api/sponsors";
    return apiRequest("GET", url);
  },
};
