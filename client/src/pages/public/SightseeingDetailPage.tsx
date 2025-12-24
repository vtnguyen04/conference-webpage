import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Sightseeing } from "@shared/types";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function SightseeingDetailPage() {
  const params = useParams();
  const sightseeingId = params.id;
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { data: sightseeing, isLoading, error } = useQuery<Sightseeing>({
    queryKey: ["/api/sightseeing", sightseeingId],
    queryFn: () => apiRequest("GET", `/api/sightseeing/${sightseeingId}`),
    enabled: !!sightseeingId,
  });

  useEffect(() => {
    if (sightseeing && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sightseeing]);

  const handleFacebookShare = () => {
    const url = window.location.href;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookShareUrl, "_blank", "width=600,height=400");
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Lỗi tải trang</h1>
          <p className="text-sm text-muted-foreground">{error.message || "Không thể tải chi tiết."}</p>
        </div>
      </div>
    );
  }

  if (!sightseeing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy trang</h1>
          <p className="text-muted-foreground">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

    return (
      <>
        <PageHeader
          title="Địa điểm tham quan"
          subtitle=""
          bannerImageUrl={sightseeing.featuredImageUrl}
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
                  <Link href="/sightseeing">Địa điểm tham quan</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">{sightseeing.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageHeader>
  
        <div ref={mainContentRef} className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center uppercase">
                {sightseeing.title}
              </h1>
              {sightseeing.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-8">
                  {sightseeing.excerpt}
                </p>
              )}
  
              <div
                className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sightseeing.content }}
              />

              <div className="mt-8 flex justify-end">
                <Button onClick={handleFacebookShare} variant="outline">
                  <Facebook className="h-4 w-4 mr-2" />
                  Chia sẻ lên Facebook
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
