import { apiRequest } from "./apiClient";
import type { Registration, InsertRegistration } from "@shared/types";
interface BatchRegistrationRequest {
  fullName: string;
  email: string;
  phone: string;
  organization?: string;
  position?: string;
  role: "participant" | "speaker" | "moderator";
  cmeCertificateRequested: boolean;
  sessionIds: string[];
  conferenceSlug?: string;
}
interface SuccessData {
  success: boolean;
  registrations?: any[];
  confirmationToken?: string;
  emailSent?: boolean;
}
export const registrationService = {
  getRegistrations: async (_slug: string | undefined, query?: string, page: number = 1, limit: number = 10): Promise<{ data: Registration[], total: number }> => {
    const url = `/api/admin/registrations/search?query=${query || ''}&page=${page}&limit=${limit}`;
    return apiRequest("GET", url);
  },
  deleteRegistration: async (id: string): Promise<void> => {
    return apiRequest("DELETE", `/api/admin/registrations/${id}`);
  },
  checkInRegistration: async (registrationId: string): Promise<void> => {
    return apiRequest("POST", `/api/check-ins/manual`, { registrationId });
  },
  bulkCheckinRegistrations: async (registrationIds: string[], sessionId: string): Promise<{ successCount: number; failCount: number }> => {
    return apiRequest("POST", "/api/admin/bulk-checkin-registrations", { registrationIds, sessionId });
  },
  addRegistration: async (data: InsertRegistration): Promise<Registration> => {
    return apiRequest("POST", "/api/admin/registrations", data);
  },
  batchRegisterSessions: async (data: BatchRegistrationRequest): Promise<SuccessData> => {
    return apiRequest("POST", "/api/registrations/batch", data);
  },
};
