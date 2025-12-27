import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Mail, Phone, MapPin, ChevronDown, Facebook, Globe, Share2, Calendar, FileText, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Conference } from "@shared/types";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: allConferences = [] } = useQuery<Conference[]>({
    queryKey: ["/api/conferences"],
  });

  const activeConference = allConferences.find(c => c.isActive);
  const pastConferences = allConferences.filter(c => !c.isActive).sort((a, b) => (b.startDate ? new Date(b.startDate).getTime() : 0) - (a.startDate ? new Date(a.startDate).getTime() : 0));

  useEffect(() => {
    if (activeConference?.name) {
      document.title = activeConference.name;
    }
  }, [activeConference]);

  useEffect(() => {
    const handleScroll = () => {
      // Sử dụng ngưỡng cao hơn để tránh jitter ở đầu trang
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const getConferenceMenuItems = (conference: Conference, isCurrentActive: boolean) => {
    const allItems = [
      { href: isCurrentActive ? "/program" : `/conference/${conference.slug}/program`, label: "Chương trình hội nghị" },
      { href: isCurrentActive ? "/speakers" : `/conference/${conference.slug}/speakers`, label: "Chủ tọa & Báo cáo viên" },
      { href: isCurrentActive ? "/organizers" : `/conference/${conference.slug}/organizers`, label: "Ban tổ chức" },
      { href: isCurrentActive ? "/sponsors" : `/conference/${conference.slug}/sponsors`, label: "Đơn vị tài trợ" },
      { href: isCurrentActive ? "/announcements" : `/conference/${conference.slug}/announcements`, label: "Thông báo" },
      { href: isCurrentActive ? "/documents" : `/conference/${conference.slug}/documents`, label: "Tài liệu báo cáo" },
    ];
    if (conference.isActive) {
      allItems.push(
        { href: "/register", label: "Đăng ký tham dự" },
        { href: "/khao-sat", label: "Khảo sát" }
      );
    }
    return allItems;
  };

  const navItems = [
    { href: "/", label: "TRANG CHỦ" },
    { href: "/about", label: "GIỚI THIỆU" },
    { href: "/organizers", label: "BAN TỔ CHỨC" },
  ];

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-2 text-sm font-bold transition-all duration-200 mx-1 uppercase tracking-tight",
        location === href
          ? "text-teal-600"
          : "text-slate-700 hover:text-teal-600"
      )}
    >
      {children}
      {location === href && (
        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-teal-600 rounded-full" />
      )}
    </Link>
  );

  return (
    <div className={cn("min-h-screen bg-white flex flex-col", className)}>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 h-20", // Chiều cao cố định h-20
        scrolled
          ? "bg-white/95 shadow-md backdrop-blur-md"
          : "bg-white border-b border-slate-100"
      )}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex h-full items-center justify-between">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0">
              {activeConference?.logoUrl ? (
                <img
                  src={activeConference.logoUrl}
                  alt={activeConference.name || 'Logo'}
                  className="h-14 w-auto object-contain" // Chiều cao ảnh cố định
                />
              ) : (
                <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Logo</span>
                </div>
              )}
            </Link>
            
            <nav className="hidden lg:flex items-center space-x-1 mx-auto">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
              ))}
              {activeConference && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-700 hover:text-teal-600 transition-colors uppercase tracking-tight",
                      location.startsWith(`/conference/${activeConference.slug}`) && "text-teal-600"
                    )}>
                      THÔNG TIN HỘI NGHỊ <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56 p-2 rounded-xl shadow-xl border-slate-100">
                    {getConferenceMenuItems(activeConference, true).map(item => (
                      <Link key={item.href} href={item.href}>
                        <DropdownMenuItem className="cursor-pointer font-bold text-[11px] py-2.5 uppercase tracking-tighter hover:bg-teal-50 hover:text-teal-700 rounded-lg">
                          {item.label}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-700 hover:text-teal-600 transition-colors uppercase tracking-tight">
                    CÁC KỲ HỘI NGHỊ <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 p-2 rounded-xl shadow-xl border-slate-100">
                  {pastConferences.length > 0 ? (
                    pastConferences.map((conf) => (
                      <DropdownMenuSub key={conf.slug}>
                        <DropdownMenuSubTrigger className="py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-tighter">
                          {conf.name}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-56 p-2 rounded-xl shadow-xl ml-1 border-slate-100">
                            {getConferenceMenuItems(conf, false).map(item => (
                              <Link key={item.href} href={item.href}>
                                <DropdownMenuItem className="cursor-pointer font-bold text-[11px] py-2 uppercase tracking-tighter">
                                  {item.label}
                                </DropdownMenuItem>
                              </Link>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="text-xs text-slate-400">Không có dữ liệu hội nghị cũ</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <NavLink href="/sightseeing">THAM QUAN</NavLink>
              <NavLink href="/contact">LIÊN HỆ</NavLink>
            </nav>

            <div className="hidden lg:block flex-shrink-0">
              <Link href="/register">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-black px-8 h-11 rounded-full shadow-lg shadow-teal-100 uppercase text-[11px] tracking-widest transition-all active:scale-95">
                  Đăng ký tham dự
                </Button>
              </Link>
            </div>

            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-300 shadow-2xl">
            <nav className="container mx-auto p-6 space-y-2 max-h-[80vh] overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-4 py-3 text-sm font-bold transition-colors rounded-xl uppercase tracking-tight",
                    location === item.href ? "bg-teal-50 text-teal-700" : "text-slate-700 hover:bg-slate-50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-6 rounded-2xl uppercase tracking-widest shadow-lg">
                    Đăng ký ngay
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Padding top to compensate for fixed header */}
      <main className="flex-1 relative pt-20">
        {children}
      </main>

      <footer className="bg-[#042f2e] text-white pt-20 pb-10 mt-auto">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-16">
            
            {/* Column 1: Brand Intro */}
            <div className="space-y-6">
              <Link href="/" className="inline-block">
                {activeConference?.logoUrl ? (
                  <img src={activeConference.logoUrl} alt="Logo" className="h-16 w-auto object-contain bg-white rounded-lg p-2 shadow-lg" />
                ) : (
                  <div className="h-16 w-16 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                    <span className="text-[10px] font-bold text-white uppercase">Hội Nghị</span>
                  </div>
                )}
              </Link>
              <div className="space-y-4">
                <h3 className="font-bold text-xl leading-tight text-white uppercase tracking-tight">
                  {activeConference?.name || "Hội Nghị Khoa Học"}
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {activeConference?.theme || "Nâng tầm nghiên cứu và phát triển y dược bền vững."}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <a href="#" className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-teal-600 transition-all">
                  <Facebook className="h-5 w-5 text-white" />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-teal-600 transition-all">
                  <Globe className="h-5 w-5 text-white" />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-teal-600 transition-all">
                  <Share2 className="h-5 w-5 text-white" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-6">
              <h4 className="text-xs font-black text-teal-400 uppercase tracking-[0.2em]">Thông tin chung</h4>
              <nav className="flex flex-col gap-4">
                <Link href="/about" className="text-sm font-bold text-slate-100 hover:text-teal-400 transition-colors flex items-center group">
                  <ArrowRight className="h-3.5 w-3.5 mr-2 text-teal-500 group-hover:translate-x-1 transition-transform" /> Giới thiệu hội nghị
                </Link>
                <Link href="/program" className="text-sm font-bold text-slate-100 hover:text-teal-400 transition-colors flex items-center group">
                  <ArrowRight className="h-3.5 w-3.5 mr-2 text-teal-500 group-hover:translate-x-1 transition-transform" /> Chương trình khoa học
                </Link>
                <Link href="/speakers" className="text-sm font-bold text-slate-100 hover:text-teal-400 transition-colors flex items-center group">
                  <ArrowRight className="h-3.5 w-3.5 mr-2 text-teal-500 group-hover:translate-x-1 transition-transform" /> Báo cáo viên & Chủ tọa
                </Link>
                <Link href="/announcements" className="text-sm font-bold text-slate-100 hover:text-teal-400 transition-colors flex items-center group">
                  <ArrowRight className="h-3.5 w-3.5 mr-2 text-teal-500 group-hover:translate-x-1 transition-transform" /> Thông báo từ BTC
                </Link>
              </nav>
            </div>

            {/* Column 3: Contact Info */}
            <div className="space-y-6">
              <h4 className="text-xs font-black text-teal-400 uppercase tracking-[0.2em]">Ban Thư ký Hội nghị</h4>
              <div className="space-y-5">
                {activeConference?.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-100 leading-relaxed italic">{activeConference.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-teal-400" />
                  </div>
                  <a href={`tel:${activeConference?.contactPhone}`} className="text-sm font-black text-white hover:text-teal-400 transition-colors">
                    {activeConference?.contactPhone || "Đang cập nhật"}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-teal-400" />
                  </div>
                  <a href={`mailto:${activeConference?.contactEmail}`} className="text-sm font-black text-white hover:text-teal-400 transition-colors truncate">
                    {activeConference?.contactEmail || "Đang cập nhật"}
                  </a>
                </div>
              </div>
            </div>

            {/* Column 4: Map */}
            <div className="space-y-6">
              <h4 className="text-xs font-black text-teal-400 uppercase tracking-[0.2em]">Bản đồ chỉ dẫn</h4>
              {activeConference?.location ? (
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-48 bg-slate-800">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(activeConference.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Bản đồ địa điểm"
                  ></iframe>
                </div>
              ) : (
                <div className="h-48 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-center p-6">
                  <MapPin className="h-8 w-8 text-teal-900 mb-2 opacity-20" />
                  <p className="text-xs font-bold text-teal-800 uppercase">Tọa độ đang cập nhật</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-10 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-100">
                  © {new Date().getFullYear()} {activeConference?.name || "Hội Nghị Y Học"}
                </p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                  Phát triển bởi Ban Thư ký Hội nghị
                </p>
              </div>
              <div className="flex items-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
                <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
                <a href="#" className="hover:text-white transition-colors">Trợ giúp</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}