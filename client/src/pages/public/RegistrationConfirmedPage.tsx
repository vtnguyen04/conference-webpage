import { useLocation } from "wouter";
import { CheckCircle2, QrCode, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@shared/types";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
export default function RegistrationConfirmedPage() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const sessionId = queryParams.get('sessionId');
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });
  const confirmedSession = sessionId ? sessions.find(s => s.id === sessionId) : null;
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">
                Đăng ký phiên họp thành công!
              </h1>
              <p className="text-muted-foreground mb-8">
                Phiên họp của bạn đã được xác nhận. Mã QR tham dự đã được gửi đến email của bạn.
              </p>
              {confirmedSession && (
                <div className="mb-8">
                  <Card className="bg-muted/50 border-dashed border-2">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Phiên đã xác nhận
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <h3 className="font-semibold text-lg">{confirmedSession.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(parseISO(confirmedSession.startTime), "HH:mm, EEEE, dd/MM/yyyy", { locale: vi })}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {confirmedSession.room}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              <Button onClick={() => window.location.href = '/'}>
                Quay lại trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}