import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  bannerImageUrl?: string;
  className?: string;
  children?: React.ReactNode; // For breadcrumbs or other elements
}

export function PageHeader({ title, subtitle, bannerImageUrl, className, children }: PageHeaderProps) {
  return (
    <section className={cn(
      "relative py-20 md:py-28 lg:py-36 flex items-center justify-center overflow-hidden text-white",
      bannerImageUrl ? "" : "bg-gradient-to-r from-blue-700 to-blue-900",
      className
    )}>
      {bannerImageUrl && (
        <img
          src={bannerImageUrl}
          alt="Page Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
        />
      )}
      <div className="absolute inset-0 bg-black/50"></div> {/* Dark overlay */}

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4 uppercase">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
        {children} {/* For breadcrumbs */}
      </div>
    </section>
  );
}
