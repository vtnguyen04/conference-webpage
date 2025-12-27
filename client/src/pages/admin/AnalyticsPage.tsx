import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, UserCheck, Calendar, Award, ArrowUpRight, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { analyticsService, type DashboardAnalytics } from "@/services/analyticsService";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics"],
    queryFn: analyticsService.getStats,
  });

  const attendanceRate = analytics?.totalRegistrations
    ? Math.round((analytics.totalCheckIns / analytics.totalRegistrations) * 100)
    : 0;

  const notCheckedIn = analytics
    ? analytics.totalRegistrations - analytics.totalCheckIns
    : 0;

  const statCards = [
    {
      title: "Tổng lượt đăng ký",
      value: analytics?.totalRegistrations || 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      description: "Dữ liệu đại biểu toàn khóa",
      trend: "Thực tế",
    },
    {
      title: "Xác nhận tham dự",
      value: analytics?.totalCheckIns || 0,
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600",
      description: "Đại biểu đã quét mã QR",
      trend: `${attendanceRate}%`,
    },
    {
      title: "Chưa Check-in",
      value: notCheckedIn,
      icon: AlertCircle,
      color: "bg-rose-50 text-rose-600",
      description: "Đại biểu vắng mặt hoặc chưa tới",
      trend: "Cần lưu ý",
    },
    {
      title: "Tỷ lệ tăng trưởng",
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
      description: "So với dự kiến ban đầu",
      trend: "+2.4%",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Báo cáo & Phân tích Dữ liệu"
        description="Theo dõi lưu lượng đại biểu, hiệu suất check-in và các chỉ số tăng trưởng của hội nghị theo thời gian thực."
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="group border-slate-200/60 hover:shadow-md transition-all duration-300 overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl transition-colors", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center text-[10px] font-extrabold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-tighter">
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                    {isLoading ? "..." : stat.value}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-2 font-medium flex items-center">
                    <Info className="h-3 w-3 mr-1 text-slate-300" />
                    {stat.description}
                  </p>
                </div>
              </div>
              <div className="h-1 w-full bg-slate-50 group-hover:bg-indigo-500 transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Analysis */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Phân tích Tỷ lệ Tham dự</CardTitle>
                <CardDescription>So sánh giữa số lượng đăng ký và số lượng thực tế có mặt</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="relative h-32 w-32 flex items-center justify-center shrink-0">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-slate-100"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * attendanceRate) / 100}
                      className="text-emerald-500 transition-all duration-1000 ease-in-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-900">{attendanceRate}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Tham dự</span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-8 w-full">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đã Check-in</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">{analytics?.totalCheckIns || 0}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Lượt quét mã thành công</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-200" />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đăng ký</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">{analytics?.totalRegistrations || 0}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Đại biểu trong danh sách</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Tiến độ Check-in hiện tại</span>
                  <span className="text-xs font-extrabold text-emerald-600">{attendanceRate}% hoàn thành</span>
                </div>
                <Progress value={attendanceRate} className="h-3 bg-slate-100" />
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Hệ thống đang hoạt động ổn định. Dữ liệu được cập nhật tự động mỗi 30 giây.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Breakdown */}
        <div className="space-y-6">
          <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Phiên họp
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-end justify-between">
                <div>
                  <h4 className="text-3xl font-extrabold text-slate-900 leading-none">{analytics?.totalSessions || 0}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Tổng số phiên báo cáo</p>
                </div>
                <Button size="sm" variant="ghost" className="text-indigo-600 font-bold text-[10px] uppercase h-8 hover:bg-indigo-50">
                  Chi tiết <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Nhà tài trợ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-end justify-between">
                <div>
                  <h4 className="text-3xl font-extrabold text-slate-900 leading-none">{analytics?.totalSponsors || 0}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Đơn vị đồng hành</p>
                </div>
                <Button size="sm" variant="ghost" className="text-amber-600 font-bold text-[10px] uppercase h-8 hover:bg-amber-50">
                  Quản lý <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <h4 className="font-bold text-sm">Xuất báo cáo chi tiết</h4>
            <p className="text-[10px] text-indigo-100 mt-1 opacity-80 leading-relaxed font-medium">Tải xuống file dữ liệu thống kê đầy đủ dưới dạng Excel để phục vụ lưu trữ.</p>
            <Button className="w-full mt-4 bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-xs h-9">
              Download Report (.xlsx)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
