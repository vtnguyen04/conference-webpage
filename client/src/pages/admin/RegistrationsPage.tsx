import { AddRegistrationDialog } from "@/components/AddRegistrationDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Conference, Registration, Session, Speaker } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Download, PlusCircle, Search, Trash2, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const isSessionActive = (session?: Session): boolean => {
  if (!session) return false;
  const now = new Date();
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  return startTime <= now && now <= endTime;
};

export default function RegistrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [roleFilter, setRoleFilter] = useState("all");
  const [bulkCheckinSessionId, setBulkCheckinSessionId] = useState<string>("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
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
    queryKey: ["/api/sessions", conference?.slug],
    enabled: !!conference,
  });

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers", conference?.slug],
    enabled: !!conference,
  });

  const activeSessions = useMemo(() => {
    return sessions.filter(session => isSessionActive(session));
  }, [sessions]);

  const speakerRoles = useMemo(() => {
    const map = new Map<string, 'speaker' | 'moderator' | 'both'>();
    speakers.forEach(speaker => {
      if (speaker.email) {
        map.set(speaker.email, speaker.role);
      }
    });
    return map;
  }, [speakers]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      if (roleFilter === 'all') return true;

      // Sử dụng trực tiếp trường 'role' từ đối tượng đăng ký
      const registrationRole = reg.role;

      if (roleFilter === 'attendee') {
        // 'Tham dự' tương ứng với vai trò 'participant'
        return registrationRole === 'participant';
      }
      if (roleFilter === 'speaker') {
        return registrationRole === 'speaker' || registrationRole === 'both';
      }
      if (roleFilter === 'moderator') {
        return registrationRole === 'moderator' || registrationRole === 'both';
      }
      return true;
    });
  }, [registrations, roleFilter]);

  const sessionsMap = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/registrations/${id}`),
    onSuccess: () => {
      toast({ title: "Xóa đăng ký thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
    onError: (error: any) => toast({ title: "Lỗi", description: error.message, variant: "destructive" }),
  });

  const checkInMutation = useMutation({
    mutationFn: (registrationId: string) => apiRequest("POST", `/api/check-ins/manual`, { registrationId }),
    onSuccess: () => {
      toast({ title: "Check-in thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
    onError: (error: any) => toast({ title: "Lỗi check-in", description: error.message, variant: "destructive" }),
  });

  const bulkCheckinMutation = useMutation({
    mutationFn: (data: { registrationIds: string[]; sessionId: string }) => apiRequest("POST", "/api/admin/bulk-checkin-registrations", data),
    onSuccess: (result: { successCount: number; failCount: number }) => {
      toast({
        title: "Check-in hàng loạt hoàn tất",
        description: `${result.successCount} thành công, ${result.failCount} thất bại.`,
      });
      setSelectedRows({});
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
    onError: (error: any) => toast({ title: "Lỗi check-in hàng loạt", description: error.message, variant: "destructive" }),
  });

  const handleExportCSV = async () => {
    // ... (implementation unchanged)
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa đăng ký này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCheckIn = (registrationId: string) => {
    checkInMutation.mutate(registrationId);
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    const newSelectedRows: Record<string, boolean> = {};
    if (checked === true) {
      filteredRegistrations.forEach(r => {
        newSelectedRows[r.id] = true;
      });
    }
    setSelectedRows(newSelectedRows);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows(prev => ({ ...prev, [id]: checked }));
  };

  const numSelected = Object.values(selectedRows).filter(Boolean).length;
  const selectedRegistrationIds = Object.keys(selectedRows).filter(id => selectedRows[id]);

  const handleBulkCheckin = () => {
    if (numSelected === 0 || !bulkCheckinSessionId) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng chọn người dùng và phiên để check-in.", variant: "destructive" });
      return;
    }
    setIsAlertOpen(true);
  };

  const handleBulkCheckinConfirm = () => {
    if (!bulkCheckinSessionId) return;
    bulkCheckinMutation.mutate({
      registrationIds: selectedRegistrationIds,
      sessionId: bulkCheckinSessionId,
    });
  };

  const getRoleForRegistration = (registration: Registration) => {
    if (registration.role === 'moderator') return <Badge variant="outline">Chủ tọa</Badge>;
    if (registration.role === 'speaker') return <Badge variant="outline">Báo cáo viên</Badge>;
    if (registration.role === 'both') return <Badge variant="outline">Cả hai</Badge>;
    return <Badge variant="secondary">Tham dự</Badge>; // Default to participant
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý đăng ký</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      <AddRegistrationDialog
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đăng ký ({total})</CardTitle>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="attendee">Tham dự</SelectItem>
                  <SelectItem value="speaker">Báo cáo viên</SelectItem>
                  <SelectItem value="moderator">Chủ tọa</SelectItem>
                </SelectContent>
              </Select>
              {numSelected > 0 && (
                <>
                  <Select onValueChange={setBulkCheckinSessionId}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Chọn phiên đang diễn ra..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSessions.length > 0 ? activeSessions.map(session => (
                        <SelectItem key={session.id} value={session.id}>{session.title}</SelectItem>
                      )) : <p className="p-4 text-sm text-muted-foreground">Không có phiên nào đang diễn ra.</p>}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleBulkCheckin} disabled={bulkCheckinMutation.isPending}>
                    Check-in hàng loạt ({numSelected})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={numSelected > 0 && numSelected === filteredRegistrations.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Phiên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Yêu cầu</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center">Đang tải...</TableCell></TableRow>
              ) : filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((registration) => {
                  const session = sessionsMap.get(registration.sessionId);
                  const sessionIsActive = isSessionActive(session);
                  return (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows[registration.id] || false}
                          onCheckedChange={(checked) => handleRowSelect(registration.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{registration.fullName}</div>
                        <div className="text-sm text-muted-foreground">{registration.email}</div>
                      </TableCell>
                      <TableCell>{getRoleForRegistration(registration)}</TableCell>
                      <TableCell>{session?.title || "N/A"}</TableCell>
                      <TableCell><Badge variant={registration.status === "confirmed" ? "default" : "secondary"}>{registration.status}</Badge></TableCell>
                      <TableCell>{registration.cmeCertificateRequested && <Badge variant="secondary"><Award className="h-3 w-3" /></Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleCheckIn(registration.id)} disabled={checkInMutation.isPending || registration.status === 'checked-in' || !sessionIsActive}>
                          <UserCheck className="mr-2 h-4 w-4" /> Check-in
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(registration.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Chưa có đăng ký nào.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination>
        {/* Pagination content unchanged */}
      </Pagination>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận check-in hàng loạt?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn check-in cho {numSelected} người đã chọn vào phiên
              "{sessions.find(s => s.id === bulkCheckinSessionId)?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCheckinConfirm} disabled={bulkCheckinMutation.isPending}>
              {bulkCheckinMutation.isPending ? "Đang check-in..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
