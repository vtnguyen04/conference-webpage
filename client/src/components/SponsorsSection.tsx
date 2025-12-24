import { Sponsor } from "@shared/types";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SponsorsList } from "@/components/SponsorsList";
import { useQuery } from "@tanstack/react-query";
import { useActiveConference } from "@/hooks/useActiveConference";
import { sponsorService } from "@/services/sponsorService"; // Added

const SponsorsSection = () => {
    const { conference } = useActiveConference();
    const { data: sponsors = [] } = useQuery<Sponsor[]>({
        queryKey: ["/api/sponsors"],
        queryFn: () => sponsorService.getSponsors(conference?.slug),
        enabled: !!conference,
    });

    if (sponsors.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader
                title="Đơn vị tài trợ"
                subtitle="Cảm ơn sự đồng hành của các đối tác"
                accentColor="bg-gray-500"
            />

            <SponsorsList sponsors={sponsors} />
            <div className="text-center mt-16">
                <Link href="/sponsors">
                    <Button variant="outline" size="lg" className="border-2 border-gray-500 text-gray-600 hover:bg-gray-500 hover:text-white font-semibold px-8">
                        Xem tất cả nhà tài trợ
                    </Button>
                </Link>
            </div>
        </div>
    )
}

export default SponsorsSection;