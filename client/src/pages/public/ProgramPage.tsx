import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Conference, Session, Speaker } from "@shared/schema";
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

export default function ProgramPage() {
  const { data: conference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    enabled: !!conference,
  });

  const { data: speakers = [], isLoading: speakersLoading } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers"],
    enabled: !!conference,
  });

  const speakerMap = useMemo(() => {
    return speakers.reduce((acc, speaker) => {
      acc[speaker.id] = speaker;
      return acc;
    }, {} as Record<string, Speaker>);
  }, [speakers]);

  const sessionsBySlot = useMemo(() => {
    const grouped: Record<string, Session[]> = {};
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    for (const session of sortedSessions) {
      const date = new Date(session.startTime);
      const dateKey = format(date, "yyyy-MM-dd");
      const timeSlotKey = date.getHours() < 12 ? "Sáng" : "Chiều";
      const combinedKey = `${dateKey}_${timeSlotKey}`;

      if (!grouped[combinedKey]) {
        grouped[combinedKey] = [];
      }
      grouped[combinedKey].push(session);
    }
    return grouped;
  }, [sessions]);

  const sortedSlots = Object.keys(sessionsBySlot).sort();

  if (sessionsLoading || speakersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải chương trình...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Chương trình hội nghị"
        subtitle="Khám phá lịch trình chi tiết các phiên, bài thuyết trình và diễn giả của chúng tôi."
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Chương trình hội nghị</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue={sortedSlots[0]} className="w-full">
            <TabsList className="w-full justify-start mb-8 flex-wrap h-auto gap-2">
              {sortedSlots.map(slot => {
                const [date, timeOfDay] = slot.split('_');
                return (
                  <TabsTrigger key={slot} value={slot} className="flex-1 min-w-[200px]">
                    {timeOfDay} {format(new Date(date), "EEEE, dd/MM", { locale: vi })}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {sortedSlots.map(slot => (
              <TabsContent key={slot} value={slot} className="mt-0">
                <Accordion type="single" collapsible className="space-y-4">
                  {sessionsBySlot[slot].map(session => (
                    <AccordionItem key={session.id} value={session.id} className="border rounded-lg overflow-hidden bg-background">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover-elevate">
                        <div className="flex items-start justify-between w-full pr-4 text-left">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{format(new Date(session.startTime), "HH:mm")} - {format(new Date(session.endTime), "HH:mm")}</span></div>
                              {session.room && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{session.room}</span></div>}
                            </div>
                          </div>
                          <Badge variant="secondary" className="ml-4 shrink-0">{session.type}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 space-y-6">
                        {session.description && <p className="text-muted-foreground">{session.description}</p>}
                        {session.chairIds?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2"><User className="h-4 w-4" />Chủ tọa</h4>
                            <div className="flex flex-wrap gap-2">
                              {session.chairIds.map(id => speakerMap[id] ? <Badge key={id} variant="secondary" className="text-sm py-1 px-3">{speakerMap[id].credentials} {speakerMap[id].name}</Badge> : null)}
                            </div>
                          </div>
                        )}
                        {session.agendaItems?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" />Chương trình chi tiết</h4>
                            <div className="space-y-2">
                              {session.agendaItems.map((item, index) => {
                                const speaker = item.speakerId ? speakerMap[item.speakerId] : null;
                                return (
                                  <div key={index} className="border-l-4 border-primary/30 pl-4 py-2">
                                    <div className="flex items-start gap-3">
                                      <Badge variant="outline" className="mt-1 shrink-0 font-mono text-xs">{item.timeSlot}</Badge>
                                      <div className="flex-1">
                                        <p className="font-medium">{item.title}</p>
                                        {speaker && <p className="text-sm text-primary mt-1">{speaker.credentials} {speaker.name}</p>}
                                        {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      </div>
    </>
  );
}
