import { Session, Speaker } from "@shared/types";
import { SessionList } from "@/components/SessionList";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useActiveConference } from "@/hooks/useActiveConference";
import { speakerService } from "@/services/speakerService";
import { sessionService } from "@/services/sessionService"; // Added

const ProgramSection = () => {
    const { conference } = useActiveConference();
    
    const { data: sessions = [] } = useQuery<Session[]>({
        queryKey: ["/api/sessions"],
        queryFn: () => sessionService.getSessions(conference?.slug),
        enabled: !!conference,
    });

    const { data: speakers = [] } = useQuery<Speaker[]>({
        queryKey: ["/api/speakers"],
        queryFn: () => speakerService.getSpeakers(conference?.slug),
        enabled: !!conference,
    });

    if (sessions.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader
                title="Chương trình hội nghị"
                subtitle="Lịch trình chi tiết các phiên làm việc"
                accentColor="bg-gray-500"
            />

            <div className="max-w-6xl mx-auto">
                <SessionList sessions={sessions} speakers={speakers} view="homepage" />
            </div>

            <div className="text-center mt-12">
                <Link href="/program">
                    <Button size="lg" className="bg-teal-600 text-white hover:bg-teal-700 font-semibold px-10 border-0 shadow-lg">
                        Xem chương trình đầy đủ
                    </Button>
                </Link>
            </div>
        </div>
    )
}

export default ProgramSection;