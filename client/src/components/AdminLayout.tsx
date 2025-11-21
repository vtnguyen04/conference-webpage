import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
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
  ChevronDown,
  Bell,
  Search,
  Menu,
  Building,
  Mail,
  Eye,
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
  useSidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { useAdminView } from "@/hooks/useAdminView";
import type { Conference } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const menuItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Tổng quan"
  },
  {
    href: "/admin/conference",
    icon: FileText,
    label: "Hội nghị"
  },
  {
    href: "/admin/conferences",
    icon: Building,
    label: "Quản lý hội nghị"
  },
  {
    href: "/admin/sessions",
    icon: Calendar,
    label: "Phiên họp"
  },
  {
    href: "/admin/speakers",
    icon: Users,
    label: "Diễn giả"
  },
  {
    href: "/admin/organizers",
    icon: Users,
    label: "Ban tổ chức"
  },
  {
    href: "/admin/sponsors",
    icon: Award,
    label: "Nhà tài trợ"
  },
  {
    href: "/admin/announcements",
    icon: Megaphone,
    label: "Thông báo"
  },
  {
    href: "/admin/sightseeing",
    icon: Building,
    label: "Địa điểm tham quan"
  },
  {
    href: "/admin/registrations",
    icon: UserCheck,
    label: "Đăng ký"
  },
  {
    href: "/admin/checkin",
    icon: UserCheck,
    label: "Check-in"
  },
  {
    href: "/admin/analytics",
    icon: BarChart3,
    label: "Phân tích"
  },
  {
    href: "/admin/contact-messages",
    icon: Mail,
    label: "Tin nhắn liên hệ"
  }
];

const ConferenceSelector = () => {
  const { data: conferences = [] } = useQuery<Conference[]>({
    queryKey: ['/api/conferences'],
  });
  const { viewingSlug, setViewingSlug, isReadOnly } = useAdminView();

  if (!viewingSlug) return null;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={viewingSlug}
        onValueChange={(value) => setViewingSlug(value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Chọn hội nghị..." />
        </SelectTrigger>
        <SelectContent>
          {conferences.map((conf) => (
            <SelectItem key={conf.slug} value={conf.slug}>
              {conf.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isReadOnly && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Chế độ chỉ xem
        </Badge>
      )}
    </div>
  );
};

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  const { refetch: refetchAuth } = useAuth();
  const setSlugs = useAdminView(state => state.setSlugs);

  const { data: activeConference } = useQuery<Conference>({
    queryKey: ['/api/conferences/active'],
  });

  useEffect(() => {
    if (activeConference) {
      setSlugs(activeConference.slug, activeConference.slug);
    }
  }, [activeConference, setSlugs]);

  // Fetch contact message count
  const { data: contactMessageCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/stats/contact-messages"],
    queryFn: async () => {
      const response = await fetch("/api/stats/contact-messages");
      if (!response.ok) {
        throw new Error("Failed to fetch contact message count");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });



  const handleLogout = async () => {
    try {
      console.log("handleLogout: Function started.");
      console.log("Attempting logout...");
      const response = await fetch("/api/logout", { method: "POST", credentials: "include" });
      const result = await response.json();
      console.log("Logout API response:", result);
      if (response.ok) {
        console.log("Logout successful, redirecting to /admin/login");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); // Invalidate auth query
        await refetchAuth(); // Force refetch of auth status
        setLocation("/admin/login");
        toast({
          title: "Đã đăng xuất",
          description: "Bạn đã đăng xuất thành công.",
        });
      } else {
        console.error("Logout failed on server:", result.message);
        toast({ title: "Lỗi đăng xuất", description: result.message || "Đăng xuất thất bại.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Logout failed on client:", error);
      toast({
        title: "Lỗi",
        description: "Đăng xuất thất bại. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar */}
      <Sidebar className="border-r border-gray-200 bg-white">
        <SidebarContent>
          {/* Header */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-3 transition-all duration-300",
                  !sidebarOpen && "justify-center"
                )}>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  {sidebarOpen && (
                    <span className="font-semibold text-gray-900">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </SidebarGroupLabel>
          </SidebarGroup>

          <SidebarGroup className="mt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={location === item.href}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => setLocation(item.href)}
                      className={cn(
                        "group relative transition-all duration-200 mx-2 rounded-md",
                        "hover:bg-gray-100 hover:text-gray-900",
                        location === item.href && "bg-blue-50 text-blue-700 border border-blue-200"
                      )}
                      tooltip={!sidebarOpen ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className="h-4 w-4" />
                        
                        {sidebarOpen && (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="font-medium text-sm">{item.label}</span>
                            {item.href === "/admin/contact-messages" && contactMessageCount.count > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {contactMessageCount.count}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset>
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <ConferenceSelector />
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                  AU
                </AvatarFallback>
              </Avatar>
              
              {sidebarOpen && (
                <>
                  <div className="flex flex-col items-start">
                    <p className="font-medium text-gray-900 text-sm">
                      Admin User
                    </p>
                    <p className="text-xs text-gray-500">
                      Quản trị viên
                    </p>
                  </div>
                  
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Xem website
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {menuItems.find(item => item.href === location)?.label || "Tổng quan"}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto p-6 bg-gray-50",
          className
        )}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}