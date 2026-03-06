import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";
import type { Document, InsertDocument } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useDocuments(viewingSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const documentsQuery = useQuery<Document[]>({
    queryKey: ["/api/documents", viewingSlug],
    queryFn: () => viewingSlug ? documentService.getAll(viewingSlug) : Promise.resolve([]),
    enabled: !!viewingSlug,
  });

  const createMutation = useMutation({
    mutationFn: documentService.create,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã đăng kỷ yếu mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertDocument> }) =>
      documentService.update(id, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật kỷ yếu." });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentService.delete,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa kỷ yếu." });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const incrementViewMutation = useMutation({
    mutationFn: documentService.incrementViews,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", id] });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    createDocument: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateDocument: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    incrementView: incrementViewMutation.mutate,
  };
}
