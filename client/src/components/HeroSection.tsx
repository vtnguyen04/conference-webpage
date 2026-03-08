import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useActiveConference } from "@/hooks/useActiveConference";
import Autoplay from "embla-carousel-autoplay";
import React from "react";

const HeroSection = () => {
    const { conference, isLoading } = useActiveConference();
    const plugin = React.useRef(
        Autoplay({ delay: 4500, stopOnInteraction: true })
    );



    if (isLoading) {
        return (
            <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden bg-slate-900">
                <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <section className="w-full bg-slate-50/50 overflow-hidden">
            <div className="w-full">
                {/* Image Carousel */}
                <Carousel
                    plugins={[plugin.current]}
                    className="w-full overflow-hidden bg-slate-100 group relative"
                >
                    <CarouselContent className="w-full ml-0">
                        {(conference?.bannerUrls && conference.bannerUrls.length > 0) ? (
                            conference.bannerUrls.map((url, index) => (
                                <CarouselItem key={index} className="w-full pl-0 basis-full">
                                    <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] xl:h-[700px] overflow-hidden">
                                        <img
                                            src={url}
                                            alt={`Banner ${index + 1}`}
                                            className="w-full h-full object-cover object-center transition-transform duration-[10s] ease-linear group-hover:scale-110"
                                        />
                                    </div>
                                </CarouselItem>
                            ))
                        ) : (
                            <CarouselItem className="w-full pl-0 basis-full">
                                <div className="w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] xl:h-[700px] bg-slate-200 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    )
}

export default HeroSection;
