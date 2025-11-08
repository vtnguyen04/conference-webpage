import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { Sightseeing } from "@shared/schema";
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
import type { Conference } from "@shared/schema";
import { useEffect, useRef } from "react";
import { Building } from "lucide-react"; // nếu bạn đang dùng icon

export default function SightseeingPage() {
  const { data: sightseeing = [], isLoading } = useQuery<Sightseeing[]>({
    queryKey: ["/api/sightseeing"],
  });

  const { data: conference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sightseeing.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sightseeing]);

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
        title="Địa điểm tham quan"
        subtitle="Khám phá những địa điểm thú vị và hấp dẫn gần nơi diễn ra hội nghị."
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
              <BreadcrumbPage className="text-white">Địa điểm tham quan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-0.5 bg-gray-400"></div>
                <h2 className="text-xl font-semibold text-gray-900">Tất cả địa điểm</h2>
                <div className="flex-1 h-0.5 bg-gray-400"></div>
              </div>

              {sightseeing.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sightseeing.map((item) => (
                    <Link key={item.id} href={`/sightseeing/${item.id}`}>
                      <Card className="overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
                        {item.featuredImageUrl && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={item.featuredImageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                              {item.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                              Xem chi tiết
                            </span>
                            <ArrowRight className="h-4 w-4 text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có địa điểm</h3>
                    <p className="text-gray-600">Các địa điểm tham quan sẽ được cập nhật tại đây.</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
