import React, { useState, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Map, Camera, FileText, MoreHorizontal, Info, Clock } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Sightseeing, InsertSightseeing } from "@shared/types";
import { insertSightseeingSchema } from "@shared/validation";
import { useAdminView } from "@/hooks/useAdminView";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useSightseeing } from "@/hooks/useSightseeing";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ImageUploader } from "@/components/ImageUploader";

export default function SightseeingManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSightseeing, setEditingSightseeing] = useState<Sightseeing | null>(null);
  const quillRef = useRef<any>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

    const {
      sightseeing,
      isLoading,
      createSightseeing,
      updateSightseeing,
      deleteSightseeing,
      isCreating,
      isUpdating,
      isDeleting: isDeletingItem
    } = useSightseeing(viewingSlug || undefined);
  const { uploadImage, deleteImage, isUploading, isDeleting: isDeletingImage } = useImageUpload({
    onSuccess: (path) => form.setValue("featuredImageUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("featuredImageUrl", "", { shouldValidate: true }),
  });

  const form = useForm<InsertSightseeing>({
    resolver: zodResolver(insertSightseeingSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      featuredImageUrl: "",
    },
  });

  const handleAdd = () => {
    if (isReadOnly) return;
    setEditingSightseeing(null);
    form.reset({
      title: "",
      content: "",
      excerpt: "",
      featuredImageUrl: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Sightseeing) => {
    if (isReadOnly) return;
    setEditingSightseeing(item);
    form.reset({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      featuredImageUrl: item.featuredImageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (isReadOnly) return;
    if (confirm(`Xác nhận xóa địa điểm: "${title}"?`)) {
      deleteSightseeing(id);
    }
  };

  const onSubmit = (data: InsertSightseeing) => {
    if (isReadOnly) return;
    if (editingSightseeing) {
      updateSightseeing({ id: editingSightseeing.id, data });
    } else {
      createSightseeing(data);
    }
    setIsDialogOpen(false);
  };

  const sortedSightseeing = useMemo(() => {
    return [...sightseeing].sort(
      (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
    );
  }, [sightseeing]);

  const renderSightseeingItem = (item: Sightseeing) => (
    <Card 
      key={item.id} 
      className="group relative bg-white border border-slate-200/60 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-300"
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {item.featuredImageUrl && (
            <div className="md:w-56 h-48 md:h-auto shrink-0 overflow-hidden">
              <img
                src={item.featuredImageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
                <Clock className="h-3 w-3 mr-1.5" />
                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: vi }) : "N/A"}
              </span>
              {!isReadOnly && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => handleEdit(item)} className="text-indigo-600 font-medium cursor-pointer">
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(item.id, item.title)} className="text-rose-600 font-medium cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed">
                {item.excerpt}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Quản lý Địa điểm Tham quan"
        description="Biên tập danh sách các địa danh và gợi ý trải nghiệm cho đại biểu hội nghị."
        onAdd={handleAdd}
        addLabel="Thêm địa điểm"
        isReadOnly={isReadOnly}
      />

      <div className="space-y-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-dashed">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
          </div>
        ) : sortedSightseeing.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sortedSightseeing.map(renderSightseeingItem)}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Map className="h-10 w-10 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">Chưa có địa điểm tham quan</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingSightseeing ? "Cập nhật địa điểm" : "Thêm địa điểm tham quan"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Cung cấp thông tin giới thiệu về địa điểm du lịch, ẩm thực.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <FormField
                    control={form.control}
                    name="featuredImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ảnh tiêu biểu</FormLabel>
                        <FormControl>
                          <ImageUploader
                            preview={field.value}
                            onDrop={(files) => uploadImage(files, field.value)}
                            onDelete={() => deleteImage(field.value || "")}
                            isUploading={isUploading}
                            isDeleting={isDeletingImage}
                            disabled={isReadOnly}
                          />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tên địa danh</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nhập tên địa điểm..." className="bg-slate-50 border-slate-200 font-bold h-11" readOnly={isReadOnly} />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tóm tắt ngắn</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} className="bg-slate-50 border-slate-200 resize-none" placeholder="Mô tả ngắn gọn..." readOnly={isReadOnly} />
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
                        <React.Suspense fallback={<div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">Đang tải trình soạn thảo...</div>}>
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={field.value}
                            onChange={field.onChange}
                            readOnly={isReadOnly}
                            className="bg-white rounded-lg min-h-[300px]"
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
                  {isCreating || isUpdating ? "Đang lưu trữ..." : editingSightseeing ? "Lưu thay đổi" : "Thêm địa điểm mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}