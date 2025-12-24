// Section Header Component
const SectionHeader = ({ title, subtitle, accentColor = "bg-teal-600", cta }: { title: string; subtitle:string; accentColor?: string; cta?: React.ReactNode }) => {
  const isSplitTitle = title.includes("||");
  const titleParts = isSplitTitle ? title.split("||").map(part => part.trim()) : [title];
  return (
    <div className="text-center mb-16 relative">
      <div className="relative inline-block">
        <div className={`absolute -left-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
        <div className={`absolute -right-20 top-1/2 w-16 h-0.5 ${accentColor}`}></div>
        {isSplitTitle ? (
          <div className="flex items-center justify-center text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase px-6">
            <span>{titleParts[0]}</span>
            <span className="mx-4">||</span>
            <span>{titleParts[1]}</span>
          </div>
        ) : (
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase px-6">
            {title}
          </h2>
        )}
      </div>
      <p className="text-slate-600 text-base mt-4 font-medium">{subtitle}</p>
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