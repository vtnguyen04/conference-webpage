import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QrCode, CheckCircle, X, Calendar, MapPin } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import type { Conference, Session, CheckIn, Registration } from "@shared/schema";

interface CheckInWithDetails extends CheckIn {
  registration?: Registration;
}

export default function CheckinPage() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const { data: conference } = useQuery<Conference | null>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.year],
    enabled: !!conference,
  });

  const { data: recentCheckIns = [] } = useQuery<CheckInWithDetails[]>({
    queryKey: ["/api/check-ins/session", selectedSessionId],
    enabled: !!selectedSessionId,
  });

  const checkInMutation = useMutation({
    mutationFn: async (qrData: string) => {
      if (!selectedSessionId) {
        throw new Error("Vui lòng chọn phiên trước");
      }
      return await apiRequest("POST", "/api/check-ins", { 
        qrData, 
        sessionId: selectedSessionId 
      });
    },
    onSuccess: () => {
      toast({ title: "Check-in thành công!" });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/session", selectedSessionId] });
      stopScanning();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi check-in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startScanning = async () => {
    try {
      setScanning(true);
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          checkInMutation.mutate(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors - they happen frequently
        }
      );
    } catch (error) {
      console.error("Failed to start scanner:", error);
      toast({
        title: "Không thể khởi động camera",
        description: "Vui lòng cho phép truy cập camera",
        variant: "destructive",
      });
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-checkin-title">
          Check-in phiên
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chọn phiên check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-full" data-testid="select-session">
              <SelectValue placeholder="Chọn phiên để check-in..." />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id} data-testid={`select-item-${session.id}`}>
                  {session.title} - {new Date(session.startTime).toLocaleDateString('vi-VN')} ({session.room})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSession && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2" data-testid="selected-session-details">
              <h3 className="font-semibold" data-testid="text-session-title">{selectedSession.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1" data-testid="text-session-time">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedSession.startTime).toLocaleString('vi-VN')}
                </span>
                <span className="flex items-center gap-1" data-testid="text-session-room">
                  <MapPin className="h-4 w-4" />
                  {selectedSession.room}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSessionId && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quét mã QR</span>
                {scanning && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopScanning}
                    data-testid="button-stop-scanning"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Dừng
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden bg-muted">
                {scanning ? (
                  <div id="qr-reader" className="w-full"></div>
                ) : (
                  <div className="aspect-square flex items-center justify-center">
                    <Button
                      size="lg"
                      onClick={startScanning}
                      data-testid="button-start-scanning"
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      Bắt đầu quét
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Check-in phiên này</span>
                <Badge variant="secondary" data-testid="badge-checkin-count">{recentCheckIns.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border" data-testid={`checkin-item-${checkIn.id}`}>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">{checkIn.registration?.fullName || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {checkIn.registration?.email || ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {checkIn.checkedInAt ? new Date(checkIn.checkedInAt).toLocaleString('vi-VN') : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có check-in nào cho phiên này.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
