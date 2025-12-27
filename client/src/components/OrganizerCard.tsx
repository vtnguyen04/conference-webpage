import { Card, CardContent } from "@/components/ui/card";
import type { Organizer } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { User, ShieldCheck } from "lucide-react";

export const OrganizerCard = ({ organizer }: { organizer: Organizer }) => (
    <div className="p-2 h-full w-full">
      <Card 
        className="group relative overflow-hidden bg-white border-2 border-slate-100 hover:border-slate-900 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] h-full flex flex-col"
      >
        <CardContent className="p-6 flex flex-col items-center text-center">
          {/* Framed Avatar Section - Compact */}
          <div className="relative mb-6">
            <div className="absolute -inset-3 border-2 border-dashed border-slate-200 rounded-full group-hover:rotate-90 transition-transform duration-1000" />
            <div className="relative h-28 w-28 rounded-full p-1 bg-white border-2 border-slate-900 shadow-lg overflow-hidden">
              {organizer.photoUrl ? (
                <img
                  src={organizer.photoUrl}
                  alt={organizer.name}
                  className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            
            {/* Overlay Role Badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-max z-10">
              <Badge className="bg-slate-900 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 shadow-xl">
                {organizer.organizingRole}
              </Badge>
            </div>
          </div>

          {/* Name & Header */}
          <div className="space-y-1 mb-4 w-full">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ShieldCheck className="h-3 w-3 text-teal-600" />
              <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Ban Tổ chức</span>
            </div>
            <h3 className="font-black text-xl text-slate-900 leading-tight">
              {organizer.credentials && <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5 tracking-wider">{organizer.credentials}</span>}
              {organizer.name}
            </h3>
          </div>

          {/* Title - Full Display */}
          <div className="w-full">
            <p className="text-[12px] font-extrabold text-slate-600 leading-relaxed uppercase tracking-tight">
              {organizer.title}
            </p>
            <div className="h-0.5 w-8 bg-slate-100 rounded-full mx-auto mt-4 group-hover:w-16 group-hover:bg-slate-900 transition-all duration-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );