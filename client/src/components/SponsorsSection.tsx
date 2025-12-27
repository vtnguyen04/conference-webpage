import { Sponsor } from "@shared/types";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SponsorsList } from "@/components/SponsorsList";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicSponsors } from "@/hooks/usePublicData";

const SponsorsSection = () => {
    const { conference } = useActiveConference();
    const { data: sponsors = [] } = usePublicSponsors(conference?.slug);

    if (sponsors.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader
                title="Đơn vị tài trợ"
                subtitle="Cảm ơn sự đồng hành của các đối tác chiến lược"
                accentColor="bg-teal-500"
            />
            <SponsorsList sponsors={sponsors} />
            <div className="text-center mt-16">
                <Link href="/sponsors">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm uppercase tracking-widest h-12 px-10 rounded-full transition-all shadow-xl shadow-teal-200">
                        Xem danh sách đối tác
                    </Button>
                </Link>
            </div>
        </div>
    )
}
export default SponsorsSection;