import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, MapPin, Award, Trash2, Search } from "lucide-react";
import type { Registration, Session, Conference } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function RegistrationsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const { data: registrations = [] } = useQuery<Registration[]>({
    queryKey: ["registrations", debouncedSearchQuery],
    queryFn: async (): Promise<Registration[]> => {
      let url = "/api/registrations";
      if (debouncedSearchQuery) {
        url = `/api/admin/registrations/search?query=${debouncedSearchQuery}`;
      }
      const response = await apiRequest("GET", url);
      return response as Registration[];
    },
    enabled: !!debouncedSearchQuery || searchQuery === '', // Only run query if debounced value exists or no search is active
  });

  const { data: conference } = useQuery<Conference | null>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.year],
    enabled: !!conference,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/registrations/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Xóa đăng ký thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
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

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa đăng ký này?")) {
      deleteMutation.mutate(id);
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo email hoặc tên..."
              className="pl-10 pr-4 py-2 rounded-md border-gray-300 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-registrations"
            />
          </div>
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
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={registration.status === "confirmed" ? "default" : "secondary"}>
                          {registration.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(registration.id)}
                          data-testid={`button-delete-registration-${registration.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
