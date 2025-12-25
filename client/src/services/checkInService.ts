import { apiRequest } from "./apiClient";
import type { CheckIn, Registration } from "@shared/types";
interface CheckInWithDetails extends CheckIn {
  registration?: Registration;
}
export const checkInService = {
  getCheckInsBySession: async (sessionId: string, page: number, limit: number): Promise<{ data: CheckInWithDetails[], total: number }> => {
    const response = await apiRequest("GET", `/api/check-ins/session/${sessionId}?page=${page}&limit=${limit}`);
    return response as { data: CheckInWithDetails[], total: number };
  },
  checkIn: async (qrData: string, sessionId: string): Promise<any> => {
    try {
        const response = await apiRequest("POST", "/api/check-ins", { 
          qrData, 
          sessionId 
        });
        return response;
      } catch (error: any) {
        if (error.message && error.message.includes("400: {\"message\":\"Already checked in for this session\"}")) {
          return { status: 400, message: "Already checked in for this session" };
        }
        throw error;
      }
  },
};
