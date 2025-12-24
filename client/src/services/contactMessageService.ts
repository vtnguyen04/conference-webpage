import { apiRequest } from "./apiClient";
import type { ContactMessage } from "@shared/types";

export const contactMessageService = {
  getContactMessages: async (query?: string, page: number = 1, limit: number = 10): Promise<{ data: ContactMessage[], total: number }> => {
    const url = `/api/admin/contact-messages/search?query=${query || ''}&page=${page}&limit=${limit}`;
    const response = await apiRequest("GET", url);
    return response as { data: ContactMessage[], total: number };
  },

  deleteContactMessage: async (id: string): Promise<void> => {
    return await apiRequest("DELETE", `/api/admin/contact-messages/${id}`);
  },

  deleteAllContactMessages: async (): Promise<void> => {
    return await apiRequest("DELETE", "/api/admin/contact-messages/all");
  },
};
