import { useQuery } from "@tanstack/react-query";
import { analyticsService, type DashboardAnalytics } from "@/services/analyticsService";

export function useAnalytics() {
  const analyticsQuery = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics"],
    queryFn: analyticsService.getStats,
    refetchInterval: 30000, // Tự động làm mới mỗi 30 giây
  });

  const analytics = analyticsQuery.data;
  
  const attendanceRate = analytics?.totalRegistrations
    ? Math.round((analytics.totalCheckIns / analytics.totalRegistrations) * 100)
    : 0;

  const notCheckedIn = analytics
    ? analytics.totalRegistrations - analytics.totalCheckIns
    : 0;

  return {
    analytics,
    isLoading: analyticsQuery.isLoading,
    isError: analyticsQuery.isError,
    error: analyticsQuery.error,
    attendanceRate,
    notCheckedIn,
  };
}
