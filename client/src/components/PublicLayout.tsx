import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Mail, Phone, MapPin, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Conference } from "@shared/schema";
import { cn } from "@/lib/utils"; 


interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  console.log("PublicLayout rendered");
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: conference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  useEffect(() => {
    if (conference?.name) {
      document.title = conference.name;
    }
  }, [conference]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "TRANG CHỦ" },
    { href: "/about", label: "GIỚI THIỆU" },
  ];

  const conferenceMenuItems = [
    { href: "/announcements", label: "Thông báo" },
    { href: "/program", label: "Chương trình hội nghị" },
    { href: "/register", label: "Đăng ký tham dự" },
    { href: "/sponsors", label: "Đơn vị tài trợ" },
    { href: "/speakers", label: "Chủ tọa" },
    { href: "/post-test", label: "Làm bài Post-test" },
    { href: "/documents", label: "Tài liệu báo cáo" },
  ];

  const otherNavItems = [
    { href: "/registration-venues", label: "CÁC KỲ HỘI NGHỊ" },
    { href: "/sightseeing", label: "ĐỊA ĐIỂM THAM QUAN" },
    { href: "/contact", label: "LIÊN HỆ" },
  ];

  return (
    <div className={cn("min-h-screen bg-white dark:bg-slate-950", className)}>
      {/* Header - Thiết kế trang trọng, đơn giản */}
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled 
          ? "bg-white/90 dark:bg-slate-900/90 shadow-md" 
          : "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex h-24 items-center justify-between">
            {/* Logo only - không có text */}
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              {conference?.logoUrl ? (
                <img 
                  src={conference.logoUrl} 
                  alt={conference.name || 'Logo'} 
                  className="h-20 object-contain" 
                />
              ) : (
                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
              )}
            </Link>

            {/* Desktop Navigation - Chính thống, không màu mè */}
            <nav className="hidden lg:flex items-center space-x-0">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium tracking-wide transition-colors",
                    location === item.href
                      ? "text-blue-700 dark:text-blue-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Dropdown Menu - Hover trigger */}
              <div 
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium tracking-wide transition-colors text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
                  data-testid="nav-conference-dropdown"
                >
                  {conference?.name.toUpperCase() || 'HỘI NGHỊ'}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", dropdownOpen && "rotate-180")} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                    {conferenceMenuItems.map((item) => (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className="block px-5 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                        data-testid={`dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {otherNavItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium tracking-wide transition-colors",
                    location === item.href
                      ? "text-blue-700 dark:text-blue-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:block">
              <Link href="/register">
                <Button 
                  className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-6"
                  size="default" 
                  data-testid="button-register-header"
                >
                  Đăng ký tham dự
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <nav className="container mx-auto p-4 space-y-1 max-h-[80vh] overflow-y-auto">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "block px-4 py-3 text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {conference?.name || 'Hội nghị'}
                </p>
                {conferenceMenuItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                {otherNavItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "block px-4 py-3 text-sm font-medium transition-colors",
                      location === item.href
                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium"
                    size="lg"
                  >
                    Đăng ký tham dự
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Footer - Đơn giản, trang trọng */}
      <footer className="relative mt-24 bg-slate-900 dark:bg-slate-950 text-white border-t-2 border-blue-700">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <div className="flex items-start gap-4 mb-8">
                {conference?.logoUrl && (
                  <img
                    src={conference.logoUrl}
                    alt="Logo"
                    className="h-16 w-16 object-contain bg-white rounded p-2"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white">
                    {conference?.name || "Hội Nghị Y Học"}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {conference?.theme || ""}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-base mb-4 text-slate-200 uppercase tracking-wide">
                  Thông tin liên hệ
                </h4>
                
                {conference?.location && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-blue-400" />
                    <span className="text-slate-300">
                      {conference.location}
                    </span>
                  </div>
                )}

                {conference?.contactPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 flex-shrink-0 text-blue-400" />
                    <span className="text-slate-300">
                      <span className="font-medium">Điện thoại:</span> {conference.contactPhone}
                    </span>
                  </div>
                )}

                {conference?.contactEmail && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 flex-shrink-0 text-blue-400" />
                    <span className="text-slate-300">
                      <span className="font-medium">Email:</span> {conference.contactEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            {conference?.location && (
              <div>
                <h4 className="font-semibold text-base mb-4 text-slate-200 uppercase tracking-wide">
                  Bản đồ
                </h4>
                <div className="border border-slate-700 overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3244384857774!2d106.68338931528748!3d10.787845192312282!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f38f9ed887b%3A0x14aded124fd2a8ab!2sUniversity%20of%20Medicine%20and%20Pharmacy%20at%20Ho%20Chi%20Minh%20City!5e0!3m2!1sen!2s!4v1635000000000!5m2!1sen!2s"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Bản đồ"
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="text-center">
              <p className="text-sm text-slate-300">
                © {new Date().getFullYear()} <span className="font-semibold text-white">{conference?.name || "Hội Nghị Y Học"}</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Bản quyền thuộc về Ban Tổ chức Hội nghị
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}