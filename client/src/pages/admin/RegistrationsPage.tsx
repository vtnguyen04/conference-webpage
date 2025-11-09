import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, MapPin, Award, Trash2, Search, UserCheck } from "lucide-react";
import type { Registration, Session, Conference } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// New component for a single registration row
const RegistrationRow = ({
  registration,
  session,
  onDelete,
  onCheckIn,
  isCheckInLoading,
}: {
  registration: Registration;
  session?: Session;
  onDelete: (id: string) => void;
  onCheckIn: (registrationId: string) => void;
  isCheckInLoading: boolean;
}) => {
  return (
    <TableRow data-testid={`registration-row-${registration.id}`}>
      <TableCell>
        <div className="font-semibold">{registration.fullName}</div>
        <div className="text-sm text-muted-foreground">{registration.email}</div>
      </TableCell>
      <TableCell>
        <div>{session?.title || "N/A"}</div>
        {session && (
          <div className="text-xs text-muted-foreground">
            {new Date(session.startTime).toLocaleString("vi-VN")}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={registration.status === "confirmed" ? "default" : "secondary"}>
          {registration.status}
        </Badge>
      </TableCell>
      <TableCell>
        {registration.cmeCertificateRequested && (
          <Badge variant="secondary" className="gap-1">
            <Award className="h-3 w-3" />
            CME
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCheckIn(registration.id)}
          disabled={isCheckInLoading || registration.status === 'checked-in'}
          data-testid={`button-checkin-registration-${registration.id}`}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Check-in
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(registration.id)}
          data-testid={`button-delete-registration-${registration.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default function RegistrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const { data, isLoading } = useQuery<{ data: Registration[], total: number }>({
    queryKey: ["registrations", debouncedSearchQuery, page, limit],
    queryFn: async () => {
      const url = debouncedSearchQuery
        ? `/api/admin/registrations/search?query=${debouncedSearchQuery}&page=${page}&limit=${limit}`
        : `/api/registrations?page=${page}&limit=${limit}`;
      return apiRequest("GET", url);
    },
  });

  const registrations = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const { data: conference } = useQuery<Conference | null>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.year],
    enabled: !!conference,
  });

  const sessionsMap = useMemo(() => 
    new Map(sessions.map(s => [s.id, s])),
  [sessions]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/registrations/${id}`),
    onSuccess: () => {
      toast({ title: "Xóa đăng ký thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations", debouncedSearchQuery, page, limit] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (registrationId: string) => apiRequest("POST", `/api/check-ins/manual`, { registrationId }),
    onSuccess: () => {
      toast({ title: "Check-in thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations", debouncedSearchQuery, page, limit] });
    },
    onError: (error: any) => {
      console.error("Check-in error:", error);
      let errorMessage = "Đã có lỗi xảy ra trong quá trình check-in.";
      try {
        const errorData = JSON.parse(error.message.substring(error.message.indexOf('{')));
        if (errorData.message === "Registration not confirmed") {
          errorMessage = "Đăng ký chưa được xác nhận.";
        } else if (errorData.message === "Already checked in for this session") {
          errorMessage = "Đăng ký này đã được check-in.";
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        // Fallback to generic message
      }
      toast({ title: "Lỗi check-in", description: errorMessage, variant: "destructive" });
    },
  });

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/registrations/export", { credentials: "include" });
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
      toast({ title: "Lỗi xuất file", description: "Không thể xuất file CSV.", variant: "destructive" });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa đăng ký này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCheckIn = (registrationId: string) => {
    checkInMutation.mutate(registrationId);
  };

  const uniqueAttendees = useMemo(() => new Set(registrations.map(r => r.email)).size, [registrations]);

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
            <p className="text-3xl font-bold" data-testid="stat-total-registrations">{total}</p>
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
          <CardTitle>Danh sách đăng ký ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Phiên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Yêu cầu</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : registrations.length > 0 ? (
                registrations.map((registration) => (
                  <RegistrationRow
                    key={registration.id}
                    registration={registration}
                    session={sessionsMap.get(registration.sessionId)}
                    onDelete={handleDelete}
                    onCheckIn={handleCheckIn}
                    isCheckInLoading={checkInMutation.isLoading}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Chưa có đăng ký nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
