import { useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/SessionList";
import SectionHeader from "@/components/SectionHeader";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSessions, usePublicSpeakers } from "@/hooks/usePublicData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ProgramSection = () => {
    const { conference } = useActiveConference();
    const { data: sessions = [], isLoading: sessionsLoading } = usePublicSessions(conference?.slug);
    const { data: speakers = [], isLoading: speakersLoading } = usePublicSpeakers(conference?.slug);

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
                    <Tabs defaultValue={sortedDays[0].toString()} className="w-full">
                        <div className="flex justify-center mb-10">
                            <TabsList className="bg-teal-50 p-1 h-14 rounded-2xl shadow-inner border border-teal-100">
                                {sortedDays.map(day => (
                                    <TabsTrigger 
                                        key={day} 
                                        value={day.toString()} 
                                        className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-[11px] uppercase tracking-widest px-10 transition-all duration-300"
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Ngày {day}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {sortedDays.map(day => (
                            <TabsContent key={day} value={day.toString()} className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="bg-white rounded-[2.5rem] p-2 md:p-6 shadow-[0_20px_50px_rgba(13,148,136,0.15)] border border-teal-50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-teal-100/30 rounded-full -mr-20 -mt-20 blur-2xl" />
                                    
                                    <ScrollArea className="h-[550px] pr-4 relative z-20">
                                        <div className="py-4">
                                            <SessionList sessions={sessionsByDay[day]} speakers={speakers} view="homepage" />
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