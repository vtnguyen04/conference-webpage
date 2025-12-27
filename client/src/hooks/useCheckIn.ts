import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkInService } from "@/services/checkInService";
import { useToast } from "@/hooks/use-toast";
import type { CheckIn, Registration } from "@shared/types";

interface CheckInWithDetails extends CheckIn {
  registration?: Registration;
}

export function useCheckIn(sessionId: string, page = 1, limit = 10) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkInsQuery = useQuery<{ data: CheckInWithDetails[], total: number }>({
    queryKey: ["/api/check-ins/session", sessionId, page, limit],
    queryFn: () => checkInService.getCheckInsBySession(sessionId, page, limit),
    enabled: !!sessionId,
  });

  const checkInMutation = useMutation({
    mutationFn: async (qrData: string) => {
      try {
        return await checkInService.qrCheckIn(qrData, sessionId);
      } catch (error: any) {
        if (error.message.includes("Already checked in")) {
          return { status: 400, message: "Already checked in" };
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data && (data as any).status === 400) {
        toast({ title: "Đã check-in", description: "Đại biểu này đã được ghi nhận trước đó." });
      } else {
        toast({ title: "Thành công", description: "Đã xác nhận sự diện của đại biểu." });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/session", sessionId] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi check-in", description: error.message, variant: "destructive" });
    },
  });

  return {
    checkIns: checkInsQuery.data?.data || [],
    totalCheckIns: checkInsQuery.data?.total || 0,
    isLoading: checkInsQuery.isLoading,
    submitCheckIn: checkInMutation.mutate,
    isCheckingIn: checkInMutation.isPending,
  };
}
