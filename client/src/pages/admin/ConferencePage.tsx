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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <h1 className="text-3xl font-bold" data-testid="text-conference-title">
          Quản lý hội nghị
        </h1>
        <Button
          variant="outline"
          onClick={handleClone}
          disabled={!activeConference || cloneMutation.isPending}
          data-testid="button-clone-conference"
        >
          <Copy className="mr-2 h-4 w-4" />
          Sao chép sang năm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hội nghị</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Năm *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-year"
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
                      <FormLabel>Tên hội nghị *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name" />
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
                      <FormLabel>Chủ đề</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-theme" />
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
                      <FormLabel>Địa điểm</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-location" />
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
                      <FormLabel>Email liên hệ</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} data-testid="input-contact-email" />
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
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-contact-phone" />
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
                      <FormLabel>Ngày bắt đầu *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-start-date"
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
                      <FormLabel>Ngày kết thúc *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-end-date"
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
                    <FormLabel>Nội dung giới thiệu</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={6}
                        data-testid="textarea-intro-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNote1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú đăng ký 1</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={4}
                        data-testid="textarea-reg-note-1"
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
                    <FormLabel>Ghi chú đăng ký 2</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={6}
                        data-testid="textarea-reg-note-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo hội nghị</FormLabel>
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
                      <FormLabel>Banners Hội nghị</FormLabel>
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

              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-conference">
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
