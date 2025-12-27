import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conferenceService } from "@/services/conferenceService";
import { useToast } from "@/hooks/use-toast";
import type { Conference } from "@shared/types";

export function useConferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const conferencesQuery = useQuery<Conference[]>({
    queryKey: ["conferences"],
    queryFn: conferenceService.getAllConferences,
  });

  const activateMutation = useMutation({
    mutationFn: conferenceService.activateConference,
    onSuccess: (_, slug) => {
      toast({ title: "Thành công", description: `Hội nghị ${slug} đã được kích hoạt.` });
      queryClient.invalidateQueries({ queryKey: ["conferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conferences/active"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message || "Không thể kích hoạt.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: conferenceService.deleteConference,
    onSuccess: (_, slug) => {
      toast({ title: "Thành công", description: `Đã xóa hội nghị ${slug}.` });
      queryClient.invalidateQueries({ queryKey: ["conferences"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: ({ fromSlug, newConferenceName }: { fromSlug: string, newConferenceName: string }) => 
      conferenceService.cloneConference(fromSlug, newConferenceName),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã sao chép hội nghị mới." });
      queryClient.invalidateQueries({ queryKey: ["conferences"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  return {
    conferences: conferencesQuery.data || [],
    isLoading: conferencesQuery.isLoading,
    isError: conferencesQuery.isError,
    error: conferencesQuery.error,
    activateConference: activateMutation.mutate,
    isActivating: activateMutation.isPending,
    deleteConference: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    cloneConference: cloneMutation.mutate,
    isCloning: cloneMutation.isPending,
  };
}
