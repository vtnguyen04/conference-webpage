import React, { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Layout, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { format } from "date-fns";
import type { Session, Speaker } from "@shared/types";
import { cn } from "@/lib/utils";

interface SessionListProps {
  sessions: Session[];
  speakers: Speaker[];
  view?: 'homepage' | 'full'; 
}

interface SpeakerMap {
  [key: string]: Speaker;
}

const SessionAccordionItem = React.memo(({ session, speakerMap }: { session: Session; speakerMap: SpeakerMap }) => {
  return (
    <AccordionItem 
      key={session.id} 
      value={session.id} 
      className="border-none mb-4"
    >
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-300 overflow-hidden">
        <AccordionTrigger className="px-6 py-5 hover:no-underline group">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 text-left gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ring-1 ring-teal-100">
                  <Clock className="h-3 w-3" />
                  {format(new Date(session.startTime), "HH:mm")} - {format(new Date(session.endTime), "HH:mm")}
                </div>
                <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[9px] uppercase tracking-tighter">
                  {session.type}
                </Badge>
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-teal-600 transition-colors leading-tight">
                {session.title}
              </h3>
              <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-teal-500/50" />
                {session.room || "TBA"}
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 group-data-[state=open]:rotate-90 transition-transform">
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500" />
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-px w-full bg-slate-50 mb-8" />
          
          <div className="space-y-8">
            {session.description && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Info className="h-3.5 w-3.5 text-teal-500" /> Giới thiệu phiên họp
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed italic border-l-2 border-teal-100 pl-4">
                  {session.description}
                </p>
              </div>
            )}

            {(() => {
              const validChairs = session.chairIds?.filter(id => speakerMap[id]);
              if (validChairs && validChairs.length > 0) {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <User className="h-3.5 w-3.5 text-teal-500" /> Ban chủ tọa
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {validChairs.map(id => (
                        <div key={id} className="flex items-center gap-3 bg-slate-50 pl-1 pr-4 py-1 rounded-full border border-slate-100 group/avatar hover:border-teal-200 transition-colors">
                          <img 
                            src={speakerMap[id].photoUrl || `https://avatar.vercel.sh/${speakerMap[id].name}.png`} 
                            alt={speakerMap[id].name} 
                            className="h-8 w-8 rounded-full object-cover shadow-sm ring-2 ring-white" 
                          />
                          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tighter">
                            {speakerMap[id].credentials} {speakerMap[id].name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {session.agendaItems?.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Layout className="h-3.5 w-3.5 text-teal-500" /> Chương trình chi tiết
                  </div>
                  <Badge className="bg-teal-600 text-white text-[9px] font-bold uppercase">{session.agendaItems.length} mục</Badge>
                </div>
                
                <div className="grid gap-3">
                  {session.agendaItems.map((item, index) => {
                    const speaker = item.speakerId ? speakerMap[item.speakerId] : null;
                    return (
                      <div key={index} className="relative group/item">
                        <div className="bg-slate-50/50 rounded-2xl p-4 border border-transparent hover:border-teal-100 hover:bg-white hover:shadow-sm transition-all duration-200">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex items-center justify-center px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-teal-600 shadow-sm shrink-0 h-fit">
                              {item.timeSlot}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-bold text-slate-800 leading-tight group-hover/item:text-teal-700 transition-colors">{item.title}</p>
                              {speaker && (
                                <div className="flex items-center gap-2 text-xs font-bold text-teal-600/80">
                                  <span className="h-1 w-1 rounded-full bg-teal-400" />
                                  {speaker.credentials} {speaker.name}
                                </div>
                              )}
                              {item.notes && <p className="text-xs text-slate-400 font-medium italic mt-1">{item.notes}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
});

export function SessionList({ sessions, speakers, view = 'full' }: SessionListProps) {
  const speakerMap = useMemo(() => {
    return speakers.reduce((acc, speaker) => {
      acc[speaker.id] = speaker;
      return acc;
    }, {} as Record<string, Speaker>);
  }, [speakers]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Chưa có dữ liệu chương trình chi tiết</p>
      </div>
    );
  }

  // Nếu là view homepage, không cần render Tabs lồng nhau nữa vì ProgramSection đã handle Tabs rồi
  if (view === 'homepage') {
    return (
      <Accordion type="single" collapsible className="w-full">
        {sessions.map(session => (
          <SessionAccordionItem key={session.id} session={session} speakerMap={speakerMap} />
        ))}
      </Accordion>
    );
  }

  // Cho view full (trang Program đầy đủ), ta vẫn cần logic gộp slot này
  const sessionsBySlot = useMemo(() => {
    const grouped: Record<string, Session[]> = {};
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    for (const session of sortedSessions) {
      const date = new Date(session.startTime);
      const timeOfDay = date.getHours() < 12 ? "Sáng" : "Chiều";
      const key = timeOfDay;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    }
    return grouped;
  }, [sessions]);

  return (
    <div className="space-y-12">
      {Object.keys(sessionsBySlot).map(slot => (
        <div key={slot} className="space-y-6">
          <div className="flex items-center gap-4">
            <Badge className="bg-slate-900 text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Buổi {slot}</Badge>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <Accordion type="single" collapsible className="w-full">
            {sessionsBySlot[slot].map(session => (
              <SessionAccordionItem key={session.id} session={session} speakerMap={speakerMap} />
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}

import { Info as LucideInfo } from "lucide-react";