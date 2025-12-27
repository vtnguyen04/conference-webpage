import { Organizer } from "@shared/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { OrganizerCard } from "@/components/OrganizerCard";
import { useQuery } from "@tanstack/react-query";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicOrganizers } from "@/hooks/usePublicData";

const OrganizersSection = () => {
    const { conference } = useActiveConference();
    const { data: organizers = [] } = usePublicOrganizers(conference?.slug);

    if (organizers.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader
                title="Ban Tổ chức"
                subtitle="Những người đứng sau thành công của hội nghị"
                accentColor="bg-teal-600"
                cta={
                    <Link href="/organizers">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm uppercase tracking-widest h-12 px-10 rounded-full transition-all shadow-xl shadow-teal-200">
                            Hội đồng điều hành
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
                                <OrganizerCard organizer={organizer} />
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
export default OrganizersSection;