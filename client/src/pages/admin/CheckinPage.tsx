import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CheckCircle, X, Calendar, MapPin, Camera, Clock, User, UserCheck, History, Mail } from "lucide-react";
import type { Conference, Session } from "@shared/types";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useAdminView } from "@/hooks/useAdminView";

export default function CheckinPage() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const scannerRef = useRef<any | null>(null);
  const { viewingSlug } = useAdminView();

  const { data: conference } = useQuery<Conference | null>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", viewingSlug],
    enabled: !!viewingSlug,
    select: (data) => {
      const now = new Date();
      return data.filter(session => {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        return startTime <= now && endTime >= now;
      });
    }
  });

  const { 
    checkIns, 
    totalCheckIns, 
    isLoading, 
    submitCheckIn, 
    isCheckingIn 
  } = useCheckIn(selectedSessionId, page, limit);

  const totalPages = Math.ceil(totalCheckIns / limit);

  useEffect(() => {
    if (selectedSessionId && !sessions.some(s => s.id === selectedSessionId)) {
      setSelectedSessionId("");
      setPage(1);
    }
  }, [sessions, selectedSessionId]);

  const startScanning = async () => {
    try {
      setScanning(true);
      await new Promise(resolve => setTimeout(resolve, 0));
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          submitCheckIn(decodedText);
          stopScanning();
        },
        () => {}
      );
    } catch (error) {
      toast({
        title: "Lỗi camera",
        description: "Vui lòng cho phép truy cập camera.",
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Hệ thống Check-in QR"
        description="Sử dụng camera để xác nhận sự hiện diện của đại biểu tại từng phiên họp."
      />

      <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 text-white rounded-md shadow-sm">
              <UserCheck className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight">Cấu hình Phiên</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-xl space-y-4">
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-bold focus:bg-white transition-all">
                <SelectValue placeholder="Chọn phiên đang diễn ra..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id} className="py-3 font-medium">
                    {session.title} ({session.room})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSession && (
              <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in zoom-in-95">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-extrabold text-indigo-900 leading-tight truncate">{selectedSession.title}</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center text-[11px] font-bold text-indigo-600/70 uppercase tracking-tight">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        {new Date(selectedSession.startTime).toLocaleTimeString('vi-VN')}
                      </span>
                      <span className="flex items-center text-[11px] font-bold text-indigo-600/70 uppercase tracking-tight">
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        {selectedSession.room}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSessionId && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-5 border-slate-200/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-bold text-slate-800">Cửa sổ quét mã</CardTitle>
              {scanning && (
                <Button variant="ghost" size="sm" onClick={stopScanning} className="h-8 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase">
                  <X className="h-3.5 w-3.5 mr-1.5" /> Dừng quét
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                {scanning ? (
                  <div id="qr-reader" className="w-full h-full object-cover"></div>
                ) : (
                  <div className="flex flex-col items-center gap-6 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center ring-1 ring-white/10">
                      <Camera className="h-10 w-10 text-slate-500" />
                    </div>
                    <Button
                      size="lg"
                      onClick={startScanning}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 rounded-full shadow-xl"
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      Kích hoạt Camera
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7 border-slate-200/60 shadow-sm overflow-hidden bg-white flex flex-col">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-bold text-slate-800">Lịch sử check-in</CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-extrabold px-3 py-1 text-[10px] uppercase shadow-sm">
                Tổng: {totalCheckIns}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <div className="flex-1">
                {checkIns.length > 0 ? (
                  <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {checkIns.map((checkIn) => (
                      <div key={checkIn.id} className="group flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-all">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {checkIn.registration?.fullName || "N/A"}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              <Mail className="h-2.5 w-2.5 mr-1 text-slate-300" />
                              {checkIn.registration?.email}
                            </span>
                            <span className="flex items-center text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              {checkIn.checkedInAt ? new Date(checkIn.checkedInAt).toLocaleTimeString('vi-VN') : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <History className="h-8 w-8 text-slate-200" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Chưa có dữ liệu</p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                          className={cn("cursor-pointer font-bold text-[10px] uppercase", page === 1 && "opacity-50 pointer-events-none")}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            onClick={() => setPage(i + 1)} 
                            isActive={page === i + 1}
                            className="cursor-pointer font-bold text-xs h-8 w-8"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
                          className={cn("cursor-pointer font-bold text-[10px] uppercase", page === totalPages && "opacity-50 pointer-events-none")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
