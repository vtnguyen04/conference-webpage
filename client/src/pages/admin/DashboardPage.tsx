import { useQuery } from "@tanstack/react-query";
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
import type { Conference } from "@shared/types";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalRegistrations: number;
  totalCheckIns: number;
  totalSessions: number;
  totalSponsors: number;
}

interface ContactMessagesStats {
  count: number;
}

export default function DashboardPage() {
  const { data: conference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });
  const { data: contactMessagesStats } = useQuery<ContactMessagesStats>({
    queryKey: ["/api/stats/contact-messages"],
  });

  const statCards = [
    {
      title: "Tổng số Đăng ký",
      value: stats?.totalRegistrations || 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      trend: "+12%",
      trendUp: true,
      description: "Người tham gia mới",
      href: "/admin/registrations",
    },
    {
      title: "Đã Check-in",
      value: stats?.totalCheckIns || 0,
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600",
      trend: "+5.4%",
      trendUp: true,
      description: "Tỷ lệ tham dự: 85%",
      href: "/admin/checkin",
    },
    {
      title: "Phiên họp",
      value: stats?.totalSessions || 0,
      icon: Calendar,
      color: "bg-orange-50 text-orange-600",
      trend: "Ổn định",
      trendUp: null,
      description: "Đang diễn ra: 2",
      href: "/admin/sessions",
    },
    {
      title: "Nhà tài trợ",
      value: stats?.totalSponsors || 0,
      icon: Award,
      color: "bg-purple-50 text-purple-600",
      trend: "+2",
      trendUp: true,
      description: "Mục tiêu: 10",
      href: "/admin/sponsors",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="group hover:shadow-md transition-all duration-300 border-slate-200/60 overflow-hidden cursor-pointer">
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
                    <p className="text-[13px] font-medium text-slate-500 uppercase tracking-tight">{stat.title}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {stat.value}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
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
        {/* Main Actions & Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Thông tin Hội nghị</CardTitle>
                  <CardDescription>Chi tiết cấu hình và trạng thái hiện tại</CardDescription>
                </div>
                <Link href="/admin/conference">
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
                    Chỉnh sửa cấu hình
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {conference ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên hội nghị</span>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{conference.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đường dẫn (Slug)</span>
                    <p className="text-sm font-mono text-indigo-600 font-semibold">{conference.slug}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày bắt đầu</span>
                    <p className="text-sm font-bold text-slate-700 italic">{new Date(conference.startDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                    <div className="flex items-center pt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                      <span className="text-xs font-bold text-emerald-600 uppercase">Đang kích hoạt</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">Chưa có hội nghị nào được kích hoạt</p>
                  <Link href="/admin/conferences">
                    <Button variant="link" className="text-indigo-600">Quản lý danh sách hội nghị</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
             <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Thao tác nhanh</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Link href="/admin/registrations">
                    <Button variant="ghost" className="w-full justify-between hover:bg-slate-50 group h-12">
                      <div className="flex items-center">
                        <Plus className="mr-3 h-4 w-4 text-indigo-500" />
                        <span className="font-semibold text-slate-700">Thêm người đăng ký mới</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </Button>
                  </Link>
                  <Link href="/admin/announcements">
                    <Button variant="ghost" className="w-full justify-between hover:bg-slate-50 group h-12">
                      <div className="flex items-center">
                        <Megaphone className="mr-3 h-4 w-4 text-orange-500" />
                        <span className="font-semibold text-slate-700">Đăng thông báo mới</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                    </Button>
                  </Link>
                </CardContent>
             </Card>

             <Card className="border-slate-200/60 shadow-sm bg-indigo-600 text-white">
                <CardContent className="p-6 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <ExternalLink className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="mt-8">
                    <h4 className="text-xl font-bold italic">Khám phá Analytics</h4>
                    <p className="text-indigo-100 text-xs mt-2 font-medium">Xem chi tiết báo cáo và biểu đồ tăng trưởng của hội nghị.</p>
                  </div>
                  <Link href="/admin/analytics">
                    <Button className="mt-6 bg-white text-indigo-600 hover:bg-indigo-50 font-bold w-full">
                      Xem báo cáo ngay
                    </Button>
                  </Link>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Sidebar News/Contact */}
        <div className="space-y-8">
          <Card className="border-slate-200/60 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-slate-800">Tin nhắn mới</CardTitle>
              {contactMessagesStats && contactMessagesStats.count > 0 && (
                <Badge className="bg-rose-500 text-white border-none font-bold">
                  {contactMessagesStats.count} mới
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Bạn có các yêu cầu hỗ trợ hoặc tin nhắn liên hệ từ người tham gia chưa xử lý.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase">Yêu cầu hỗ trợ mới nhất</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">2 giờ trước</span>
                    </div>
                  </div>
                </div>
                <Link href="/admin/contact-messages">
                  <Button variant="link" className="px-0 h-auto text-indigo-600 font-bold text-sm">
                    Xem tất cả tin nhắn &rarr;
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

