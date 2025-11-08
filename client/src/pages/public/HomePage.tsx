import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, FileText, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Conference, Announcement, Session, Speaker, Sponsor } from "@shared/schema";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ScrollAnimatedSection } from "@/components/ScrollAnimatedSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Section Header Component
const SectionHeader = ({ title, subtitle, accentColor = "bg-blue-600", cta }: { title: string; subtitle: string; accentColor?: string; cta?: React.ReactNode }) => (
  <div className="text-center mb-16 relative">
    <div className="relative inline-block">
      <div className={`absolute -left-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
      <div className={`absolute -right-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase px-6">
        {title}
      </h2>
    </div>
    <p className="text-slate-600 text-base mt-4 font-medium">{subtitle}</p>
    <div className="flex items-center justify-center gap-2 mt-4">
      <div className={`w-2 h-2 ${accentColor} rounded-full`}></div>
      <div className={`w-12 h-0.5 ${accentColor}`}></div>
      <div className={`w-2 h-2 ${accentColor} rounded-full`}></div>
    </div>
    {cta && <div className="mt-8">{cta}</div>}
  </div>
);

export default function HomePage() {
  const { data: conference, isLoading, error } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers"],
  });

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Lỗi tải dữ liệu</h1>
          <pre className="text-sm text-muted-foreground">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chưa có hội nghị nào được kích hoạt</h1>
          <p className="text-slate-600">Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) {
      acc[sponsor.tier] = [];
    }
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  const tierOrder = ['diamond', 'gold', 'silver', 'bronze', 'supporting', 'other'];
  const tierNames: Record<string, string> = {
    diamond: 'ĐƠN VỊ TÀI TRỢ KIM CƯƠNG',
    gold: 'ĐƠN VỊ TÀI TRỢ VÀNG',
    silver: 'ĐƠN VỊ TÀI TRỢ BẠC',
    bronze: 'ĐƠN VỊ TÀI TRỢ ĐỒNG',
    supporting: 'ĐƠN VỊ ĐỒNG HÀNH',
    other: 'ĐƠN VỊ HỖ TRỢ',
  };

  const speakerMap: Record<string, Speaker> = speakers.reduce((acc, speaker) => {
    acc[speaker.id] = speaker;
    return acc;
  }, {} as Record<string, Speaker>);

  const sessionsBySlot: Record<string, Session[]> = (() => {
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
  })();

  const sortedSlots = Object.keys(sessionsBySlot).sort();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-slate-900">
        <Carousel
          plugins={[plugin.current]}
          className="absolute inset-0 w-full h-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent className="w-full h-full">
            {(conference?.bannerUrls && conference.bannerUrls.length > 0) ? (
              conference.bannerUrls.map((url, index) => (
                <CarouselItem key={index} className="w-full h-full">
                  <img 
                    src={url} 
                    alt={`Banner ${index + 1}`}
                    className="w-full h-full object-cover object-top opacity-40"
                  />
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="w-full h-full">
                <div className="w-full h-full bg-slate-800" />
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 text-white bg-black/50 hover:bg-black/70 border-none" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 text-white bg-black/50 hover:bg-black/70 border-none" />
        </Carousel>

        <div className="absolute inset-0 bg-slate-900/80 z-0"></div>

        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {conference?.year && (
              <div className="inline-block border-2 border-amber-400 px-8 py-2 mb-8 relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400"></div>
                <span className="text-amber-400 font-bold text-lg tracking-widest">
                  {conference.year}
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight leading-tight" data-testid="text-conference-name">
              {conference?.name || "Hội Nghị Y Học"}
            </h1>
            
            {conference?.theme && (
              <div className="mb-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-16 h-0.5 bg-amber-400"></div>
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <div className="w-16 h-0.5 bg-amber-400"></div>
                </div>
                <p className="text-xl md:text-2xl font-medium text-white/95 leading-relaxed max-w-3xl mx-auto" data-testid="text-conference-theme">
                  {conference.theme}
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="w-16 h-0.5 bg-amber-400"></div>
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <div className="w-16 h-0.5 bg-amber-400"></div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-white mb-12">
              {conference?.startDate && conference?.endDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-amber-400" />
                  <span className="font-medium text-lg">
                    {format(new Date(conference.startDate), "dd/MM", { locale: vi })} - {format(new Date(conference.endDate), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              )}
              
              {conference?.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  <span className="font-medium text-lg" data-testid="text-conference-location">{conference.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 text-base font-semibold px-10 py-6 border-0 shadow-lg" data-testid="button-register-hero">
                  Đăng ký tham dự
                </Button>
              </Link>
              <Link href="/program">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-slate-900 text-base font-semibold px-10 py-6" data-testid="button-program-hero">
                  Xem chương trình
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Border */}
      <div className="relative h-2 bg-slate-100">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-blue-600"></div>
          <div className="flex-1 bg-amber-400"></div>
          <div className="flex-1 bg-blue-600"></div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <ScrollAnimatedSection className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Link href="/register">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-blue-600 relative overflow-hidden group" data-testid="card-action-register">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <Users className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Đăng ký tham dự</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/program">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-amber-500 relative overflow-hidden group" data-testid="card-action-program">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-amber-500 flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors duration-300">
                    <FileText className="h-8 w-8 text-amber-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Chương trình</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sponsors">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-blue-600 relative overflow-hidden group" data-testid="card-action-sponsors">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <Users className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Đơn vị tài trợ</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/announcements">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-amber-500 relative overflow-hidden group" data-testid="card-action-announcements">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-amber-500 flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors duration-300">
                    <FileText className="h-8 w-8 text-amber-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Thông báo</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </ScrollAnimatedSection>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-white relative">
          <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-blue-600/10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-amber-400/10"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Thông báo" 
              subtitle="Cập nhật mới nhất từ Ban Tổ chức"
              accentColor="bg-blue-600"
              cta={
                <Link href="/announcements">
                  <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-8">
                    Xem tất cả thông báo
                  </Button>
                </Link>
              }
            />

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[Autoplay({ delay: 2000, stopOnInteraction: true })]}
              className="w-full max-w-7xl mx-auto"
            >
              <CarouselContent className="-ml-6">
                {announcements.map((announcement: Announcement) => (
                  <CarouselItem key={announcement.id} className="md:basis-1/2 lg:basis-1/3 pl-6">
                    <Link href={`/announcements/${announcement.id}`}>
                      <a className="block h-full">
                        <Card 
                          className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-blue-600 group h-full flex flex-col"
                          data-testid={`card-announcement-${announcement.id}`}
                        >
                          {announcement.featuredImageUrl && (
                            <div className="relative aspect-video overflow-hidden bg-slate-100">
                              <img 
                                src={announcement.featuredImageUrl} 
                                alt={announcement.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-4 left-4">
                                <span className="bg-blue-600 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide shadow-lg">
                                  {announcement.category === 'important' ? 'Quan trọng' : 
                                   announcement.category === 'deadline' ? 'Hạn cuối' : 'Thông báo'}
                                </span>
                              </div>
                              <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-b-[40px] border-b-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          )}
                          <CardContent className="p-6 relative flex-1 flex flex-col">
                            <div className="absolute top-0 left-0 w-1 h-0 bg-blue-600 group-hover:h-full transition-all duration-300"></div>
                            {announcement.publishedAt && (
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 uppercase tracking-wide font-semibold">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{format(new Date(announcement.publishedAt), "dd 'Tháng' MM, yyyy", { locale: vi })}</span>
                              </div>
                            )}
                            <h3 className="font-bold text-lg line-clamp-2 mb-3 text-slate-900 group-hover:text-blue-600 transition-colors flex-grow">
                              {announcement.title}
                            </h3>
                            {announcement.excerpt && (
                              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mt-auto">
                                {announcement.excerpt}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </a>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12 border-2 border-slate-300 hover:border-blue-600" />
              <CarouselNext className="-right-4 md:-right-12 border-2 border-slate-300 hover:border-blue-600" />
            </Carousel>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Program/Sessions Section */}
      {sessions.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
          <div className="absolute top-20 right-10 w-24 h-24 border-4 border-amber-400/20 rotate-45"></div>
          <div className="absolute bottom-20 left-10 w-20 h-20 border-4 border-blue-600/20"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Chương trình hội nghị" 
              subtitle="Lịch trình chi tiết các phiên làm việc"
              accentColor="bg-amber-500"
            />

            <Tabs defaultValue={sortedSlots[0]} className="w-full max-w-6xl mx-auto">
              <TabsList className="w-full justify-start mb-8 flex-wrap h-auto gap-3 bg-white border-2 border-slate-200 p-2 shadow-sm">
                {sortedSlots.map(slot => {
                  const [date, timeOfDay] = slot.split('_');
                  return (
                    <TabsTrigger 
                      key={slot} 
                      value={slot} 
                      className="flex-1 min-w-[200px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white font-semibold uppercase tracking-wide text-sm py-3 relative overflow-hidden group"
                    >
                      <span className="relative z-10">{timeOfDay} - {format(new Date(date), "dd/MM", { locale: vi })}</span>
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {sortedSlots.map(slot => (
                <TabsContent key={slot} value={slot} className="mt-0">
                  <Accordion type="single" collapsible className="space-y-4">
                    {sessionsBySlot[slot].map(session => (
                      <AccordionItem key={session.id} value={session.id} className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-600 to-amber-400"></div>
                        <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-slate-50">
                          <div className="flex items-start justify-between w-full pr-4 text-left">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold mb-3 text-slate-900">{session.title}</h3>
                              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">{format(new Date(session.startTime), "HH:mm")} - {format(new Date(session.endTime), "HH:mm")}</span>
                                </div>
                                {session.room && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium">{session.room}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary" className="ml-4 shrink-0 bg-blue-600 text-white uppercase tracking-wide font-semibold border-0">{session.type}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-6 space-y-6 bg-slate-50">
                          {session.description && <p className="text-slate-700 leading-relaxed border-l-4 border-amber-400 pl-4">{session.description}</p>}
                          {session.chairIds?.length > 0 && (
                            <div className="bg-white p-4 border-l-4 border-blue-600">
                              <h4 className="font-bold mb-3 flex items-center gap-2 text-slate-900 uppercase tracking-wide text-sm">
                                <User className="h-4 w-4 text-blue-600" />Chủ tọa
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {session.chairIds.map(id => speakerMap[id] ? (
                                  <Badge key={id} variant="outline" className="text-sm py-2 px-4 border-2 border-blue-200 font-semibold hover:bg-blue-50">
                                    {speakerMap[id].credentials} {speakerMap[id].name}
                                  </Badge>
                                ) : null)}
                              </div>
                            </div>
                          )}
                          {session.agendaItems?.length > 0 && (
                            <div className="bg-white p-4 border-l-4 border-amber-400">
                              <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-900 uppercase tracking-wide text-sm">
                                <Clock className="h-4 w-4 text-amber-500" />Chương trình chi tiết
                              </h4>
                              <div className="space-y-3">
                                {session.agendaItems.map((item, index) => {
                                  const speaker = item.speakerId ? speakerMap[item.speakerId] : null;
                                  return (
                                    <div key={index} className="bg-slate-50 border-l-4 border-blue-400 p-4 hover:bg-slate-100 transition-colors">
                                      <div className="flex items-start gap-4">
                                        <Badge variant="outline" className="mt-1 shrink-0 font-mono text-xs border-2 border-blue-600 text-blue-600 font-bold px-3 py-1">
                                          {item.timeSlot}
                                        </Badge>
                                        <div className="flex-1">
                                          <p className="font-semibold text-slate-900">{item.title}</p>
                                          {speaker && <p className="text-sm text-blue-600 mt-2 font-medium">{speaker.credentials} {speaker.name}</p>}
                                          {item.notes && <p className="text-xs text-slate-500 mt-2 italic">{item.notes}</p>}
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

            <div className="text-center mt-12">
              <Link href="/program">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-10 border-0 shadow-lg">
                  Xem chương trình đầy đủ
                </Button>
              </Link>
            </div>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Speakers Section */}
      {speakers.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600"></div>
          <div className="absolute top-10 left-1/4 w-16 h-16 border-2 border-blue-600/10 rounded-full"></div>
          <div className="absolute bottom-10 right-1/4 w-24 h-24 border-2 border-amber-400/10 rounded-full"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Chủ tọa & Diễn giả" 
              subtitle="Đội ngũ chuyên gia hàng đầu"
              accentColor="bg-blue-600"
              cta={
                <Link href="/speakers">
                  <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-8">
                    Xem tất cả
                  </Button>
                </Link>
              }
            />

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent className="-ml-6">
                {speakers.map((speaker: Speaker) => (
                  <CarouselItem key={speaker.id} className="md:basis-1/2 lg:basis-1/3 pl-6">
                    <div className="p-1 h-full">
                      <Card 
                        className="overflow-hidden transition-all duration-300 border-2 border-slate-200 hover:border-blue-600 hover:shadow-xl h-full flex flex-col group relative"
                        data-testid={`card-speaker-${speaker.id}`}
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-amber-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                          {speaker.photoUrl ? (
                            <div className="relative mb-6">
                              <div className="absolute -inset-2 border-2 border-blue-600/20 group-hover:border-blue-600 transition-colors duration-300"></div>
                              <img
                                src={speaker.photoUrl}
                                alt={speaker.name}
                                className="w-32 h-32 object-cover relative z-10"
                              />
                              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ) : (
                            <div className="relative mb-6">
                              <div className="absolute -inset-2 border-2 border-blue-600/20 group-hover:border-blue-600 transition-colors duration-300"></div>
                              <div className="w-32 h-32 bg-slate-200 flex items-center justify-center text-slate-600 text-3xl font-bold relative z-10">
                                {speaker.name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          )}
                          
                          <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-blue-600 transition-colors">
                            {speaker.credentials && `${speaker.credentials}. `}{speaker.name}
                          </h3>
                          
                          {speaker.title && (
                            <p className="text-sm font-semibold text-slate-700 mb-3">{speaker.title}</p>
                          )}
                          
                          {speaker.specialty && (
                            <p className="text-sm text-slate-600 mb-4">{speaker.specialty}</p>
                          )}
                          
                          <div className="mt-auto pt-4 w-full">
                            <div className="h-0.5 w-12 bg-blue-600 mx-auto mb-3"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                              {speaker.role === 'moderator' ? 'Chủ tọa' : 
                              speaker.role === 'both' ? 'Chủ tọa & Diễn giả' : 'Diễn giả'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12 border-2 border-slate-300 hover:border-blue-600" />
              <CarouselNext className="-right-4 md:-right-12 border-2 border-slate-300 hover:border-blue-600" />
            </Carousel>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Sponsors Section */}
      {sponsors.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
          <div className="absolute top-0 right-0 w-40 h-40 border-t-4 border-r-4 border-blue-600/10"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 border-b-4 border-l-4 border-amber-400/10"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Đơn vị tài trợ" 
              subtitle="Cảm ơn sự đồng hành của các đối tác"
              accentColor="bg-amber-500"
            />

            <div className="space-y-16 max-w-6xl mx-auto">
              {tierOrder.map(tier => {
                const tierSponsors = sponsorsByTier[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;

                const tierColors: Record<string, string> = {
                  diamond: 'border-blue-600 bg-blue-600',
                  gold: 'border-amber-400 bg-amber-400',
                  silver: 'border-slate-400 bg-slate-400',
                  bronze: 'border-orange-600 bg-orange-600',
                  supporting: 'border-blue-500 bg-blue-500',
                  other: 'border-slate-500 bg-slate-500',
                };

                return (
                  <div key={tier} className="text-center" data-testid={`sponsor-tier-${tier}`}>
                    <div className="mb-10 relative inline-block">
                      <div className={`absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 ${tierColors[tier].split(' ')[0]}`}></div>
                      <div className={`absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 ${tierColors[tier].split(' ')[0]}`}></div>
                      <h3 className={`font-bold text-base uppercase tracking-widest px-8 py-3 border-t-2 border-b-2 ${tierColors[tier].split(' ')[0]} text-slate-800`}>
                        {tierNames[tier]}
                      </h3>
                      <div className={`absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 ${tierColors[tier].split(' ')[0]}`}></div>
                      <div className={`absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 ${tierColors[tier].split(' ')[0]}`}></div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-10">
                      {tierSponsors.map((sponsor) => (
                        <div
                          key={sponsor.id}
                          className={`bg-white border-2 border-slate-200 p-8 flex items-center justify-center hover:border-blue-600 hover:shadow-xl transition-all duration-300 relative group
                            ${tier === 'diamond' ? 'w-64 h-40' : ''}
                            ${tier === 'gold' ? 'w-56 h-36' : ''}
                            ${tier === 'silver' ? 'w-48 h-32' : ''}
                            ${tier === 'bronze' ? 'w-40 h-28' : ''}
                            ${tier === 'supporting' || tier === 'other' ? 'w-36 h-24' : ''}
                          `}
                          data-testid={`sponsor-logo-${sponsor.id}`}
                        >
                          <div className={`absolute top-0 left-0 w-0 h-0.5 ${tierColors[tier].split(' ')[1]} group-hover:w-full transition-all duration-300`}></div>
                          <div className={`absolute bottom-0 right-0 w-0 h-0.5 ${tierColors[tier].split(' ')[1]} group-hover:w-full transition-all duration-300`}></div>
                          {sponsor.logoUrl ? (
                            <img
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-sm font-bold text-center text-slate-700">
                              {sponsor.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-16">
              <Link href="/sponsors">
                <Button variant="outline" size="lg" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-semibold px-8">
                  Xem tất cả nhà tài trợ
                </Button>
              </Link>
            </div>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Introduction Section */}
      {conference?.introContent && (
        <ScrollAnimatedSection className="py-20 bg-white relative">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-10 w-32 h-32 border-4 border-blue-600 rotate-45"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-amber-400"></div>
          </div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <SectionHeader 
                title="Giới thiệu" 
                subtitle="Thông tin chi tiết về hội nghị"
                accentColor="bg-blue-600"
              />
              <Card className="border-2 border-slate-200 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600"></div>
                <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-10">
                  <div
                    className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: conference.introContent }}
                    data-testid="text-intro-content"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Footer Decorative Border */}
      <div className="relative h-3">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-blue-600"></div>
          <div className="w-16 bg-amber-400"></div>
          <div className="flex-1 bg-blue-600"></div>
          <div className="w-16 bg-amber-400"></div>
          <div className="flex-1 bg-blue-600"></div>
        </div>
      </div>
    </div>
  );
}