import { apiRequest } from "./apiClient";

export const checkInService = {
  getCheckInsBySession: async (sessionId: string, page: number, limit: number): Promise<any> => {
    return apiRequest("GET", `/api/check-ins/session/${sessionId}?page=${page}&limit=${limit}`);
  },
  qrCheckIn: async (qrData: string, sessionId: string): Promise<any> => {
    return apiRequest("POST", "/api/check-ins", { qrData, sessionId });
  }
};