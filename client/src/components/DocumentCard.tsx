import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Document } from "@shared/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "wouter";

interface DocumentCardProps {
    document: Document;
    slug?: string;
}

export const DocumentCard = ({ document, slug }: DocumentCardProps) => {
    const getLinkUrl = (documentId: string) => {
        return slug
            ? `/conference/${slug}/documents/${documentId}`
            : `/documents/${documentId}`;
    };

    return (
        <Link
            key={document.id}
            href={getLinkUrl(document.id)}
        >
            <Card className="border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Hình ảnh */}
                        {document.featuredImageUrl && (
                            <div className="lg:w-48 lg:shrink-0">
                                <div className="aspect-video lg:aspect-square overflow-hidden rounded-lg">
                                    <img
                                        src={document.featuredImageUrl}
                                        alt={document.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            </div>
                        )}
                        {/* Nội dung */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <Badge
                                    variant="outline"
                                    className="border-indigo-100 bg-indigo-50 text-indigo-700 font-medium text-[10px] uppercase tracking-wider"
                                >
                                    Kỷ yếu
                                </Badge>
                                <div className="flex items-center gap-1 text-sm text-gray-400">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                        {document.publishedAt && !isNaN(new Date(document.publishedAt).getTime())
                                            ? format(
                                                new Date(document.publishedAt),
                                                "dd/MM/yyyy",
                                                { locale: vi }
                                            )
                                            : "N/A"}
                                    </span>
                                </div>
                                {document.pdfUrl && (
                                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 text-[9px] font-bold uppercase">
                                        PDF
                                    </Badge>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {document.title}
                            </h3>
                            {document.excerpt && (
                                <p className="text-gray-500 mb-4 line-clamp-2 leading-relaxed text-sm">
                                    {document.excerpt}
                                </p>
                            )}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-indigo-600 text-sm font-semibold group-hover:underline flex items-center gap-1">
                                    Xem chi tiết
                                </span>
                                <ArrowRight className="h-4 w-4 text-indigo-600 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};
