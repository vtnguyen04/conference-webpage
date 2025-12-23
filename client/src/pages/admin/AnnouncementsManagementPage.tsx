import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
const ReactQuill = React.lazy(() => import("react-quill"));
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Announcement, InsertAnnouncement } from "@shared/schema";
import { insertAnnouncementSchema } from "@shared/schema";
import { apiRequest, queryClient, apiUploadFile } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ImageUploader } from "@/components/ImageUploader";
import { useAdminView } from "@/hooks/useAdminView";

const categoryLabels: Record<string, string> = {
  general: "Thông báo chung",
  important: "Quan trọng",
  deadline: "Hạn chót",
};

const categoryColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  important: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  deadline: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AnnouncementsManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [isPdfDeleting, setIsPdfDeleting] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements", viewingSlug],
    queryFn: async () => {
      if (!viewingSlug) return [];
      return await apiRequest("GET", `/api/announcements/slug/${viewingSlug}`);
    },
    enabled: !!viewingSlug,
  });

  const form = useForm<InsertAnnouncement>({
    resolver: zodResolver(insertAnnouncementSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      featuredImageUrl: "",
      category: "general",
      publishedAt: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingAnnouncement) {
        form.reset({
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          excerpt: editingAnnouncement.excerpt,
          featuredImageUrl: editingAnnouncement.featuredImageUrl,
          pdfUrl: editingAnnouncement.pdfUrl,
          category: editingAnnouncement.category,
          publishedAt: new Date(editingAnnouncement.publishedAt).toISOString().slice(0, 16),
        });
      } else {
        form.reset({
          title: "",
          content: "",
          excerpt: "",
          featuredImageUrl: "",
          pdfUrl: "",
          category: "general",
          publishedAt: new Date().toISOString().slice(0, 16),
        });
      }
    }
  }, [editingAnnouncement, isDialogOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertAnnouncement) => {
      return await apiRequest("POST", "/api/announcements", data);
    },
    onSuccess: () => {
      toast({ title: "Tạo thông báo thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", viewingSlug] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertAnnouncement }) => {
      return await apiRequest("PUT", `/api/announcements/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Cập nhật thông báo thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", viewingSlug] });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Xóa thông báo thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/admin/announcements/all");
    },
    onSuccess: () => {
      toast({ title: "Xóa tất cả thông báo thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (isReadOnly) return;
    setEditingAnnouncement(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    if (isReadOnly) return;
    setEditingAnnouncement(announcement);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (isReadOnly) return;
    if (confirm(`Bạn có chắc muốn xóa thông báo "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = async () => {
    if (isReadOnly) return;
    if (confirm("Bạn có chắc muốn xóa TẤT CẢ thông báo? Hành động này không thể hoàn tác.")) {
      deleteAllMutation.mutate();
    }
  };

  const onSubmit = (data: InsertAnnouncement) => {
    if (isReadOnly) return;
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageDrop = async (acceptedFiles: File[]) => {
    if (isReadOnly) return;
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const oldImageUrl = form.getValues("featuredImageUrl");
    if (oldImageUrl) {
      formData.append("oldImagePath", oldImageUrl);
    }

    setIsImageUploading(true);

    try {
      const result = await apiUploadFile("/api/upload", formData);
      form.setValue("featuredImageUrl", result.imagePath, { shouldValidate: true });
      toast({ title: 'Tải ảnh đại diện thành công' });
    } catch (error: any) {
      console.error('Error uploading featured image:', error);
      toast({ title: 'Lỗi tải ảnh đại diện', description: error.message, variant: 'destructive' });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (isReadOnly) return;
    const currentImageUrl = form.getValues("featuredImageUrl");
    if (!currentImageUrl || !confirm("Bạn có chắc muốn xóa ảnh này?")) {
      return;
    }

    setIsImageDeleting(true);

    try {
      await apiRequest("DELETE", `/api/upload?filePath=${currentImageUrl}`);
      form.setValue("featuredImageUrl", "", { shouldValidate: true });
      toast({ title: 'Thành công', description: 'Ảnh đã được xóa thành công.' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ title: 'Lỗi', description: error.message || 'Không thể xóa ảnh.', variant: 'destructive' });
    } finally {
      setIsImageDeleting(false);
    }
  };

  const handlePdfFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    const oldPdfUrl = form.getValues("pdfUrl");
    if (oldPdfUrl) {
      formData.append("oldPdfPath", oldPdfUrl);
    }

    setIsPdfUploading(true);

    try {
      const result = await apiUploadFile("/api/upload-pdf", formData);
      form.setValue("pdfUrl", result.pdfPath, { shouldValidate: true });
      toast({ title: 'Tải tệp PDF thành công' });
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      toast({ title: 'Lỗi tải tệp PDF', description: error.message, variant: 'destructive' });
    } finally {
      setIsPdfUploading(false);
    }
  };

  const handlePdfDelete = async () => {
    if (isReadOnly) return;
    const currentPdfUrl = form.getValues("pdfUrl");
    if (!currentPdfUrl || !confirm("Bạn có chắc muốn xóa tệp này?")) {
      return;
    }

    setIsPdfDeleting(true);

    try {
      await apiRequest("DELETE", `/api/upload?filePath=${currentPdfUrl}`);
      form.setValue("pdfUrl", "", { shouldValidate: true });
      toast({ title: 'Thành công', description: 'Tệp đã được xóa thành công.' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ title: 'Lỗi', description: error.message || 'Không thể xóa tệp.', variant: 'destructive' });
    } finally {
      setIsPdfDeleting(false);
    }
  };

  const imageHandler = () => {
    if (isReadOnly) return;
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
          const result = await apiUploadFile('/api/upload', formData);
          const imageUrl = result.imagePath;

          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.insertEmbed(range.index, 'image', imageUrl);
            }
          }
        } catch (error: any) {
          toast({ title: 'Lỗi tải ảnh lên', description: error.message, variant: 'destructive' });
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [isReadOnly]);

  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-announcements-mgmt-title">
          Quản lý thông báo
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            data-testid="button-delete-all-announcements"
            disabled={deleteAllMutation.isPending || isReadOnly}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
          <Button onClick={handleAdd} data-testid="button-add-announcement" disabled={isReadOnly}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm thông báo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAnnouncements.length > 0 ? (
            <div className="space-y-3">
              {sortedAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                  data-testid={`announcement-item-${announcement.id}`}
                >
                  <div className="flex items-start gap-4">
                    {announcement.featuredImageUrl && (
                      <img
                        src={announcement.featuredImageUrl}
                        alt={announcement.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${categoryColors[announcement.category]}`}>
                          {categoryLabels[announcement.category]}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(announcement.publishedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{announcement.excerpt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                        data-testid={`button-edit-announcement-${announcement.id}`}
                        disabled={isReadOnly}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(announcement.id, announcement.title)}
                        data-testid={`button-delete-announcement-${announcement.id}`}
                        disabled={isReadOnly}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Chưa có thông báo nào. Nhấn "Thêm thông báo" để tạo mới.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Chỉnh sửa thông báo" : "Thêm thông báo mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về thông báo
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="featuredImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ảnh đại diện</FormLabel>
                    <FormControl>
                      <ImageUploader
                        onDrop={handleImageDrop}
                        onDelete={handleImageDelete}
                        preview={field.value}
                        isUploading={isImageUploading}
                        isDeleting={isImageDeleting}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormDescription>
                      Tải lên ảnh đại diện cho thông báo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pdfUrl"
                render={({ field: { value } }) => (
                  <FormItem>
                    <FormLabel>Tệp PDF đính kèm</FormLabel>
                    <FormControl>
                      <ObjectUploader
                        acceptedFileTypes="application/pdf"
                        onFileSelect={handlePdfFileSelect}
                        onDelete={handlePdfDelete}
                        currentFileUrl={value || undefined}
                        isUploading={isPdfUploading}
                        isDeleting={isPdfDeleting}
                        disabled={isReadOnly}
                      >
                        {value ? "Thay đổi tệp PDF" : "Tải lên tệp PDF"}
                      </ObjectUploader>
                    </FormControl>
                    <FormDescription>
                      Tải lên tệp PDF đính kèm cho thông báo (ví dụ: hợp đồng, nội quy)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-announcement-title" readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tóm tắt</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} data-testid="input-announcement-excerpt" readOnly={isReadOnly} />
                    </FormControl>
                    <FormDescription>
                      Mô tả ngắn gọn (hiển thị trong danh sách)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                name="content"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nội dung</FormLabel>
                    <FormControl>
                      <React.Suspense fallback={<div>Đang tải trình soạn thảo...</div>}>
                        <ReactQuill
                          ref={quillRef as React.RefObject<ReactQuill>}
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
                          readOnly={isReadOnly}
                          className="min-h-[200px]"
                          modules={modules}
                        />
                      </React.Suspense>
                    </FormControl>
                    <FormDescription>
                      Nội dung chi tiết của thông báo/bài viết
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-category">
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">Thông báo chung</SelectItem>
                          <SelectItem value="important">Quan trọng</SelectItem>
                          <SelectItem value="deadline">Hạn chót</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publishedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày xuất bản</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-announcement-published" readOnly={isReadOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || isReadOnly}
                  data-testid="button-submit-announcement"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingAnnouncement
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}