import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, FileText, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Conference, Announcement, Session, Speaker, Sponsor, Organizer } from "@shared/schema";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ScrollAnimatedSection } from "@/components/ScrollAnimatedSection";
import { SessionList } from "@/components/SessionList";

// Section Header Component
const SectionHeader = ({ title, subtitle, accentColor = "bg-teal-600", cta }: { title: string; subtitle: string; accentColor?: string; cta?: React.ReactNode }) => {
  const isSplitTitle = title.includes("||");
  const titleParts = isSplitTitle ? title.split("||").map(part => part.trim()) : [title];

  return (
    <div className="text-center mb-16 relative">
      <div className="relative inline-block">
        <div className={`absolute -left-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
        <div className={`absolute -right-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
        {isSplitTitle ? (
          <div className="flex items-center justify-center text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase px-6">
            <span>{titleParts[0]}</span>
            <span className="mx-4">||</span>
            <span>{titleParts[1]}</span>
          </div>
        ) : (
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase px-6">
            {title}
          </h2>
        )}
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
};

export default function HomePage() {
  const { data: conference, isLoading, error } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: !!conference,
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    enabled: !!conference,
  });

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers"],
    enabled: !!conference,
  });

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
    enabled: !!conference,
  });

  const { data: organizers = [] } = useQuery<Organizer[]>({
    queryKey: ["/api/organizers"],
    enabled: !!conference,
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
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
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


            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight leading-tight" data-testid="text-conference-name">
              {conference?.name || "Hội Nghị Y Học"}
            </h1>
            
            {conference?.theme && (
              <div className="mb-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-16 h-0.5 bg-gray-400"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-16 h-0.5 bg-gray-400"></div>
                </div>
                <p className="text-xl md:text-2xl font-medium text-white/95 leading-relaxed max-w-3xl mx-auto" data-testid="text-conference-theme">
                  {conference.theme}
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="w-16 h-0.5 bg-gray-400"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-16 h-0.5 bg-gray-400"></div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-white mb-12">
              {conference?.startDate && conference?.endDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-lg">
                    {format(new Date(conference.startDate), "dd/MM", { locale: vi })} - {format(new Date(conference.endDate), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              )}
              
              {conference?.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-lg" data-testid="text-conference-location">{conference.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-teal-600 text-white hover:bg-teal-700 text-base font-semibold px-10 py-6 border-0 shadow-lg" data-testid="button-register-hero">
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
          <div className="flex-1 bg-teal-600"></div>
          <div className="flex-1 bg-gray-400"></div>
          <div className="flex-1 bg-teal-600"></div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <ScrollAnimatedSection className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Link href="/register">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-teal-600 relative overflow-hidden group" data-testid="card-action-register">
                <div className="absolute top-0 left-0 w-full h-1 bg-teal-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 transition-colors duration-300">
                    <Users className="h-8 w-8 text-teal-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Đăng ký tham dự</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/program">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-gray-500 relative overflow-hidden group" data-testid="card-action-program">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-gray-500 flex items-center justify-center mb-4 group-hover:bg-gray-500 transition-colors duration-300">
                    <FileText className="h-8 w-8 text-gray-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Chương trình</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sponsors">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-teal-600 relative overflow-hidden group" data-testid="card-action-sponsors">
                <div className="absolute top-0 left-0 w-full h-1 bg-teal-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 transition-colors duration-300">
                    <Users className="h-8 w-8 text-teal-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Đơn vị tài trợ</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/announcements">
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-gray-500 relative overflow-hidden group" data-testid="card-action-announcements">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 border-2 border-gray-500 flex items-center justify-center mb-4 group-hover:bg-gray-500 transition-colors duration-300">
                    <FileText className="h-8 w-8 text-gray-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Thông báo</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </ScrollAnimatedSection>

      {/* Organizers Section */}
      {organizers.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-600 via-gray-400 to-teal-600"></div>
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Ban tổ chức" 
              subtitle="Những người đứng sau thành công của hội nghị"
              accentColor="bg-teal-600"
              cta={
                <Link href="/organizers">
                  <Button variant="outline" className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white font-semibold px-8">
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
                {organizers.map((organizer: Organizer) => (
                  <CarouselItem key={organizer.id} className="md:basis-1/2 lg:basis-1/3 pl-6">
                    <div className="p-1 h-full">
                      <Card 
                        className="overflow-hidden transition-all duration-300 border-2 border-slate-200 hover:border-teal-600 hover:shadow-xl h-full flex flex-col group relative"
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 to-gray-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                          {organizer.photoUrl ? (
                            <div className="relative mb-6">
                              <div className="absolute -inset-2 border-2 border-teal-600/20 group-hover:border-teal-600 transition-colors duration-300"></div>
                              <img
                                src={organizer.photoUrl}
                                alt={organizer.name}
                                className="w-32 h-32 object-cover relative z-10"
                              />
                              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ) : (
                            <div className="relative mb-6">
                              <div className="absolute -inset-2 border-2 border-teal-600/20 group-hover:border-teal-600 transition-colors duration-300"></div>
                              <div className="w-32 h-32 bg-slate-200 flex items-center justify-center text-slate-600 text-3xl font-bold relative z-10">
                                {organizer.name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          )}
                          
                          <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-teal-600 transition-colors">
                            {organizer.credentials && `${organizer.credentials}. `}{organizer.name}
                          </h3>
                          
                          {organizer.title && (
                            <p className="text-sm font-semibold text-slate-700 mb-3">{organizer.title}</p>
                          )}

                          {organizer.bio && (
                            <p className="text-sm text-slate-600 mb-4 line-clamp-3">{organizer.bio}</p>
                          )}
                          
                          <div className="mt-auto pt-4 w-full">
                            <div className="h-0.5 w-12 bg-teal-600 mx-auto mb-3"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                              {organizer.organizingRole}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12 border-2 border-slate-300 hover:border-teal-600" />
              <CarouselNext className="-right-4 md:-right-12 border-2 border-slate-300 hover:border-teal-600" />
            </Carousel>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-white relative">
          <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-teal-600/10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-gray-400/10"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="TIN TỨC - THÔNG BÁO" 
              subtitle="Cập nhật mới nhất từ Ban Tổ chức"
              accentColor="bg-teal-600"
              cta={
                <Link href="/announcements">
                  <Button variant="outline" className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white font-semibold px-8">
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
              plugins={[Autoplay({ delay: 2000, stopOnInteraction: true })]}
              className="w-full max-w-7xl mx-auto"
            >
              <CarouselContent className="-ml-6">
                {announcements.map((announcement: Announcement) => (
                                    <CarouselItem key={announcement.id} className="md:basis-1/2 lg:basis-1/3 pl-6">
                                      <Link href={`/announcements/${announcement.id}`}>
                                        <Card
                                          className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-teal-600 group h-full flex flex-col"
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
                                                <span className="bg-teal-600 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide shadow-lg">
                                                  {announcement.category === 'important' ? 'Quan trọng' :
                                                   announcement.category === 'deadline' ? 'Hạn cuối' : 'Thông báo'}
                                                </span>
                                              </div>
                                              <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-b-[40px] border-b-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </div>
                                          )}
                                          <CardContent className="p-6 relative flex-1 flex flex-col">
                                            <div className="absolute top-0 left-0 w-1 h-0 bg-teal-600 group-hover:h-full transition-all duration-300"></div>
                                            {announcement.publishedAt && (
                                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 uppercase tracking-wide font-semibold">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{format(new Date(announcement.publishedAt), "dd 'Tháng' MM, yyyy", { locale: vi })}</span>
                                              </div>
                                            )}
                                            <h3 className="font-bold text-lg line-clamp-2 mb-3 text-slate-900 group-hover:text-teal-600 transition-colors flex-grow">
                                              {announcement.title}
                                            </h3>
                                            {announcement.excerpt && (
                                              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mt-auto">
                                                {announcement.excerpt}
                                              </p>
                                            )}
                                          </CardContent>
                                        </Card>
                                      </Link>
                                    </CarouselItem>                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12 border-2 border-slate-300 hover:border-teal-600" />
              <CarouselNext className="-right-4 md:-right-12 border-2 border-slate-300 hover:border-teal-600" />
            </Carousel>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Program/Sessions Section */}
      {sessions.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
          <div className="absolute top-20 right-10 w-24 h-24 border-4 border-gray-400/20 rotate-45"></div>
          <div className="absolute bottom-20 left-10 w-20 h-20 border-4 border-teal-600/20"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Chương trình hội nghị" 
              subtitle="Lịch trình chi tiết các phiên làm việc"
              accentColor="bg-gray-500"
            />

            <div className="max-w-6xl mx-auto">
              <SessionList sessions={sessions} speakers={speakers} view="homepage" />
            </div>

            <div className="text-center mt-12">
              <Link href="/program">
                <Button size="lg" className="bg-teal-600 text-white hover:bg-teal-700 font-semibold px-10 border-0 shadow-lg">
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
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-600 via-gray-400 to-teal-600"></div>
          <div className="absolute top-10 left-1/4 w-16 h-16 border-2 border-teal-600/10 rounded-full"></div>
          <div className="absolute bottom-10 right-1/4 w-24 h-24 border-2 border-gray-400/10 rounded-full"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Chủ tọa & Diễn giả" 
              subtitle="Đội ngũ chuyên gia hàng đầu"
              accentColor="bg-teal-600"
              cta={
                <Link href="/speakers">
                  <Button variant="outline" className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white font-semibold px-8">
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
                        className="overflow-hidden transition-all duration-300 border-2 border-slate-200 hover:border-teal-600 hover:shadow-xl h-full flex flex-col group relative"
                        data-testid={`card-speaker-${speaker.id}`}
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 to-gray-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                          {speaker.photoUrl ? (
                            <div className="relative mb-6">
                              <div className="absolute -inset-2 border-2 border-teal-600/20 group-hover:border-teal-600 transition-colors duration-300"></div>
                                      <img
                                        src={speaker.photoUrl}
                                        alt={speaker.name}
                                        className="w-32 h-auto relative z-10"
                                      />                              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ) : (
      <div className="relative mb-4">
        <div className="absolute -inset-2 border-2 border-blue-600/20 group-hover:border-blue-600 transition-colors duration-300"></div>
        <div className="w-32 h-auto bg-slate-200 flex items-center justify-center text-slate-600 text-3xl font-bold relative z-10">
          {speaker.name.charAt(0)}
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
                          )}
                          
                          <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-teal-600 transition-colors">
                            {speaker.credentials && `${speaker.credentials}. `}{speaker.name}
                          </h3>
                          
                          {speaker.title && (
                            <p className="text-sm font-semibold text-slate-700 mb-3">{speaker.title}</p>
                          )}
                          
                          {speaker.specialty && (
                            <p className="text-sm text-slate-600 mb-4">{speaker.specialty}</p>
                          )}
                          
                          <div className="mt-auto pt-4 w-full">
                            <div className="h-0.5 w-12 bg-teal-600 mx-auto mb-3"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
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
              <CarouselPrevious className="-left-4 md:-left-12 border-2 border-slate-300 hover:border-teal-600" />
              <CarouselNext className="-right-4 md:-right-12 border-2 border-slate-300 hover:border-teal-600" />
            </Carousel>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Sponsors Section */}
      {sponsors.length > 0 && (
        <ScrollAnimatedSection className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
          <div className="absolute top-0 right-0 w-40 h-40 border-t-4 border-r-4 border-teal-600/10"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 border-b-4 border-l-4 border-gray-400/10"></div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader 
              title="Đơn vị tài trợ" 
              subtitle="Cảm ơn sự đồng hành của các đối tác"
              accentColor="bg-gray-500"
            />

            <div className="space-y-16 max-w-6xl mx-auto">
              {tierOrder.map(tier => {
                const tierSponsors = sponsorsByTier[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;

                const tierColors: Record<string, string> = {
                  diamond: 'border-teal-600 bg-teal-600',
                  gold: 'border-gray-400 bg-gray-400',
                  silver: 'border-slate-400 bg-slate-400',
                  bronze: 'border-teal-600 bg-teal-600',
                  supporting: 'border-teal-500 bg-teal-500',
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
                          className={`bg-white border-2 border-slate-200 p-8 flex items-center justify-center hover:border-teal-600 hover:shadow-xl transition-all duration-300 relative group
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
                <Button variant="outline" size="lg" className="border-2 border-gray-500 text-gray-600 hover:bg-gray-500 hover:text-white font-semibold px-8">
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
            <div className="absolute top-20 left-10 w-32 h-32 border-4 border-teal-600 rotate-45"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-gray-400"></div>
          </div>
          
          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <SectionHeader 
                title="Giới thiệu" 
                subtitle="Thông tin chi tiết về hội nghị"
                accentColor="bg-teal-600"
              />
              <Card className="border-2 border-slate-200 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-600 via-gray-400 to-teal-600"></div>
                <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
          <div className="flex-1 bg-teal-600"></div>
          <div className="w-16 bg-gray-400"></div>
          <div className="flex-1 bg-teal-600"></div>
          <div className="w-16 bg-gray-400"></div>
          <div className="flex-1 bg-teal-600"></div>
        </div>
      </div>
    </div>
  );
}