import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { Speaker } from "@shared/types";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useRoute } from "wouter";

import { useEffect, useRef } from "react";
import { SpeakerCard } from "@/components/SpeakerCard";
import { useActiveConference } from "@/hooks/useActiveConference";
import { speakerService } from "@/services/speakerService";

export default function SpeakersPage() {
  const [, params] = useRoute("/conference/:slug/speakers");
  const slug = params?.slug;

  const { conference } = useActiveConference();

  const conferenceId = conference?.id;
  const { data: speakers = [], isLoading } = useQuery<Speaker[]>({
    queryKey: ["speakers", slug || "active"], // Unique key for React Query
    queryFn: () => speakerService.getSpeakers(slug),
    enabled: !!conferenceId,
  });

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (speakers.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [speakers]);

  const moderators = speakers.filter(
    (s) => s.role === "moderator" || s.role === "both"
  );
  const regularSpeakers = speakers.filter(
    (s) => s.role === "speaker" || s.role === "both"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Chủ tọa & Báo cáo viên"
        subtitle="Gặp gỡ các chuyên gia hàng đầu và những người có tầm ảnh hưởng sẽ chia sẻ kiến thức tại hội nghị."
        bannerImageUrl={conference?.bannerUrls?.[0]}
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Chủ tọa & Báo cáo viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">

          {/* Moderators Section */}
          {moderators.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-700 text-center" data-testid="text-moderators-title">
                Chủ tọa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moderators.map((speaker) => (
                  <SpeakerCard key={speaker.id} speaker={speaker} />
                ))}
              </div>
            </section>
          )}

          {/* Speakers Section */}
          {regularSpeakers.length > 0 && (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-700 text-center" data-testid="text-speakers-section-title">
                Báo cáo viên
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularSpeakers.map((speaker) => (
                  <SpeakerCard key={speaker.id} speaker={speaker} />
                ))}
              </div>
            </section>
          )}

          {speakers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground" data-testid="text-no-speakers">
                  Danh sách chủ tọa và diễn giả đang được cập nhật.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
