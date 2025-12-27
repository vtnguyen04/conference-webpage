import { apiRequest } from "./apiClient";

export interface DashboardAnalytics {
  totalRegistrations: number;
  totalCheckIns: number;
  totalSessions: number;
  totalSponsors: number;
}

export const analyticsService = {
  getStats: async (): Promise<DashboardAnalytics> => {
    return apiRequest("GET", "/api/analytics");
  }
};
