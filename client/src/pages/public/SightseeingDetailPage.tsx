import { useParams, Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Facebook, Share2, Compass, ChevronLeft, MapPin, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { usePublicSightseeingItem } from "@/hooks/usePublicData";
import { useActiveConference } from "@/hooks/useActiveConference";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function SightseeingDetailPage() {
  const params = useParams();
  const sightseeingId = params.id;
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { conference } = useActiveConference();

  const { data: sightseeing, isLoading, isError } = usePublicSightseeingItem(sightseeingId, conference?.slug);

  useEffect(() => {
    if (sightseeing && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sightseeing]);

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
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Đang tải thông tin địa điểm...</p>
        </div>
      </div>
    );
  }

  if (isError || !sightseeing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-rose-100 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy địa danh</h1>
          <p className="text-slate-500 font-medium leading-relaxed">Thông tin này có thể đã bị gỡ bỏ hoặc đường dẫn không chính xác.</p>
          <Link href="/sightseeing">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8">Quay lại danh sách</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-white animate-in fade-in duration-700">
      <PageHeader
        title="Du lịch & Trải nghiệm"
        subtitle={sightseeing.title}
        bannerImageUrl={sightseeing.featuredImageUrl}
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
                <Link href="/sightseeing">Địa điểm tham quan</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold line-clamp-1 max-w-[200px]">
                {sightseeing.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Sightseeing Header Area */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Badge className="bg-teal-50 text-teal-700 border-teal-100 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <Compass className="h-3 w-3 mr-1.5" /> Gợi ý du lịch
                </Badge>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="h-3.5 w-3.5" />
                  Đăng ngày {sightseeing.createdAt && !isNaN(new Date(sightseeing.createdAt).getTime())
                    ? format(new Date(sightseeing.createdAt), "dd/MM/yyyy", { locale: vi })
                    : "Đang cập nhật"}
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight text-center tracking-tight">
                {sightseeing.title}
              </h1>
              
              <div className="h-1.5 w-24 bg-teal-500 mx-auto rounded-full shadow-lg shadow-teal-900/20" />
            </div>

            {/* Main Content Card */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
              <CardContent className="p-8 md:p-12 lg:p-16">
                {sightseeing.excerpt && (
                  <div className="mb-12 p-8 bg-teal-50/30 rounded-3xl border-l-4 border-teal-500 italic text-slate-600 font-medium leading-relaxed md:text-lg">
                    "{sightseeing.excerpt}"
                  </div>
                )}

                <div
                  className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed text-justify prose-headings:text-slate-900 prose-headings:font-black prose-a:text-teal-600 prose-img:rounded-3xl prose-img:shadow-xl"
                  dangerouslySetInnerHTML={{ __html: sightseeing.content }}
                />
              </CardContent>
            </Card>

            {/* Actions & Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-200">
              <Link href="/sightseeing">
                <Button variant="ghost" className="text-slate-500 font-bold hover:text-teal-600 flex items-center gap-2 group">
                  <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                  Xem thêm địa điểm khác
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Share2 className="h-3.5 w-3.5" /> Chia sẻ:
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