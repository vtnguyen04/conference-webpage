import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { usePublicOrganizers } from "@/hooks/usePublicData";
import { Users, Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OrganizersPage() {
  const [, params] = useRoute("/conference/:slug/organizers");
  const slug = params?.slug;
  const { conference } = useActiveConference();
  
  const { data: organizers = [], isLoading } = usePublicOrganizers(slug || conference?.slug);

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (organizers.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [organizers.length]);

  const groupedOrganizers = organizers.reduce((acc, organizer) => {
    const role = organizer.organizingRole;
    if (!acc[role]) acc[role] = [];
    acc[role].push(organizer);
    return acc;
  }, {} as Record<string, typeof organizers>);

  const roleOrder = ["Trưởng Ban", "Phó trưởng Ban", "Thành viên", "Thành viên TK"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang tải danh sách ban tổ chức...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Ban Tổ chức"
        subtitle="Đội ngũ tận tâm đứng sau sự thành công và chuyên nghiệp của hội nghị khoa học."
        bannerImageUrl={conference?.bannerUrls?.[0]}
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white opacity-80 hover:opacity-100 transition-opacity">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold">Ban Tổ chức</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-20">
            
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-extrabold uppercase tracking-widest">Hội đồng điều hành</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Nhân sự Ban Tổ chức
              </h2>
              <div className="h-1 w-20 bg-teal-500 rounded-full" />
            </div>

            {organizers.length > 0 ? (
              roleOrder.map(role => groupedOrganizers[role] && (
                <div key={role} className="space-y-10">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-slate-900 text-white px-6 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-md">
                      {role}
                    </Badge>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groupedOrganizers[role]
                      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map((organizer) => (
                        <OrganizerCard key={organizer.id} organizer={organizer} />
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <Card className="border-dashed border-2 border-slate-200 bg-white/50 shadow-none">
                <CardContent className="p-20 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                    Danh sách đang được cập nhật
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}