import { apiRequest } from "./apiClient";
import type { Document } from "@shared/types";
export const documentService = {
  getDocuments: async (): Promise<Document[]> => {
    return apiRequest("GET", "/api/documents");
  },
};
