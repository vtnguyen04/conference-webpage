import { useQuery } from "@tanstack/react-query";
import type { Conference } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { useEffect, useRef } from "react";

export default function AboutPage() {
  const { data: conference, isLoading } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conference && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conference]);

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
        title="Giới thiệu hội nghị"
        subtitle="Tìm hiểu thêm về mục tiêu, lịch sử và những người đứng sau sự kiện của chúng tôi."
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
              <BreadcrumbPage className="text-white">Giới thiệu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
          {conference?.introContent ? (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: conference.introContent }}
              data-testid="text-about-content"
            />
          ) : (
            <p className="text-muted-foreground" data-testid="text-no-content">
              Nội dung giới thiệu đang được cập nhật.
            </p>
          )}

          {conference && (
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">Thông tin liên hệ</h3>
                {conference.contactEmail && (
                  <p className="mb-2">
                    <span className="font-medium">Email:</span>{" "}
                    <a href={`mailto:${conference.contactEmail}`} className="text-primary hover:underline">
                      {conference.contactEmail}
                    </a>
                  </p>
                )}
                {conference.contactPhone && (
                  <p className="mb-2">
                    <span className="font-medium">Điện thoại:</span>{" "}
                    <a href={`tel:${conference.contactPhone}`} className="text-primary hover:underline">
                      {conference.contactPhone}
                    </a>
                  </p>
                )}
                {conference.location && (
                  <p>
                    <span className="font-medium">Địa điểm:</span> {conference.location}
                  </p>
                )}
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">Thời gian tổ chức</h3>
                <p className="mb-2">
                  <span className="font-medium">Từ ngày:</span>{" "}
                  {new Date(conference.startDate).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  <span className="font-medium">Đến ngày:</span>{" "}
                  {new Date(conference.endDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
};