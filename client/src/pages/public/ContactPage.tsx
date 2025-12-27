import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { contactFormSchema } from '@shared/validation';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { useActiveConference } from '@/hooks/useActiveConference';
import { Mail, Phone, MapPin, Send, Loader2, Info, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { contactService } from '@/services/contactService';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const { toast } = useToast();
  const { conference } = useActiveConference();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const form = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      recaptcha: false,
    },
  });

  const mutation = useMutation({
    mutationFn: contactService.sendMessage,
    onSuccess: () => {
      toast({
        title: 'Thành công!',
        description: 'Tin nhắn của bạn đã được gửi tới Ban thư ký. Chúng tôi sẽ phản hồi sớm nhất có thể.',
      });
      form.reset();
      setIsVerified(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi hệ thống',
        description: error.message || 'Không thể gửi tin nhắn lúc này. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!isVerified) {
      toast({
        title: "Bảo mật",
        description: "Vui lòng xác nhận bạn không phải là robot.",
        variant: "destructive"
      });
      return;
    }
    mutation.mutate(data);
  };

  const handleCaptchaChange = (checked: boolean) => {
    if (checked) {
      setIsValidating(true);
      // Giả lập quá trình phân tích hành vi người dùng trong 1.5s
      setTimeout(() => {
        setIsValidating(false);
        setIsVerified(true);
        form.setValue('recaptcha', true, { shouldValidate: true });
      }, 1500);
    } else {
      setIsVerified(false);
      form.setValue('recaptcha', false);
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="bg-white animate-in fade-in duration-700">
      <PageHeader
        title="Liên hệ & Hỗ trợ"
        subtitle="Mọi thắc mắc về đăng ký, báo cáo khoa học hoặc tài trợ, vui lòng gửi thông tin cho chúng tôi."
        bannerImageUrl={conference?.bannerUrls?.[0]}
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white/80 hover:text-white transition-colors">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-semibold">Liên hệ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div ref={contentRef} className="py-16 md:py-24 bg-slate-50/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              {/* Cột trái: Form liên hệ */}
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-teal-600 rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gửi yêu cầu trực tiếp</h2>
                  </div>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-lg">
                    Quý đại biểu vui lòng điền thông tin chi tiết bên dưới. Hệ thống sẽ tự động chuyển tin nhắn đến bộ phận phụ trách tương ứng.
                  </p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Họ và tên *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nguyễn Văn A" {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium" />
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
                              <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Địa chỉ Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="example@email.com" {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Chủ đề cần hỗ trợ *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ví dụ: Lỗi đăng ký, Yêu cầu tài liệu..." {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nội dung chi tiết *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải..." rows={6} {...field} className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none p-4 text-sm font-medium leading-relaxed" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Nâng cấp phần Captcha */}
                      <FormField
                        control={form.control}
                        name="recaptcha"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
                            <FormControl>
                              <div className="relative flex items-center justify-center">
                                {isValidating ? (
                                  <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                                ) : isVerified ? (
                                  <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-in zoom-in" />
                                ) : (
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={handleCaptchaChange}
                                    className="h-6 w-6 border-slate-300 rounded-md"
                                  />
                                )}
                              </div>
                            </FormControl>
                            <div className="flex-1 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-bold text-slate-900 cursor-pointer">
                                  {isValidating ? "Đang xác thực hành vi..." : isVerified ? "Đã xác nhận là con người" : "Xác nhận không phải là robot"}
                                </FormLabel>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bảo mật reCAPTCHA v2.0</p>
                              </div>
                              <div className="hidden sm:flex flex-col items-center opacity-30 grayscale grayscale-100 pointer-events-none">
                                <ShieldCheck className="h-6 w-6 text-slate-400" />
                                <span className="text-[8px] font-black uppercase mt-1">SECURED</span>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={mutation.isPending || isValidating}
                        className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest shadow-lg shadow-teal-100 rounded-2xl transition-all"
                      >
                        {mutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang xử lý...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Gửi yêu cầu hỗ trợ
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Cột phải: Thông tin văn phòng */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-6 sticky top-24">
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Mail className="h-4 w-4 text-teal-600" /> Văn phòng Ban Thư ký
                      </h3>
                    </div>
                    <CardContent className="p-8 space-y-8">
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            <MapPin className="h-5 w-5 text-rose-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa điểm tổ chức</p>
                            <p className="text-sm font-bold text-slate-700 leading-tight">{conference?.location || "Đang cập nhật..."}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            <Phone className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đường dây nóng</p>
                            <a href={`tel:${conference?.contactPhone}`} className="text-sm font-black text-slate-800 hover:text-teal-600 transition-colors">
                              {conference?.contactPhone || "Đang cập nhật..."}
                            </a>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            <Mail className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email tiếp nhận</p>
                            <a href={`mailto:${conference?.contactEmail}`} className="text-sm font-black text-slate-800 hover:text-teal-600 transition-colors break-all">
                              {conference?.contactEmail || "Đang cập nhật..."}
                            </a>
                          </div>
                        </div>
                      </div>

                      {conference?.location && (
                        <div className="space-y-3 pt-4 border-t border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chỉ dẫn Google Maps</p>
                          <div className="rounded-xl overflow-hidden border border-slate-100 h-40">
                            <iframe
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(conference.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              title="Bản đồ địa điểm"
                            ></iframe>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
