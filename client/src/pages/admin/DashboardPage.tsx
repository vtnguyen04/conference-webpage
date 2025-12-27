import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Award, 
  Mail, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink,
  Plus,
  Megaphone,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useActiveConference } from "@/hooks/useActiveConference";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function DashboardPage() {
  const { conference } = useActiveConference();
  const { analytics, attendanceRate, isLoading } = useAnalytics();

  const statCards = [
    {
      title: "Tổng số Đăng ký",
      value: analytics?.totalRegistrations || 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      trend: "+12%",
      trendUp: true,
      description: "Đại biểu mới",
      href: "/admin/registrations",
    },
    {
      title: "Đã Check-in",
      value: analytics?.totalCheckIns || 0,
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600",
      trend: `${attendanceRate}%`,
      trendUp: true,
      description: "Tỷ lệ tham dự",
      href: "/admin/checkin",
    },
    {
      title: "Phiên họp",
      value: analytics?.totalSessions || 0,
      icon: Calendar,
      color: "bg-orange-50 text-orange-600",
      trend: "Live",
      trendUp: null,
      description: "Lịch trình khoa học",
      href: "/admin/sessions",
    },
    {
      title: "Nhà tài trợ",
      value: analytics?.totalSponsors || 0,
      icon: Award,
      color: "bg-purple-50 text-purple-600",
      trend: "Partners",
      trendUp: true,
      description: "Đơn vị đồng hành",
      href: "/admin/sponsors",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="group hover:shadow-md transition-all duration-300 border-slate-200/60 overflow-hidden cursor-pointer bg-white">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl transition-colors", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {stat.trendUp !== null && (
                      <div className={cn(
                        "flex items-center text-[10px] font-bold px-2 py-1 rounded-full",
                        stat.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {stat.trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {stat.trend}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                      {isLoading ? "..." : stat.value}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                      {stat.description}
                    </p>
                  </div>
                </div>
                <div className="h-1 w-full bg-slate-50 group-hover:bg-indigo-500 transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Trạng thái Hội nghị</CardTitle>
                  <CardDescription>Cấu hình vận hành hiện tại</CardDescription>
                </div>
                <Link href="/admin/conference">
                  <Button size="sm" variant="outline" className="h-9 text-xs font-bold px-4 border-slate-200">
                    Chỉnh sửa
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {conference ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Định danh</span>
                    <p className="text-sm font-bold text-slate-700 truncate">{conference.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug URL</span>
                    <p className="text-xs font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md w-fit">/{conference.slug}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khai mạc</span>
                    <p className="text-sm font-bold text-slate-700 italic">{new Date(conference.startDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vận hành</span>
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">Không có hội nghị nào đang kích hoạt</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
             <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-50">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Thao tác nhanh</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid gap-2">
                  <Link href="/admin/registrations">
                    <Button variant="ghost" className="w-full justify-between hover:bg-slate-50 h-12 rounded-xl px-4 group">
                      <div className="flex items-center">
                        <Plus className="mr-3 h-4 w-4 text-indigo-500" />
                        <span className="font-bold text-slate-700 text-sm">Thêm đăng ký mới</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </Button>
                  </Link>
                  <Link href="/admin/announcements">
                    <Button variant="ghost" className="w-full justify-between hover:bg-slate-50 h-12 rounded-xl px-4 group">
                      <div className="flex items-center">
                        <Megaphone className="mr-3 h-4 w-4 text-orange-500" />
                        <span className="font-bold text-slate-700 text-sm">Đăng thông báo</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                    </Button>
                  </Link>
                </CardContent>
             </Card>

             <Card className="border-none shadow-xl bg-indigo-600 text-white rounded-3xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                  <div>
                    <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-6">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-xl font-black italic tracking-tight">Khám phá Analytics</h4>
                    <p className="text-indigo-100 text-[10px] mt-2 font-bold uppercase tracking-widest opacity-80">Data Deep Dive</p>
                  </div>
                  <Link href="/admin/analytics">
                    <Button className="mt-8 bg-white text-indigo-600 hover:bg-indigo-50 font-black text-xs uppercase tracking-widest w-full h-11 rounded-xl shadow-lg">
                      Xem báo cáo <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
             </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-slate-200/60 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Mail className="h-4 w-4 text-rose-500" /> Tin nhắn mới
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Bạn có các tin nhắn liên hệ từ đại biểu đang chờ xử lý trong hộp thư.
              </p>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 border-dashed">
                <Clock className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kiểm tra ngay</p>
              </div>
              <Link href="/admin/contact-messages">
                <Button variant="link" className="text-indigo-600 font-black text-[11px] uppercase tracking-widest p-0 h-auto hover:no-underline hover:text-indigo-700">
                  Mở hộp thư liên hệ &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}