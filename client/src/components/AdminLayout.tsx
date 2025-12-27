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
  Bell,
  Menu,
  Building,
  Mail,
  Eye,
  Settings,
  Map,
  ClipboardList,
  Search,
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
  useSidebar,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAdminView } from "@/hooks/useAdminView";
import type { Conference } from "@shared/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuGroups = [
  {
    label: "Chung",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
      { href: "/admin/analytics", icon: BarChart3, label: "Phân tích & Thống kê" },
    ]
  },
  {
    label: "Quản lý Hội nghị",
    items: [
      { href: "/admin/conferences", icon: Building, label: "Danh sách hội nghị" },
      { href: "/admin/conference", icon: FileText, label: "Cấu hình chi tiết" },
      { href: "/admin/sessions", icon: Calendar, label: "Lịch trình & Phiên họp" },
    ]
  },
  {
    label: "Nội dung",
    items: [
      { href: "/admin/speakers", icon: Users, label: "Báo cáo viên" },
      { href: "/admin/organizers", icon: Users, label: "Ban tổ chức" },
      { href: "/admin/sponsors", icon: Award, label: "Nhà tài trợ" },
      { href: "/admin/announcements", icon: Megaphone, label: "Thông báo" },
      { href: "/admin/sightseeing", icon: Map, label: "Địa điểm tham quan" },
    ]
  },
  {
    label: "Đăng ký & Liên hệ",
    items: [
      { href: "/admin/registrations", icon: ClipboardList, label: "Danh sách đăng ký" },
      { href: "/admin/checkin", icon: UserCheck, label: "Quản lý Check-in" },
      { href: "/admin/contact-messages", icon: Mail, label: "Tin nhắn liên hệ", badge: true },
    ]
  }
];

const ConferenceSelector = () => {
  const { data: conferences = [] } = useQuery<Conference[]>({
    queryKey: ['api/conferences'],
  });
  const { viewingSlug, setViewingSlug, isReadOnly } = useAdminView();
  if (!viewingSlug) return null;
  
  return (
    <div className="flex items-center gap-2">
      <Select
        value={viewingSlug}
        onValueChange={(value) => setViewingSlug(value)}
      >
        <SelectTrigger className="w-[220px] bg-white border-gray-200 h-9 text-xs font-medium">
          <SelectValue placeholder="Chọn hội nghị..." />
        </SelectTrigger>
        <SelectContent>
          {conferences.map((conf) => (
            <SelectItem key={conf.slug} value={conf.slug} className="text-xs">
              {conf.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isReadOnly && (
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase tracking-wider font-bold">
          <Eye className="h-3 w-3 mr-1" />
          READ ONLY
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
  const { user, refetch: refetchAuth } = useAuth();
  const setSlugs = useAdminView(state => state.setSlugs);
  const [scrolled, setScrolled] = useState(false);

  const { data: activeConference } = useQuery<Conference>({
    queryKey: ['api', 'conferences', 'active'],
  });

  useEffect(() => {
    if (activeConference) {
      setSlugs(activeConference.slug, activeConference.slug);
    }
  }, [activeConference, setSlugs]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: contactMessageCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["api", "stats", "contact-messages"],
    queryFn: async () => {
      const response = await fetch("/api/stats/contact-messages");
      if (!response.ok) throw new Error("Failed to fetch contact message count");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", { method: "POST", credentials: "include" });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        await refetchAuth();
        setLocation("/admin/login");
        toast({ title: "Đã đăng xuất", description: "Hẹn gặp lại bạn!" });
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Đăng xuất thất bại.", variant: "destructive" });
    }
  };

  const activeItem = menuGroups.flatMap(g => g.items).find(i => i.href === location);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FC]">
      <Sidebar className="border-r border-slate-200 bg-white shadow-sm transition-all duration-300">
        <SidebarHeader className="h-16 border-b border-slate-100 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Building className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm tracking-tight uppercase">Conference</span>
                <span className="text-[10px] text-slate-500 font-medium -mt-1 uppercase tracking-widest">CMS Dashboard</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="py-4 custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <SidebarGroup key={idx} className="px-3">
              <SidebarGroupLabel className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2">
                {sidebarOpen ? group.label : "•••"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={location === item.href}
                        onClick={() => setLocation(item.href)}
                        className={cn(
                          "flex items-center gap-3 px-3 h-10 rounded-lg transition-all duration-200 group",
                          location === item.href 
                            ? "bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                        tooltip={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className={cn(
                          "h-[18px] w-[18px]",
                          location === item.href ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                        )} />
                        {sidebarOpen && (
                          <div className="flex-1 flex items-center justify-between overflow-hidden">
                            <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                            {item.badge && contactMessageCount.count > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                                {contactMessageCount.count}
                              </span>
                            )}
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-100 p-4">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl transition-colors",
            sidebarOpen ? "bg-slate-50 border border-slate-100" : "justify-center"
          )}>
            <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
              <AvatarImage src={`https://avatar.vercel.sh/${user?.email || 'admin'}.png`} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">
                {user?.email?.[0] || 'A'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate">{user?.firstName || 'Admin User'}</span>
                <span className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">System Administrator</span>
              </div>
            )}
            {sidebarOpen && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col min-w-0">
        <header className={cn(
          "sticky top-0 z-30 flex h-16 items-center justify-between px-6 transition-all duration-200 border-b",
          scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-slate-200" : "bg-white border-slate-100"
        )}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-9 w-9 text-slate-500 hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />
            
            <ConferenceSelector />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex relative group mr-4">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input 
                placeholder="Tìm kiếm nhanh..." 
                className="w-48 h-9 pl-9 bg-slate-50 border-slate-100 focus-visible:bg-white transition-all text-xs"
              />
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 relative">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </Button>

            <div className="h-6 w-[1px] bg-slate-200 mx-1" />

            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-9 rounded-full px-4 border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700">
                <Eye className="h-3.5 w-3.5 mr-2" />
                Preview Website
              </Button>
            </a>
          </div>
        </header>

        <main className={cn(
          "flex-1 overflow-y-auto p-8 custom-scrollbar",
          className
        )}>
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

