import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Announcement } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AnnouncementDetailPage() {
  const params = useParams();
  const announcementId = params.id;

  const { data: announcement, isLoading, error } = useQuery<Announcement>({
    queryKey: ["/api/announcements", announcementId],
    queryFn: () => fetch(`/api/announcements/${announcementId}`).then((res) => res.json()),
    enabled: !!announcementId, // Only run query if announcementId is available
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Lỗi tải thông báo</h1>
          <p className="text-sm text-muted-foreground">{error.message || "Không thể tải thông báo chi tiết."}</p>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông báo</h1>
          <p className="text-muted-foreground">Thông báo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

    return (
      <>
        <PageHeader
          title=""
          subtitle=""
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
                <BreadcrumbLink asChild className="text-white">
                  <Link href="/announcements">Thông báo</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">{announcement.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageHeader>
  
        <div className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center uppercase">
                {announcement.title}
              </h1>
              {announcement.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-8">
                  {announcement.excerpt}
                </p>
              )}
  
              {announcement.featuredImageUrl && (
                <img
                  src={announcement.featuredImageUrl}
                  alt={announcement.title}
                  className="w-full h-auto object-cover rounded-lg mb-8 shadow-lg"
                />
              )}

              {announcement.pdfUrl && (
                <div className="mb-8 p-4 border rounded-lg bg-gray-50">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    Tài liệu đính kèm
                  </h2>
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <iframe
                      src={announcement.pdfUrl}
                      width="100%"
                      height="500px"
                      style={{ border: 'none' }}
                      title="Tài liệu thông báo"
                    >
                      This browser does not support PDFs. Please download the PDF to view it.
                    </iframe>
                  </div>
                  <a
                    href={announcement.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Tải xuống PDF
                  </a>
                </div>
              )}
  
              <Card className="mb-8">
                <CardContent className="p-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {announcement.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(announcement.publishedAt), "dd 'Tháng' MM, yyyy", { locale: vi })}</span>
                    </div>
                  )}
                  {announcement.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>{announcement.category === 'important' ? 'Quan trọng' : announcement.category === 'deadline' ? 'Hạn cuối' : 'Thông báo chung'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
  
              <div
                className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
