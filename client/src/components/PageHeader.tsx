import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  bannerImageUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, bannerImageUrl, className, children }: PageHeaderProps) {
  return (
    <section className={cn(
      "relative py-24 md:py-32 lg:py-40 flex items-center justify-center overflow-hidden text-white bg-slate-950",
      className
    )}>
      {/* Background Image with Zoom Effect */}
      {bannerImageUrl ? (
        <img
          src={bannerImageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 animate-slow-zoom"
        />
      ) : (
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
      )}

      {/* Professional Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#042f2e]/80 via-[#042f2e]/60 to-[#042f2e]" />
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 text-center space-y-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-1000">
          
          {/* Main Title Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight uppercase drop-shadow-2xl">
              {title}
            </h1>
            <div className="h-1.5 w-24 bg-teal-500 mx-auto rounded-full shadow-lg shadow-teal-900/40" />
          </div>

          {/* Subtitle with High Readability */}
          {subtitle && (
            <p className="text-lg md:text-xl text-teal-50/90 max-w-2xl mx-auto font-medium leading-relaxed italic">
              "{subtitle}"
            </p>
          )}
        </div>

        {/* Breadcrumbs Container Area */}
        <div className="pt-4 opacity-90 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
          {children}
        </div>
      </div>

      {/* Bottom Curve Divider (Optional aesthetic touch) */}
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-50/50 to-transparent opacity-20" />
    </section>
  );
}