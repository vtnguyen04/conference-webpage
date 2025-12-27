import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sponsorService } from "@/services/sponsorService";
import { useToast } from "@/hooks/use-toast";
import type { Sponsor, InsertSponsor } from "@shared/types";

export function useSponsors(viewingSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sponsorsQuery = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors", viewingSlug],
    queryFn: () => viewingSlug ? sponsorService.getSponsors(viewingSlug) : Promise.resolve([]),
    enabled: !!viewingSlug,
  });

  const createMutation = useMutation({
    mutationFn: sponsorService.createSponsor,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm nhà tài trợ mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertSponsor }) => sponsorService.updateSponsor(id, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật nhà tài trợ." });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sponsorService.deleteSponsor,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa nhà tài trợ." });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  return {
    sponsors: sponsorsQuery.data || [],
    isLoading: sponsorsQuery.isLoading,
    createSponsor: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateSponsor: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteSponsor: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
