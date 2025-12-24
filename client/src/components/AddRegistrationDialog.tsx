import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import type { Conference, Session } from "@shared/types";
import { insertRegistrationSchema } from "@/shared/validation";

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
    },
  });

  const { data: conference } = useQuery<Conference | null>({
    queryKey: ["/api/conferences/active"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", conference?.slug],
    enabled: !!conference,
  });

  const addRegistrationMutation = useMutation({
    mutationFn: (newRegistration: AddRegistrationFormValues & { conferenceSlug: string }) =>
      apiRequest("POST", "/api/admin/registrations", newRegistration),
    onSuccess: () => {
      toast({ title: "Thêm đăng ký thành công" });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] }); // Invalidate speakers query
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      if (error && error.message && error.message.includes("Email này đã được đăng ký cho phiên này.")) {
        toast({
          title: "Lỗi đăng ký",
          description: "Email này đã được đăng ký cho phiên đã chọn. Vui lòng chọn một phiên khác hoặc sử dụng email khác.",
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
      toast({
        title: "Lỗi",
        description: "Không tìm thấy hội nghị đang hoạt động.",
        variant: "destructive",
      });
      return;
    }
    addRegistrationMutation.mutate({ ...values, conferenceSlug: conference.slug });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm đăng ký mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để thêm một đăng ký mới vào hệ thống.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
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
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="0901234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tổ chức</FormLabel>
                  <FormControl>
                    <Input placeholder="Bệnh viện X" {...field} />
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
                  <FormLabel>Chức danh</FormLabel>
                  <FormControl>
                    <Input placeholder="Bác sĩ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sessionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phiên đăng ký</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn một phiên" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sessions.length > 0 ? (
                        sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.title}
                          </SelectItem>
                        ))
                      ) : (
                        <p className="p-4 text-sm text-muted-foreground">Không có phiên nào.</p>
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
                  <FormLabel>Vai trò</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn một vai trò" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="participant">Tham dự</SelectItem>
                      <SelectItem value="speaker">Báo cáo viên</SelectItem>
                      <SelectItem value="moderator">Chủ tọa</SelectItem>
                    </SelectContent>
                  </Select>
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
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Yêu cầu chứng chỉ CME</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={addRegistrationMutation.isPending}>
                {addRegistrationMutation.isPending ? "Đang thêm..." : "Thêm đăng ký"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
