import { Speaker } from "@shared/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SpeakerCard } from "@/components/SpeakerCard";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSpeakers } from "@/hooks/usePublicData";

const SpeakersSection = () => {
    const { conference } = useActiveConference();
    const { data: speakers = [] } = usePublicSpeakers(conference?.slug);

    if (speakers.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader
                title="Chủ tọa & Báo cáo viên"
                subtitle="Đội ngũ chuyên gia hàng đầu"
                accentColor="bg-teal-500"
                isDark={false}
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
                                <SpeakerCard speaker={speaker} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="flex items-center justify-center gap-4 mt-8">
                    <CarouselPrevious className="static transform-none mr-0" />
                    <CarouselNext className="static transform-none ml-0" />
                </div>
            </Carousel>
            
            <div className="text-center mt-12">
                <Link href="/speakers">
                    <Button className="group bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-widest h-10 px-6 rounded-full transition-all shadow-lg shadow-teal-100 active:scale-95 flex items-center justify-center mx-auto">
                        Xem chi tiết
                    </Button>
                </Link>
            </div>
        </div>
    )
}
export default SpeakersSection;