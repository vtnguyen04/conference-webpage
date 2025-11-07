import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Announcement } from "@shared/schema";

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

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
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-12" data-testid="text-announcements-title">
            Thông báo
          </h1>

          {announcements.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {announcements.map((announcement) => (
                <Card
                  key={announcement.id}
                  className="overflow-hidden hover-elevate active-elevate-2 transition-all h-full flex flex-col"
                  data-testid={`card-announcement-${announcement.id}`}
                >
                  {announcement.featuredImageUrl && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img
                        src={announcement.featuredImageUrl}
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-announcement-${announcement.id}`}
                      />
                    </div>
                  )}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground" data-testid={`text-announcement-date-${announcement.id}`}>
                        {format(new Date(announcement.publishedAt), "dd/MM/yyyy", { locale: vi })}
                      </span>
                      {announcement.category && (
                        <Badge variant="secondary" className="ml-auto" data-testid={`badge-announcement-category-${announcement.id}`}>
                          {announcement.category}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold mb-3" data-testid={`text-announcement-title-${announcement.id}`}>
                      {announcement.title}
                    </h2>
                    {announcement.excerpt && (
                      <p className="text-muted-foreground mb-4 flex-1" data-testid={`text-announcement-excerpt-${announcement.id}`}>
                        {announcement.excerpt}
                      </p>
                    )}
                    <details className="mt-auto">
                      <summary className="cursor-pointer text-primary hover:underline font-medium" data-testid={`link-read-more-${announcement.id}`}>
                        Đọc thêm
                      </summary>
                      <div
                        className="mt-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                        data-testid={`text-announcement-content-${announcement.id}`}
                      />
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground" data-testid="text-no-announcements">
                  Chưa có thông báo nào được đăng.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
