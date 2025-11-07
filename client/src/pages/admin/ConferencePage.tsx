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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy } from "lucide-react";
import type { Conference, InsertConference } from "@shared/schema";
import { insertConferenceSchema } from "@shared/schema";

export default function ConferencePage() {
  const { toast } = useToast();
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

  const { data: conferences = [] } = useQuery<Conference[]>({
    queryKey: ["/api/conferences"],
  });

  const { data: activeConference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  const form = useForm<InsertConference>({
    resolver: zodResolver(insertConferenceSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      name: "",
      theme: "",
      location: "",
      contactEmail: "",
      contactPhone: "",
      introContent: "",
      registrationNote1: "",
      registrationNote2: "",
      logoUrl: "",
      bannerUrls: [],
      startDate: new Date(),
      endDate: new Date(),
      isActive: true,
    },
  });

  // Reset form when activeConference data loads
  useEffect(() => {
    if (activeConference) {
      form.reset({
        ...activeConference,
        startDate: new Date(activeConference.startDate),
        endDate: new Date(activeConference.endDate),
      });
    }
  }, [activeConference, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertConference) => {
      return await apiRequest("PUT", "/api/conferences/active", data);
    },
    onSuccess: () => {
      toast({ title: "Cập nhật thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/conferences"] });
      queryClient.refetchQueries({ queryKey: ["/api/conferences/active"] });
      setFilesToDelete([]); // Clear staged deletions on success
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
  });

  const cloneMutation = useMutation({
    mutationFn: async (newYear: number) => {
      return await apiRequest("POST", "/api/conferences/clone", { toYear: newYear });
    },
    onSuccess: () => {
      toast({ title: "Sao chép hội nghị thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/conferences"] });
    },
  });

  const handleStageBannerForDeletion = (path: string) => {
    setFilesToDelete(prev => [...prev, path]);
    const currentBanners = form.getValues("bannerUrls") || [];
    form.setValue("bannerUrls", currentBanners.filter(p => p !== path));
  };

  const onSubmit = (data: InsertConference) => {
    const payload = {
      ...data,
      filesToDelete,
    };
    updateMutation.mutate(payload);
  };

  const handleClone = () => {
    const newYear = activeConference ? activeConference.year + 1 : new Date().getFullYear() + 1;
    if (confirm(`Sao chép hội nghị sang năm ${newYear}?`)) {
      cloneMutation.mutate(newYear);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900" data-testid="text-conference-title">
          Quản lý hội nghị
        </h1>
        <Button
          variant="outline"
          onClick={handleClone}
          disabled={!activeConference || cloneMutation.isPending}
          data-testid="button-clone-conference"
          className="whitespace-nowrap"
        >
          <Copy className="mr-2 h-4 w-4" />
          Sao chép sang năm mới
        </Button>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Thông tin hội nghị</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Năm *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-year"
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Logo hội nghị</FormLabel>
                      <FormControl>
                        <ImageUploader
                          currentImageUrl={field.value}
                          onUploadSuccess={(newPath) => form.setValue("logoUrl", newPath)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bannerUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Banners Hội nghị</FormLabel>
                      <FormControl>
                        <MultiImageManager
                          value={field.value || []}
                          onChange={field.onChange}
                          onDelete={handleStageBannerForDeletion}
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
                  disabled={updateMutation.isPending} 
                  data-testid="button-save-conference"
                  className="min-w-24"
                >
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}