import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sightseeingService } from "@/services/sightseeingService";
import { useToast } from "@/hooks/use-toast";
import type { Sightseeing, InsertSightseeing } from "@shared/types";

export function useSightseeing(viewingSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sightseeingQuery = useQuery<Sightseeing[]>({
    queryKey: ["/api/sightseeing", viewingSlug],
    queryFn: () => viewingSlug ? sightseeingService.getSightseeings(viewingSlug) : Promise.resolve([]),
    enabled: !!viewingSlug,
  });

  const createMutation = useMutation({
    mutationFn: sightseeingService.createSightseeing,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm địa điểm mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertSightseeing }) => 
      sightseeingService.updateSightseeing(id, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật thông tin địa điểm." });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sightseeingService.deleteSightseeing,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa địa điểm." });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  return {
    sightseeing: sightseeingQuery.data || [],
    isLoading: sightseeingQuery.isLoading,
    createSightseeing: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateSightseeing: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteSightseeing: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
