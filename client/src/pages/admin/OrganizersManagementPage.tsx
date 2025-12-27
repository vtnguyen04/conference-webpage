import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, User, MoreHorizontal, Info, Briefcase, GraduationCap } from "lucide-react";
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
import type { Organizer, InsertOrganizer } from "@shared/types";
import { insertOrganizerSchema } from "@shared/validation";
import { apiRequest, queryClient, apiUploadFile } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";
import { useAdminView } from "@/hooks/useAdminView";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OrganizersManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState<Organizer | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { data: organizers = [] } = useQuery<Organizer[]>({
    queryKey: ["/api/organizers", viewingSlug],
    queryFn: async () => {
      if (!viewingSlug) return [];
      return await apiRequest("GET", `/api/organizers/${viewingSlug}`);
    },
    enabled: !!viewingSlug,
  });

  const form = useForm<InsertOrganizer>({
    resolver: zodResolver(insertOrganizerSchema),
    defaultValues: {
      name: "",
      title: "",
      credentials: "",
      photoUrl: "",
      bio: "",
      organizingRole: "Thành viên",
      displayOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOrganizer) => {
      return await apiRequest("POST", "/api/organizers", data);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm thành viên BTC mới." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertOrganizer }) => {
      return await apiRequest("PUT", `/api/organizers/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật thông tin thành viên." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
      setIsDialogOpen(false);
      setEditingOrganizer(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/organizers/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa thành viên khỏi BTC." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/admin/organizers/all");
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã dọn sạch danh sách BTC." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizers", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (isReadOnly) return;
    setEditingOrganizer(null);
    form.reset({
      name: "",
      title: "",
      credentials: "",
      photoUrl: "",
      bio: "",
      organizingRole: "Thành viên",
      displayOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (organizer: Organizer) => {
    if (isReadOnly) return;
    setEditingOrganizer(organizer);
    form.reset({
      name: organizer.name,
      title: organizer.title,
      credentials: organizer.credentials,
      photoUrl: organizer.photoUrl,
      bio: organizer.bio,
      organizingRole: organizer.organizingRole,
      displayOrder: organizer.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) return;
    if (confirm(`Bạn có chắc muốn xóa thành viên "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = async () => {
    if (isReadOnly) return;
    if (confirm("Cảnh báo: Bạn có chắc muốn xóa TẤT CẢ thành viên BTC?")) {
      deleteAllMutation.mutate();
    }
  };

  const onSubmit = (data: InsertOrganizer) => {
    if (isReadOnly) return;
    if (editingOrganizer) {
      updateMutation.mutate({ id: editingOrganizer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0 || isReadOnly) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("image", file);
    const oldPhotoUrl = form.getValues("photoUrl");
    if (oldPhotoUrl) formData.append("oldImagePath", oldPhotoUrl);

    setIsUploading(true);
    try {
      const result = await apiUploadFile("/api/upload", formData);
      form.setValue("photoUrl", result.imagePath, { shouldValidate: true });
      toast({ title: "Tải ảnh lên thành công" });
    } catch (error: any) {
      toast({ title: "Lỗi tải ảnh lên", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (isReadOnly) return;
    const currentPhotoUrl = form.getValues("photoUrl");
    if (!currentPhotoUrl) return;
    if (!confirm("Xác nhận xóa ảnh?")) return;
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/upload?filePath=${currentPhotoUrl}`);
      form.setValue("photoUrl", "", { shouldValidate: true });
      toast({ title: "Đã xóa ảnh" });
    } catch (error: any) {
      toast({ title: "Lỗi xóa ảnh", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const groupedOrganizers = organizers.reduce((acc, organizer) => {
    const role = organizer.organizingRole;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(organizer);
    return acc;
  }, {} as Record<string, Organizer[]>);

  const roleOrder: (string)[] = ["Trưởng Ban", "Phó trưởng Ban", "Thành viên", "Thành viên TK"];

  const renderOrganizerCard = (organizer: Organizer) => (
    <Card 
      key={organizer.id} 
      className="group relative border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all duration-300 bg-white overflow-hidden"
    >
      <CardContent className="p-0">
        <div className="p-5 flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-white shadow-sm ring-1 ring-slate-100">
            <AvatarImage src={organizer.photoUrl} alt={organizer.name} className="object-cover" />
            <AvatarFallback className="bg-slate-50 text-slate-400">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {organizer.credentials} {organizer.name}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center mt-0.5">
              <Briefcase className="h-3 w-3 mr-1.5 text-slate-300" />
              {organizer.title}
            </p>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
            <GraduationCap className="h-3 w-3 mr-1.5" />
            STT: {organizer.displayOrder}
          </span>
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleEdit(organizer)} className="text-indigo-600 font-medium cursor-pointer">
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(organizer.id, organizer.name)} className="text-rose-600 font-medium cursor-pointer">
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
        title="Quản lý Ban tổ chức"
        description="Quản lý nhân sự và phân công nhiệm vụ trong hội đồng ban tổ chức hội nghị."
        onAdd={handleAdd}
        addLabel="Thêm thành viên"
        onDeleteAll={organizers.length > 0 ? handleDeleteAll : undefined}
        isReadOnly={isReadOnly}
      />

      <div className="space-y-10">
        {organizers.length > 0 ? (
          roleOrder.map(role => groupedOrganizers[role] && (
            <div key={role} className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest shadow-sm">
                  {role}
                </Badge>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groupedOrganizers[role]
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map(renderOrganizerCard)}
              </div>
            </div>
          ))
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <User className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                Ban tổ chức hiện đang trống.
              </p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">
                Thêm thành viên đầu tiên &rarr;
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingOrganizer ? "Cập nhật thành viên" : "Thêm thành viên BTC"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Thông tin này sẽ được hiển thị trong trang giới thiệu của hội nghị.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Image Side */}
                <div className="lg:col-span-5 space-y-4">
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ảnh chân dung</FormLabel>
                        <FormControl>
                          <ImageUploader
                            preview={field.value}
                            onDrop={handleImageUpload}
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
                      Sử dụng ảnh chân dung rõ nét, tỷ lệ 1:1 là tốt nhất.
                    </p>
                  </div>
                </div>

                {/* Details Side */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Chức danh / Đơn vị</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Giám đốc Bệnh viện..." className="bg-slate-50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizingRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Nhiệm vụ trong BTC</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Chọn nhiệm vụ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Trưởng Ban">Trưởng Ban</SelectItem>
                              <SelectItem value="Phó trưởng Ban">Phó trưởng Ban</SelectItem>
                              <SelectItem value="Thành viên">Thành viên</SelectItem>
                              <SelectItem value="Thành viên TK">Thành viên TK</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Thứ tự hiển thị</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="bg-slate-50 border-slate-200" />
                          </FormControl>
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
                      <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tiểu sử tóm tắt</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} className="bg-slate-50 border-slate-200 resize-none" placeholder="Nhập giới thiệu chi tiết..." />
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
                    ? "Đang lưu..."
                    : editingOrganizer
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