import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { speakerService } from "@/services/speakerService";
import { useToast } from "@/hooks/use-toast";
import type { Speaker, InsertSpeaker } from "@shared/types";

export function useSpeakers(viewingSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const speakersQuery = useQuery<Speaker[]>({
    queryKey: ["/api/speakers", viewingSlug],
    queryFn: () => viewingSlug ? speakerService.getSpeakers(viewingSlug) : Promise.resolve([]),
    enabled: !!viewingSlug,
  });

  const createMutation = useMutation({
    mutationFn: speakerService.createSpeaker,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm báo cáo viên mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertSpeaker }) => speakerService.updateSpeaker(id, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật thông tin báo cáo viên." });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: speakerService.deleteSpeaker,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa báo cáo viên." });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  return {
    speakers: speakersQuery.data || [],
    isLoading: speakersQuery.isLoading,
    createSpeaker: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateSpeaker: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteSpeaker: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
