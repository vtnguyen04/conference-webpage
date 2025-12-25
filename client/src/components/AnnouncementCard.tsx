import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Announcement } from "@shared/types";
import { Link } from "wouter";
interface AnnouncementCardProps {
    announcement: Announcement;
    slug?: string;
    type: 'featured' | 'regular';
}
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
export const AnnouncementCard = ({ announcement, slug, type }: AnnouncementCardProps) => {
    const getLinkUrl = (announcementId: string) => {
        return slug
            ? `/conference/${slug}/announcements/${announcementId}`
            : `/announcements/${announcementId}`;
    };
    if (type === 'featured') {
        return (
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
        )
    }
    return (
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
    )
};