import { useRoute, Link } from "wouter";
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
import { Calendar, Tag, FileText, Eye, Facebook, Share2, Clock, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicAnnouncement } from "@/hooks/usePublicData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementService } from "@/services/announcementService";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  general: "Thông báo chung",
  important: "Quan trọng",
  deadline: "Hạn chót",
};

const categoryColors: Record<string, string> = {
  general: "bg-blue-50 text-blue-700 border-blue-100",
  important: "bg-amber-50 text-amber-700 border-amber-100",
  deadline: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function AnnouncementDetailPage() {
  const [isConferenceAnnouncements, conferenceAnnouncementsParams] = useRoute("/conference/:slug/announcements/:id");
  const [, announcementsParams] = useRoute("/announcements/:id");
  
  const slug = isConferenceAnnouncements ? conferenceAnnouncementsParams?.slug : undefined;
  const announcementId = isConferenceAnnouncements ? conferenceAnnouncementsParams?.id : announcementsParams?.id;
  
  const queryClient = useQueryClient();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { conference } = useActiveConference();

  const {
    data: announcement,
    isLoading,
    isError
  } = usePublicAnnouncement(announcementId);

  const { incrementView } = useAnnouncements(slug || undefined);

  useEffect(() => {
    if (announcementId) {
      incrementView({ id: announcementId, slug });
    }
  }, [announcementId]);

  useEffect(() => {
    if (announcement && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [announcement]);

  const handleFacebookShare = () => {
    const url = window.location.href;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookShareUrl, "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-2 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Đang tải nội dung bản tin...</p>
        </div>
      </div>
    );
  }

  if (isError || !announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-rose-100 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy bản tin</h1>
          <p className="text-slate-500 font-medium leading-relaxed">Nội dung này có thể đã bị gỡ bỏ hoặc đường dẫn không chính xác.</p>
          <Link href="/announcements">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8">Quay lại danh sách</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const announcementsLink = slug ? `/conference/${slug}/announcements` : "/announcements";

  return (
    <div className="bg-white animate-in fade-in duration-700">
      <PageHeader
        title="Bản tin Hội nghị"
        subtitle={announcement.title}
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
              <BreadcrumbLink asChild className="text-white/80 hover:text-white transition-opacity">
                <Link href={announcementsLink}>Thông báo</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold line-clamp-1 max-w-[200px]">
                {announcement.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-10">
            
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Badge className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm", categoryColors[announcement.category])}>
                  {categoryLabels[announcement.category]}
                </Badge>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(announcement.publishedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <Eye className="h-3.5 w-3.5" />
                  {announcement.views} lượt xem
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight text-center tracking-tight">
                {announcement.title}
              </h1>
              
              <div className="h-1 w-20 bg-teal-500 mx-auto rounded-full" />
            </div>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white rounded-[2rem]">
              <CardContent className="p-8 md:p-12 lg:p-16">
                {announcement.excerpt && (
                  <div className="mb-12 p-6 bg-slate-50 rounded-2xl border-l-4 border-teal-500 italic text-slate-600 font-medium leading-relaxed md:text-lg">
                    "{announcement.excerpt}"
                  </div>
                )}

                <div
                  className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed text-justify prose-headings:text-slate-900 prose-headings:font-black prose-a:text-teal-600 prose-strong:text-slate-900"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />

                {announcement.pdfUrl && (
                  <div className="mt-16 p-8 bg-teal-50/50 rounded-3xl border border-teal-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/20">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-widest">Tài liệu đính kèm</h4>
                          <p className="text-[10px] text-teal-700 font-bold uppercase tracking-tighter">Official Conference Document</p>
                        </div>
                      </div>
                      <a href={announcement.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-white text-teal-600 hover:bg-teal-50 border border-teal-200 font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-sm transition-all">
                          Tải xuống PDF
                        </Button>
                      </a>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-white h-[600px]">
                      <iframe src={announcement.pdfUrl} width="100%" height="100%" style={{ border: "none" }} title="Tài liệu thông báo" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-200">
              <Link href="/announcements">
                <Button variant="ghost" className="text-slate-500 font-bold hover:text-teal-600 flex items-center gap-2 group">
                  <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                  Quay lại danh sách tin
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Share2 className="h-3.5 w-3.5" /> Chia sẻ bài viết:
                </span>
                <Button onClick={handleFacebookShare} variant="outline" className="rounded-full border-slate-200 h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                  <Facebook className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
