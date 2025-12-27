import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactMessageService } from "@/services/contactMessageService";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export function useContactMessages(limit = 10) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const messagesQuery = useQuery({
    queryKey: ['contactMessages', debouncedSearchQuery, page, limit],
    queryFn: () => contactMessageService.getContactMessages(debouncedSearchQuery, page, limit),
  });

  const deleteMutation = useMutation({
    mutationFn: contactMessageService.deleteContactMessage,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa tin nhắn." });
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: contactMessageService.deleteAllContactMessages,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã dọn sạch hộp thư." });
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
  });

  return {
    messages: messagesQuery.data?.data || [],
    totalMessages: messagesQuery.data?.total || 0,
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    error: messagesQuery.error,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages: Math.ceil((messagesQuery.data?.total || 0) / limit),
    deleteMessage: deleteMutation.mutate,
    deleteAllMessages: deleteAllMutation.mutate,
    isDeleting: deleteMutation.isPending || deleteAllMutation.isPending,
  };
}
