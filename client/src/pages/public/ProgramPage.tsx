import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import type { Session, Speaker } from "@shared/types";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SessionList } from "@/components/SessionList";
import { useActiveConference } from "@/hooks/useActiveConference";
import { sessionService } from "@/services/sessionService";
import { speakerService } from "@/services/speakerService";
export default function ProgramPage() {
  const [, params] = useRoute("/conference/:slug/program");
  const slug = params?.slug;
  const { conference } = useActiveConference();
    const conferenceId = conference?.id;
    const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
      queryKey: ["sessions", slug || "active"],
      queryFn: () => sessionService.getSessions(slug),
      enabled: !!conferenceId,
    });
    const { data: speakers = [], isLoading: speakersLoading } = useQuery<Speaker[]>({
      queryKey: ["speakers", slug || "active"],
      queryFn: () => speakerService.getSpeakers(slug),
      enabled: !!conferenceId,
    });
  const mainContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sessions.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions]);
  if (sessionsLoading || speakersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải chương trình...</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <PageHeader
        title="Chương trình hội nghị"
        subtitle="Khám phá lịch trình chi tiết các phiên, bài thuyết trình và diễn giả của chúng tôi."
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
              <BreadcrumbPage className="text-white">Chương trình hội nghị</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>
      <div ref={mainContentRef} className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <SessionList sessions={sessions} speakers={speakers} />
          </div>
        </div>
      </div>
    </>
  );
}
