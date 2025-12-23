import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import type { Organizer } from "@shared/schema";
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
import type { Conference } from "@shared/schema";
import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function OrganizersPage() {
  const [, params] = useRoute("/conference/:slug/organizers");
  const slug = params?.slug;

  const conferenceQueryKey = slug ? `/api/conferences/${slug}` : "/api/conferences/active";
  const { data: conference } = useQuery<Conference>({
    queryKey: [conferenceQueryKey],
    queryFn: () => apiRequest("GET", conferenceQueryKey),
  });

  const conferenceId = conference?.id;
  const organizersApiUrl = slug ? `/api/organizers/${slug}` : "/api/organizers";
  const { data: organizers = [], isLoading } = useQuery<Organizer[]>({
    queryKey: ["organizers", slug || "active"], // Unique key for React Query
    queryFn: () => apiRequest("GET", organizersApiUrl),
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

  const OrganizerCard = ({ organizer }: { organizer: Organizer }) => (
    <Card className="overflow-hidden hover-elevate transition-all h-full flex flex-col group relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="p-6 flex flex-col items-center text-center flex-1">
        {organizer.photoUrl ? (
          <div className="relative mb-6">
            <div className="absolute -inset-2 border-2 border-primary/20 group-hover:border-primary transition-colors duration-300"></div>
            <img
              src={organizer.photoUrl}
              alt={organizer.name}
              className="w-32 h-32 object-contain relative z-10"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ) : (
          <div className="relative mb-6">
            <div className="absolute -inset-2 border-2 border-primary/20 group-hover:border-primary transition-colors duration-300"></div>
            <div className="w-32 h-32 bg-muted flex items-center justify-center text-muted-foreground text-3xl font-bold relative z-10">
              {organizer.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
          {organizer.credentials && `${organizer.credentials}. `}{organizer.name}
        </h3>
        {organizer.title && (
          <p className="text-sm text-muted-foreground mb-2">
            {organizer.title}
          </p>
        )}
        {organizer.bio && (
          <p className="text-sm text-muted-foreground mt-4 text-left line-clamp-3">
            {organizer.bio}
          </p>
        )}
        <div className="mt-auto pt-4 w-full">
          <div className="h-0.5 w-12 bg-primary mx-auto mb-3"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {organizer.organizingRole}
          </span>
        </div>
      </CardContent>
    </Card>
  );

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
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-primary">
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
