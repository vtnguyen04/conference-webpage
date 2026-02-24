import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSpeakers } from "@/hooks/useSpeakers";
import { useImageUpload } from "@/hooks/useImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminView } from "@/hooks/useAdminView";
import { insertSpeakerSchema } from "@shared/validation";
import type { Speaker, InsertSpeaker } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Pencil, 
  Trash2, 
  User, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  Info, 
  MoreHorizontal 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUploader } from "@/components/ImageUploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SpeakersManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { 
    speakers, 
    isLoading, 
    createSpeaker, 
    updateSpeaker, 
    deleteSpeaker, 
    isCreating, 
    isUpdating, 
    isDeleting: isDeletingSpeaker 
  } = useSpeakers(viewingSlug || undefined);

  const { uploadImage, deleteImage, isUploading, isDeleting } = useImageUpload({
    onSuccess: (path) => form.setValue("photoUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("photoUrl", "", { shouldValidate: true }),
  });

  const form = useForm<InsertSpeaker>({
    resolver: zodResolver(insertSpeakerSchema),
    defaultValues: {
      name: "",
      title: "",
      credentials: "",
      specialty: "",
      photoUrl: "",
      bio: "",
      email: "",
      role: "speaker",
    },
  });

  const handleAdd = () => {
    if (isReadOnly) return;
    setEditingSpeaker(null);
    form.reset({
      name: "",
      title: "",
      credentials: "",
      specialty: "",
      photoUrl: "",
      bio: "",
      email: "",
      role: "speaker",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (speaker: Speaker) => {
    if (isReadOnly) return;
    setEditingSpeaker(speaker);
    form.reset({
      name: speaker.name,
      title: speaker.title,
      credentials: speaker.credentials,
      specialty: speaker.specialty,
      photoUrl: speaker.photoUrl,
      bio: speaker.bio,
      email: speaker.email || "",
      role: speaker.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) return;
    if (confirm(`Bạn có chắc muốn xóa báo cáo viên "${name}"?`)) {
      deleteSpeaker(id);
    }
  };

  const onSubmit = (data: InsertSpeaker) => {
    if (isReadOnly) return;
    if (editingSpeaker) {
      updateSpeaker({ id: editingSpeaker.id, data });
    } else {
      createSpeaker(data);
    }
    setIsDialogOpen(false);
  };

  const renderSpeakerCard = (speaker: Speaker) => (
    <Card 
      key={speaker.id} 
      className="group border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all duration-300 overflow-hidden bg-white"
    >
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm ring-1 ring-slate-100">
              <AvatarImage src={speaker.photoUrl} alt={speaker.name} className="object-cover" />
              <AvatarFallback className="bg-slate-50 text-slate-400">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex gap-1">
              {speaker.role === "moderator" || speaker.role === "both" ? (
                <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-bold uppercase tracking-tighter">
                  Chủ tọa
                </Badge>
              ) : null}
              {speaker.role === "speaker" || speaker.role === "both" ? (
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] font-bold uppercase tracking-tighter">
                  Báo cáo viên
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
              {speaker.credentials} {speaker.name}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <Briefcase className="h-3 w-3 mr-1.5 text-slate-300" />
              {speaker.title || "Chưa cập nhật"}
            </p>
            <p className="text-xs text-slate-500 font-medium flex items-center">
              <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-slate-300" />
              {speaker.specialty}
            </p>
          </div>
        </div>
        
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center">
            <Info className="h-3 w-3 mr-1" /> Chi tiết
          </span>
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleEdit(speaker)} className="text-indigo-600 cursor-pointer">
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(speaker.id, speaker.name)} className="text-rose-600 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Quản lý Báo cáo viên"
        description="Danh sách các chuyên gia và chủ tọa tham gia báo cáo tại hội nghị."
        onAdd={handleAdd}
        addLabel="Thêm báo cáo viên"
        isReadOnly={isReadOnly}
      />

      <div className="space-y-12">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-dashed">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
          </div>
        ) : speakers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {speakers.map(renderSpeakerCard)}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <User className="h-8 w-8 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Chưa có báo cáo viên nào.</p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">Bắt đầu thêm ngay &rarr;</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingSpeaker ? "Cập nhật báo cáo viên" : "Thêm báo cáo viên mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Điền thông tin chi tiết để hiển thị trên website chính thức.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-4">
                   <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ảnh chân dung</FormLabel>
                        <FormControl>
                          <ImageUploader
                            preview={field.value}
                            onDrop={(files) => uploadImage(files, field.value)}
                            onDelete={() => deleteImage(field.value || "")}
                            isUploading={isUploading}
                            isDeleting={isDeleting}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-[10px] text-amber-700 font-medium flex items-start leading-relaxed">
                      <Info className="h-3 w-3 mr-1.5 mt-0.5 shrink-0" />
                      Khuyến nghị ảnh tỷ lệ 1:1, dung lượng dưới 2MB.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-8 grid grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="credentials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Học hàm học vị</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="TS.BS, PGS.TS..." className="bg-slate-50 border-slate-200" />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Họ và tên</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nguyễn Văn A" className="bg-slate-50 border-slate-200 font-bold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Chức danh / Đơn vị công tác</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Trưởng khoa Tim mạch - Bệnh viện..." className="bg-slate-50 border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Chuyên ngành</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Tim mạch..." className="bg-slate-50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Vai trò</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-200">
                              <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="speaker">Báo cáo viên</SelectItem>
                            <SelectItem value="moderator">Chủ tọa</SelectItem>
                            <SelectItem value="both">Cả hai vai trò</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Email liên hệ (Tùy chọn)</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="example@email.com" className="bg-slate-50 border-slate-200" />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            Dùng để gửi thư mời và thông tin đăng nhập tự động cho chủ tọa.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tiểu sử & Tóm tắt chuyên môn</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={5} className="bg-slate-50 border-slate-200 resize-none" placeholder="Nhập thông tin giới thiệu chi tiết về báo cáo viên..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-8">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold text-slate-500">
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating || isReadOnly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
                >
                  {isCreating || isUpdating ? "Đang xử lý..." : editingSpeaker ? "Lưu thay đổi" : "Xác nhận tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}