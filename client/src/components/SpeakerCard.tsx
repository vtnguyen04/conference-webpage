import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Speaker } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { User, Quote } from "lucide-react";

interface SpeakerCardProps {
  speaker: Speaker;
}

export const SpeakerCard = memo(function SpeakerCard({ speaker }: SpeakerCardProps) {
  return (
    <div className="p-2 h-full w-full">
      <Card
        className="group relative overflow-hidden bg-white border-2 border-slate-100 hover:border-teal-500 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] h-full flex flex-col"
        data-testid={`card-speaker-${speaker.id}`}
      >
        <CardContent className="p-8 md:p-10 flex flex-col items-center text-center">
          {/* Framed Avatar Section - Perfectly Widen */}
          <div className="relative mb-8">
            <div className="absolute -inset-4 border-2 border-dashed border-teal-600/20 rounded-full group-hover:rotate-90 transition-transform duration-1000" />
            <div className="relative h-36 w-36 md:h-40 md:w-40 rounded-full p-1.5 bg-white border-2 border-teal-600 shadow-lg overflow-hidden">
              {speaker.photoUrl ? (
                <img
                  src={speaker.photoUrl}
                  alt={speaker.name}
                  className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-200">
                  <User className="w-20 h-20" />
                </div>
              )}
            </div>
            
            {/* Role Badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-max z-10">
              <Badge className="bg-teal-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 shadow-lg">
                {speaker.role === 'moderator' ? 'Chủ tọa' : 
                 speaker.role === 'both' ? 'Chủ tọa & Báo cáo viên' : 'Báo cáo viên'}
              </Badge>
            </div>
          </div>

          {/* Name & Credentials */}
          <div className="space-y-1 mb-6">
            <p className="text-teal-600 font-black text-[11px] uppercase tracking-[0.25em]">{speaker.credentials || 'Báo cáo viên'}</p>
            <h3 className="font-black text-2xl text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">
              {speaker.name}
            </h3>
          </div>

          {/* Title & Info - Widen text area */}
          <div className="space-y-6 w-full px-2">
            <p className="text-[13px] font-extrabold text-slate-700 uppercase tracking-tight leading-relaxed">
              {speaker.title}
            </p>
            
            {speaker.specialty && (
              <p className="text-xs font-bold text-teal-600/60 italic">
                Chuyên ngành: {speaker.specialty}
              </p>
            )}

            {/* Bio Section - High Readability & Wide */}
            <div className="relative px-6 py-6 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-teal-50/30 transition-all text-left shadow-inner">
              <Quote className="absolute -top-2 left-4 h-5 w-5 text-teal-200 opacity-50" />
              <p className="text-[12px] text-slate-700 font-semibold leading-relaxed italic line-clamp-4">
                {speaker.bio || "Thông tin kinh nghiệm chuyên môn đang được cập nhật..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});