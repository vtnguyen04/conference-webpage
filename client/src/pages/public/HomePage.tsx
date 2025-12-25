import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Conference } from "@shared/types";
import { ScrollAnimatedSection } from "@/components/ScrollAnimatedSection";
import { LazyMotion, domAnimation } from "framer-motion";

// Import all section components
import HeroSection from "@/components/HeroSection";
import QuickActionsSection from "@/components/QuickActionsSection";
import OrganizersSection from "@/components/OrganizersSection";
import AnnouncementsSection from "@/components/AnnouncementsSection";
import ProgramSection from "@/components/ProgramSection";
import SpeakersSection from "@/components/SpeakersSection";
import SponsorsSection from "@/components/SponsorsSection";
import IntroductionSection from "@/components/IntroductionSection";

export default function HomePage() {
  const { data: conference, isLoading, error } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Lỗi tải dữ liệu</h1>
          <pre className="text-sm text-muted-foreground">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chưa có hội nghị nào được kích hoạt</h1>
          <p className="text-slate-600">Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <HeroSection />

        {/* Decorative Border */}
        <div className="relative h-2 bg-slate-100">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-teal-600"></div>
            <div className="flex-1 bg-gray-400"></div>
            <div className="flex-1 bg-teal-600"></div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <ScrollAnimatedSection className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <QuickActionsSection />
          </div>
        </ScrollAnimatedSection>

        {/* Organizers Section */}
        <ScrollAnimatedSection className="py-20 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-600 via-gray-400 to-teal-600"></div>
          <OrganizersSection />
        </ScrollAnimatedSection>

        {/* Announcements Section */}
        <ScrollAnimatedSection className="py-20 bg-white relative">
          <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-teal-600/10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-gray-400/10"></div>
          <AnnouncementsSection />
        </ScrollAnimatedSection>

        {/* Program/Sessions Section */}
        <ScrollAnimatedSection className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
          <div className="absolute top-20 right-10 w-24 h-24 border-4 border-gray-400/20 rotate-45"></div>
          <div className="absolute bottom-20 left-10 w-20 h-20 border-4 border-teal-600/20"></div>
          <ProgramSection />
        </ScrollAnimatedSection>
        
        {/* Speakers Section */}
        <ScrollAnimatedSection className="py-20 bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-600 via-gray-400 to-teal-600"></div>
            <div className="absolute top-10 left-1/4 w-16 h-16 border-2 border-teal-600/10 rounded-full"></div>
            <div className="absolute bottom-10 right-1/4 w-24 h-24 border-2 border-gray-400/10 rounded-full"></div>
            <SpeakersSection />
        </ScrollAnimatedSection>

        {/* Sponsors Section */}
        <ScrollAnimatedSection className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
            <div className="absolute top-0 right-0 w-40 h-40 border-t-4 border-r-4 border-teal-600/10"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 border-b-4 border-l-4 border-gray-400/10"></div>
            <SponsorsSection />
        </ScrollAnimatedSection>

        {/* Introduction Section */}
        <ScrollAnimatedSection className="py-20 bg-white relative">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-20 left-10 w-32 h-32 border-4 border-teal-600 rotate-45"></div>
              <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-gray-400"></div>
            </div>
            <IntroductionSection />
        </ScrollAnimatedSection>

        {/* Footer Decorative Border */}
        <div className="relative h-3">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-teal-600"></div>
            <div className="w-16 bg-gray-400"></div>
            <div className="flex-1 bg-teal-600"></div>
            <div className="w-16 bg-gray-400"></div>
            <div className="flex-1 bg-teal-600"></div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
