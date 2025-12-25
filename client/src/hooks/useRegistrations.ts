import { useToast } from "@/hooks/use-toast";
import type { Registration, Session } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { sessionService } from "@/services/sessionService";
import { registrationService } from "@/services/registrationService";
import { useActiveConference } from "@/hooks/useActiveConference";
const isSessionActive = (session?: Session): boolean => {
  if (!session) return false;
  const now = new Date();
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
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
  const activeSessions = useMemo(() => {
    return sessions.filter(session => isSessionActive(session));
  }, [sessions]);
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
  const handleExportCSV = async () => {
    console.log("Exporting CSV...");
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
        isSessionActive
    };
}
