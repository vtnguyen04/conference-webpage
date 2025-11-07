import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Calendar, FileText } from "lucide-react";
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
import { useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Announcement, InsertAnnouncement } from "@shared/schema";
import { insertAnnouncementSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

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
  const quillRef = useRef<ReactQuill>(null);

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    staleTime: 0, // Ensure data is always considered stale for immediate refetching
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertAnnouncement) => {
      return await apiRequest("POST", "/api/announcements", data);
    },
    onSuccess: () => {
      console.log('Invalidating announcements query...');
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"], exact: true });
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
      console.log('Invalidating announcements query...');
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"], exact: true });
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
      console.log('Invalidating announcements query...');
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"], exact: true });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    setEditingAnnouncement(null);
    form.reset({
      title: "",
      content: "",
      excerpt: "",
      featuredImageUrl: "",
      pdfUrl: "", // Clear pdfUrl
      category: "general",
      publishedAt: new Date().toISOString().slice(0, 16),
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      excerpt: announcement.excerpt,
      featuredImageUrl: announcement.featuredImageUrl,
      pdfUrl: announcement.pdfUrl, // Populate pdfUrl
      category: announcement.category,
      publishedAt: new Date(announcement.publishedAt).toISOString().slice(0, 16),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa thông báo "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertAnnouncement) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    // If editing, send old image path for deletion
    if (editingAnnouncement?.featuredImageUrl) {
      formData.append('oldImagePath', editingAnnouncement.featuredImageUrl);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log('Featured image upload response:', result);
      fieldOnChange(result.imagePath);
      toast({ title: 'Tải ảnh đại diện thành công' });
    } catch (error) {
      console.error('Error uploading featured image:', error);
      toast({ title: 'Lỗi tải ảnh đại diện', description: 'Không thể tải ảnh lên.', variant: 'destructive' });
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    // If editing, send old PDF path for deletion
    if (editingAnnouncement?.pdfUrl) {
      formData.append('oldPdfPath', editingAnnouncement.pdfUrl);
    }

    try {
      const response = await fetch('/api/upload-pdf', { // Use the new PDF upload endpoint
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log('PDF upload response:', result);
      fieldOnChange(result.pdfPath);
      toast({ title: 'Tải tệp PDF thành công' });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({ title: 'Lỗi tải tệp PDF', description: 'Không thể tải tệp PDF lên.', variant: 'destructive' });
    }
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      console.log('Selected file:', file);
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
          console.log('Sending image upload request...');
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          console.log('Image upload response:', result);
          const imageUrl = result.imagePath; // Assuming the backend returns { imagePath: '/uploads/image.jpg' }
          console.log('Image URL to insert into Quill:', imageUrl);

          // Get the current cursor position
          const quill = quillRef.current?.getEditor(); // Access Quill editor instance using ref
          console.log('Quill editor instance:', quill);
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.insertEmbed(range.index, 'image', imageUrl);
            }
          }
        } catch (error) {
          console.error('Error uploading image:', error);
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

  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-announcements-mgmt-title">
          Quản lý thông báo
        </h1>
        <Button onClick={handleAdd} data-testid="button-add-announcement">
          <Plus className="mr-2 h-4 w-4" />
          Thêm thông báo
        </Button>
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
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(announcement.id, announcement.title)}
                        data-testid={`button-delete-announcement-${announcement.id}`}
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
                        data-testid="input-featured-image"
                        {...fieldProps}
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
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Tệp PDF đính kèm</FormLabel>
                    {value && (
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          Xem tệp PDF hiện tại
                        </a>
                      </div>
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(event) => handlePdfUpload(event, onChange)}
                        data-testid="input-announcement-pdf"
                        {...fieldProps}
                      />
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
                      <Input {...field} data-testid="input-announcement-title" />
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
                      <Textarea {...field} rows={2} data-testid="input-announcement-excerpt" />
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
                        onChange={(content, delta, source, editor) => {
                          console.log('Quill onChange - content:', content);
                          console.log('Quill onChange - field.value before:', field.value);
                          field.onChange(content);
                          console.log('Quill onChange - field.value after:', form.getValues('content'));
                        }}
                        className="min-h-[200px]"
                        modules={modules}
                      />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input type="datetime-local" {...field} data-testid="input-announcement-published" />
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
                  disabled={createMutation.isPending || updateMutation.isPending}
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
