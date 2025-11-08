import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
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
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo, useRef } from "react";
import type { Sightseeing, InsertSightseeing } from "@shared/schema";
import { insertSightseeingSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SightseeingManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSightseeing, setEditingSightseeing] = useState<Sightseeing | null>(null);
  const quillRef = useRef<ReactQuill>(null);

  const { data: sightseeing = [] } = useQuery<Sightseeing[]>({
    queryKey: ["/api/sightseeing"],
    staleTime: 0,
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
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing"], exact: true });
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
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing"], exact: true });
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
      toast({ title: "Xóa địa điểm thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing"], exact: true });
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
      toast({ title: "Xóa tất cả địa điểm tham quan thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/sightseeing"], exact: true });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    setEditingSightseeing(null);
    form.reset({
      title: "",
      content: "",
      excerpt: "",
      featuredImageUrl: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (sightseeing: Sightseeing) => {
    setEditingSightseeing(sightseeing);
    form.reset({
      title: sightseeing.title,
      content: sightseeing.content,
      excerpt: sightseeing.excerpt,
      featuredImageUrl: sightseeing.featuredImageUrl,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa địa điểm "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("Bạn có chắc muốn xóa TẤT CẢ địa điểm tham quan? Hành động này không thể hoàn tác.")) {
      deleteAllMutation.mutate();
    }
  };

  const onSubmit = (data: InsertSightseeing) => {
    if (editingSightseeing) {
      updateMutation.mutate({ id: editingSightseeing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    if (editingSightseeing?.featuredImageUrl) {
      formData.append('oldImagePath', editingSightseeing.featuredImageUrl);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      fieldOnChange(result.imagePath);
      toast({ title: 'Tải ảnh đại diện thành công' });
    } catch (error) {
      toast({ title: 'Lỗi tải ảnh đại diện', description: 'Không thể tải ảnh lên.', variant: 'destructive' });
    }
  };

  const imageHandler = () => {
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
            if (range) {
              quill.insertEmbed(range.index, 'image', imageUrl);
            }
          }
        } catch (error) {
          toast({ title: 'Lỗi tải ảnh lên', description: 'Không thể tải ảnh lên.', variant: 'destructive' });
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
  }), []);

  const sortedSightseeing = [...sightseeing].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Quản lý địa điểm tham quan
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            data-testid="button-delete-all-sightseeing"
            disabled={deleteAllMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm địa điểm
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách địa điểm tham quan</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSightseeing.length > 0 ? (
            <div className="space-y-3">
              {sortedSightseeing.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {item.featuredImageUrl && (
                      <img
                        src={item.featuredImageUrl}
                        alt={item.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.title)}
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
              Chưa có địa điểm nào. Nhấn "Thêm địa điểm" để tạo mới.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSightseeing ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về địa điểm tham quan
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="featuredImageUrl"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Ảnh đại diện</FormLabel>
                    {value && (
                      <div className="mb-2">
                        <img src={value} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
                      </div>
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFeaturedImageUpload(event, onChange)}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormDescription>
                      Tải lên ảnh đại diện cho địa điểm
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
                      <Input {...field} />
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
                      <Textarea {...field} rows={2} />
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
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-[200px]"
                        modules={modules}
                      />
                    </FormControl>
                    <FormDescription>
                      Nội dung chi tiết của bài viết
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingSightseeing
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
