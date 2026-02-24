import { useState, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import type { Session } from "@shared/types";
import { AlertCircle, Clock, MapPin, Users, Mail } from "lucide-react";
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
import { useActiveConference } from "@/hooks/useActiveConference";
import { usePublicRegistration, type RegistrationFormData } from "@/hooks/usePublicRegistration";

export default function RegistrationPage() {
  const { conference } = useActiveConference();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    form,
    sessions,
    capacityMap,
    hasOverlap,
    disabledSessions,
    isSubmitting,
    registrationState,
    setRegistrationState,
    submitRegistration,
    sessionIds,
  } = usePublicRegistration(conference);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

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

  const handleSessionToggle = (sessionId: string) => {
    const currentSelection = form.getValues("sessionIds");
    const newSelection = currentSelection.includes(sessionId)
      ? currentSelection.filter(id => id !== sessionId)
      : [...currentSelection, sessionId];
    form.setValue("sessionIds", newSelection, { shouldValidate: true });
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
    submitRegistration(data);
  };

  if (registrationState === 'pendingConfirmation') {
    return (
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Card className="text-center border-slate-200/60 shadow-lg">
              <CardContent className="p-12">
                                <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                  <Mail className="h-10 w-10 text-teal-600" />
                                </div>
                                <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                                  Kiểm tra email của bạn
                                </h1>
                                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                  Chúng tôi đã gửi một email xác nhận đến địa chỉ của bạn. Vui lòng kiểm tra hộp thư đến (và cả thư mục spam/junk) để hoàn tất đăng ký và nhận mã QR tham dự.
                                </p>
                                <Button 
                                  onClick={() => setRegistrationState('form')}
                                  className="bg-teal-600 hover:bg-teal-700 font-bold px-8 shadow-lg shadow-teal-100"
                                >
                                  Quay lại trang đăng ký
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    );
                  }
                
                  return (
                    <div className="animate-in fade-in duration-500">
                      <PageHeader
                        title="Đăng ký tham dự Hội nghị"
                        subtitle="Vui lòng cung cấp đầy đủ thông tin để chúng tôi có thể phục vụ bạn tốt nhất tại sự kiện."
                        bannerImageUrl={conference?.bannerUrls?.[0]}
                      >
                        <Breadcrumb className="mb-4 mx-auto">
                          <BreadcrumbList className="text-white justify-center">
                            <BreadcrumbItem>
                              <BreadcrumbLink asChild className="text-white opacity-80 hover:opacity-100 transition-opacity">
                                <Link href="/">Trang chủ</Link>
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-white/40" />
                            <BreadcrumbItem>
                              <BreadcrumbPage className="text-white font-bold">Đăng ký đại biểu</BreadcrumbPage>
                            </BreadcrumbItem>
                          </BreadcrumbList>
                        </Breadcrumb>
                      </PageHeader>
                
                      <div ref={mainContentRef} className="py-16 md:py-24 bg-slate-50/50">
                        <div className="container mx-auto px-4 md:px-6 lg:px-8">
                          <div className="max-w-6xl mx-auto">
                            {conference?.registrationNote1 && (
                              <div className="prose prose-sm max-w-none bg-teal-50 border-l-4 border-teal-600 p-6 rounded-r-2xl mb-10 shadow-sm">
                                <div className="flex gap-4">
                                  <Info className="h-5 w-5 text-teal-600 shrink-0" />
                                  <p className="font-medium text-teal-900 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: conference.registrationNote1.replace(/\n/g, '<br />') }} />
                                </div>
                              </div>
                            )}
                
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                              <div className="lg:col-span-2 space-y-8">
                                <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white">
                                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                                    <CardTitle className="text-xl font-bold text-slate-800">Thông tin đại biểu</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-8">
                                    <Form {...form}>
                                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                          <FormField
                                            control={form.control}
                                            name="fullName"
                                            render={({ field }) => (
                                              <FormItem className="col-span-2 md:col-span-1">
                                                <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Họ và tên *</FormLabel>
                                                <FormControl>
                                                  <Input placeholder="Nguyễn Văn A" {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                              <FormItem className="col-span-2 md:col-span-1">
                                                <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Địa chỉ Email *</FormLabel>
                                                <FormControl>
                                                  <Input type="email" placeholder="email@example.com" {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
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
                                                <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Số điện thoại *</FormLabel>
                                                <FormControl>
                                                  <Input placeholder="090x xxx xxx" {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vai trò tham dự *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                  <FormControl>
                                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 font-medium">
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
                                          <FormField
                                            control={form.control}
                                            name="organization"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Đơn vị công tác</FormLabel>
                                                <FormControl>
                                                  <Input placeholder="Bệnh viện, Trường học..." {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
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
                                                <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Chức vụ</FormLabel>
                                                <FormControl>
                                                  <Input placeholder="Bác sĩ, Giảng viên..." {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                
                                        <FormField
                                          control={form.control}
                                          name="cmeCertificateRequested"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border border-amber-100 bg-amber-50/30 p-5 shadow-sm">
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                  className="h-5 w-5 data-[state=checked]:bg-amber-600 border-amber-200"
                                                />
                                              </FormControl>
                                              <div className="space-y-1">
                                                <FormLabel className="text-[13px] font-bold text-amber-900 cursor-pointer">
                                                  Yêu cầu cấp chứng chỉ CME (Đào tạo liên tục)
                                                </FormLabel>
                                                <p className="text-[11px] text-amber-700/70 font-medium uppercase tracking-tighter">Đánh dấu nếu bạn muốn nhận chứng chỉ sau khi kết thúc phiên báo cáo.</p>
                                              </div>
                                            </FormItem>
                                          )}
                                        />
                
                                        <div className="pt-10 border-t border-slate-100">
                                          <div className="flex items-center justify-between mb-6">
                                            <div>
                                              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Lịch trình các phiên họp</h3>
                                              <p className="text-sm text-slate-400 font-medium mt-1">Vui lòng chọn ít nhất một phiên tham dự.</p>
                                            </div>
                                            <Badge className="bg-slate-900 text-white font-bold h-7 px-3">{sessionIds.length} đã chọn</Badge>
                                          </div>
                
                                          {conference?.registrationNote2 && (
                                            <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl mb-8 flex gap-3">
                                              <Info className="h-4 w-4 text-teal-600 mt-0.5" />
                                              <div className="text-xs text-teal-900 font-medium leading-relaxed italic" dangerouslySetInnerHTML={{ __html: conference.registrationNote2.replace(/\n/g, '<br />') }} />
                                            </div>
                                          )}
                
                                          {hasOverlap && (
                                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                                              <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                                              <p className="text-xs text-rose-900 font-bold leading-relaxed uppercase tracking-tighter">
                                                Cảnh báo: Bạn đang chọn các phiên có thời gian trùng lặp. Vui lòng kiểm tra lại để tránh sai sót.
                                              </p>
                                            </div>
                                          )}
                
                                          <Tabs defaultValue={sortedSlots[0]} className="w-full">
                                            <TabsList className="w-full justify-start mb-8 bg-slate-100/50 p-1 h-12 rounded-xl overflow-x-auto no-scrollbar flex-nowrap">
                                              {sortedSlots.map(slot => {
                                                const [date, timeOfDay] = slot.split('_');
                                                return (
                                                  <TabsTrigger key={slot} value={slot} className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest h-10 shrink-0">
                                                    {timeOfDay} {date && !isNaN(new Date(date).getTime()) ? format(new Date(date), "dd/MM", { locale: vi }) : ""}
                                                  </TabsTrigger>
                                                )
                                              })}
                                            </TabsList>
                                            {sortedSlots.map(slot => (
                                              <TabsContent key={slot} value={slot} className="mt-0 space-y-3">
                                                {sessionsBySlot[slot].map((session) => {
                                                  const isSelected = sessionIds.includes(session.id);
                                                  const capacityInfo = capacityMap[session.id];
                                                  const isFull = capacityInfo?.isFull ?? false;
                                                  const hasEnded = new Date(session.endTime) < new Date();
                                                  const isDisabled = isFull || disabledSessions.has(session.id) || hasEnded;
                                                  
                                                  return (
                                                    <div 
                                                      key={session.id} 
                                                      onClick={() => !isDisabled && handleSessionToggle(session.id)}
                                                      className={cn(
                                                        "relative group flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer",
                                                        isSelected 
                                                          ? "border-teal-600 bg-teal-50/50 shadow-md shadow-teal-100" 
                                                          : "border-slate-100 bg-white hover:border-slate-200",
                                                        isDisabled && "opacity-50 cursor-not-allowed grayscale"
                                                      )}
                                                    >
                                                      <div className={cn(
                                                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                                                        isSelected ? "bg-teal-600 border-teal-600" : "border-slate-200 bg-white"
                                                      )}>
                                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                                                      </div>
                                                      
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4 mb-2">
                                                          <h5 className={cn("font-bold text-sm leading-tight", isSelected ? "text-teal-900" : "text-slate-800")}>
                                                            {session.title}
                                                          </h5>
                                                          {session.capacity && (
                                                            <Badge variant="outline" className={cn("text-[9px] font-extrabold uppercase tracking-tighter shrink-0", isFull ? "text-rose-600 border-rose-100 bg-rose-50" : "text-slate-400")}>
                                                              {isFull ? "Hết chỗ" : `Còn ${ (session.capacity || 0) - (capacityInfo?.registered || 0) }/${session.capacity}`}
                                                            </Badge>
                                                          )}
                                                        </div>
                                                        
                                                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                          <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3 text-slate-300" />
                                                            {format(parseISO(session.startTime), "HH:mm")} - {format(parseISO(session.endTime), "HH:mm")}
                                                          </div>
                                                          <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3 w-3 text-slate-300" />
                                                            {session.room}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </TabsContent>
                                            ))}
                                          </Tabs>
                                        </div>
                
                                        <Button
                                          type="submit"
                                          className="w-full h-14 text-base font-extrabold uppercase tracking-widest bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-xl shadow-teal-100 transition-all active:scale-[0.98]"
                                          disabled={isSubmitting || hasOverlap || sessionIds.length === 0}
                                        >
                                          {isSubmitting ? (
                                            <div className="flex items-center gap-3">
                                              <div className="h-5 w-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                              Đang xử lý đăng ký...
                                            </div>
                                          ) : (
                                            `Xác nhận đăng ký (${sessionIds.length} phiên)`
                                          )}
                                        </Button>
                                      </form>
                                    </Form>
                                  </CardContent>
                                </Card>
                              </div>
                
                              {/* Sidebar Info */}
                              <div className="space-y-8">
                                <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
                                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                                    <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Quyền lợi của bạn</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-6">
                                    {conference?.registrationBenefits ? (
                                      <div className="prose prose-slate prose-xs max-w-none text-slate-600 font-medium leading-relaxed" 
                                           dangerouslySetInnerHTML={{ __html: conference.registrationBenefits.replace(/\n/g, '<br />') }} />
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">Dữ liệu đang được cập nhật...</p>
                                    )}
                                  </CardContent>
                                </Card>
                
                                <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
                                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                                    <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Lưu ý tham dự</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-6">
                                    {conference?.registrationRules ? (
                                      <div className="prose prose-slate prose-xs max-w-none text-slate-600 font-medium leading-relaxed" 
                                           dangerouslySetInnerHTML={{ __html: conference.registrationRules.replace(/\n/g, '<br />') }} />
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">Dữ liệu đang được cập nhật...</p>
                                    )}
                                  </CardContent>
                                </Card>
                
                                {sessionIds.length > 0 && (
                                  <Card className="border-teal-100 shadow-md bg-teal-50/30 overflow-hidden animate-in slide-in-from-bottom-4">
                                    <CardHeader className="bg-teal-600 py-4 px-6">
                                      <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Phiên đã chọn</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                      <div className="space-y-2">
                                        {sessionIds.map(sessionId => {
                                          const session = sessions.find(s => s.id === sessionId);
                                          if (!session) return null;
                                          return (
                                            <div key={sessionId} className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm animate-in zoom-in-95">
                                              <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">{session.title}</p>
                                              <div className="flex items-center justify-between mt-2">
                                                <span className="text-[9px] font-bold text-teal-600 uppercase">{format(parseISO(session.startTime), "HH:mm")}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{session.room}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <p className="text-[10px] text-teal-600 font-extrabold text-center uppercase tracking-widest pt-2">
                                        Tổng cộng {sessionIds.length} phiên
                                      </p>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </div>
                
          </div>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";