import { apiRequest } from "./apiClient";
import { ContactFormValues } from "@shared/validation";

export const contactService = {
  submitContactForm: async (data: ContactFormValues): Promise<any> => {
    return apiRequest("POST", "/api/contact", data);
  },
};
