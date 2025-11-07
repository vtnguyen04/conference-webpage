import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Award,
  Megaphone,
  UserCheck,
  BarChart3,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const menuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/conference", icon: FileText, label: "Thông tin hội nghị" },
  { href: "/admin/sessions", icon: Calendar, label: "Phiên họp" },
  { href: "/admin/speakers", icon: Users, label: "Diễn giả & Chủ tọa" },
  { href: "/admin/sponsors", icon: Award, label: "Nhà tài trợ" },
  { href: "/admin/announcements", icon: Megaphone, label: "Thông báo" },
  { href: "/admin/registrations", icon: UserCheck, label: "Đăng ký" },
  { href: "/admin/checkin", icon: UserCheck, label: "Check-in" },
  { href: "/admin/analytics", icon: BarChart3, label: "Thống kê" },
];


interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}


export function AdminLayout({ children, className }: AdminLayoutProps) {
  console.log("AdminLayout rendered");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-6">
                <Link href="/admin">
                  <a className="text-lg font-bold text-primary">
                    Quản lý Hội Nghị
                  </a>
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={location === item.href}
                        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => setLocation(item.href)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Xem trang công khai
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-logout"
                onClick={async () => {
                  try {
                    await fetch("/api/logout", { method: "POST", credentials: "include" });
                    setLocation("/login");
                  } catch (error) {
                    console.error("Logout failed:", error);
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
