import { useQuery } from "@tanstack/react-query";
import type { Sponsor, Conference } from "@shared/schema";
import { Link } from "wouter";
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

// Định nghĩa tên các hạng tài trợ như trong HomePage
const tierNames: Record<string, string> = {
  diamond: 'ĐƠN VỊ TÀI TRỢ KIM CƯƠNG',
  gold: 'ĐƠN VỊ TÀI TRỢ VÀNG',
  silver: 'ĐƠN VỊ TÀI TRỢ BẠC',
  bronze: 'ĐƠN VỊ TÀI TRỢ ĐỒNG',
  supporting: 'ĐƠN VỊ ĐỒNG HÀNH',
  other: 'ĐƠN VỊ HỖ TRỢ',
};

// Thứ tự hiển thị các hạng
const tierOrder = ['diamond', 'gold', 'silver', 'bronze', 'supporting', 'other'];

export default function SponsorsPage() {
  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: conference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Nhóm các nhà tài trợ theo hạng
  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier || "other";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  // Sắp xếp các nhà tài trợ trong mỗi hạng
  Object.keys(sponsorsByTier).forEach((tier) => {
    sponsorsByTier[tier].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  });

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
      <div className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="space-y-16 max-w-6xl mx-auto">
            {tierOrder.map(tier => {
              const tierSponsors = sponsorsByTier[tier];
              if (!tierSponsors || tierSponsors.length === 0) return null;

              const tierColors: Record<string, string> = {
                diamond: 'border-blue-600 bg-blue-600',
                gold: 'border-amber-400 bg-amber-400',
                silver: 'border-blue-600 bg-blue-600',
                bronze: 'border-orange-600 bg-orange-600',
                supporting: 'border-blue-600 bg-blue-600',
                other: 'border-slate-500 bg-slate-500',
              };

              return (
                <div key={tier} className="text-center" data-testid={`sponsor-tier-${tier}`}>
                  <div className="mb-10 relative inline-block">
                    <div className={`absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 ${tierColors[tier].split(' ')[0]}`}></div>
                    <div className={`absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 ${tierColors[tier].split(' ')[0]}`}></div>
                    <h3 className={`font-bold text-base uppercase tracking-widest px-8 py-3 border-t-2 border-b-2 ${tierColors[tier].split(' ')[0]} text-slate-800`}>
                      {tierNames[tier]}
                    </h3>
                    <div className={`absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 ${tierColors[tier].split(' ')[0]}`}></div>
                    <div className={`absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 ${tierColors[tier].split(' ')[0]}`}></div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-10">
                    {tierSponsors.map((sponsor) => (
                      <a
                        key={sponsor.id}
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bg-white border-2 border-slate-200 p-8 flex items-center justify-center hover:border-blue-600 hover:shadow-xl transition-all duration-300 relative group
                          ${tier === 'diamond' ? 'w-64 h-40' : ''}
                          ${tier === 'gold' ? 'w-56 h-36' : ''}
                          ${tier === 'silver' ? 'w-48 h-32' : ''}
                          ${tier === 'bronze' ? 'w-40 h-28' : ''}
                          ${tier === 'supporting' || tier === 'other' ? 'w-36 h-24' : ''}
                        `}
                        data-testid={`sponsor-logo-${sponsor.id}`}
                      >
                        <div className={`absolute top-0 left-0 w-0 h-0.5 ${tierColors[tier].split(' ')[1]} group-hover:w-full transition-all duration-300`}></div>
                        <div className={`absolute bottom-0 right-0 w-0 h-0.5 ${tierColors[tier].split(' ')[1]} group-hover:w-full transition-all duration-300`}></div>
                        {sponsor.logoUrl ? (
                          <img
                            src={sponsor.logoUrl}
                            alt={sponsor.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-sm font-bold text-center text-slate-700">
                            {sponsor.name}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {sponsors.length === 0 && (
            <Card className="border-0 shadow-lg mt-16">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Danh sách đơn vị tài trợ đang được cập nhật.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}