import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizerService } from "@/services/organizerService";
import { useToast } from "@/hooks/use-toast";
import type { Organizer, InsertOrganizer } from "@shared/types";

export function useOrganizers(viewingSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const organizersQuery = useQuery<Organizer[]>({
    queryKey: ["/api/organizers", viewingSlug],
    queryFn: () => viewingSlug ? organizerService.getOrganizers(viewingSlug) : Promise.resolve([]),
    enabled: !!viewingSlug,
  });

  const createMutation = useMutation({
    mutationFn: organizerService.createOrganizer,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm thành viên BTC mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertOrganizer }) => 
      organizerService.updateOrganizer(id, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật thông tin thành viên." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: organizerService.deleteOrganizer,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa thành viên." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: organizerService.deleteAllOrganizers,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã dọn sạch danh sách BTC." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  return {
    organizers: organizersQuery.data || [],
    isLoading: organizersQuery.isLoading,
    createOrganizer: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateOrganizer: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteOrganizer: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteAllOrganizers: deleteAllMutation.mutate,
    isDeletingAll: deleteAllMutation.isPending,
  };
}
