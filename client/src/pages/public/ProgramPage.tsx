import { PageHeader } from "@/components/PageHeader";
import { SessionList } from "@/components/SessionList";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSessions, usePublicSpeakers } from "@/hooks/usePublicData";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, useRoute } from "wouter";

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
    const grouped: Record<string, typeof sessions> = {};

    // Sort sessions chronologically first
    const sortedSessions = [...sessions].sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeA - timeB;
    });

    sortedSessions.forEach(s => {
      if (!s.startTime) return;
      const startDate = new Date(s.startTime);
      if (isNaN(startDate.getTime())) return;

      const hour = startDate.getHours();
      const timeOfDay = hour < 12 ? "Sáng" : "Chiều";

      // format: EEEE (Thứ X), dd/MM/yyyy
      let dayStr = format(startDate, "EEEE", { locale: vi });
      // vi locale might output 'thứ Sáu', capitalize it:
      dayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);

      const dateStr = format(startDate, "dd/MM/yyyy");
      const key = `${timeOfDay} ${dayStr} (${dateStr})`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });
    return grouped;
  }, [sessions]);

  // Keys are already in chronological order because we sorted the items before grouping
  const sortedDays = Object.keys(sessionsByDay);

  if (sessionsLoading || speakersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang tải chương trình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Chương trình Hội nghị"
        subtitle="Khám phá chương trình chi tiết, nội dung các phiên báo cáo và các chuyên gia tham luận."
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
              <BreadcrumbPage className="text-white font-bold">Chương trình chi tiết</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {sortedDays.length > 0 ? (
              <Tabs defaultValue={sortedDays[0]} className="w-full">
                <div className="flex flex-col items-center mb-12 space-y-6 w-full">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 shadow-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Chương trình hội nghị</span>
                  </div>

                  <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex min-w-full w-max justify-center px-4 md:px-0">
                      <TabsList className="bg-white p-1 h-14 rounded-2xl shadow-sm border border-slate-200/60 inline-flex w-max">
                    {sortedDays.map(dayKey => (
                      <TabsTrigger
                        key={dayKey}
                        value={dayKey}
                        className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white font-bold text-[11px] uppercase tracking-widest h-full px-8 transition-all"
                      >
                        {dayKey}
                      </TabsTrigger>
                    ))}
                      </TabsList>
                    </div>
                  </div>
                </div>

                {sortedDays.map(dayKey => (
                  <TabsContent key={dayKey} value={dayKey} className="mt-0 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <SessionList sessions={sessionsByDay[dayKey]} speakers={speakers} />
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
