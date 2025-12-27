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
                cta={
                    <Link href="/speakers">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm uppercase tracking-widest h-12 px-10 rounded-full transition-all shadow-xl shadow-teal-200">
                            Xem tất cả danh sách
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
                                <SpeakerCard speaker={speaker} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="-left-4 md:-left-12 border-2 border-slate-300 hover:border-teal-600" />
                <CarouselNext className="-right-4 md:-right-12 border-2 border-slate-300 hover:border-teal-600" />
            </Carousel>
        </div>
    )
}
export default SpeakersSection;