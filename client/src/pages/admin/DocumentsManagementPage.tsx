import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImageUploader } from "@/components/ImageUploader";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminView } from "@/hooks/useAdminView";
import { useDocuments } from "@/hooks/useDocuments";
import { useImageUpload } from "@/hooks/useImageUpload";
import { uploadService } from "@/services/uploadService";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Document, InsertDocument } from "@shared/types";
import { insertDocumentSchema } from "@shared/validation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, Eye, FileText, MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import "react-quill-new/dist/quill.snow.css";
const ReactQuill = React.lazy(() => import("react-quill-new"));

export default function DocumentsManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const quillRef = useRef<any>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const {
    documents,
    isLoading,
    createDocument,
    updateDocument,
    deleteDocument,
    isCreating,
    isUpdating,
  } = useDocuments(viewingSlug || undefined);

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
    fieldName: "pdf",
    onSuccess: (path) => form.setValue("pdfUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("pdfUrl", "", { shouldValidate: true }),
  });

  const form = useForm<InsertDocument>({
    resolver: zodResolver(insertDocumentSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      featuredImageUrl: "",
      pdfUrl: "",
      publishedAt: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingDocument) {
        form.reset({
          title: editingDocument.title,
          content: editingDocument.content,
          excerpt: editingDocument.excerpt,
          featuredImageUrl: editingDocument.featuredImageUrl || "",
          pdfUrl: editingDocument.pdfUrl || "",
          publishedAt: editingDocument.publishedAt && !isNaN(new Date(editingDocument.publishedAt).getTime())
            ? new Date(editingDocument.publishedAt).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        });
      } else {
        form.reset({
          title: "",
          content: "",
          excerpt: "",
          featuredImageUrl: "",
          pdfUrl: "",
          publishedAt: new Date().toISOString().slice(0, 16),
        });
      }
    }
  }, [editingDocument, isDialogOpen, form]);

  const handleAdd = () => {
    if (isReadOnly) return;
    setEditingDocument(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (document: Document) => {
    if (isReadOnly) return;
    setEditingDocument(document);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (isReadOnly) return;
    if (confirm(`Xác nhận xóa kỷ yếu: "${title}"?`)) {
      deleteDocument(id);
    }
  };

  const onSubmit = (data: InsertDocument) => {
    if (isReadOnly) return;
    if (editingDocument) {
      updateDocument({ id: editingDocument.id, data });
    } else {
      createDocument(data);
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

  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
  });

  const renderDocumentItem = (document: Document) => (
    <div
      key={document.id}
      className="group relative bg-white border border-slate-200/60 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row">
        {document.featuredImageUrl && (
          <div className="md:w-48 h-48 md:h-auto shrink-0 overflow-hidden">
            <img
              src={document.featuredImageUrl}
              alt={document.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter shadow-sm border-none bg-indigo-50 text-indigo-700">
                Kỷ yếu
              </Badge>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
                <Clock className="h-3 w-3 mr-1.5" />
                {document.publishedAt && !isNaN(new Date(document.publishedAt).getTime())
                  ? format(new Date(document.publishedAt), "dd/MM/yyyy HH:mm", { locale: vi })
                  : "Đang cập nhật"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{document.views || 0}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-2">
              {document.title}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed">
              {document.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              {document.pdfUrl && (
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
                  <DropdownMenuItem onClick={() => handleEdit(document)} className="text-indigo-600 font-medium cursor-pointer">
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(document.id, document.title)} className="text-rose-600 font-medium cursor-pointer">
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
        title="Quản lý Kỷ yếu"
        description="Đăng tải và quản lý các tài liệu, bài báo khoa học và kỷ yếu của hội nghị."
        onAdd={handleAdd}
        addLabel="Đăng kỷ yếu"
        isReadOnly={isReadOnly}
      />

      <div className="space-y-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-dashed">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
          </div>
        ) : sortedDocuments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sortedDocuments.map(renderDocumentItem)}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Hệ thống chưa có kỷ yếu nào.</p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">Đăng kỷ yếu đầu tiên &rarr;</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingDocument ? "Cập nhật kỷ yếu" : "Đăng kỷ yếu mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Nội dung sẽ được hiển thị trong mục kỷ yếu của hội nghị.
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tiêu đề kỷ yếu</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nhập tiêu đề kỷ yếu..." className="bg-slate-50 border-slate-200 font-bold h-11" readOnly={isReadOnly} />
                        </FormControl>
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

                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tóm tắt ngắn</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} className="bg-slate-50 border-slate-200 resize-none" placeholder="Mô tả tóm tắt nội dung kỷ yếu..." readOnly={isReadOnly} />
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
                  {isCreating || isUpdating ? "Đang xử lý..." : editingDocument ? "Lưu thay đổi" : "Đăng kỷ yếu"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
