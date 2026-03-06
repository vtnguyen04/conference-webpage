import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useActiveConference } from "@/hooks/useActiveConference";
import { ClipboardCheck, Loader2 } from "lucide-react";

export default function SurveyPage() {
  const { conference, isLoading } = useActiveConference();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const surveyUrl = conference?.surveyUrl;

  // Optimize Google Form URL for embedding
  const embedUrl = surveyUrl?.includes("docs.google.com/forms") && !surveyUrl.includes("embedded=true")
    ? `${surveyUrl}${surveyUrl.includes("?") ? "&" : "?"}embedded=true`
    : surveyUrl;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <PageHeader
        title="Khảo sát ý kiến"
        subtitle="Ý kiến của bạn giúp chúng tôi cải thiện chất lượng hội nghị trong tương lai."
      />

      <div className="w-full max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          {embedUrl ? (
            <div className="relative w-full h-[80vh] min-h-[700px]">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                className="w-full h-full"
                title="Khảo sát hội nghị"
                allow="autoplay"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              >
                Đang tải...
              </iframe>
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center px-10">
              <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                <ClipboardCheck className="h-10 w-10 text-teal-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">Hiện chưa có khảo sát</h3>
              <p className="text-slate-500 max-w-md mx-auto font-medium">
                Ban tổ chức hiện chưa mở đợt khảo sát ý kiến cho hội nghị này. Vui lòng quay lại sau.
              </p>
              <Button
                className="mt-8 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 rounded-full"
                onClick={() => window.history.back()}
              >
                Quay lại
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
