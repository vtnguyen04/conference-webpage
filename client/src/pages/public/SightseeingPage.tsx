import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Map, Info, Compass } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { useEffect, useRef } from "react";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSightseeing } from "@/hooks/usePublicData";
import { Badge } from "@/components/ui/badge";

export default function SightseeingPage() {
  const { conference } = useActiveConference();
  const { data: sightseeing = [], isLoading } = usePublicSightseeing(conference?.slug);

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sightseeing.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sightseeing.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang khám phá các địa danh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Du lịch & Trải nghiệm"
        subtitle="Khám phá vẻ đẹp văn hóa, ẩm thực và các danh lam thắng cảnh tiêu biểu xung quanh khu vực hội nghị."
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
              <BreadcrumbPage className="text-white font-bold">Địa điểm tham quan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-12">
            
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 shadow-sm">
                <Compass className="h-4 w-4" />
                <span className="text-xs font-extrabold uppercase tracking-widest">Gợi ý dành cho đại biểu</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Hành trình Trải nghiệm
              </h2>
              <div className="h-1 w-20 bg-teal-500 rounded-full" />
            </div>

            {sightseeing.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {sightseeing.map((item) => (
                  <Link key={item.id} href={`/sightseeing/${item.id}`}>
                    <Card className="group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white rounded-3xl h-full flex flex-col">
                      {item.featuredImageUrl && (
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={item.featuredImageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-teal-600 border-none font-bold text-[10px] uppercase tracking-widest py-1.5 px-3 rounded-full shadow-sm">
                            Địa điểm du lịch
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-8 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-teal-600 transition-colors line-clamp-2 leading-tight">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-slate-500 text-sm font-medium line-clamp-3 leading-relaxed">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-50 group-hover:border-teal-50 transition-colors">
                          <span className="text-teal-600 font-extrabold text-[11px] uppercase tracking-widest flex items-center gap-2">
                            Khám phá ngay <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-slate-200 bg-white/50 shadow-none">
                <CardContent className="p-20 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Map className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                    Thông tin địa điểm đang được cập nhật
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