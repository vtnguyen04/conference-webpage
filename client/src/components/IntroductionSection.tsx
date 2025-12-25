import SectionHeader from "@/components/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveConference } from "@/hooks/useActiveConference";
const IntroductionSection = () => {
    const { conference } = useActiveConference();
    if (!conference?.introContent) {
        return null;
    }
    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
                <SectionHeader
                    title="Giới thiệu"
                    subtitle="Thông tin chi tiết về hội nghị"
                    accentColor="bg-teal-600"
                />
                <Card className="border-2 border-slate-200 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-600 via-gray-400 to-teal-600"></div>
                    <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-10">
                        <div
                            className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: conference.introContent }}
                            data-testid="text-intro-content"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
export default IntroductionSection;