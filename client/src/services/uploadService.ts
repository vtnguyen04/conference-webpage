import { apiUploadFile, apiRequest } from "./apiClient";
export const uploadService = {
  uploadImage: async (formData: FormData): Promise<{ imagePath: string }> => {
    return apiUploadFile("/api/upload", formData);
  },
  uploadPdf: async (formData: FormData): Promise<{ pdfPath: string }> => {
    return apiUploadFile("/api/upload-pdf", formData);
  },
  deleteFile: async (filePath: string): Promise<void> => {
    return apiRequest("DELETE", `/api/upload?filePath=${filePath}`);
  },
};
