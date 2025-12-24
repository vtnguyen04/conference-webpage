import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Announcement, Conference } from "@shared/types";
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
import { apiRequest } from "@/lib/queryClient";

export default function AnnouncementsPage() {
  const [isAnnouncements, announcementsParams] = useRoute("/announcements");
  const [isConferenceAnnouncements, conferenceAnnouncementsParams] = useRoute(
    "/conference/:slug/announcements"
  );

  const slug = isConferenceAnnouncements
    ? conferenceAnnouncementsParams?.slug
    : undefined;
  const conferenceQueryKey = slug
    ? `/api/conferences/${slug}`
    : "/api/conferences/active";
  const { data: conference } = useQuery<Conference>({
    queryKey: [conferenceQueryKey],
    queryFn: () => apiRequest("GET", conferenceQueryKey),
  });

  const conferenceId = conference?.id;
  const announcementsApiUrl = slug
    ? `/api/announcements/slug/${slug}`
    : "/api/announcements";
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements", slug || "active"], // Unique key for React Query
    queryFn: () => apiRequest("GET", announcementsApiUrl),
    enabled: !!conferenceId,
  });

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcements.length > 0 && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [announcements]);

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

  // Phân loại thông báo theo category để hiển thị
  const featuredAnnouncements = announcements
    .filter((a) => a.category === "important")
    .slice(0, 2);
  const regularAnnouncements = announcements.filter(
    (a) =>
      a.category !== "important" || !featuredAnnouncements.includes(a)
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "important":
        return "bg-red-100 text-red-800 border-red-200";
      case "deadline":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "update":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "important":
        return "QUAN TRỌNG";
      case "deadline":
        return "HẠN CUỐI";
      case "update":
        return "CẬP NHẬT";
      default:
        return "THÔNG BÁO";
    }
  };

  const getLinkUrl = (announcementId: string) => {
    return slug
      ? `/conference/${slug}/announcements/${announcementId}`
      : `/announcements/${announcementId}`;
  };

  return (
    <>
      <PageHeader
        title="Tin tức & Thông báo"
        subtitle="Cập nhật mới nhất về hội nghị, các sự kiện quan trọng và thông tin liên quan."
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
              <BreadcrumbPage className="text-white">
                Tin tức & Thông báo
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Featured Announcements - Tin nổi bật */}
            {featuredAnnouncements.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-0.5 bg-blue-600"></div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Tin nổi bật
                  </h2>
                  <div className="w-12 h-0.5 bg-blue-600"></div>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  {featuredAnnouncements.map((announcement) => (
                    <Link
                      key={announcement.id}
                      href={getLinkUrl(announcement.id)}
                    >
                      <Card className="overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
                        {announcement.featuredImageUrl && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={announcement.featuredImageUrl}
                              alt={announcement.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge
                              variant="outline"
                              className={`border-2 font-semibold text-xs ${getCategoryColor(
                                announcement.category || "default"
                              )}`}
                            >
                              {getCategoryLabel(
                                announcement.category || "default"
                              )}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(
                                  new Date(announcement.publishedAt),
                                  "dd 'Tháng' MM, yyyy",
                                  { locale: vi }
                                )}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {announcement.title}
                          </h3>
                          {announcement.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                              {announcement.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                              Đọc chi tiết
                            </span>
                            <ArrowRight className="h-4 w-4 text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Regular Announcements - Danh sách tin thường */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-0.5 bg-gray-400"></div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Tất cả thông báo
                </h2>
                <div className="flex-1 h-0.5 bg-gray-400"></div>
              </div>

              {regularAnnouncements.length > 0 ? (
                <div className="space-y-6">
                  {regularAnnouncements.map((announcement) => (
                    <Link
                      key={announcement.id}
                      href={getLinkUrl(announcement.id)}
                    >
                      <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            {/* Hình ảnh */}
                            {announcement.featuredImageUrl && (
                              <div className="lg:w-48 lg:shrink-0">
                                <div className="aspect-video lg:aspect-square overflow-hidden rounded-lg">
                                  <img
                                    src={announcement.featuredImageUrl}
                                    alt={announcement.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Nội dung */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge
                                  variant="outline"
                                  className={`border font-medium text-xs ${getCategoryColor(
                                    announcement.category || "default"
                                  )}`}
                                >
                                  {getCategoryLabel(
                                    announcement.category || "default"
                                  )}
                                </Badge>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {format(
                                      new Date(announcement.publishedAt),
                                      "dd/MM/yyyy",
                                      { locale: vi }
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {format(
                                      new Date(announcement.publishedAt),
                                      "HH:mm",
                                      { locale: vi }
                                    )}
                                  </span>
                                </div>
                              </div>

                              <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {announcement.title}
                              </h3>

                              {announcement.excerpt && (
                                <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                  {announcement.excerpt}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-blue-600 text-sm font-medium group-hover:underline">
                                  Xem chi tiết
                                </span>
                                <ArrowRight className="h-4 w-4 text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : announcements.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chưa có thông báo
                    </h3>
                    <p className="text-gray-600">
                      Các thông báo mới sẽ được cập nhật tại đây.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </section>

            {/* Thống kê */}
            {announcements.length > 0 && (
              <div className="mt-16 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {announcements.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Tổng số thông báo
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {
                        announcements.filter(
                          (a) => a.category === "important"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Tin quan trọng</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {
                        announcements.filter(
                          (a) => a.category === "deadline"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Hạn cuối</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600 mb-1">
                      {
                        new Set(
                          announcements.map((a) =>
                            format(new Date(a.publishedAt), "yyyy-MM-dd")
                          )
                        ).size
                      }
                    </div>
                    <div className="text-sm text-gray-600">Ngày đăng</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}