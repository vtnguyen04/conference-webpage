import { DocumentCard } from "@/components/DocumentCard";
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
import { usePublicDocuments } from "@/hooks/usePublicData";
import { format } from "date-fns";
import { FileText, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";

export default function DocumentsPage() {
  const [, params] = useRoute("/conference/:slug/documents");
  const slug = params?.slug;
  const { conference } = useActiveConference();

  const { data: documents = [], isLoading } = usePublicDocuments(slug || conference?.slug);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(documents.length / itemsPerPage);

  const paginatedDocuments = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (documents.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [documents.length]);

  const stats = useMemo(() => {
    if (!documents.length) return null;
    return {
      total: documents.length,
      withPdf: documents.filter(d => !!d.pdfUrl).length,
      daysCount: new Set(documents.map(d => {
        const date = d.publishedAt ? new Date(d.publishedAt) : null;
        return date && !isNaN(date.getTime()) ? format(date, "yyyy-MM-dd") : "unknown";
      })).size
    };
  }, [documents]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang tải kỷ yếu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Kỷ yếu hội nghị"
        subtitle="Tổng hợp các báo cáo, tài liệu nghiên cứu và ấn phẩm chuyên môn từ hội nghị."
        bannerImageUrl={conference?.bannerUrls?.[0]}
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white/80 hover:text-white transition-opacity">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold">Kỷ yếu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 shadow-sm">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-extrabold uppercase tracking-widest">Tài liệu chuyên môn</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Kỷ yếu
              </h2>
              <div className="h-1 w-20 bg-indigo-500 rounded-full" />
            </div>

            {documents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                  {paginatedDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} slug={slug} />
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

                {stats && (
                  <div className="mt-20 pt-12 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-indigo-600 tracking-tighter">{stats.total}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng số tài liệu</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-rose-600 tracking-tighter">{stats.withPdf}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Có tệp đính kèm (PDF)</p>
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
                    Chưa có tài liệu kỷ yếu nào được đăng tải
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
