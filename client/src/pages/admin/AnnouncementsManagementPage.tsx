import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Eye, MoreHorizontal, FileText, Megaphone, Info, Clock, Paperclip } from "lucide-react";
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
import "react-quill/dist/quill.snow.css";
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
import type { Announcement, InsertAnnouncement } from "@shared/types";
import { insertAnnouncementSchema } from "@shared/validation";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ImageUploader } from "@/components/ImageUploader";
import { useAdminView } from "@/hooks/useAdminView";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useImageUpload } from "@/hooks/useImageUpload";
import { uploadService } from "@/services/uploadService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryLabels: Record<string, string> = {
  general: "Thông báo chung",
  important: "Quan trọng",
  deadline: "Hạn chót",
};

const categoryColors: Record<string, string> = {
  general: "bg-blue-50 text-blue-700 border-blue-100",
  important: "bg-amber-50 text-amber-700 border-amber-100",
  deadline: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function AnnouncementsManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const quillRef = useRef<any>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { 
    announcements, 
    isLoading, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement, 
    isCreating, 
    isUpdating, 
  } = useAnnouncements(viewingSlug || undefined);

  const { uploadImage, deleteImage, isUploading: isImageUploading, isDeleting: isImageDeleting } = useImageUpload({
    onSuccess: (path) => form.setValue("featuredImageUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("featuredImageUrl", "", { shouldValidate: true }),
  });

  const { 
    uploadImage: uploadPdfFile, 
    deleteImage: deletePdfFile, 
    isUploading: isPdfUploading, 
    isDeleting: isPdfDeleting 
  } = useImageUpload({
    uploadPath: "/api/upload-pdf",
    onSuccess: (path) => form.setValue("pdfUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("pdfUrl", "", { shouldValidate: true }),
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
    if (confirm(`Xác nhận xóa thông báo: "${title}"?`)) {
      deleteAnnouncement(id);
    }
  };

  const onSubmit = (data: InsertAnnouncement) => {
    if (isReadOnly) return;
    if (editingAnnouncement) {
      updateAnnouncement({ id: editingAnnouncement.id, data });
    } else {
      createAnnouncement(data);
    }
    setIsDialogOpen(false);
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
          const result = await uploadService.uploadImage(formData);
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range) quill.insertEmbed(range.index, 'image', result.imagePath);
          }
        } catch (error: any) {
          toast({ title: 'Lỗi chèn ảnh', description: error.message, variant: 'destructive' });
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
      handlers: { image: imageHandler },
    },
  }), [isReadOnly]);

  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const renderAnnouncementItem = (announcement: Announcement) => (
    <div
      key={announcement.id}
      className="group relative bg-white border border-slate-200/60 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row">
        {announcement.featuredImageUrl && (
          <div className="md:w-48 h-48 md:h-auto shrink-0 overflow-hidden">
            <img
              src={announcement.featuredImageUrl}
              alt={announcement.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter shadow-sm border-none", categoryColors[announcement.category])}>
                {categoryLabels[announcement.category]}
              </Badge>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
                <Clock className="h-3 w-3 mr-1.5" />
                {format(new Date(announcement.publishedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{announcement.views || 0}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-2">
              {announcement.title}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed">
              {announcement.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              {announcement.pdfUrl && (
                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 text-[9px] font-bold uppercase tracking-tighter">
                  <Paperclip className="h-2.5 w-2.5 mr-1" /> PDF Đính kèm
                </Badge>
              )}
            </div>
            {!isReadOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => handleEdit(announcement)} className="text-indigo-600 font-medium cursor-pointer">
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(announcement.id, announcement.title)} className="text-rose-600 font-medium cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Quản lý Thông báo"
        description="Đăng và điều chỉnh các bản tin, cập nhật quan trọng dành cho người tham dự hội nghị."
        onAdd={handleAdd}
        addLabel="Đăng thông báo"
        isReadOnly={isReadOnly}
      />

      <div className="space-y-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-dashed">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
          </div>
        ) : sortedAnnouncements.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sortedAnnouncements.map(renderAnnouncementItem)}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <Megaphone className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Hệ thống chưa có thông báo nào.</p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">Đăng thông báo đầu tiên &rarr;</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingAnnouncement ? "Cập nhật thông báo" : "Đăng thông báo mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Nội dung sẽ được hiển thị ngay trên trang chủ hội nghị.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <FormField
                    control={form.control}
                    name="featuredImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ảnh đại diện</FormLabel>
                        <FormControl>
                          <ImageUploader
                            preview={field.value}
                            onDrop={(files) => uploadImage(files, field.value)}
                            onDelete={() => deleteImage(field.value || "")}
                            isUploading={isImageUploading}
                            isDeleting={isImageDeleting}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pdfUrl"
                    render={({ field: { value } }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tài liệu (PDF)</FormLabel>
                        <FormControl>
                          <ObjectUploader
                            acceptedFileTypes="application/pdf"
                            onFileSelect={(e) => {
                              const files = e.target.files ? Array.from(e.target.files) : [];
                              uploadPdfFile(files, value || "");
                            }}
                            onDelete={() => deletePdfFile(value || "")}
                            currentFileUrl={value || undefined}
                            isUploading={isPdfUploading}
                            isDeleting={isPdfDeleting}
                            disabled={isReadOnly}
                          >
                            {value ? "Thay đổi tài liệu" : "Tải tệp PDF"}
                          </ObjectUploader>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="lg:col-span-8 space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tiêu đề thông báo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nhập tiêu đề..." className="bg-slate-50 border-slate-200 font-bold h-11" readOnly={isReadOnly} />
                        </FormControl>
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Danh mục</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-50 border-slate-200">
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Ngày xuất bản</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} className="bg-slate-50 border-slate-200" readOnly={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tóm tắt ngắn</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} className="bg-slate-50 border-slate-200 resize-none" placeholder="Mô tả ngắn gọn..." readOnly={isReadOnly} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <Controller
                  name="content"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nội dung chi tiết</FormLabel>
                      <FormControl>
                        <React.Suspense fallback={<div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400 uppercase">Đang tải...</div>}>
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={field.value}
                            onChange={field.onChange}
                            readOnly={isReadOnly}
                            className="bg-white rounded-lg min-h-[300px]"
                            modules={modules}
                          />
                        </React.Suspense>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-8">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold text-slate-500">Hủy bỏ</Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating || isReadOnly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
                >
                  {isCreating || isUpdating ? "Đang xử lý..." : editingAnnouncement ? "Lưu thay đổi" : "Đăng thông báo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
