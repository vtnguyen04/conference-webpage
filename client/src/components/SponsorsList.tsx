import type { Sponsor } from "@shared/types";
import { cn } from "@/lib/utils";
import { ExternalLink, Award } from "lucide-react";

const tierNames: Record<string, string> = {
  diamond: 'NHÀ TÀI TRỢ KIM CƯƠNG',
  gold: 'NHÀ TÀI TRỢ VÀNG',
  silver: 'NHÀ TÀI TRỢ BẠC',
  bronze: 'NHÀ TÀI TRỢ ĐỒNG',
  supporting: 'ĐƠN VỊ ĐỒNG HÀNH',
  other: 'ĐƠN VỊ HỖ TRỢ',
};

const tierColors: Record<string, string> = {
  diamond: 'border-teal-600 text-teal-600',
  gold: 'border-amber-500 text-amber-600',
  silver: 'border-slate-400 text-slate-500',
  bronze: 'border-orange-500 text-orange-600',
  supporting: 'border-indigo-500 text-indigo-600',
  other: 'border-slate-400 text-slate-400',
};

const tierOrder = ['diamond', 'gold', 'silver', 'bronze', 'supporting', 'other'];

interface SponsorsListProps {
    sponsors: Sponsor[];
}

export const SponsorsList = ({ sponsors }: SponsorsListProps) => {
    const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
        const tier = sponsor.tier || "other";
        if (!acc[tier]) acc[tier] = [];
        acc[tier].push(sponsor);
        return acc;
    }, {} as Record<string, Sponsor[]>);

    Object.keys(sponsorsByTier).forEach((tier) => {
        sponsorsByTier[tier].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    });

    return (
        <div className="space-y-20 max-w-6xl mx-auto py-6">
            {tierOrder.map(tier => {
                const tierSponsors = sponsorsByTier[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;
                
                const colorClass = tierColors[tier] || tierColors.other;
                const borderOnly = colorClass.split(' ')[0];

                return (
                    <div key={tier} className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700" data-testid={`sponsor-tier-${tier}`}>
                        {/* Compact Premium Header */}
                        <div className="mb-12 relative inline-block">
                            <div className={cn("absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl-sm", borderOnly)}></div>
                            <div className={cn("absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr-sm", borderOnly)}></div>
                            <div className={cn("absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl-sm", borderOnly)}></div>
                            <div className={cn("absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 rounded-br-sm", borderOnly)}></div>
                            
                            <div className={cn("px-8 py-2.5 border-y border-slate-100 bg-white shadow-sm flex items-center gap-3", borderOnly)}>
                                <Award className={cn("h-4 w-4", colorClass.split(' ')[1])} />
                                <h3 className={cn("font-extrabold text-sm md:text-base uppercase tracking-[0.2em] text-slate-800")}>
                                    {tierNames[tier]}
                                </h3>
                                <Award className={cn("h-4 w-4", colorClass.split(' ')[1])} />
                            </div>
                        </div>

                        {/* Balanced Logos Grid */}
                        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 px-4">
                            {tierSponsors.map((sponsor) => (
                                <a
                                    key={sponsor.id}
                                    href={sponsor.websiteUrl || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "bg-white border border-slate-100 p-6 md:p-8 flex items-center justify-center transition-all duration-500 relative group rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1.5",
                                        tier === 'diamond' ? 'w-60 h-36 md:w-64 md:h-40' : 
                                        tier === 'gold' ? 'w-52 h-32 md:w-56 md:h-36' : 
                                        tier === 'silver' ? 'w-44 h-28 md:w-48 md:h-32' : 
                                        'w-40 h-24 md:w-44 md:h-28'
                                    )}
                                    data-testid={`sponsor-logo-${sponsor.id}`}
                                >
                                    <div className={cn("absolute inset-0 border-2 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", borderOnly)} />
                                    
                                    {sponsor.logoUrl ? (
                                        <img
                                            src={sponsor.logoUrl}
                                            alt={sponsor.name}
                                            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <span className="font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                                            {sponsor.name}
                                        </span>
                                    )}

                                    <div className="absolute bottom-4 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                        <ExternalLink className="h-3 w-3 text-slate-300" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    )
};
