import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight, ChevronRight, Info, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "wouter";
import React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useActiveConference } from "@/hooks/useActiveConference";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const HeroSection = () => {
    const { conference, isLoading } = useActiveConference();
    const plugin = React.useRef(
        Autoplay({ delay: 6000, stopOnInteraction: true })
    );

    const conferenceYear = conference?.startDate 
        ? new Date(conference.startDate).getFullYear() 
        : new Date().getFullYear();
    const tagline = conference?.tagline || "Sự kiện Khoa học thường niên";

    if (isLoading) {
        return (
            <div className="relative h-[700px] md:h-[800px] flex items-center justify-center overflow-hidden bg-slate-900">
                <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <section className="relative h-[700px] md:h-[850px] w-full overflow-hidden bg-slate-950">
            {/* Background Carousel */}
            <Carousel
                plugins={[plugin.current]}
                className="absolute inset-0 w-full h-full"
            >
                <CarouselContent className="w-full h-full ml-0">
                    {(conference?.bannerUrls && conference.bannerUrls.length > 0) ? (
                        conference.bannerUrls.map((url, index) => (
                            <CarouselItem key={index} className="w-full h-full pl-0 basis-full">
                                <div className="relative w-full h-full">
                                    <img
                                        src={url}
                                        alt={`Banner ${index + 1}`}
                                        className="w-full h-full object-cover object-center scale-105 animate-slow-zoom"
                                    />
                                    {/* Professional Dark Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-950" />
                                    <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
                                </div>
                            </CarouselItem>
                        ))
                    ) : (
                        <CarouselItem className="w-full h-full pl-0 basis-full">
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                            </div>
                        </CarouselItem>
                    )}
                </CarouselContent>
            </Carousel>

            {/* Content Container */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 h-full flex flex-col justify-center relative z-10">
                <div className="max-w-5xl mx-auto text-center space-y-10 animate-in fade-in zoom-in-95 duration-1000">
                    
                    {/* Top Tag */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl">
                        <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.2em]">
                            {tagline} {conferenceYear}
                        </span>
                    </div>

                    {/* Main Title */}
                    <div className="space-y-6">
                        <h1 
                            className="block text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-normal py-6 overflow-visible" 
                            style={{ lineHeight: '1.4', height: 'auto' }}
                            data-testid="text-conference-name"
                        >
                            {conference?.name || "Hội Nghị Khoa Học Quốc Tế"}
                        </h1>
                        
                        {conference?.theme && (
                            <div className="flex flex-col items-center gap-6">
                                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
                                <p className="text-xl md:text-2xl font-bold text-teal-50/90 leading-relaxed max-w-3xl mx-auto italic drop-shadow-md" data-testid="text-conference-theme">
                                    "{conference.theme}"
                                </p>
                                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
                            </div>
                        )}
                    </div>

                    {/* Info Badges (Glassmorphism) */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 pt-4">
                        {conference?.startDate && (
                            <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl group hover:bg-white/10 transition-all duration-300">
                                <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/40">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Thời gian</p>
                                    <p className="text-sm font-bold text-white uppercase">
                                        {conference.startDate && !isNaN(new Date(conference.startDate).getTime()) && conference.endDate && !isNaN(new Date(conference.endDate).getTime())
                                          ? `${format(new Date(conference.startDate), "dd/MM", { locale: vi })} - ${format(new Date(conference.endDate), "dd/MM/yyyy", { locale: vi })}`
                                          : "Đang cập nhật"}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {conference?.location && (
                            <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl group hover:bg-white/10 transition-all duration-300">
                                <div className="h-10 w-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/40 shrink-0">
                                    <MapPin className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Địa điểm</p>
                                    <p className="text-sm font-bold text-white uppercase leading-tight" data-testid="text-conference-location">
                                        {conference.location}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
                        <Link href="/register">
                            <Button 
                                className="h-16 px-12 bg-teal-600 hover:bg-teal-700 text-white text-base font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-teal-900/40 border-none transition-all hover:scale-105 active:scale-95 group" 
                                data-testid="button-register-hero"
                            >
                                Đăng ký tham dự ngay
                                <ArrowRight className="ml-3 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/program">
                            <Button 
                                variant="outline" 
                                className="h-16 px-12 bg-white/5 backdrop-blur-md text-white border-2 border-white/20 hover:bg-white hover:text-slate-900 text-base font-black uppercase tracking-widest rounded-2xl transition-all" 
                                data-testid="button-program-hero"
                            >
                                Xem chương trình
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 animate-bounce">
                <div className="w-[1.5px] h-14 bg-gradient-to-b from-teal-400 via-white to-transparent shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Scroll
                </span>
            </div>
        </section>
    )
}

export default HeroSection;
