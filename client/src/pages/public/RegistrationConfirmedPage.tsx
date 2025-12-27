import { Link, useLocation } from "wouter";
import { CheckCircle2, QrCode, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@shared/types";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { usePublicSessions } from "@/hooks/usePublicData";
import { useActiveConference } from "@/hooks/useActiveConference";

export default function RegistrationConfirmedPage() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const sessionId = queryParams.get('sessionId');
  const { conference } = useActiveConference();
  const { data: sessions = [] } = usePublicSessions(conference?.slug);
  const confirmedSession = sessionId ? sessions.find(s => s.id === sessionId) : null;

  return (
    <div className="py-16 md:py-32 bg-slate-50/50 animate-in fade-in duration-700">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <Card className="text-center border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <div className="h-2 w-full bg-teal-600" />
            <CardContent className="p-12 md:p-16">
              <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="h-10 w-10 text-teal-600" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">
                Đăng ký thành công!
              </h1>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed italic">
                Cảm ơn bạn đã quan tâm. Thông tin xác nhận và mã QR tham dự đã được gửi đến địa chỉ email đăng ký của bạn.
              </p>
              {confirmedSession && (
                <div className="mb-10 animate-in zoom-in-95 duration-500 delay-300">
                  <div className="bg-teal-50/50 border-2 border-dashed border-teal-200 rounded-[2rem] p-8 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
                      <QrCode className="h-5 w-5" />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Thông tin phiên họp</span>
                    </div>
                    <h3 className="font-black text-lg text-slate-800 leading-tight">{confirmedSession.title}</h3>
                    <div className="flex flex-col items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-teal-500/50" />
                        {format(parseISO(confirmedSession.startTime), "HH:mm, EEEE, dd/MM", { locale: vi })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-500/50" />
                        {confirmedSession.room}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Link href="/">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-black px-10 h-12 rounded-2xl shadow-xl shadow-teal-100 uppercase text-xs tracking-widest transition-all active:scale-95">
                  Về lại Trang chủ
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}