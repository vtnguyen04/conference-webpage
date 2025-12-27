import { cn } from "@/lib/utils";

const SectionHeader = ({ 
  title, 
  subtitle, 
  accentColor = "bg-teal-600", 
  cta,
  isDark = false
}: { 
  title: string; 
  subtitle:string; 
  accentColor?: string; 
  cta?: React.ReactNode;
  isDark?: boolean;
}) => {
  const isSplitTitle = title.includes("||");
  const titleParts = isSplitTitle ? title.split("||").map(part => part.trim()) : [title];
  
  const titleColor = isDark ? "text-white" : "text-slate-900";
  const subtitleColor = isDark ? "text-slate-300" : "text-slate-600";

  return (
    <div className="text-center mb-16 relative">
      <div className="relative inline-block">
        <div className={`absolute -left-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
        <div className={`absolute -right-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
        {isSplitTitle ? (
          <div className={cn("flex items-center justify-center text-3xl md:text-4xl font-bold tracking-tight uppercase px-6", titleColor)}>
            <span>{titleParts[0]}</span>
            <span className="mx-4 opacity-50">||</span>
            <span>{titleParts[1]}</span>
          </div>
        ) : (
          <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight uppercase px-6", titleColor)}>
            {title}
          </h2>
        )}
      </div>
      <p className={cn("text-base mt-4 font-medium", subtitleColor)}>{subtitle}</p>
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className={`w-2 h-2 ${accentColor} rounded-full`}></div>
        <div className={`w-12 h-0.5 ${accentColor}`}></div>
        <div className={`w-2 h-2 ${accentColor} rounded-full`}></div>
      </div>
      {cta && <div className="mt-8">{cta}</div>}
    </div>
  );
};
export default SectionHeader;