import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { Sponsor } from "@shared/schema";

const tierLabels: Record<string, string> = {
  diamond: "Tài trợ Kim cương",
  gold: "Tài trợ Vàng",
  silver: "Tài trợ Bạc",
  bronze: "Tài trợ Đồng",
  supporting: "Nhà tài trợ Đồng hành",
  other: "Tài trợ Khác",
};

const tierOrder = ["diamond", "gold", "silver", "bronze", "supporting", "other"];

const tierColumns: Record<string, string> = {
  diamond: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  gold: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  silver: "grid-cols-2 md:grid-cols-4 lg:grid-cols-5",
  bronze: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
  supporting: "grid-cols-3 md:grid-cols-5 lg:grid-cols-7",
  other: "grid-cols-3 md:grid-cols-5 lg:grid-cols-7",
};

export default function SponsorsPage() {
  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
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

  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier || "other";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  // Sort sponsors within each tier by displayOrder
  Object.keys(sponsorsByTier).forEach((tier) => {
    sponsorsByTier[tier].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  });

  return (
    <div className="min-h-screen py-16 md:py-24 bg-gradient-section">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight" data-testid="text-sponsors-title">
              Đơn vị tài trợ
            </h1>
            <p className="text-muted-foreground text-lg">Cảm ơn sự đồng hành của các đối tác</p>
          </div>

          {tierOrder.map((tier) => {
            const tieredSponsors = sponsorsByTier[tier];
            if (!tieredSponsors || tieredSponsors.length === 0) return null;

            return (
              <section key={tier} className="mb-16" data-testid={`section-tier-${tier}`}>
                <h2 className="text-xl font-bold mb-8 text-center text-secondary uppercase tracking-wider">
                  {tierLabels[tier] || tier}
                </h2>
                <div className={`grid ${tierColumns[tier] || "grid-cols-4"} gap-6`}>
                  {tieredSponsors.map((sponsor) => (
                    <Card
                      key={sponsor.id}
                      className="overflow-hidden border-0 hover:shadow-xl hover:scale-105 transition-all duration-300"
                      data-testid={`card-sponsor-${sponsor.id}`}
                    >
                      <CardContent className="p-6 flex items-center justify-center min-h-[120px]">
                        {sponsor.logoUrl ? (
                          sponsor.websiteUrl ? (
                            <a
                              href={sponsor.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full h-full flex items-center justify-center"
                              data-testid={`link-sponsor-${sponsor.id}`}
                            >
                              <img
                                src={sponsor.logoUrl}
                                alt={sponsor.name}
                                className="max-w-full max-h-20 object-contain"
                                data-testid={`img-sponsor-logo-${sponsor.id}`}
                              />
                            </a>
                          ) : (
                            <img
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              className="max-w-full max-h-20 object-contain"
                              data-testid={`img-sponsor-logo-${sponsor.id}`}
                            />
                          )
                        ) : (
                          <div className="text-center">
                            <p className="font-semibold text-sm text-muted-foreground" data-testid={`text-sponsor-name-${sponsor.id}`}>
                              {sponsor.name}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          {sponsors.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground" data-testid="text-no-sponsors">
                  Danh sách đơn vị tài trợ đang được cập nhật.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
