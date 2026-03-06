import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveConference } from "@/hooks/useActiveConference";
import { useDocuments } from "@/hooks/useDocuments";
import { usePublicDocument } from "@/hooks/usePublicData";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, Clock, Eye, Facebook, FileText, Paperclip, Share2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useRoute } from "wouter";

export default function DocumentDetailPage() {
  const [isConferenceDocuments, conferenceDocumentsParams] = useRoute("/conference/:slug/documents/:id");
  const [, documentsParams] = useRoute("/documents/:id");

  const slug = isConferenceDocuments ? conferenceDocumentsParams?.slug : undefined;
  const documentId = isConferenceDocuments ? conferenceDocumentsParams?.id : documentsParams?.id;

  const mainContentRef = useRef<HTMLDivElement>(null);
  const { conference } = useActiveConference();

  const {
    data: documentData,
    isLoading,
    isError
  } = usePublicDocument(documentId, slug || conference?.slug);

  const { incrementView } = useDocuments(slug || conference?.slug);

  useEffect(() => {
    if (documentId) {
      incrementView(documentId);
    }
  }, [documentId]);

  useEffect(() => {
    if (documentData && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [documentData]);

  const handleFacebookShare = () => {
    const url = window.location.href;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookShareUrl, "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Đang tải nội dung kỷ yếu...</p>
        </div>
      </div>
    );
  }

  if (isError || !documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-rose-100 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy tài liệu</h1>
          <p className="text-slate-500 font-medium leading-relaxed">Tài liệu này có thể đã bị gỡ bỏ hoặc đường dẫn không chính xác.</p>
          <Link href="/documents">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8">Quay lại danh sách</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const documentsLink = slug ? `/conference/${slug}/documents` : "/documents";

  return (
    <div className="bg-white animate-in fade-in duration-700">
      <PageHeader
        title="Kỷ yếu Hội nghị"
        subtitle={documentData.title}
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
                <Link href={documentsLink}>Kỷ yếu</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold line-clamp-1 max-w-[200px]">
                {documentData.title}
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
                <Badge className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm bg-indigo-50 text-indigo-700">
                  Tài liệu chuyên môn
                </Badge>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="h-3.5 w-3.5" />
                  {documentData.publishedAt && !isNaN(new Date(documentData.publishedAt).getTime())
                    ? format(new Date(documentData.publishedAt), "dd/MM/yyyy HH:mm", { locale: vi })
                    : "Đang cập nhật"}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <Eye className="h-3.5 w-3.5" />
                  {documentData.views || 0} lượt xem
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight text-center tracking-tight">
                {documentData.title}
              </h1>

              <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
            </div>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white rounded-[2rem]">
              <CardContent className="p-8 md:p-12 lg:p-16">
                {documentData.excerpt && (
                  <div className="mb-12 p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 italic text-slate-600 font-medium leading-relaxed md:text-lg">
                    "{documentData.excerpt}"
                  </div>
                )}

                <div
                  className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed text-justify prose-headings:text-slate-900 prose-headings:font-black prose-a:text-indigo-600 prose-strong:text-slate-900"
                  dangerouslySetInnerHTML={{ __html: documentData.content }}
                />

                {documentData.pdfUrl && (
                  <div className="mt-16 p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/20">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-widest">Tài liệu đính kèm</h4>
                          <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-tighter">Official Conference Document</p>
                        </div>
                      </div>
                      <a href={documentData.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-sm transition-all">
                          <Paperclip className="h-3.5 w-3.5 mr-2" /> Tải xuống PDF
                        </Button>
                      </a>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-white h-[600px]">
                      <iframe src={documentData.pdfUrl} width="100%" height="100%" style={{ border: "none" }} title="Tài liệu kỷ yếu" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-200">
              <Link href={documentsLink}>
                <Button variant="ghost" className="text-slate-500 font-bold hover:text-indigo-600 flex items-center gap-2 group">
                  <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                  Quay lại danh sách
                </Button>
              </Link>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Share2 className="h-3.5 w-3.5" /> Chia sẻ tài liệu:
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
