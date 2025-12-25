import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, UserCheck } from "lucide-react";
export default function AnalyticsPage() {
  const { data: analytics } = useQuery<{
    totalRegistrations: number;
    totalCheckIns: number;
    totalSessions: number;
    totalSponsors: number;
  }>({
    queryKey: ["/api/analytics"],
  });
  const attendanceRate = analytics?.totalRegistrations
    ? Math.round((analytics.totalCheckIns / analytics.totalRegistrations) * 100)
    : 0;
  const notCheckedIn = analytics
    ? analytics.totalRegistrations - analytics.totalCheckIns
    : 0;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold" data-testid="text-analytics-title">
        Thống kê & Phân tích
      </h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tổng đăng ký</p>
              <p className="text-3xl font-bold">{analytics?.totalRegistrations || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Đã check-in</p>
              <p className="text-3xl font-bold">{analytics?.totalCheckIns || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tỷ lệ tham dự</p>
              <p className="text-3xl font-bold">{attendanceRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chưa check-in</p>
              <p className="text-3xl font-bold">{notCheckedIn}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thống kê tổng quan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số phiên họp</span>
                <span className="font-semibold">{analytics?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nhà tài trợ</span>
                <span className="font-semibold">{analytics?.totalSponsors || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ tham dự</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Đã check-in</span>
                  <span className="font-semibold">{attendanceRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
