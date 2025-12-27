import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QrCode, CheckCircle, X, Calendar, MapPin, Camera, Clock, User, UserCheck, History, Mail } from "lucide-react";
import type { Conference, Session, CheckIn, Registration } from "@shared/types";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";

interface CheckInWithDetails extends CheckIn {
  registration?: Registration;
}

export default function CheckinPage() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const scannerRef = useRef<any | null>(null);

  const { data: conference } = useQuery<Conference | null>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.slug],
    enabled: !!conference?.slug,
    select: (data) => {
      const now = new Date();
      return data.filter(session => {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        // Ưu tiên các phiên đang diễn ra trong phạm vi thời gian hiện tại
        return startTime <= now && endTime >= now;
      });
    }
  });

  const { data: checkInsData } = useQuery<{ data: CheckInWithDetails[], total: number }>({
    queryKey: ["/api/check-ins/session", selectedSessionId, page, limit],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/check-ins/session/${selectedSessionId}?page=${page}&limit=${limit}`);
      return response as { data: CheckInWithDetails[], total: number };
    },
    enabled: !!selectedSessionId,
  });

  const recentCheckIns = checkInsData?.data || [];
  const totalCheckIns = checkInsData?.total || 0;
  const totalPages = Math.ceil(totalCheckIns / limit);

  useEffect(() => {
    if (selectedSessionId && !sessions.some(s => s.id === selectedSessionId)) {
      setSelectedSessionId("");
      setPage(1);
    }
  }, [sessions, selectedSessionId]);

  const checkInMutation = useMutation({
    mutationFn: async (qrData: string) => {
      if (!selectedSessionId) {
        throw new Error("Vui lòng chọn phiên trước");
      }
      try {
        const response = await apiRequest("POST", "/api/check-ins", { 
          qrData, 
          sessionId: selectedSessionId 
        });
        return response;
      } catch (error: any) {
        if (error.message.includes("Already checked in for this session")) {
          return { status: 400, message: "Already checked in for this session" };
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data && data.status === 400 && data.message === "Already checked in for this session") {
        toast({ 
          title: "Đã check-in", 
          description: "Người tham dự đã có dữ liệu check-in trong phiên này.",
          variant: "default" 
        });
      } else {
        toast({ title: "Thành công!", description: "Đã xác nhận sự diện của đại biểu." });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/session", selectedSessionId, page, limit] });
      stopScanning();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi quét mã",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
          checkInMutation.mutate(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error("Failed to start scanner:", error);
      toast({
        title: "Lỗi camera",
        description: "Vui lòng cho phép trình duyệt truy cập máy ảnh để quét mã QR.",
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
        description="Sử dụng camera để quét mã QR trên thư mời và xác nhận sự diện của đại biểu tại từng phiên họp."
      />

      <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 text-white rounded-md shadow-sm">
              <UserCheck className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight">Cấu hình Phiên Check-in</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-xl space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chọn phiên họp đang diễn ra</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-bold focus:bg-white transition-all">
                  <SelectValue placeholder="Bấm để xem danh sách phiên đang diễn ra..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id} className="py-3 font-medium">
                        <div className="flex flex-col">
                          <span>{session.title}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter italic">
                            Hội trường: {session.room} • {new Date(session.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-xs text-slate-400 font-medium">Không có phiên nào đang diễn ra trong khung giờ hiện tại.</p>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

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
                        {new Date(selectedSession.startTime).toLocaleTimeString('vi-VN')} - {new Date(selectedSession.endTime).toLocaleTimeString('vi-VN')}
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
          {/* Scanner Section */}
          <Card className="lg:col-span-5 border-slate-200/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-slate-800">Cửa sổ quét mã</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Camera Scanner</CardDescription>
              </div>
              {scanning && (
                <Button variant="ghost" size="sm" onClick={stopScanning} className="h-8 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase">
                  <X className="h-3.5 w-3.5 mr-1.5" /> Dừng quét
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden transition-all duration-500">
                {scanning ? (
                  <div id="qr-reader" className="w-full h-full object-cover"></div>
                ) : (
                  <div className="flex flex-col items-center gap-6 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center ring-1 ring-white/10">
                      <Camera className="h-10 w-10 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Sẵn sàng vận hành</h4>
                      <p className="text-slate-500 text-xs mt-1 font-medium px-8 leading-relaxed">
                        Hãy đảm bảo môi trường có đủ ánh sáng và ống kính camera sạch sẽ.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={startScanning}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 rounded-full shadow-xl shadow-indigo-900/20"
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      Kích hoạt Camera
                    </Button>
                  </div>
                )}
                {/* Decorative border corners for scanning effect */}
                {scanning && (
                  <>
                    <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl z-10" />
                    <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl z-10" />
                    <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl z-10" />
                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-xl z-10" />
                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent History Section */}
          <Card className="lg:col-span-7 border-slate-200/60 shadow-sm overflow-hidden bg-white flex flex-col">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-slate-800">Lịch sử nhận diện</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Live Check-in Feed</CardDescription>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-extrabold px-3 py-1 text-[10px] uppercase tracking-widest shadow-sm">
                <History className="h-2.5 w-2.5 mr-1.5" />
                Tổng: {totalCheckIns}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <div className="flex-1">
                {recentCheckIns.length > 0 ? (
                  <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {recentCheckIns.map((checkIn) => (
                      <div key={checkIn.id} className="group flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-all">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {checkIn.registration?.fullName || "Khách vô danh"}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              <Mail className="h-2.5 w-2.5 mr-1 text-slate-300" />
                              {checkIn.registration?.email || "N/A"}
                            </span>
                            <span className="flex items-center text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              {checkIn.checkedInAt ? new Date(checkIn.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity border-slate-200 text-slate-400 text-[9px] font-bold uppercase tracking-tighter h-6">
                          ID: {checkIn.id.slice(0, 8)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center">
                      <History className="h-6 w-6 text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Chưa có dữ liệu check-in</p>
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
                        <PaginationItem key={`page-${i + 1}`}>
                          <PaginationLink 
                            onClick={() => setPage(i + 1)} 
                            isActive={page === i + 1}
                            className={cn("cursor-pointer font-bold text-xs h-8 w-8", page === i + 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400")}
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