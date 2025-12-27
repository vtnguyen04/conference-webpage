import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Session, Conference } from "@shared/types";
import { format } from "date-fns";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên đầy đủ"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  organization: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(["participant", "speaker", "moderator"], {
    required_error: "Vui lòng chọn một vai trò",
  }).default("participant"),
  cmeCertificateRequested: z.boolean().default(false),
  sessionIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một phiên"),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export function usePublicRegistration(conference?: Conference | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [registrationState, setRegistrationState] = useState<'form' | 'pendingConfirmation'>('form');

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["api/sessions"],
    enabled: !!conference?.slug,
  });

  const { data: capacityData = [] } = useQuery<Array<{
    sessionId: string;
    isFull: boolean;
    registered: number;
    capacity: number | null;
  }>>({
    queryKey: ["api/sessions/capacity"],
    enabled: !!conference?.slug,
    staleTime: 0,
  });

  const capacityMap = useMemo(() => {
    return capacityData.reduce((acc, item) => {
      acc[item.sessionId] = item;
      return acc;
    }, {} as Record<string, typeof capacityData[0]>);
  }, [capacityData]);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      organization: "",
      position: "",
      cmeCertificateRequested: false,
      sessionIds: [],
    },
  });

  const sessionIds = form.watch("sessionIds");

  const checkTimeOverlap = (currentSessionIds: string[]): boolean => {
    const selected = sessions.filter(s => currentSessionIds.includes(s.id));
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const s1Start = new Date(selected[i].startTime);
        const s1End = new Date(selected[i].endTime);
        const s2Start = new Date(selected[j].startTime);
        const s2End = new Date(selected[j].endTime);
        if ((s1Start < s2End && s1End > s2Start) || (s2Start < s1End && s2End > s1Start)) return true;
      }
    }
    return false;
  };

  const hasOverlap = useMemo(() => checkTimeOverlap(sessionIds), [sessionIds, sessions]);

  const disabledSessions = useMemo(() => {
    const disabled = new Set<string>();
    const selected = sessions.filter(s => sessionIds.includes(s.id));
    const now = new Date();
    
    const hasPlenary = selected.some(s => s.track === 'Toàn thể');
    const hasMorningBreakout = selected.some(s => s.track !== 'Toàn thể' && new Date(s.startTime).getHours() < 12);
    const hasAfternoonBreakout = selected.some(s => s.track !== 'Toàn thể' && new Date(s.startTime).getHours() >= 12);

    sessions.forEach(session => {
      if (new Date(session.endTime) < now) {
        disabled.add(session.id);
        return;
      }
      if (sessionIds.includes(session.id)) return;
      const isMorning = new Date(session.startTime).getHours() < 12;
      const isPlenary = session.track === 'Toàn thể';
      if (isPlenary && hasPlenary) disabled.add(session.id);
      if (!isPlenary && isMorning && hasMorningBreakout) disabled.add(session.id);
      if (!isPlenary && !isMorning && hasAfternoonBreakout) disabled.add(session.id);
    });
    return disabled;
  }, [sessionIds, sessions]);

  const submitMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      return await apiRequest("POST", "/api/registrations/batch", {
        ...data,
        conferenceSlug: conference?.slug,
      });
    },
    onSuccess: (res: any) => {
      setRegistrationState('pendingConfirmation');
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/capacity'] });
      if (res.emailSent) {
        toast({ title: "Đăng ký thành công!", description: "Vui lòng kiểm tra email để xác nhận." });
      } else {
        toast({ title: "Đăng ký thành công!", description: "Ghi nhận dữ liệu thành công nhưng không thể gửi email.", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Đăng ký thất bại", description: error.message, variant: "destructive" });
    },
  });

  return {
    form,
    sessions,
    capacityMap,
    hasOverlap,
    disabledSessions,
    isSubmitting: submitMutation.isPending,
    registrationState,
    setRegistrationState,
    submitRegistration: submitMutation.mutate,
    sessionIds,
  };
}
