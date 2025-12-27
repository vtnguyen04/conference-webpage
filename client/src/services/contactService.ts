import { apiRequest } from "./apiClient";

export const contactService = {
  sendMessage: async (data: any): Promise<any> => {
    return apiRequest("POST", "/api/contact", data);
  }
};