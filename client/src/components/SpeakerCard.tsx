import { Card, CardContent } from "@/components/ui/card";
import type { Speaker } from "@shared/schema";

interface SpeakerCardProps {
  speaker: Speaker;
}

export function SpeakerCard({ speaker }: SpeakerCardProps) {
  return (
    <div className="p-1 h-full">
      <Card
        className="overflow-hidden transition-all duration-300 border-2 border-slate-200 hover:border-blue-600 hover:shadow-xl h-full flex flex-col group relative"
        data-testid={`card-speaker-${speaker.id}`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-amber-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardContent className="p-8 flex flex-col items-center text-center flex-1">
          {speaker.photoUrl ? (
            <div className="relative mb-6">
              <div className="absolute -inset-2 border-2 border-blue-600/20 group-hover:border-blue-600 transition-colors duration-300"></div>
              <img
                src={speaker.photoUrl}
                alt={speaker.name}
                className="w-32 h-32 object-cover relative z-10"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ) : (
            <div className="relative mb-6">
              <div className="absolute -inset-2 border-2 border-blue-600/20 group-hover:border-blue-600 transition-colors duration-300"></div>
              <div className="w-32 h-32 bg-slate-200 flex items-center justify-center text-slate-600 text-3xl font-bold relative z-10">
                {speaker.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )}

          <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-blue-600 transition-colors">
            {speaker.credentials && `${speaker.credentials}. `}{speaker.name}
          </h3>

          {speaker.title && (
            <p className="text-sm font-semibold text-slate-700 mb-3">{speaker.title}</p>
          )}

          {speaker.specialty && (
            <p className="text-sm text-slate-600 mb-4">{speaker.specialty}</p>
          )}

          <div className="mt-auto pt-4 w-full">
            <div className="h-0.5 w-12 bg-blue-600 mx-auto mb-3"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {speaker.role === 'moderator' ? 'Chủ tọa' :
                speaker.role === 'both' ? 'Chủ tọa & Báo cáo viên' : 'Báo cáo viên'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
