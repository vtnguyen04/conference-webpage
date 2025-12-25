import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Calendar, Award, Mail } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Conference } from "@shared/types";
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
      title: "Đăng ký",
      value: stats?.totalRegistrations || 0,
      icon: Users,
      color: "text-blue-500",
      href: "/admin/registrations",
    },
    {
      title: "Check-in",
      value: stats?.totalCheckIns || 0,
      icon: UserCheck,
      color: "text-green-500",
      href: "/admin/checkin",
    },
    {
      title: "Phiên họp",
      value: stats?.totalSessions || 0,
      icon: Calendar,
      color: "text-orange-500",
      href: "/admin/sessions",
    },
    {
      title: "Nhà tài trợ",
      value: stats?.totalSponsors || 0,
      icon: Award,
      color: "text-purple-500",
      href: "/admin/sponsors",
    },
    {
      title: "Tin nhắn liên hệ",
      value: contactMessagesStats?.count || 0,
      icon: Mail,
      color: "text-red-500",
      href: "/admin/contact-messages",
    },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        {conference && (
          <p className="text-muted-foreground" data-testid="text-current-conference">
            Hội nghị hiện tại: {conference.name}
          </p>
        )}
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid={`card-stat-${stat.title}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold" data-testid={`text-stat-${stat.title}`}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/admin/conference">
              <Button variant="outline" className="w-full justify-start" data-testid="button-manage-conference">
                <Calendar className="mr-2 h-4 w-4" />
                Quản lý hội nghị
              </Button>
            </Link>
            <Link href="/admin/registrations">
              <Button variant="outline" className="w-full justify-start" data-testid="button-view-registrations">
                <Users className="mr-2 h-4 w-4" />
                Xem đăng ký
              </Button>
            </Link>
            <Link href="/admin/checkin">
              <Button variant="outline" className="w-full justify-start" data-testid="button-checkin">
                <UserCheck className="mr-2 h-4 w-4" />
                Check-in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
