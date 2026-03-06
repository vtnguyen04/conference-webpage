import SectionHeader from "@/components/SectionHeader";
import { SessionList } from "@/components/SessionList";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSessions, usePublicSpeakers } from "@/hooks/usePublicData";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowRight, Calendar, Info } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

const ProgramSection = () => {
    const { conference } = useActiveConference();
    const { data: sessions = [], isLoading: sessionsLoading } = usePublicSessions(conference?.slug);
    const { data: speakers = [], isLoading: speakersLoading } = usePublicSpeakers(conference?.slug);

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
            dayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);

            const dateStr = format(startDate, "dd/MM/yyyy");
            const key = `${timeOfDay} ${dayStr} (${dateStr})`;

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(s);
        });
        return grouped;
    }, [sessions]);

    const sortedDays = Object.keys(sessionsByDay);

    if (sessionsLoading || speakersLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader
                title="Chương trình || Khoa học"
                subtitle="Chi tiết các phiên báo cáo và thảo luận chuyên đề"
                accentColor="bg-teal-500"
            />

            <div className="max-w-5xl mx-auto space-y-10">
                {sortedDays.length > 0 ? (
                    <Tabs defaultValue={sortedDays[0]} className="w-full">
                        <div className="w-full overflow-x-auto pb-4 custom-scrollbar mb-10">
                            <div className="flex min-w-full w-max justify-center px-4 md:px-0">
                                <TabsList className="bg-teal-50 p-1 h-14 rounded-2xl shadow-inner border border-teal-100 inline-flex w-max">
                                {sortedDays.map(dayKey => (
                                    <TabsTrigger
                                        key={dayKey}
                                        value={dayKey}
                                        className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-[11px] uppercase tracking-widest px-10 transition-all duration-300"
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {dayKey}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            </div>
                        </div>

                        {sortedDays.map(dayKey => (
                            <TabsContent key={dayKey} value={dayKey} className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="bg-white rounded-[2.5rem] p-2 md:p-6 shadow-[0_20px_50px_rgba(13,148,136,0.15)] border border-teal-50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-teal-100/30 rounded-full -mr-20 -mt-20 blur-2xl" />

                                    <ScrollArea className="h-[550px] pr-4 relative z-20">
                                        <div className="py-4">
                                            <SessionList sessions={sessionsByDay[dayKey]} speakers={speakers} view="homepage" />
                                        </div>
                                    </ScrollArea>

                                    {/* Lớp mờ ở đáy để báo hiệu còn nội dung */}
                                    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-30 rounded-b-[2.5rem]" />
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <Info className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Dữ liệu chương trình đang được cập nhật</p>
                    </div>
                )}

                <div className="text-center pt-8">
                    <Link href="/program">
                        <Button
                            className="group bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm uppercase tracking-widest h-14 px-10 rounded-full transition-all shadow-xl shadow-teal-200 active:scale-95"
                        >
                            Xem chương trình chi tiết & đầy đủ
                            <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ProgramSection;
