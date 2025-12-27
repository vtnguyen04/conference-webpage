import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Session } from "@shared/types";
import { useActiveConference } from "@/hooks/useActiveConference";
import { sessionService } from "@/services/sessionService";
import { registrationService } from "@/services/registrationService";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Building, Briefcase, Calendar, Award, Info } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(1, "Họ và tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  organization: z.string().optional(),
  position: z.string().optional(),
  sessionId: z.string().min(1, "Vui lòng chọn một phiên"),
  role: z.enum(["participant", "speaker", "moderator"], {
    required_error: "Vui lòng chọn một vai trò",
  }),
  cmeCertificateRequested: z.boolean().default(false),
});

type AddRegistrationFormValues = z.infer<typeof formSchema>;

interface AddRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRegistrationDialog({ isOpen, onClose }: AddRegistrationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<AddRegistrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      organization: "",
      position: "",
      role: "participant",
      cmeCertificateRequested: false,
    },
  });

  const { conference } = useActiveConference();

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.slug],
    queryFn: () => sessionService.getSessions(conference?.slug),
    enabled: !!conference,
  });

  const { data: capacityData = [] } = useQuery<Array<{
    sessionId: string;
    registered: number;
    capacity: number | null;
    isFull: boolean;
  }>>({
    queryKey: ["/api/sessions/capacity", conference?.slug],
    queryFn: () => sessionService.getSessionCapacities(),
    enabled: !!conference,
  });

  const capacityMap = useMemo(() => {
    return capacityData.reduce((acc, item) => {
      acc[item.sessionId] = item;
      return acc;
    }, {} as Record<string, typeof capacityData[0]>);
  }, [capacityData]);

  const addRegistrationMutation = useMutation({
    mutationFn: (newRegistration: AddRegistrationFormValues & { conferenceSlug: string }) =>
      registrationService.addRegistration(newRegistration),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm đại biểu mới vào hệ thống." });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      if (error && error.message && error.message.includes("Email này đã được đăng ký cho phiên này.")) {
        toast({
          title: "Lỗi đăng ký",
          description: "Email này đã được đăng ký cho phiên đã chọn. Vui lòng chọn một phiên khác.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể thêm đăng ký.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (values: AddRegistrationFormValues) => {
    if (!conference?.slug) {
      toast({ title: "Lỗi", description: "Không tìm thấy hội nghị đang hoạt động.", variant: "destructive" });
      return;
    }
    addRegistrationMutation.mutate({ ...values, conferenceSlug: conference.slug });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 border-none shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            Thêm đại biểu đăng ký thủ công
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Sử dụng form này để ghi nhận các trường hợp đăng ký trực tiếp hoặc đặc biệt.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Personal Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông tin cá nhân</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Họ và tên đại biểu</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input placeholder="Nguyễn Văn A" {...field} className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Địa chỉ Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input placeholder="email@example.com" {...field} className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                        </div>
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
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Số điện thoại</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input placeholder="09xx xxx xxx" {...field} className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Organization Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn vị công tác</span>
                </div>

                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tên tổ chức / Đơn vị</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input placeholder="Bệnh viện, Trường đại học..." {...field} className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                        </div>
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
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Chức danh chuyên môn</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input placeholder="Bác sĩ, Giảng viên..." {...field} className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <FormField
                    control={form.control}
                    name="cmeCertificateRequested"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-amber-100 bg-amber-50/50 p-3 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-amber-600 border-amber-200"
                          />
                        </FormControl>
                        <div className="flex items-center gap-2 leading-none">
                          <FormLabel className="text-[11px] font-bold text-amber-800 uppercase tracking-tight cursor-pointer">Cấp chứng chỉ CME</FormLabel>
                          <Award className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phân bổ tham dự</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Phiên đăng ký chính</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200 font-medium">
                            <SelectValue placeholder="Chọn một phiên họp" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {sessions.length > 0 ? (
                            sessions.map((session) => {
                              const cap = capacityMap[session.id];
                              const isFull = cap?.isFull || false;
                              return (
                                <SelectItem key={session.id} value={session.id} disabled={isFull} className="py-2">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-slate-900">{session.title}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400">
                                        Đã đăng ký: {cap?.registered || 0}/{cap?.capacity || "∞"}
                                      </span>
                                      {isFull && <Badge className="bg-rose-500 text-[8px] h-4 px-1.5 font-extrabold uppercase">Hết chỗ</Badge>}
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })
                          ) : (
                            <p className="p-4 text-xs text-slate-400 italic">Hệ thống chưa có dữ liệu phiên họp.</p>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Vai trò đại biểu</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200 font-medium">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="participant" className="font-medium">Người tham dự</SelectItem>
                          <SelectItem value="speaker" className="font-medium">Báo cáo viên</SelectItem>
                          <SelectItem value="moderator" className="font-medium">Chủ tọa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-8">
              <Button type="button" variant="ghost" onClick={onClose} className="font-bold text-slate-500">
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={addRegistrationMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
              >
                {addRegistrationMutation.isPending ? "Đang xử lý..." : "Xác nhận thêm đại biểu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}