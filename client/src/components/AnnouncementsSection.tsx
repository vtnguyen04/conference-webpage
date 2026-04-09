import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicAnnouncements } from "@/hooks/usePublicData";
import { Announcement } from "@shared/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Autoplay from "embla-carousel-autoplay";
import { Calendar } from "lucide-react";
import { Link } from "wouter";

const AnnouncementsSection = () => {
    const { conference } = useActiveConference();
    const { data: announcements = [] } = usePublicAnnouncements(conference?.slug);

    if (announcements.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <SectionHeader
                title="TIN TỨC || THÔNG BÁO"
                subtitle="Cập nhật mới nhất từ Ban Tổ chức"
                accentColor="bg-teal-600"
            />
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[Autoplay({ delay: 2000, stopOnInteraction: true })]}
                className="w-full max-w-7xl mx-auto"
            >
                <CarouselContent className="-ml-6">
                    {announcements.map((announcement: Announcement) => (
                        <CarouselItem key={announcement.id} className="md:basis-1/2 lg:basis-1/3 pl-6">
                            <Link href={`/announcements/${announcement.id}`}>
                                <Card
                                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-teal-600 group h-full flex flex-col"
                                    data-testid={`card-announcement-${announcement.id}`}
                                >
                                    {announcement.featuredImageUrl && (
                                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                                            <img
                                                src={announcement.featuredImageUrl}
                                                alt={announcement.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-teal-600 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide shadow-lg">
                                                    {announcement.category === 'important' ? 'Quan trọng' :
                                                        announcement.category === 'deadline' ? 'Hạn cuối' :
                                                        announcement.category === 'news' ? 'Tin tức' : 'Thông báo'}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-b-[40px] border-b-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                    )}
                                    <CardContent className="p-6 relative flex-1 flex flex-col">
                                        <div className="absolute top-0 left-0 w-1 h-0 bg-teal-600 group-hover:h-full transition-all duration-300"></div>
                                        {announcement.publishedAt && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 uppercase tracking-wide font-semibold">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>
                                                  {announcement.publishedAt && !isNaN(new Date(announcement.publishedAt).getTime())
                                                    ? format(new Date(announcement.publishedAt), "dd 'Tháng' MM, yyyy", { locale: vi })
                                                    : "Đang cập nhật"}
                                                </span>
                                            </div>
                                        )}
                                        <h3 className="font-bold text-lg line-clamp-2 mb-3 text-slate-900 group-hover:text-teal-600 transition-colors flex-grow">
                                            {announcement.title}
                                        </h3>
                                        {announcement.excerpt && (
                                            <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mt-auto">
                                                {announcement.excerpt}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        </CarouselItem>))}
                </CarouselContent>
                <div className="flex items-center justify-center gap-4 mt-8">
                    <CarouselPrevious className="static transform-none mr-0" />
                    <CarouselNext className="static transform-none ml-0" />
                </div>
            </Carousel>

            <div className="text-center mt-12">
                <Link href="/announcements">
                    <Button className="group bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-widest h-10 px-6 rounded-full transition-all shadow-lg shadow-teal-100 active:scale-95 flex items-center justify-center mx-auto">
                        Xem chi tiết
                    </Button>
                </Link>
            </div>
        </div>
    )
}
export default AnnouncementsSection;
