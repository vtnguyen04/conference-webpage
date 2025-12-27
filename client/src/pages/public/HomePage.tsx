import React from "react";
import { useActiveConference } from "@/hooks/useActiveConference";
import { ScrollAnimatedSection } from "@/components/ScrollAnimatedSection";
import { LazyMotion, domAnimation } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import QuickActionsSection from "@/components/QuickActionsSection";
import OrganizersSection from "@/components/OrganizersSection";
import AnnouncementsSection from "@/components/AnnouncementsSection";
import ProgramSection from "@/components/ProgramSection";
import SpeakersSection from "@/components/SpeakersSection";
import SponsorsSection from "@/components/SponsorsSection";
import IntroductionSection from "@/components/IntroductionSection";
import { Loader2, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const { conference, isLoading, error } = useActiveConference();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-rose-100 text-center space-y-4">
          <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Lỗi kết nối máy chủ</h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Hệ thống không thể tải dữ liệu hội nghị lúc này.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-teal-600 mx-auto" />
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!conference) return null;

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-white">
        <HeroSection />

        {/* 1. Quick Actions - Xanh Teal nhạt vừa phải */}
        <ScrollAnimatedSection className="py-16 bg-teal-50/80 border-b border-teal-100/50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <QuickActionsSection />
          </div>
        </ScrollAnimatedSection>

        {/* 2. Introduction - Trắng */}
        <ScrollAnimatedSection className="py-24 bg-white relative overflow-hidden">
            <div className="absolute top-20 left-10 w-64 h-64 bg-teal-100/10 rounded-full blur-3xl" />
            <IntroductionSection />
        </ScrollAnimatedSection>

        {/* 3. Announcements - Xanh Teal nhạt vừa phải */}
        <ScrollAnimatedSection className="py-24 bg-teal-50/80 border-y border-teal-100/50">
          <AnnouncementsSection />
        </ScrollAnimatedSection>

        {/* 4. Program - Trắng */}
        <ScrollAnimatedSection className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-40 right-0 w-96 h-96 bg-teal-50/50 rounded-full blur-[100px]" />
          <ProgramSection />
        </ScrollAnimatedSection>

        {/* 5. Speakers - Xanh Teal nhạt vừa phải */}
        <ScrollAnimatedSection className="py-24 bg-teal-50/80 border-y border-teal-100/50">
            <SpeakersSection />
        </ScrollAnimatedSection>

        {/* 6. Organizers - Trắng */}
        <ScrollAnimatedSection className="py-24 bg-white">
          <OrganizersSection />
        </ScrollAnimatedSection>

        {/* 7. Sponsors - Xanh Teal nhạt vừa phải */}
        <ScrollAnimatedSection className="py-24 bg-teal-50/80 border-t border-teal-100/50">
            <SponsorsSection />
        </ScrollAnimatedSection>

        {/* Decorative Footer Border */}
        <div className="h-2 w-full flex">
          <div className="flex-1 bg-teal-600" />
          <div className="w-20 bg-slate-800" />
          <div className="flex-1 bg-teal-600" />
        </div>
      </div>
    </LazyMotion>
  );
}
