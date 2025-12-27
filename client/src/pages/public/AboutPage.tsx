import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useActiveConference } from "@/hooks/useActiveConference";
import { CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Calendar, Info, FileText, Globe, Bookmark, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  const { conference, isLoading } = useActiveConference();
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conference && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conference]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-2 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-400 font-medium text-xs uppercase tracking-widest">Đang tải dữ liệu hội nghị...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white animate-in fade-in duration-700">
      <PageHeader
        title="Giới thiệu Hội nghị"
        subtitle="Thông tin tổng quan về mục tiêu, quy mô và đơn vị tổ chức sự kiện khoa học."
        bannerImageUrl={conference?.bannerUrls?.[0]}
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white/80 hover:text-white transition-colors">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-semibold">Giới thiệu chung</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              {/* Nội dung chính */}
              <div className="lg:col-span-8 space-y-12">
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-teal-600 rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Thư ngỏ & Mục tiêu Hội nghị</h2>
                  </div>
                  
                  <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
                    {conference?.introContent ? (
                      <div
                        className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed text-justify"
                        dangerouslySetInnerHTML={{ __html: conference.introContent.replace(/\n/g, '<br />') }}
                      />
                    ) : (
                      <div className="py-12 text-center space-y-3">
                        <FileText className="h-8 w-8 text-slate-200 mx-auto" />
                        <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">
                          Nội dung giới thiệu đang được cập nhật
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-teal-50 rounded-2xl border border-teal-100">
                    <h4 className="font-bold text-teal-900 mb-3 flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-teal-600" /> Giá trị học thuật
                    </h4>
                    <p className="text-sm text-teal-800/80 leading-relaxed font-medium">
                      Hội nghị là diễn đàn uy tín để các nhà khoa học công bố những công trình nghiên cứu mới nhất và trao đổi kinh nghiệm chuyên môn sâu sắc.
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-teal-600" /> Kết nối quốc tế
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Mở rộng mạng lưới hợp tác giữa các viện nghiên cứu, trường đại học và các doanh nghiệp dược phẩm trong và ngoài nước.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar thông tin */}
              <div className="lg:col-span-4 space-y-8">
                <div className="space-y-6 sticky top-24">
                  
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-teal-600" /> Thông tin tổ chức
                      </h3>
                    </div>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian diễn ra</p>
                        <p className="text-sm font-bold text-slate-700">
                          {conference ? `${new Date(conference.startDate).toLocaleDateString("vi-VN")} - ${new Date(conference.endDate).toLocaleDateString("vi-VN")}` : 'Đang cập nhật'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa điểm thực tế</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-sm font-bold text-slate-700 leading-tight">{conference?.location || 'Đang cập nhật'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Mail className="h-4 w-4 text-teal-600" /> Ban Thư ký
                      </h3>
                    </div>
                    <CardContent className="p-6 space-y-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email liên hệ</p>
                        <a href={`mailto:${conference?.contactEmail}`} className="text-sm font-black text-teal-600 hover:underline">
                          {conference?.contactEmail || 'N/A'}
                        </a>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại hỗ trợ</p>
                        <a href={`tel:${conference?.contactPhone}`} className="text-sm font-black text-slate-800">
                          {conference?.contactPhone || 'N/A'}
                        </a>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-6 bg-[#042f2e] rounded-2xl text-white shadow-xl shadow-teal-900/10">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4 text-teal-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Tin cậy & Bảo mật</span>
                    </div>
                    <p className="text-xs text-teal-50/70 leading-relaxed font-medium">
                      Ban tổ chức cam kết đảm bảo tính minh bạch và bảo mật thông tin trong mọi quy trình đăng ký tham dự.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
