import { useToast } from "@/hooks/use-toast";
import type { Registration, Session } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { sessionService } from "@/services/sessionService";
import { registrationService } from "@/services/registrationService";
import { useActiveConference } from "@/hooks/useActiveConference";
import { useAuth } from "@/hooks/useAuth";
const isSessionActive = (session?: Session): boolean => {
  if (!session) return false;
  const now = new Date();
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);

  // Kiểm tra nếu cùng ngày và trong khung giờ 7h - 17h
  const isSameDay = now.getFullYear() === startTime.getFullYear() &&
                    now.getMonth() === startTime.getMonth() &&
                    now.getDate() === startTime.getDate();
  
  if (isSameDay) {
    const currentHour = now.getHours();
    if (currentHour >= 7 && currentHour < 17) return true;
  }

  // Vẫn cho phép check-in nếu đang trong thời gian diễn ra phiên (phòng hờ phiên tối)
  return startTime <= now && now <= endTime;
};
export const useRegistrations = () => {
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
  const { conference } = useActiveConference();
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const { data, isLoading } = useQuery<{ data: Registration[], total: number }>({
    queryKey: ["registrations", conference?.slug, debouncedSearchQuery, page, limit],
    queryFn: () => registrationService.getRegistrations(conference!.slug, debouncedSearchQuery, page, limit),
    enabled: !!conference?.slug,
  });
  const registrations = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.slug],
    queryFn: () => sessionService.getSessions(conference?.slug),
    enabled: !!conference,
  });
  const { user } = useAuth();
  
  const activeSessions = useMemo(() => {
    let list = sessions;
    if (user?.role === "staff" && user.assignedSessionIds) {
      list = sessions.filter(s => user.assignedSessionIds!.includes(s.id));
    }
    return list.filter(session => isSessionActive(session));
  }, [sessions, user]);
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      if (roleFilter === 'all') return true;
      const registrationRole = reg.role;
      if (roleFilter === 'attendee') return registrationRole === 'participant';
      if (roleFilter === 'speaker') return registrationRole === 'speaker' || registrationRole === 'both';
      if (roleFilter === 'moderator') return registrationRole === 'moderator' || registrationRole === 'both';
      return true;
    });
  }, [registrations, roleFilter]);
  const sessionsMap = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions]);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => registrationService.deleteRegistration(id),
    onSuccess: () => {
      toast({ title: "Xóa đăng ký thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
    onError: (error: any) => toast({ title: "Lỗi", description: error.message, variant: "destructive" }),
  });
  const checkInMutation = useMutation({
    mutationFn: (registrationId: string) => registrationService.checkInRegistration(registrationId),
    onSuccess: () => {
      toast({ title: "Check-in thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
    onError: (error: any) => toast({ title: "Lỗi check-in", description: error.message, variant: "destructive" }),
  });
  const bulkCheckinMutation = useMutation({
    mutationFn: (data: { registrationIds: string[]; sessionId: string }) => registrationService.bulkCheckinRegistrations(data.registrationIds, data.sessionId),
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
  const resendEmailMutation = useMutation({
    mutationFn: (id: string) => registrationService.resendEmail(id),
    onSuccess: () => {
      toast({ title: "Đã gửi lại email thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
    onError: (error: any) => toast({ title: "Lỗi gửi lại email", description: error.message, variant: "destructive" }),
  });
  const handleExportCSV = async () => {
    try {
      toast({ title: "Đang xuất dữ liệu...", description: "Vui lòng chờ trong giây lát." });
      await registrationService.exportRegistrations();
      toast({ title: "Xuất dữ liệu thành công" });
    } catch (error: any) {
      toast({ 
        title: "Lỗi xuất dữ liệu", 
        description: error.message || "Có lỗi xảy ra khi tải file.", 
        variant: "destructive" 
      });
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
  const selectedRegistrationIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
  const numSelected = selectedRegistrationIds.length;
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
    setIsAlertOpen(false);
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ registrationIds }: { registrationIds: string[] }) =>
      registrationService.bulkDeleteRegistrations(registrationIds),
    onSuccess: (data) => {
      toast({
        title: "Xóa hàng loạt hoàn tất",
        description: `Thành công: ${data.successCount}, Thất bại: ${data.failCount}`,
      });
      setSelectedRows({});
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi xóa hàng loạt", description: error.message, variant: "destructive" });
    },
  });

  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const handleBulkDelete = () => {
    if (numSelected === 0) {
      toast({ title: "Chú ý", description: "Vui lòng chọn ít nhất một đại biểu." });
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };
  
  const handleBulkDeleteConfirm = () => {
    if (selectedRegistrationIds.length > 0) {
      bulkDeleteMutation.mutate({ registrationIds: selectedRegistrationIds });
    }
    setIsBulkDeleteDialogOpen(false);
  };
  const handleResendEmail = (registration: Registration) => {
    if (confirm(`Gửi lại email cho ${registration.fullName} (${registration.email})?`)) {
      resendEmailMutation.mutate(registration.id);
    }
  };
    return {
        searchQuery,
        page,
        limit,
        selectedRows,
        roleFilter,
        bulkCheckinSessionId,
        isAlertOpen,
        isAddUserDialogOpen,
        setSearchQuery,
        setPage,
        setSelectedRows,
        setRoleFilter,
        setBulkCheckinSessionId,
        setIsAlertOpen,
        setIsAddUserDialogOpen,
        registrations: filteredRegistrations,
        total,
        totalPages,
        isLoading,
        activeSessions,
        sessionsMap,
        deleteMutation,
        checkInMutation,
        bulkCheckinMutation,
        handleExportCSV,
        handleDelete,
        handleCheckIn,
        handleSelectAll,
        handleRowSelect,
        handleBulkCheckin,
        handleBulkCheckinConfirm,
        numSelected,
        selectedRegistrationIds,
        isSessionActive,
        handleResendEmail,
        resendEmailMutation,
        bulkDeleteMutation,
        isBulkDeleteDialogOpen,
        setIsBulkDeleteDialogOpen,
        handleBulkDelete,
        handleBulkDeleteConfirm
    };
}
