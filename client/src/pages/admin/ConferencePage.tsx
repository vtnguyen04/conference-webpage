import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";
import { MultiImageManager } from "@/components/MultiImageManager";
import { queryClient } from "@/lib/queryClient";
import type { Conference } from "@shared/types";
import { conferenceSchema } from "@shared/validation";
import { useAdminView } from "@/hooks/useAdminView";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Settings2, 
  FileText, 
  ShieldCheck, 
  Image as ImageIcon, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  Info
} from "lucide-react";
import { conferenceService } from "@/services/conferenceService";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";

export default function ConferencePage() {
  const { toast } = useToast();
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const { viewingSlug, isReadOnly } = useAdminView();

  const form = useForm<Conference>({
    resolver: zodResolver(conferenceSchema),
    defaultValues: {
      slug: "",
      name: "",
      theme: "",
      location: "",
      contactEmail: "",
      contactPhone: "",
      introContent: "",
      registrationNote1: "",
      registrationNote2: "",
      registrationBenefits: "",
      registrationRules: "",
      logoUrl: "",
      bannerUrls: [],
      startDate: new Date(),
      endDate: new Date(),
      isActive: true,
    },
  });

  const { uploadImage: uploadLogo, deleteImage: deleteLogo, isUploading: isLogoUploading, isDeleting: isLogoDeleting } = useImageUpload({
    onSuccess: (path) => form.setValue("logoUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("logoUrl", "", { shouldValidate: true }),
  });

  const { data: conferences = [] } = useQuery<Conference[]>({
    queryKey: ["/api/conferences"],
    queryFn: conferenceService.getAllConferences,
  });

  const selectedConference = conferences.find(c => c.slug === viewingSlug);

  useEffect(() => {
    if (selectedConference) {
      form.reset({
        ...selectedConference,
        startDate: new Date(selectedConference.startDate),
        endDate: new Date(selectedConference.endDate),
      });
    }
  }, [selectedConference, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Conference) => {
      if (!selectedConference) throw new Error("No conference selected");
      return await conferenceService.updateConference(selectedConference.slug, data);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Cấu hình hội nghị đã được cập nhật." });
      queryClient.invalidateQueries({ queryKey: ["/api/conferences/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conferences"] });
      setFilesToDelete([]);
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
  });

  const handleStageBannerForDeletion = (path: string) => {
    if (isReadOnly) return;
    setFilesToDelete(prev => [...prev, path]);
    const currentBanners = form.getValues("bannerUrls") || [];
    form.setValue("bannerUrls", currentBanners.filter(p => p !== path));
  };

  const onSubmit = (data: Conference) => {
    if (isReadOnly) return;
    const payload = {
      ...data,
      filesToDelete,
    };
    updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Cấu hình Chi tiết Hội nghị"
        description="Quản lý toàn bộ thông tin định danh, nội dung giới thiệu và hình ảnh hiển thị của hội nghị hiện tại."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-slate-100 p-1 h-12 rounded-xl mb-8">
              <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-[11px] uppercase tracking-widest gap-2">
                <Settings2 className="h-3.5 w-3.5" /> Thông tin chung
              </TabsTrigger>
              <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-[11px] uppercase tracking-widest gap-2">
                <FileText className="h-3.5 w-3.5" /> Nội dung & Giới thiệu
              </TabsTrigger>
              <TabsTrigger value="registration" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-[11px] uppercase tracking-widest gap-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Đăng ký & Quy định
              </TabsTrigger>
              <TabsTrigger value="images" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-[11px] uppercase tracking-widest gap-2">
                <ImageIcon className="h-3.5 w-3.5" /> Hình ảnh & Banners
              </TabsTrigger>
            </TabsList>

            <fieldset disabled={isReadOnly} className="space-y-8">
              {/* Tab 1: General Info */}
              <TabsContent value="general" className="space-y-6 animate-in slide-in-from-left-2">
                <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                      <FormField
                        control={form.control as any}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên hội nghị chính thức *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input {...field} placeholder="Ví dụ: Hội nghị Khoa học 2025" className="pl-10 h-11 bg-slate-50 border-slate-200 font-bold focus:bg-white transition-all" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="slug"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đường dẫn định danh (Slug)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input {...field} readOnly className="pl-10 h-11 bg-slate-100 border-slate-200 text-slate-500 font-mono text-xs" />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">Slug là duy nhất và không thể thay đổi sau khi tạo.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="theme"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chủ đề chính của hội nghị</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="Nhập chủ đề hoặc slogan..." className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="location"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Địa điểm tổ chức</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input {...field} value={field.value || ""} placeholder="Tên khách sạn, trung tâm hội nghị, thành phố..." className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email liên hệ</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input type="email" {...field} value={field.value || ""} className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại hỗ trợ</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input {...field} value={field.value || ""} className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ngày bắt đầu *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ngày kết thúc *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Intro Content */}
              <TabsContent value="content" className="space-y-6 animate-in slide-in-from-left-2">
                <Card className="border-slate-200/60 shadow-sm bg-white">
                  <CardContent className="p-8">
                    <FormField
                      control={form.control as any}
                      name="introContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Info className="h-4 w-4 text-indigo-500" /> Nội dung giới thiệu tổng quan
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              rows={12}
                              className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none leading-relaxed p-6 text-sm font-medium"
                              placeholder="Nhập nội dung giới thiệu sẽ hiển thị ở trang chủ..."
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] mt-2 italic">Hỗ trợ định dạng văn bản thô. Nội dung này là lời chào mừng đầu tiên đại biểu nhìn thấy.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Registration Rules */}
              <TabsContent value="registration" className="space-y-6 animate-in slide-in-from-left-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-slate-200/60 shadow-sm bg-white">
                    <CardContent className="p-6 space-y-6">
                      <FormField
                        control={form.control as any}
                        name="registrationNote1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thông báo đăng ký (Mục 1)</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} rows={4} className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="registrationNote2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thông báo đăng ký (Mục 2)</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} rows={4} className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/60 shadow-sm bg-white">
                    <CardContent className="p-6 space-y-6">
                      <FormField
                        control={form.control as any}
                        name="registrationBenefits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quyền lợi tham dự</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} rows={4} className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none" placeholder="Ví dụ: Tài liệu, CME, Ăn trưa..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="registrationRules"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quy định & Lưu ý</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} rows={4} className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none" placeholder="Ví dụ: Trang phục, thời gian check-in..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab 4: Images & Banners */}
              <TabsContent value="images" className="space-y-6 animate-in slide-in-from-left-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-4 border-slate-200/60 shadow-sm bg-white">
                    <CardContent className="p-6">
                      <FormField
                        control={form.control as any}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Logo Chính thức</FormLabel>
                            <FormControl>
                              <ImageUploader
                                onDrop={(files) => uploadLogo(files, field.value)}
                                onDelete={() => deleteLogo(field.value)}
                                preview={field.value}
                                isUploading={isLogoUploading}
                                isDeleting={isLogoDeleting}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormDescription className="text-[10px] mt-4 leading-relaxed">Sử dụng logo chất lượng cao (PNG trong suốt). Logo này sẽ xuất hiện trên thanh điều hướng và các tài liệu in ấn.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-8 border-slate-200/60 shadow-sm bg-white">
                    <CardContent className="p-6">
                      <FormField
                        control={form.control as any}
                        name="bannerUrls"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Banners Hội nghị (Carousel)</FormLabel>
                            <FormControl>
                              <MultiImageManager
                                value={field.value || []}
                                onChange={field.onChange}
                                onDelete={handleStageBannerForDeletion}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormDescription className="text-[10px] mt-4">Kích thước khuyến nghị: 1920x600px. Bạn có thể tải lên tối đa 5 ảnh để tạo hiệu ứng trình chiếu.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </fieldset>

            <div className="flex items-center justify-between p-6 bg-white border border-slate-200/60 rounded-2xl shadow-lg sticky bottom-0 z-10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-3 w-3 rounded-full animate-pulse",
                  updateMutation.isPending ? "bg-amber-500" : "bg-emerald-500"
                )} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                  {updateMutation.isPending ? "Đang lưu trữ dữ liệu..." : "Hệ thống đã sẵn sàng lưu"}
                </span>
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="font-bold text-slate-500"
                  onClick={() => form.reset()}
                  disabled={isReadOnly}
                >
                  Hoàn tác
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending || isReadOnly} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 shadow-xl shadow-indigo-100 h-11"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu tất cả thay đổi"}
                </Button>
              </div>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
