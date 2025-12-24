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
        // If it's a 400 "Already checked in" error, treat it as a success for react-query's onSuccess callback
        if (error.message && error.message.includes("400: {\"message\":\"Already checked in for this session\"}")) {
          // Return a resolved promise with a specific payload that onSuccess can interpret
          return { status: 400, message: "Already checked in for this session" };
        }
        throw error; // Re-throw other errors to trigger onError
      }
  },
};
