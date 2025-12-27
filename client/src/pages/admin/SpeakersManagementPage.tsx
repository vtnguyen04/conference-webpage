import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, User, Mail, GraduationCap, Briefcase, Info, MoreHorizontal } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { Speaker, InsertSpeaker } from "@shared/types";
import { insertSpeakerSchema } from "@shared/validation";
import { apiRequest, queryClient, apiUploadFile } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";
import { useAdminView } from "@/hooks/useAdminView";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SpeakersManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { uploadImage, deleteImage, isUploading, isDeleting } = useImageUpload({
    onSuccess: (path) => form.setValue("photoUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("photoUrl", "", { shouldValidate: true }),
  });

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers", viewingSlug],
    queryFn: async () => {
      if (!viewingSlug) return [];
      return await apiRequest("GET", `/api/speakers/${viewingSlug}`);
    },
    enabled: !!viewingSlug,
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertSpeaker) => {
      return await apiRequest("POST", "/api/speakers", data);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm báo cáo viên mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", viewingSlug] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertSpeaker }) => {
      return await apiRequest("PUT", `/api/speakers/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật thông tin." });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", viewingSlug] });
      setIsDialogOpen(false);
      setEditingSpeaker(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/speakers/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa báo cáo viên." });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
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
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertSpeaker) => {
    if (isReadOnly) return;
    if (editingSpeaker) {
      updateMutation.mutate({ id: editingSpeaker.id, data });
    } else {
      createMutation.mutate(data);
    }
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
              {speaker.title || "Chưa cập nhật chức danh"}
            </p>
            <p className="text-xs text-slate-500 font-medium flex items-center">
              <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-slate-300" />
              {speaker.specialty}
            </p>
            {speaker.email && (
              <p className="text-xs text-indigo-500/80 font-medium flex items-center pt-1">
                <Mail className="h-3 w-3 mr-1.5" />
                {speaker.email}
              </p>
            )}
          </div>
        </div>
        
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center">
            <Info className="h-3 w-3 mr-1" />
            Chi tiết
          </span>
          <div className="flex items-center gap-1">
            {!isReadOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 font-medium">
                  <DropdownMenuItem onClick={() => handleEdit(speaker)} className="text-indigo-600">
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(speaker.id, speaker.name)} className="text-rose-600">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Xóa bỏ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Quản lý Báo cáo viên & Chủ tọa"
        description="Quản lý danh sách các chuyên gia, báo cáo viên và chủ tọa tham gia vào các phiên họp của hội nghị."
        onAdd={handleAdd}
        addLabel="Thêm báo cáo viên"
        isReadOnly={isReadOnly}
      />

      <div className="space-y-12">
        {speakers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {speakers.map(renderSpeakerCard)}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <User className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                Chưa có báo cáo viên nào trong hệ thống.
              </p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">
                Bắt đầu thêm ngay &rarr;
              </Button>
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
                {/* Left Side: Avatar Upload */}
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
                            onDelete={() => deleteImage(field.value)}
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
                      Khuyến nghị ảnh tỷ lệ 1:1, dung lượng dưới 2MB để có tốc độ tải trang tốt nhất.
                    </p>
                  </div>
                </div>

                {/* Right Side: Form Fields */}
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
                            <Input {...field} placeholder="Trưởng khoa Tim mạch - Bệnh viện Đa khoa Trung ương" className="bg-slate-50 border-slate-200" />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Chuyên khoa</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Tim mạch, Nội khoa..." className="bg-slate-50 border-slate-200" />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Vai trò trong hội nghị</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-200">
                              <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="speaker" className="font-medium">Báo cáo viên</SelectItem>
                            <SelectItem value="moderator" className="font-medium">Chủ tọa</SelectItem>
                            <SelectItem value="both" className="font-medium">Cả hai vai trò</SelectItem>
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
                  disabled={createMutation.isPending || updateMutation.isPending || isReadOnly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang xử lý..."
                    : editingSpeaker
                    ? "Lưu thay đổi"
                    : "Xác nhận tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}