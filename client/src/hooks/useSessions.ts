import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/services/sessionService";
import { useToast } from "@/hooks/use-toast";
import type { Session, InsertSession } from "@shared/types";

export function useSessions(viewingSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sessionsQuery = useQuery<Session[]>({
    queryKey: ["/api/sessions", viewingSlug],
    queryFn: () => viewingSlug ? sessionService.getSessions(viewingSlug) : Promise.resolve([]),
    enabled: !!viewingSlug,
  });

  const createMutation = useMutation({
    mutationFn: sessionService.createSession,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã tạo phiên họp mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertSession }) => sessionService.updateSession(id, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật phiên họp." });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sessionService.deleteSession,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa phiên họp." });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    createSession: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateSession: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteSession: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
