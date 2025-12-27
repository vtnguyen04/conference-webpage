import { useEffect, useRef, useMemo } from "react";
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
import { SessionList } from "@/components/SessionList";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSessions, usePublicSpeakers } from "@/hooks/usePublicData";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronRight, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ProgramPage() {
  const [, params] = useRoute("/conference/:slug/program");
  const slug = params?.slug;
  const { conference } = useActiveConference();
  
  const { data: sessions = [], isLoading: sessionsLoading } = usePublicSessions(slug || conference?.slug);
  const { data: speakers = [], isLoading: speakersLoading } = usePublicSpeakers(slug || conference?.slug);

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessions.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions.length]);

  const sessionsByDay = useMemo(() => {
    const grouped: Record<number, typeof sessions> = {};
    sessions.forEach(s => {
      if (!grouped[s.day]) grouped[s.day] = [];
      grouped[s.day].push(s);
    });
    return grouped;
  }, [sessions]);

  const sortedDays = Object.keys(sessionsByDay).map(Number).sort((a, b) => a - b);

  if (sessionsLoading || speakersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang tải lịch trình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Chương trình Hội nghị"
        subtitle="Khám phá lịch trình chi tiết, nội dung các phiên báo cáo và các chuyên gia tham luận."
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
              <BreadcrumbPage className="text-white font-bold">Lịch trình chi tiết</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {sortedDays.length > 0 ? (
              <Tabs defaultValue={sortedDays[0].toString()} className="w-full">
                <div className="flex flex-col items-center mb-12 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 shadow-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Lịch trình hội nghị</span>
                  </div>
                  
                  <TabsList className="bg-white p-1 h-14 rounded-2xl shadow-sm border border-slate-200/60 w-full max-w-md">
                    {sortedDays.map(day => (
                      <TabsTrigger 
                        key={day} 
                        value={day.toString()} 
                        className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white font-bold text-[11px] uppercase tracking-widest h-full px-8 transition-all"
                      >
                        Ngày {day}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {sortedDays.map(day => (
                  <TabsContent key={day} value={day.toString()} className="mt-0 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <SessionList sessions={sessionsByDay[day]} speakers={speakers} />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Card className="border-dashed border-2 border-slate-200 bg-white/50 shadow-none">
                <CardContent className="p-20 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                    Thông tin chương trình đang được cập nhật
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