import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Conference, Session } from "@shared/schema";
import { CheckCircle2, AlertCircle, Calendar, Clock, MapPin, Users, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";

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

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface SuccessData {
  success: boolean;
  registrations?: any[];
  emailSent?: boolean;
}

export default function RegistrationPage() {
  const { toast } = useToast();
  const [registrationState, setRegistrationState] = useState<'form' | 'pendingConfirmation'>('form');
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const { data: conference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    enabled: !!conference?.slug,
  });

  const { data: capacityData = [] } = useQuery<Array<{
    sessionId: string;
    sessionTitle: string;
    capacity: number | null;
    registered: number;
    available: number | null;
    isFull: boolean;
  }>>({
    queryKey: ["/api/sessions/capacity"],
    enabled: !!conference?.slug,
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
  const sessionIdsString = JSON.stringify([...sessionIds].sort());

  const sessionsBySlot = useMemo(() => {
    const grouped: Record<string, Session[]> = {};
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    for (const session of sortedSessions) {
      const date = new Date(session.startTime);
      const dateKey = format(date, "yyyy-MM-dd");
      const timeSlotKey = date.getHours() < 12 ? "Sáng" : "Chiều";
      const combinedKey = `${dateKey}_${timeSlotKey}`;

      if (!grouped[combinedKey]) {
        grouped[combinedKey] = [];
      }
      grouped[combinedKey].push(session);
    }
    return grouped;
  }, [sessions]);

  const sortedSlots = Object.keys(sessionsBySlot).sort();

  const checkTimeOverlap = (currentSessionIds: string[]): boolean => {
    const selectedSessionObjs = sessions.filter(s => currentSessionIds.includes(s.id));
    
    for (let i = 0; i < selectedSessionObjs.length; i++) {
      for (let j = i + 1; j < selectedSessionObjs.length; j++) {
        const s1Start = new Date(selectedSessionObjs[i].startTime);
        const s1End = new Date(selectedSessionObjs[i].endTime);
        const s2Start = new Date(selectedSessionObjs[j].startTime);
        const s2End = new Date(selectedSessionObjs[j].endTime);

        if (
          (s1Start < s2End && s1End > s2Start) ||
          (s2Start < s1End && s2End > s1Start)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const hasOverlap = useMemo(() => {
    return checkTimeOverlap(sessionIds);
  }, [sessionIdsString, sessions]);

  const disabledSessions = useMemo(() => {
    const disabled = new Set<string>();
    const selected = sessions.filter(s => sessionIds.includes(s.id));
    const now = new Date();

    const hasPlenary = selected.some(s => s.track === 'Toàn thể');
    const hasMorningBreakout = selected.some(s => s.track !== 'Toàn thể' && new Date(s.startTime).getHours() < 12);
    const hasAfternoonBreakout = selected.some(s => s.track !== 'Toàn thể' && new Date(s.startTime).getHours() >= 12);

    sessions.forEach(session => {
      // Disable if session has already ended
      if (new Date(session.endTime) < now) {
        disabled.add(session.id);
        return;
      }

      if (sessionIds.includes(session.id)) return;

      const isMorning = new Date(session.startTime).getHours() < 12;
      const isPlenary = session.track === 'Toàn thể';

      if (isPlenary && hasPlenary) {
        disabled.add(session.id);
      }
      if (!isPlenary && isMorning && hasMorningBreakout) {
        disabled.add(session.id);
      }
      if (!isPlenary && !isMorning && hasAfternoonBreakout) {
        disabled.add(session.id);
      }
    });

    return disabled;
  }, [sessionIdsString, sessions]);

  const mutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await apiRequest("POST", "/api/registrations/batch", {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        organization: data.organization || undefined,
        position: data.position || undefined,
        role: data.role, // Add the role field
        cmeCertificateRequested: data.cmeCertificateRequested,
        sessionIds: data.sessionIds,
        conferenceSlug: conference?.slug,
      });
      return response as SuccessData;
    },
    onSuccess: (data) => {
      setRegistrationState('pendingConfirmation');
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/capacity'] });

      if (data.emailSent) {
        toast({
          title: "Đăng ký thành công!",
          description: "Vui lòng kiểm tra email của bạn để xác nhận đăng ký và nhận mã QR.",
        });
      } else {
        toast({
          title: "Đăng ký thành công nhưng có lỗi gửi email",
          description: "Đăng ký của bạn đã được ghi nhận, nhưng chúng tôi không thể gửi email xác nhận. Vui lòng liên hệ ban tổ chức.",
          variant: "destructive",
          duration: 10000,
        });
      }
    },
    onError: (error: any) => {
      let description = error.message || "Có lỗi xảy ra. Vui lòng thử lại.";
      if (error.message && error.message.includes("Already registered for session:")) {
        description = "Bạn đã đăng ký một hoặc nhiều phiên đã chọn. Vui lòng kiểm tra lại các phiên đã đăng ký của bạn.";
      }
      toast({
        title: "Đăng ký thất bại",
        description: description,
        variant: "destructive",
      });
    },
  });

  const handleSessionToggle = (sessionId: string) => {
    const currentSelection = form.getValues("sessionIds");
    const newSelection = currentSelection.includes(sessionId)
      ? currentSelection.filter(id => id !== sessionId)
      : [...currentSelection, sessionId];

    form.setValue("sessionIds", newSelection);
  };

  const onSubmit = (data: RegistrationFormData) => {
    if (hasOverlap) {
      toast({
        title: "Lỗi chọn phiên",
        description: "Các phiên đã chọn có thời gian trùng lặp. Vui lòng kiểm tra lại.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(data);
  };

  if (registrationState === 'pendingConfirmation') {
    return (
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-12">
                <Mail className="h-16 w-16 text-blue-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-4">
                  Kiểm tra email của bạn
                </h1>
                <p className="text-muted-foreground mb-8">
                  Chúng tôi đã gửi một email xác nhận đến địa chỉ của bạn. Vui lòng kiểm tra hộp thư đến (và cả thư mục spam/junk) để hoàn tất đăng ký.
                </p>
                <Button onClick={() => setRegistrationState('form')}>
                  Quay lại form đăng ký
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <PageHeader
      title="Đăng ký tham dự"
      subtitle="Điền vào biểu mẫu dưới đây để đăng ký tham gia hội nghị của chúng tôi."
      bannerImageUrl={conference?.bannerUrls?.[0]}
    >
      <Breadcrumb className="mb-4 mx-auto">
        <BreadcrumbList className="text-white justify-center">
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="text-white">
              <Link href="/">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-white">Đăng ký</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </PageHeader>
    <div ref={mainContentRef} className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {conference?.registrationNote1 && (
            <div className="prose prose-sm max-w-none bg-muted/50 border-l-4 border-primary p-4 rounded-r-lg mb-8">
              <p dangerouslySetInnerHTML={{ __html: conference.registrationNote1.replace(/\n/g, '<br />') }} />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nguyễn Văn A" {...field} data-testid="input-fullname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại *</FormLabel>
                            <FormControl>
                              <Input placeholder="0909123456" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Đơn vị công tác</FormLabel>
                            <FormControl>
                              <Input placeholder="Bệnh viện, phòng khám..." {...field} data-testid="input-organization" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chức vụ</FormLabel>
                            <FormControl>
                              <Input placeholder="Bác sĩ, điều dưỡng..." {...field} data-testid="input-position" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vai trò *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue placeholder="Chọn vai trò của bạn" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="participant">Tham dự</SelectItem>
                              <SelectItem value="speaker">Báo cáo viên</SelectItem>
                              <SelectItem value="moderator">Chủ tọa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Vui lòng chọn vai trò của bạn tại hội nghị.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cmeCertificateRequested"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-cme"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Yêu cầu chứng chỉ CME (Continuing Medical Education)
                            </FormLabel>
                            <FormDescription>
                              Đánh dấu nếu bạn muốn nhận chứng chỉ CME cho các phiên đã chọn
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Chọn phiên tham dự *</h3>
                      
                      {conference?.registrationNote2 && (
                        <div className="prose prose-sm max-w-none bg-blue-100/50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6 text-blue-900">
                          <div dangerouslySetInnerHTML={{ __html: conference.registrationNote2.replace(/\n/g, '<br />') }} />
                        </div>
                      )}

                      {hasOverlap && (
                        <div className="bg-destructive/10 border border-destructive rounded-md p-4 mb-4 flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-destructive" data-testid="text-overlap-warning">
                            Các phiên đã chọn có thời gian trùng lặp. Vui lòng kiểm tra lại.
                          </p>
                        </div>
                      )}

                      <Tabs defaultValue={sortedSlots[0]} className="w-full">
                        <TabsList className="w-full justify-start mb-8 flex-wrap h-auto gap-2">
                          {sortedSlots.map(slot => {
                            const [date, timeOfDay] = slot.split('_');
                            return (
                              <TabsTrigger key={slot} value={slot} className="flex-1 min-w-[200px]">
                                {timeOfDay} {format(new Date(date), "EEEE, dd/MM", { locale: vi })}
                              </TabsTrigger>
                            )
                          })}
                        </TabsList>

                        {sortedSlots.map(slot => (
                          <TabsContent key={slot} value={slot} className="mt-0">
                            <div className="space-y-2">
                              {sessionsBySlot[slot].map((session) => {
                                const isSelected = sessionIds.includes(session.id);
                                const capacityInfo = capacityMap[session.id];
                                const spotsRemaining = capacityInfo?.available ?? undefined;
                                const isFull = capacityInfo?.isFull ?? false;
                                const hasEnded = new Date(session.endTime) < new Date();
                                const isDisabled = isFull || disabledSessions.has(session.id) || hasEnded;

                                return (
                                  <Card 
                                    key={session.id} 
                                    className={`transition-all ${
                                      isSelected ? 'border-primary bg-primary/5' : ''
                                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}`}
                                    data-testid={`card-session-${session.id}`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <Checkbox
                                          checked={isSelected}
                                          disabled={isDisabled}
                                          onCheckedChange={() => !isDisabled && handleSessionToggle(session.id)}
                                          onClick={(e) => e.stopPropagation()}
                                          data-testid={`checkbox-session-${session.id}`}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-4 mb-2">
                                            <h5 className="font-semibold text-sm leading-tight" data-testid={`text-session-title-${session.id}`}>
                                              {session.title}
                                            </h5>
                                            <div className="flex items-center gap-2">
                                              {hasEnded && (
                                                <span className="text-xs font-medium text-red-500 bg-red-100 px-2 py-1 rounded">Đã kết thúc</span>
                                              )}
                                              {session.capacity && !hasEnded && (
                                                <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                                                  <Users className="h-3 w-3" />
                                                  <span data-testid={`text-capacity-${session.id}`}>
                                                    {isFull ? (
                                                      <span className="text-destructive font-medium">Hết chỗ</span>
                                                    ) : (
                                                      <span className="text-muted-foreground">
                                                        {spotsRemaining}/{session.capacity}
                                                      </span>
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              <span>
                                                {format(parseISO(session.startTime), "HH:mm", { locale: vi })} - {format(parseISO(session.endTime), "HH:mm", { locale: vi })}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              <span>{session.room}</span>
                                            </div>
                                          </div>

                                          {session.description && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                              {session.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={mutation.isPending || hasOverlap || sessionIds.length === 0}
                      data-testid="button-submit-registration"
                    >
                      {mutation.isPending ? "Đang xử lý..." : `Đăng ký ${sessionIds.length} phiên`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lợi ích tham dự</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  {conference?.registrationBenefits ? (
                    <div dangerouslySetInnerHTML={{ __html: conference.registrationBenefits.replace(/\n/g, '<br />') }} />
                  ) : (
                    <p>Thông tin lợi ích tham dự sẽ được cập nhật sớm.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lưu ý</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  {conference?.registrationRules ? (
                    <div dangerouslySetInnerHTML={{ __html: conference.registrationRules.replace(/\n/g, '<br />') }} />
                  ) : (
                    <p>Thông tin lưu ý sẽ được cập nhật sớm.</p>
                  )}
                </CardContent>
              </Card>

              {sessionIds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Phiên đã chọn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Đã chọn {sessionIds.length} phiên
                    </p>
                    <div className="space-y-2">
                      {sessionIds.map(sessionId => {
                        const session = sessions.find(s => s.id === sessionId);
                        if (!session) return null;
                        return (
                          <div 
                            key={sessionId} 
                            className="text-xs p-2 bg-muted rounded-md"
                            data-testid={`selected-session-${sessionId}`}
                          >
                            <p className="font-medium line-clamp-1">{session.title}</p>
                            <p className="text-muted-foreground">
                              {format(parseISO(session.startTime), "HH:mm", { locale: vi })} - {session.room}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
