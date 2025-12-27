import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementService } from "@/services/announcementService";
import { useToast } from "@/hooks/use-toast";
import type { Announcement, InsertAnnouncement } from "@shared/types";

export function useAnnouncements(viewingSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ["/api/announcements", viewingSlug],
    queryFn: () => viewingSlug ? announcementService.getAnnouncements(viewingSlug) : Promise.resolve([]),
    enabled: !!viewingSlug,
  });

  const createMutation = useMutation({
    mutationFn: announcementService.createAnnouncement,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã đăng thông báo mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertAnnouncement }) => 
      announcementService.updateAnnouncement(id, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật thông báo." });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: announcementService.deleteAnnouncement,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa thông báo." });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const incrementViewMutation = useMutation({
    mutationFn: ({ id, slug }: { id: string; slug?: string }) => 
      announcementService.incrementAnnouncementView(id, slug),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", id] });
    },
  });

  return {
    announcements: announcementsQuery.data || [],
    isLoading: announcementsQuery.isLoading,
    createAnnouncement: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateAnnouncement: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteAnnouncement: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    incrementView: incrementViewMutation.mutate,
  };
}
