import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "wouter";
import React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useActiveConference } from "@/hooks/useActiveConference";

const HeroSection = () => {
    const { conference, isLoading } = useActiveConference();
    
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );

    if (isLoading) {
        return <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-slate-900"></div>
    }

    return (
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
    )
}

export default HeroSection;