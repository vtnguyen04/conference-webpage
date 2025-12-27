import React, { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient, apiUploadFile } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";
import { useAdminView } from "@/hooks/useAdminView";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function SightseeingManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSightseeing, setEditingSightseeing] = useState<Sightseeing | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const quillRef = useRef<any>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { data: sightseeing = [] } = useQuery<Sightseeing[]>({
    queryKey: ["/api/sightseeing", viewingSlug],
    queryFn: async () => {
      if (!viewingSlug) return [];
      return await apiRequest("GET", `/api/sightseeing/slug/${viewingSlug}`);
    },
    enabled: !!viewingSlug,
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertSightseeing) => {
      return await apiRequest("POST", "/api/sightseeing", data);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm địa điểm tham quan mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing", viewingSlug] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertSightseeing }) => {
      return await apiRequest("PUT", `/api/sightseeing/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật thông tin địa điểm." });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing", viewingSlug] });
      setIsDialogOpen(false);
      setEditingSightseeing(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sightseeing/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa địa điểm tham quan." });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/admin/sightseeing/all");
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã dọn sạch danh sách địa điểm." });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
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
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = async () => {
    if (isReadOnly) return;
    if (confirm("Cảnh báo: Bạn có chắc muốn xóa TẤT CẢ địa điểm tham quan?")) {
      deleteAllMutation.mutate();
    }
  };

  const onSubmit = (data: InsertSightseeing) => {
    if (isReadOnly) return;
    if (editingSightseeing) {
      updateMutation.mutate({ id: editingSightseeing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageDrop = async (files: File[]) => {
    if (files.length === 0 || isReadOnly) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("image", file);
    const oldImageUrl = form.getValues("featuredImageUrl");
    if (oldImageUrl) formData.append("oldImagePath", oldImageUrl);

    setIsUploading(true);
    try {
      const result = await apiUploadFile("/api/upload", formData);
      form.setValue("featuredImageUrl", result.imagePath, { shouldValidate: true });
      toast({ title: "Tải ảnh lên thành công" });
    } catch (error: any) {
      toast({ title: "Lỗi tải ảnh", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (isReadOnly) return;
    const currentImageUrl = form.getValues("featuredImageUrl");
    if (!currentImageUrl) return;
    if (!confirm("Xác nhận xóa ảnh này?")) return;
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/upload?filePath=${currentImageUrl}`);
      form.setValue("featuredImageUrl", "", { shouldValidate: true });
      toast({ title: "Đã xóa ảnh" });
    } catch (error: any) {
      toast({ title: "Lỗi xóa ảnh", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
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
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          const imageUrl = result.imagePath;
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range) quill.insertEmbed(range.index, 'image', imageUrl);
          }
        } catch (error) {
          toast({ title: 'Lỗi chèn ảnh', description: 'Không thể tải ảnh vào nội dung.', variant: 'destructive' });
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

  const sortedSightseeing = [...sightseeing].sort(
    (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
  );

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

            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center">
                <FileText className="h-3 w-3 mr-1.5 text-slate-300" />
                Xem nội dung giới thiệu
              </span>
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
        description="Biên tập danh sách các danh lam thắng cảnh, địa điểm ẩm thực và tour du lịch đặc trưng tại khu vực tổ chức hội nghị."
        onAdd={handleAdd}
        addLabel="Thêm địa điểm"
        onDeleteAll={sightseeing.length > 0 ? handleDeleteAll : undefined}
        isReadOnly={isReadOnly}
      />

      <div className="space-y-4">
        {sortedSightseeing.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sortedSightseeing.map(renderSightseeingItem)}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <Map className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Chưa có dữ liệu địa điểm tham quan.</p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">Bắt đầu thêm ngay &rarr;</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingSightseeing ? "Cập nhật địa điểm" : "Thêm địa điểm tham quan"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Thông tin chi tiết về địa danh sẽ giúp người tham dự có trải nghiệm du lịch tốt hơn.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Media Section */}
                <div className="lg:col-span-4 space-y-6">
                  <FormField
                    control={form.control}
                    name="featuredImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                          <Camera className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                          Ảnh tiêu biểu
                        </FormLabel>
                        <FormControl>
                          <ImageUploader
                            preview={field.value}
                            onDrop={handleImageDrop}
                            onDelete={handleImageDelete}
                            isUploading={isUploading}
                            isDeleting={isDeleting}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      Hãy chọn ảnh đẹp nhất để giới thiệu vẻ đẹp của địa điểm đến khách tham dự.
                    </p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="lg:col-span-8 space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tên địa danh / Địa điểm</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ví dụ: Chùa Cầu Hội An, Bánh mì Phượng..." className="bg-slate-50 border-slate-200 font-bold h-11" readOnly={isReadOnly} />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Mô tả ngắn gọn</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} className="bg-slate-50 border-slate-200 resize-none" placeholder="Tóm tắt ngắn về điểm đến này..." readOnly={isReadOnly} />
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
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Giới thiệu chi tiết
                      </FormLabel>
                      <FormControl>
                        <React.Suspense fallback={<div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400 uppercase">Đang tải trình soạn thảo...</div>}>
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
                  disabled={createMutation.isPending || updateMutation.isPending || isReadOnly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Đang xử lý..." : editingSightseeing ? "Lưu thay đổi" : "Thêm địa điểm mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
