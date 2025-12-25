import { Card, CardContent } from "@/components/ui/card";
import type { Organizer } from "@shared/types";
export const OrganizerCard = ({ organizer }: { organizer: Organizer }) => (
    <Card className="overflow-hidden transition-all duration-300 border-2 border-slate-200 hover:border-blue-600 hover:shadow-xl h-full flex flex-col group relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="p-6 flex flex-col items-center text-center flex-1">
        {organizer.photoUrl ? (
          <div className="relative mb-6">
            <div className="absolute -inset-2 border-2 border-primary/20 group-hover:border-primary transition-colors duration-300"></div>
            <img
              src={organizer.photoUrl}
              alt={organizer.name}
              className="w-32 h-32 object-cover object-top relative z-10"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ) : (
          <div className="relative mb-6">
            <div className="absolute -inset-2 border-2 border-primary/20 group-hover:border-primary transition-colors duration-300"></div>
            <div className="w-32 h-32 bg-muted flex items-center justify-center text-muted-foreground text-3xl font-bold relative z-10">
              {organizer.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
        <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-primary transition-colors">
          {organizer.credentials && `${organizer.credentials}. `}{organizer.name}
        </h3>
        {organizer.title && (
          <p className="text-sm font-semibold text-slate-700 mb-3">
            {organizer.title}
          </p>
        )}
        <div className="mt-auto pt-4 w-full text-center">
          <div className="h-0.5 w-12 bg-primary mx-auto mb-3"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {organizer.organizingRole}
          </span>
        </div>
      </CardContent>
    </Card>
  );