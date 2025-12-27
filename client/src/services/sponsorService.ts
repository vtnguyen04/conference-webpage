import { apiRequest } from "./apiClient";
import type { Sponsor, InsertSponsor } from "@shared/types";

export const sponsorService = {
  getSponsors: async (slug?: string): Promise<Sponsor[]> => {
    const url = slug ? `/api/sponsors/${slug}` : "/api/sponsors";
    return apiRequest("GET", url);
  },
  createSponsor: async (data: InsertSponsor): Promise<Sponsor> => {
    return apiRequest("POST", "/api/sponsors", data);
  },
  updateSponsor: async (id: string, data: InsertSponsor): Promise<Sponsor> => {
    return apiRequest("PUT", `/api/sponsors/${id}`, data);
  },
  deleteSponsor: async (id: string): Promise<void> => {
    return apiRequest("DELETE", `/api/sponsors/${id}`);
  },
  deleteAllSponsors: async (): Promise<void> => {
    return apiRequest("DELETE", "/api/admin/sponsors/all");
  }
};