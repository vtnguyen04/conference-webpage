import { Organizer } from "@shared/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { OrganizerCard } from "@/components/OrganizerCard";
import { useQuery } from "@tanstack/react-query";
import { useActiveConference } from "@/hooks/useActiveConference";
import { organizerService } from "@/services/organizerService"; // Added

const OrganizersSection = () => {
    const { conference } = useActiveConference();
    const { data: organizers = [] } = useQuery<Organizer[]> ({
        queryKey: ["/api/organizers"],
        queryFn: () => organizerService.getOrganizers(conference?.slug),
        enabled: !!conference,
    });

    if (organizers.length === 0) {
        return null; // Don't render the section if there are no organizers
    }

    return (
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
                        <CarouselItem key={organizer.id} className="md:basis-1/3 lg:basis-1/4 pl-6">
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