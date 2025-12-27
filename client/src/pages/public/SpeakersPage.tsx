import { Card, CardContent } from "@/components/ui/card";
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
import { SpeakerCard } from "@/components/SpeakerCard";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSpeakers } from "@/hooks/usePublicData";
import { Users, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SpeakersPage() {
  const [, params] = useRoute("/conference/:slug/speakers");
  const slug = params?.slug;
  const { conference } = useActiveConference();
  
  const { data: speakers = [], isLoading } = usePublicSpeakers(slug || conference?.slug);

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (speakers.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [speakers.length]);

  const moderators = speakers.filter(
    (s) => s.role === "moderator" || s.role === "both"
  );
  const regularSpeakers = speakers.filter(
    (s) => s.role === "speaker" || s.role === "both"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang kết nối hội đồng chuyên gia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Hội đồng Chuyên gia"
        subtitle="Gặp gỡ các nhà khoa học, báo cáo viên hàng đầu sẽ chia sẻ kiến thức và kinh nghiệm tại hội nghị."
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
              <BreadcrumbPage className="text-white font-bold">Báo cáo viên & Chủ tọa</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-24">
            
            {/* Moderators Section */}
            {moderators.length > 0 && (
              <section className="space-y-12">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Ban điều hành phiên họp</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Chủ tọa Đoàn
                  </h2>
                  <div className="h-1 w-20 bg-amber-500 rounded-full" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {moderators.map((speaker) => (
                    <SpeakerCard key={speaker.id} speaker={speaker} />
                  ))}
                </div>
              </section>
            )}

            {/* Speakers Section */}
            {regularSpeakers.length > 0 && (
              <section className="space-y-12">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 shadow-sm">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Diễn giả tham luận</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Báo cáo viên chuyên đề
                  </h2>
                  <div className="h-1 w-20 bg-teal-500 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularSpeakers.map((speaker) => (
                    <SpeakerCard key={speaker.id} speaker={speaker} />
                  ))}
                </div>
              </section>
            )}

            {speakers.length === 0 && (
              <Card className="border-dashed border-2 border-slate-200 bg-white/50 shadow-none">
                <CardContent className="p-20 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                    Danh sách báo cáo viên đang được cập nhật
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