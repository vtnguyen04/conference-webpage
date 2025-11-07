import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Conference, Announcement, Session, Speaker, Sponsor } from "@shared/schema";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ScrollAnimatedSection } from "@/components/ScrollAnimatedSection";

export default function HomePage() {
  const { data: conference, isLoading, error } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });
  console.log("conference data:", conference);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chưa có hội nghị nào được kích hoạt</h1>
          <p className="text-muted-foreground">Vui lòng quay lại sau.</p>
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
    diamond: 'TÀI TRỢ KIM CƯƠNG',
    gold: 'TÀI TRỢ VÀNG',
    silver: 'TÀI TRỢ BẠC',
    bronze: 'TÀI TRỢ ĐỒNG',
    supporting: 'NHÀ TÀI TRỢ ĐỒNG HÀNH',
    other: 'TÀI TRỢ KHÁC',
  };

  const sessionsByDay = sessions.reduce((acc, session) => {
    if (!acc[session.day]) {
      acc[session.day] = [];
    }
    acc[session.day].push(session);
    return acc;
  }, {} as Record<number, Session[]>);

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section with Carousel Background */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
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
                    className="w-full h-full object-cover object-top"
                  />
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="w-full h-full">
                <div className="w-full h-full gradient-hero" />
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 text-white bg-black/50 hover:bg-black/70 border-none" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 text-white bg-black/50 hover:bg-black/70 border-none" />
        </Carousel>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-0"></div>

        {/* Content */}
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 relative z-10 pointer-events-none">
          <div className="max-w-5xl mx-auto text-center pointer-events-auto">
            {conference?.year && (
              <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-6 border border-white/30">
                <span className="text-white font-semibold text-lg tracking-wide">
                  {conference.year}
                </span>
              </div>
            )}

            <ScrollAnimatedSection>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg tracking-tight leading-tight" data-testid="text-conference-name">
                {conference?.name || "Hội Nghị Y Học"}
              </h1>
            </ScrollAnimatedSection>
            
            {conference?.theme && (
              <ScrollAnimatedSection>
                <p className="text-2xl md:text-3xl font-semibold text-white/95 mb-8 drop-shadow-lg" data-testid="text-conference-theme">
                  {conference.theme}
                </p>
              </ScrollAnimatedSection>
            )}

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white/90 text-lg mb-12">
              {conference?.startDate && conference?.endDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    {format(new Date(conference.startDate), "dd/MM", { locale: vi })} - {format(new Date(conference.endDate), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              )}
              
              {conference?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span data-testid="text-conference-location">{conference.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="default" className="gradient-hero text-white shadow-xl text-base font-semibold px-8 transform hover:scale-105 transition-transform duration-300" data-testid="button-register-hero">
                  Đăng ký tham dự
                </Button>
              </Link>
              <Link href="/program">
                <Button size="lg" variant="outline" className="glass text-white border-white/30 hover:bg-white/20 text-base font-semibold px-8 transform hover:scale-105 transition-transform duration-300" data-testid="button-program-hero">
                  Xem chương trình
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <ScrollAnimatedSection className="py-12 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/register">
              <Card className="group hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 hover:shadow-xl border-0 relative overflow-hidden" data-testid="card-action-register">
                <div className="absolute inset-0 gradient-card-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-3">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold">ĐĂNG KÝ THAM DỰ</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/program">
              <Card className="group hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 hover:shadow-xl border-0 relative overflow-hidden" data-testid="card-action-program">
                <div className="absolute inset-0 gradient-card-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold">CHƯƠNG TRÌNH</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sponsors">
              <Card className="group hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 hover:shadow-xl border-0 relative overflow-hidden" data-testid="card-action-sponsors">
                <div className="absolute inset-0 gradient-card-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-3">
                    <Users className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">ĐƠN VỊ TÀI TRỢ</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/announcements">
              <Card className="group hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 hover:shadow-xl border-0 relative overflow-hidden" data-testid="card-action-announcements">
                <div className="absolute inset-0 gradient-card-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center mb-3">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold">THÔNG BÁO</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
                  </div>
                </ScrollAnimatedSection>
        
                    {/* Modern Announcements Section */}
        
                    {announcements.length > 0 && (
        
                                            <ScrollAnimatedSection className="py-16 md:py-24 gradient-section">
        
                                              <div className="container mx-auto px-4 md:px-6 lg:px-8">
        
                                                <div className="text-center mb-12">
        
                                                  <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-gradient">Thông báo</h2>
        
                            <p className="text-muted-foreground text-lg">Cập nhật mới nhất từ ban tổ chức</p>
        
                          </div>
        
              
        
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
                            {announcements.slice(0, 6).map((announcement: Announcement) => (
        
                                                            <Card 
        
                                                              key={announcement.id} 
        
                                                              className="overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 border-0"
        
                                                              data-testid={`card-announcement-${announcement.id}`}
        
                                {announcement.featuredImageUrl && (
        
                                  <div className="relative aspect-video overflow-hidden">
        
                                    <img 
        
                                      src={announcement.featuredImageUrl} 
        
                                      alt={announcement.title}
        
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        
                                    />
        
                                    <div className="absolute top-4 left-4">
        
                                      <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
        
                                        {announcement.category === 'important' ? 'QUAN TRỌNG' : 
        
                                         announcement.category === 'deadline' ? 'HẠN CUỐI' : 'THÔNG BÁO'}
        
                                      </span>
        
                                    </div>
        
                                  </div>
        
                                )}
        
                                <CardContent className="p-6">
        
                                  {announcement.publishedAt && (
        
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        
                                      <Calendar className="h-3 w-3" />
        
                                      <span>{format(new Date(announcement.publishedAt), "dd 'Tháng' MM, yyyy", { locale: vi })}</span>
        
                                    </div>
        
                                  )}
        
                                  <h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">
        
                                    {announcement.title}
        
                                  </h3>
        
                                  {announcement.excerpt && (
        
                                    <p className="text-sm text-muted-foreground line-clamp-3">
        
                                      {announcement.excerpt}
        
                                    </p>
        
                                  )}
        
                                </CardContent>
        
                              </Card>
        
                            ))}
        
                          </div>
        
              
        
                          {announcements.length > 6 && (
        
                            <div className="text-center mt-8">
        
                              <Link href="/announcements">
        
                                <Button variant="outline" size="lg">
        
                                  Xem tất cả thông báo
        
                                </Button>
        
                              </Link>
        
                            </div>
        
                          )}
        
                        </div>
        
                      </ScrollAnimatedSection>
        
                    )}

      {/* Modern Program/Sessions Section */}
      {sessions.length > 0 && (
        <ScrollAnimatedSection className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Chương trình hội nghị</h2>
              <p className="text-muted-foreground text-lg">Lịch trình chi tiết các phiên</p>
            </div>

            <div className="space-y-8 max-w-4xl mx-auto">
              {Object.keys(sessionsByDay).sort().map((day) => (
                <div key={day}>
                  <h3 className="text-2xl font-bold mb-6 text-primary">Ngày {day}</h3>
                  <div className="relative pl-8 space-y-8 border-l-2 border-primary/20">
                    {sessionsByDay[Number(day)].map((session: Session) => (
                      <div key={session.id} className="relative">
                        <div className="absolute -left-[1.5rem] top-1 w-6 h-6 bg-primary rounded-full border-4 border-background"></div>
                        <Card 
                          className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary overflow-hidden hover:border-l-secondary"
                          data-testid={`session-${session.id}`}
                        >
                        <CardContent className="p-6">
                          <div className="flex gap-6">
                            <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-4 py-3 min-w-[100px]">
                              <Clock className="h-5 w-5 text-primary mb-1" />
                              <div className="text-sm font-bold text-primary">
                                {format(new Date(session.startTime), "HH:mm", { locale: vi })}
                              </div>
                              <div className="text-xs text-muted-foreground">-</div>
                              <div className="text-sm font-bold text-primary">
                                {format(new Date(session.endTime), "HH:mm", { locale: vi })}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              {session.track && (
                                <span className="inline-block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                                  {session.track}
                                </span>
                              )}
                              <h4 className="font-bold text-lg mb-2">{session.title}</h4>
                              {session.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {session.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {session.room || 'TBA'}
                                </span>
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                                  {session.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/program">
                <Button variant="default" size="lg">
                  Xem chương trình đầy đủ
                </Button>
              </Link>
            </div>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Modern Speakers Section */}
      {speakers.length > 0 && (
        <ScrollAnimatedSection className="py-16 md:py-24 gradient-section">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-gradient">Chủ tọa & Diễn giả</h2>
              <p className="text-muted-foreground text-lg">Đội ngũ chuyên gia hàng đầu</p>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent className="-ml-4">
                {speakers.map((speaker: Speaker) => (
                  <CarouselItem key={speaker.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                    <div className="p-1 h-full">
                      <Card 
                        className="overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 h-full flex flex-col group"
                        data-testid={`card-speaker-${speaker.id}`}
                      >
                        <CardContent className="p-6 flex flex-col items-center text-center flex-1">
                          {speaker.photoUrl ? (
                            <div className="relative w-32 h-32 rounded-full mb-4 overflow-hidden ring-4 ring-primary/10 group-hover:ring-secondary transition-colors duration-300">
                              <img
                                src={speaker.photoUrl}
                                alt={speaker.name}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold mb-4 ring-4 ring-primary/10 group-hover:ring-secondary transition-colors duration-300">
                              {speaker.name.charAt(0)}
                            </div>
                          )}
                          
                          <h3 className="font-bold text-lg mb-1 text-primary">
                            {speaker.credentials && `${speaker.credentials}. `}{speaker.name}
                          </h3>
                          
                          {speaker.title && (
                            <p className="text-sm font-medium text-foreground mb-2">{speaker.title}</p>
                          )}
                          
                          {speaker.specialty && (
                            <p className="text-sm text-muted-foreground mb-3">{speaker.specialty}</p>
                          )}
                          
                          <div className="mt-auto">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              speaker.role === 'moderator' 
                                ? 'bg-secondary/10 text-secondary' 
                                : 'bg-accent/10 text-accent-foreground'
                            }`}>
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
              <CarouselPrevious className="-left-4 md:-left-12" />
              <CarouselNext className="-right-4 md:-right-12" />
            </Carousel>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Modern Sponsors Section */}
      {sponsors.length > 0 && (
        <ScrollAnimatedSection className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Đơn vị tài trợ</h2>
              <p className="text-muted-foreground text-lg">Cảm ơn sự đồng hành của các đối tác</p>
            </div>

            <div className="space-y-12 max-w-6xl mx-auto">
              {tierOrder.map(tier => {
                const tierSponsors = sponsorsByTier[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;

                return (
                  <div key={tier} className="text-center" data-testid={`sponsor-tier-${tier}`}>
                    <h3 className="font-bold text-secondary text-xl uppercase tracking-wider mb-8 relative after:absolute after:bottom-[-10px] after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1 after:bg-primary after:rounded-full">
                      {tierNames[tier]}
                    </h3>
                    <div className={`flex flex-wrap items-center justify-center gap-8`}>
                      {tierSponsors.map((sponsor) => (
                        <div
                          key={sponsor.id}
                          className={`bg-card border border-border rounded-xl p-6 flex items-center justify-center hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer
                            ${tier === 'diamond' ? 'w-64 h-40' : ''}
                            ${tier === 'gold' ? 'w-56 h-36' : ''}
                            ${tier === 'silver' ? 'w-48 h-32' : ''}
                            ${tier === 'bronze' ? 'w-40 h-28' : ''}
                            ${tier === 'supporting' || tier === 'other' ? 'w-36 h-24' : ''}
                          `}
                          data-testid={`sponsor-logo-${sponsor.id}`}
                        >
                          {sponsor.logoUrl ? (
                            <img
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-center text-muted-foreground">
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

            <div className="text-center mt-12">
              <Link href="/sponsors">
                <Button variant="outline" size="lg">
                  Xem tất cả nhà tài trợ
                </Button>
              </Link>
            </div>
          </div>
        </ScrollAnimatedSection>
      )}

      {/* Introduction Section */}
      {conference?.introContent && (
        <ScrollAnimatedSection className="py-16 md:py-24 gradient-section">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight text-gradient">Giới thiệu</h2>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div
                    className="prose prose-lg max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: conference.introContent }}
                    data-testid="text-intro-content"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollAnimatedSection>
      )}
    </div>
  );
}
