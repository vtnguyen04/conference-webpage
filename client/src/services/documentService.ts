import { apiRequest } from "@/lib/queryClient";
import { Document, InsertDocument } from "@shared/schema";

export const documentService = {
  getAll: async (conferenceSlug: string): Promise<Document[]> => {
    return apiRequest<Document[]>("GET", `/api/documents/slug/${conferenceSlug}`);
  },

  getActive: async (): Promise<Document[]> => {
    return apiRequest<Document[]>("GET", "/api/documents");
  },

  getById: async (id: string, conferenceSlug?: string): Promise<Document> => {
    const url = conferenceSlug
      ? `/api/documents/${conferenceSlug}/${id}`
      : `/api/documents/${id}`;
    return apiRequest<Document>("GET", url);
  },

  create: async (data: InsertDocument): Promise<Document> => {
    return apiRequest<Document>("POST", "/api/documents", data);
  },

  update: async (id: string, data: Partial<InsertDocument>): Promise<Document> => {
    return apiRequest<Document>("PUT", `/api/documents/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/documents/${id}`);
  },

  incrementViews: async (id: string): Promise<Document> => {
    return apiRequest<Document>("POST", `/api/documents/${id}/view`);
  }
};
