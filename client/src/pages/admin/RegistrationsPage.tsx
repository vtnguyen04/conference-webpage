import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, MapPin, Award } from "lucide-react";
import type { Registration, Session, Conference } from "@shared/schema";

export default function RegistrationsPage() {
  const { data: registrations = [] } = useQuery<Registration[]>({
    queryKey: ["/api/registrations"],
  });

  const { data: conference } = useQuery<Conference | null>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.year],
    enabled: !!conference,
  });

  const getSessionById = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId);
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/registrations/export", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const uniqueAttendees = new Set(registrations.map(r => r.email)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-registrations-title">
          Quản lý đăng ký
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv">
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng đăng ký phiên</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-total-registrations">{registrations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Người tham dự</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-unique-attendees">{uniqueAttendees}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đăng ký theo phiên ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length > 0 ? (
            <div className="space-y-2">
              {registrations.map((registration) => {
                const session = getSessionById(registration.sessionId);
                return (
                  <div key={registration.id} className="border p-4 rounded-lg space-y-2" data-testid={`registration-item-${registration.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{registration.fullName}</h3>
                          {registration.cmeCertificateRequested && (
                            <Badge variant="secondary" className="gap-1">
                              <Award className="h-3 w-3" />
                              CME
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{registration.email}</p>
                        {registration.organization && (
                          <p className="text-sm text-muted-foreground">{registration.organization}</p>
                        )}
                      </div>
                      <Badge variant={registration.status === "confirmed" ? "default" : "secondary"}>
                        {registration.status}
                      </Badge>
                    </div>
                    
                    {session && (
                      <div className="bg-muted/50 p-3 rounded-md space-y-1" data-testid={`session-info-${registration.sessionId}`}>
                        <p className="font-medium text-sm" data-testid="text-session-title">{session.title}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1" data-testid="text-session-date">
                            <Calendar className="h-3 w-3" />
                            {new Date(session.startTime).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="flex items-center gap-1" data-testid="text-session-room">
                            <MapPin className="h-3 w-3" />
                            {session.room}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Chưa có đăng ký nào.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
