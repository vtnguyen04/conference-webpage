import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useRoute } from "wouter";
import { useEffect, useRef } from "react";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSponsors } from "@/hooks/usePublicData";
import { SponsorsList } from "@/components/SponsorsList";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Heart } from "lucide-react";

export default function SponsorsPage() {
  const [, params] = useRoute("/conference/:slug/sponsors");
  const slug = params?.slug;
  const { conference } = useActiveConference();
  const { data: sponsors = [], isLoading } = usePublicSponsors(slug || conference?.slug);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sponsors.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sponsors.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-2 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Đang kết nối đối tác...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      <PageHeader
        title="Đơn vị Đồng hành"
        subtitle="Sự thành công của hội nghị có sự đóng góp vô cùng quý báu từ các đơn vị tài trợ và đối tác chiến lược."
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
              <BreadcrumbPage className="text-white font-bold">Đơn vị tài trợ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col items-center text-center space-y-4 mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 shadow-sm">
                <Heart className="h-4 w-4 fill-teal-600" />
                <span className="text-xs font-extrabold uppercase tracking-widest">Tri ân đối tác</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Danh sách Đơn vị Tài trợ
              </h2>
              <div className="h-1 w-20 bg-teal-500 rounded-full" />
            </div>

            {sponsors.length > 0 ? (
              <SponsorsList sponsors={sponsors} />
            ) : (
              <Card className="border-dashed border-2 border-slate-200 bg-white/50 shadow-none">
                <CardContent className="p-20 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                    Thông tin nhà tài trợ đang được cập nhật
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
