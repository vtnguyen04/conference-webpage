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
import { Menu, X, Mail, Phone, MapPin, ChevronDown } from "lucide-react";
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
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        "relative px-3 py-2 text-sm font-medium transition-all duration-200 mx-1",
        location === href
          ? "text-teal-600 font-semibold"
          : "text-slate-700 hover:text-teal-600"
      )}
    >
      {children}
    </Link>
  );

  const DropdownMenuNavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href}>
      <DropdownMenuItem className="cursor-pointer">
        {children}
      </DropdownMenuItem>
    </Link>
  );

  return (
    <div className={cn("min-h-screen bg-white dark:bg-slate-950", className)}>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-sm"
          : "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0">
              {activeConference?.logoUrl ? (
                <img
                  src={activeConference.logoUrl}
                  alt={activeConference.name || 'Logo'}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-600">LOGO</span>
                </div>
              )}
            </Link>

            <nav className="hidden lg:flex items-center space-x-0 mx-auto">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
              ))}

              {activeConference && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all duration-200 mx-1 uppercase",
                        "text-slate-700 hover:text-teal-600",
                        location.startsWith(`/conference/${activeConference.slug}`) && "text-teal-600 font-semibold"
                      )}
                    >
                      {activeConference.name}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {getConferenceMenuItems(activeConference, true).map(item => (
                      <DropdownMenuNavLink key={item.href} href={item.href}>
                        {item.label}
                      </DropdownMenuNavLink>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all duration-200 mx-1",
                      "text-slate-700 hover:text-teal-600"
                    )}
                  >
                    CÁC KỲ HỘI NGHỊ
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {pastConferences.length > 0 ? (
                    pastConferences.map((conf) => (
                      <DropdownMenuSub key={conf.slug}>
                        <DropdownMenuSubTrigger>
                          <span>{conf.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {getConferenceMenuItems(conf, false).map(item => (
                              <DropdownMenuNavLink key={item.href} href={item.href}>
                                {item.label}
                              </DropdownMenuNavLink>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>Không có hội nghị cũ</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <NavLink href="/sightseeing">ĐỊA ĐIỂM THAM QUAN</NavLink>
              <NavLink href="/contact">LIÊN HỆ</NavLink>

            </nav>

            <div className="hidden lg:block flex-shrink-0">
              <Link href="/register">
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 text-sm"
                >
                  Đăng ký tham dự
                </Button>
              </Link>
            </div>

            <button
              className="lg:hidden p-2 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <nav className="container mx-auto p-4 space-y-1 max-h-[80vh] overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-4 py-3 text-sm font-medium transition-colors rounded-lg",
                    location === item.href
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {activeConference && (
                <div className="border-t border-slate-200 pt-3 mt-3">
                   <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                     Hội nghị
                   </p>
                   <div className="pl-4">
                      {getConferenceMenuItems(activeConference, true).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors rounded-lg"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 mt-3">
                 <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                   Các kỳ hội nghị cũ
                 </p>
                 {pastConferences.length > 0 ? (
                   pastConferences.map(conf => (
                     <div key={`mobile-${conf.slug}`}>
                        <p className="px-4 py-2 mt-2 font-medium text-slate-800">
                          {conf.name}
                        </p>
                        <div className="pl-4">
                          {getConferenceMenuItems(conf, false).map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors rounded-lg"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                     </div>
                   ))
                 ) : (
                  <p className="px-4 text-sm text-slate-500">Không có hội nghị cũ</p>
                 )}
              </div>
              
              <Link href="/sightseeing" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                ĐỊA ĐIỂM THAM QUAN
              </Link>
              <Link href="/contact" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                LIÊN HỆ
              </Link>

              <div className="pt-4 border-t border-slate-200">
                <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3"
                  >
                    Đăng ký tham dự
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="relative">
        {children}
      </main>

      <footer className="bg-teal-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-start gap-4 mb-6">
                {activeConference?.logoUrl && (
                  <img
                    src={activeConference.logoUrl}
                    alt="Logo"
                    className="h-14 w-14 object-contain bg-white rounded p-1"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white">
                    {activeConference?.name || "Hội Nghị Y Học"}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {activeConference?.theme || ""}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm mb-3 text-slate-200 uppercase tracking-wide">
                  Thông tin liên hệ
                </h4>
                
                {activeConference?.location && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-400" />
                    <span className="text-slate-300">
                      {activeConference.location}
                    </span>
                  </div>
                )}

                {activeConference?.contactPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 flex-shrink-0 text-teal-400" />
                    <span className="text-slate-300">
                      <span className="font-medium">Điện thoại:</span> {activeConference.contactPhone}
                    </span>
                  </div>
                )}

                {activeConference?.contactEmail && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 flex-shrink-0 text-teal-400" />
                    <span className="text-slate-300">
                      <span className="font-medium">Email:</span> {activeConference.contactEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {activeConference?.location && (
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-200 uppercase tracking-wide">
                  Bản đồ
                </h4>
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(activeConference.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Bản đồ"
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-center">
              <p className="text-sm text-slate-300">
                © {new Date().getFullYear()} <span className="font-semibold text-white">{activeConference?.name || "Hội Nghị Y Học"}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Bản quyền thuộc về Ban Tổ chức Hội nghị
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}