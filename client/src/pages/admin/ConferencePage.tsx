import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";
import { MultiImageManager } from "@/components/MultiImageManager";
import { apiRequest, queryClient, apiUploadFile } from "@/lib/queryClient";
import { Copy } from "lucide-react";
import type { Conference } from "@shared/types";
import { conferenceSchema } from "@shared/validation";
import { useAdminView } from "@/hooks/useAdminView";

export default function ConferencePage() {
  const { toast } = useToast();
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isLogoDeleting, setIsLogoDeleting] = useState(false);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { data: conferences = [] } = useQuery<Conference[]>({
    queryKey: ["/api/conferences"],
  });

  const selectedConference = conferences.find(c => c.slug === viewingSlug);

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

  // Reset form when the selected conference changes
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
      return await apiRequest("PUT", `/api/conferences/${selectedConference.slug}`, data);
    },
    onSuccess: () => {
      toast({ title: "Cập nhật thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/conferences/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conferences"] });
      setFilesToDelete([]); // Clear staged deletions on success
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
  });

  const cloneMutation = useMutation({
    mutationFn: async (newConferenceName: string) => {
      if (!selectedConference) throw new Error("No conference selected");
      return await apiRequest("POST", "/api/conferences/clone", { newConferenceName });
    },
    onSuccess: () => {
      toast({ title: "Sao chép hội nghị thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/conferences"] });
    },
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

  const handleClone = () => {
    if (!selectedConference) return;
    const newConferenceName = prompt(`Nhập tên cho hội nghị mới (sao chép từ "${selectedConference.name}"):`);
    if (newConferenceName) {
      cloneMutation.mutate(newConferenceName);
    }
  };

  const handleLogoDrop = async (acceptedFiles: File[]) => {
    if (isReadOnly) return;
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const oldLogoUrl = form.getValues("logoUrl");
    if (oldLogoUrl) {
      formData.append("oldImagePath", oldLogoUrl);
    }

    setIsLogoUploading(true);

    try {
      const result = await apiUploadFile("/api/upload", formData);
      form.setValue("logoUrl", result.imagePath, { shouldValidate: true });
      toast({ title: 'Tải logo thành công' });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({ title: 'Lỗi tải logo', description: error.message, variant: 'destructive' });
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (isReadOnly) return;
    const currentLogoUrl = form.getValues("logoUrl");
    if (!currentLogoUrl || !confirm("Bạn có chắc muốn xóa logo này?")) {
      return;
    }

    setIsLogoDeleting(true);

    try {
      await apiRequest("DELETE", `/api/upload?filePath=${currentLogoUrl}`);
      form.setValue("logoUrl", "", { shouldValidate: true });
      toast({ title: 'Thành công', description: 'Logo đã được xóa thành công.' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ title: 'Lỗi', description: error.message || 'Không thể xóa logo.', variant: 'destructive' });
    } finally {
      setIsLogoDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900" data-testid="text-conference-title">
          Quản lý hội nghị
        </h1>

      </div>

      <Card className="border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Thông tin hội nghị</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={isReadOnly} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-slug"
                            className="h-9 bg-gray-100"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Tên hội nghị *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name" className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Chủ đề</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-theme" className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Địa điểm</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-location" className="h-9" />
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
                        <FormLabel className="text-sm font-medium">Email liên hệ</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} data-testid="input-contact-email" className="h-9" />
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
                        <FormLabel className="text-sm font-medium">Số điện thoại</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-contact-phone" className="h-9" />
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
                        <FormLabel className="text-sm font-medium">Ngày bắt đầu *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-start-date"
                            className="h-9"
                          />
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
                        <FormLabel className="text-sm font-medium">Ngày kết thúc *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-end-date"
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as any}
                  name="introContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nội dung giới thiệu</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={4}
                          data-testid="textarea-intro-content"
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="registrationNote1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Ghi chú đăng ký 1</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={3}
                            data-testid="textarea-reg-note-1"
                            className="resize-none"
                          />
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
                        <FormLabel className="text-sm font-medium">Ghi chú đăng ký 2</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={3}
                            data-testid="textarea-reg-note-2"
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="registrationBenefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Lợi ích tham dự</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={5}
                            data-testid="textarea-reg-benefits"
                            className="resize-none"
                          />
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
                        <FormLabel className="text-sm font-medium">Lưu ý</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={5}
                            data-testid="textarea-reg-rules"
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Logo hội nghị</FormLabel>
                        <FormControl>
                          <ImageUploader
                            onDrop={handleLogoDrop}
                            onDelete={handleLogoDelete}
                            preview={field.value}
                            isUploading={isLogoUploading}
                            isDeleting={isLogoDeleting}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="bannerUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Banners Hội nghị</FormLabel>
                        <FormControl>
                          <MultiImageManager
                            value={field.value || []}
                            onChange={field.onChange}
                            onDelete={handleStageBannerForDeletion}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending || isReadOnly} 
                    data-testid="button-save-conference"
                    className="min-w-24"
                  >
                    {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
