import { AnnouncementCard } from "@/components/AnnouncementCard";
import { PageHeader } from "@/components/PageHeader";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicAnnouncements } from "@/hooks/usePublicData";
import { format } from "date-fns";
import { Info, Newspaper } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";

export default function AnnouncementsPage() {
  const [, params] = useRoute("/conference/:slug/announcements");
  const slug = params?.slug;
  const { conference } = useActiveConference();

  const { data: announcements = [], isLoading } = usePublicAnnouncements(slug || conference?.slug);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(announcements.length / itemsPerPage);

  const paginatedAnnouncements = announcements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcements.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [announcements.length]);

  // Logic thống kê được khôi phục
  const stats = useMemo(() => {
    if (!announcements.length) return null;
    return {
      total: announcements.length,
      important: announcements.filter(a => a.category === "important").length,
      deadline: announcements.filter(a => a.category === "deadline").length,
      news: announcements.filter(a => a.category === "news").length,
      daysCount: new Set(announcements.map(a => {
        const date = a.publishedAt ? new Date(a.publishedAt) : null;
        return date && !isNaN(date.getTime()) ? format(date, "yyyy-MM-dd") : "unknown";
      })).size
    };
  }, [announcements]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang tải bản tin mới nhất...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Thông báo & Tin tức"
        subtitle="Cập nhật những thông tin mới nhất về lịch trình, tài liệu và các hoạt động bên lề của hội nghị."
        bannerImageUrl={conference?.bannerUrls?.[0]}
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white opacity-80 hover:opacity-100 transition-opacity">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold">Bản tin hội nghị</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 shadow-sm">
                <Newspaper className="h-4 w-4" />
                <span className="text-xs font-extrabold uppercase tracking-widest">Tin tức tiêu điểm</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Cập nhật mới nhất
              </h2>
              <div className="h-1 w-20 bg-teal-500 rounded-full" />
            </div>

            {announcements.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-8">
                  {paginatedAnnouncements.map((announcement) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} type="regular" />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {[...Array(totalPages)].map((_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              onClick={() => setCurrentPage(i + 1)}
                              isActive={currentPage === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* Phần Thống kê được khôi phục và nâng cấp UI */}
                {stats && (
                  <div className="mt-20 pt-12 border-t border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
                      <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-teal-600 tracking-tighter">{stats.total}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng thông báo</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-rose-600 tracking-tighter">{stats.important}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tin quan trọng</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-amber-600 tracking-tighter">{stats.deadline}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hạn đăng ký</p>
                      </div>
                       <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter">{stats.news}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tin tức</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-slate-600 tracking-tighter">{stats.daysCount}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày cập nhật</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-dashed border-2 border-slate-200 bg-white/50 shadow-none">
                <CardContent className="p-20 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                    Chưa có thông báo nào được đăng tải
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
