import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { Organizer } from "@shared/types";
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
import { OrganizerCard } from "@/components/OrganizerCard";
import { useActiveConference } from "@/hooks/useActiveConference";
import { organizerService } from "@/services/organizerService";

export default function OrganizersPage() {
  const [, params] = useRoute("/conference/:slug/organizers");
  const slug = params?.slug;

  const { conference } = useActiveConference();

  const conferenceId = conference?.id;
  const { data: organizers = [], isLoading } = useQuery<Organizer[]>({
    queryKey: ["organizers", slug || "active"], // Unique key for React Query
    queryFn: () => organizerService.getOrganizers(slug),
    enabled: !!conferenceId,
  });

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (organizers.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [organizers]);

  const groupedOrganizers = organizers.reduce((acc, organizer) => {
    const role = organizer.organizingRole;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(organizer);
    return acc;
  }, {} as Record<string, Organizer[]>);

  const roleOrder: (keyof typeof groupedOrganizers)[] = ["Trưởng Ban", "Phó trưởng Ban", "Thành viên", "Thành viên TK"];

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
        title="Ban tổ chức"
        subtitle="Những người đóng góp cho sự thành công của hội nghị."
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
              <BreadcrumbPage className="text-white">Ban tổ chức</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">

          {roleOrder.map(role => (
            groupedOrganizers[role] && (
              <section className="mb-16" key={role}>
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-700 text-center">
                  {role}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedOrganizers[role].map((organizer) => (
                    <OrganizerCard key={organizer.id} organizer={organizer} />
                  ))}
                </div>
              </section>
            )
          ))}

          {organizers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Danh sách ban tổ chức đang được cập nhật.
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
