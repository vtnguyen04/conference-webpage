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
import { useActiveConference } from "@/hooks/useActiveConference";
import SponsorsSection from "@/components/SponsorsSection";
export default function SponsorsPage() {
  const [, _params] = useRoute("/conference/:slug/sponsors");
  const { conference } = useActiveConference();
  const mainContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  return (
    <>
      {/* PHẦN 1: KHÔI PHỤC LẠI PAGE HEADER VÀ BANNER */}
      <PageHeader
        title="Đơn vị tài trợ"
        subtitle="Cảm ơn sự đồng hành và hỗ trợ quý báu từ các đối tác của chúng tôi."
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
              <BreadcrumbPage className="text-white">Đơn vị tài trợ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>
      {/* PHẦN 2: NỘI DUNG TRANG VỚI STYLE ĐÃ SỬA ĐÚNG TỪ HOMEPAGE */}
      <div ref={mainContentRef} className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <SponsorsSection />
          </div>
        </div>
      </div>
    </>
  );
}