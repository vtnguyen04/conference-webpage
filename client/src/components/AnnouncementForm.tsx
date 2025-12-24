import React, { useState, useMemo, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Announcement, InsertAnnouncement } from "@shared/types";
import { insertAnnouncementSchema } from "@shared/validation";
import { ImageUploader } from "@/components/ImageUploader";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const ReactQuill = React.lazy(() => import("react-quill-new"));
import "react-quill-new/dist/quill.snow.css"; // Import Quill styles
import { useToast } from "@/hooks/use-toast";
import { apiUploadFile } from "@/lib/queryClient";
import { DialogFooter } from "@/components/ui/dialog";

interface AnnouncementFormProps {
  initialData?: Announcement | null;
  onSubmit: (data: InsertAnnouncement) => void;
  isSubmitting: boolean;
  isReadOnly: boolean;
  onImageDrop: (acceptedFiles: File[]) => Promise<void>;
  onImageDelete: () => Promise<void>;
  isImageUploading: boolean;
  isImageDeleting: boolean;
  onPdfFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onPdfDelete: () => Promise<void>;
  isPdfUploading: boolean;
  isPdfDeleting: boolean;
  onCancel: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  isReadOnly,
  onImageDrop,
  onImageDelete,
  isImageUploading,
  isImageDeleting,
  onPdfFileSelect,
  onPdfDelete,
  isPdfUploading,
  isPdfDeleting,
  onCancel,
}) => {
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);

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
    if (initialData) {
      form.reset({
        title: initialData.title,
        content: initialData.content,
        excerpt: initialData.excerpt,
        featuredImageUrl: initialData.featuredImageUrl,
        pdfUrl: initialData.pdfUrl,
        category: initialData.category,
        publishedAt: new Date(initialData.publishedAt).toISOString().slice(0, 16),
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
  }, [initialData, form]);

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

  return (
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
                  onDrop={onImageDrop}
                  onDelete={onImageDelete}
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
                  onFileSelect={onPdfFileSelect}
                  onDelete={onPdfDelete}
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isReadOnly}
            data-testid="button-submit-announcement"
          >
            {isSubmitting
              ? "Đang lưu..."
              : initialData
              ? "Cập nhật"
              : "Tạo mới"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default AnnouncementForm;