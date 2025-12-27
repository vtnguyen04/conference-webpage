import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOrganizers } from "@/hooks/useOrganizers";
import { useImageUpload } from "@/hooks/useImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminView } from "@/hooks/useAdminView";
import { insertOrganizerSchema } from "@shared/validation";
import type { Organizer, InsertOrganizer } from "@shared/types";
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
  MoreHorizontal, 
  Briefcase, 
  GraduationCap,
  Info 
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

export default function OrganizersManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState<Organizer | null>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { 
    organizers, 
    isLoading, 
    createOrganizer, 
    updateOrganizer, 
    deleteOrganizer, 
    deleteAllOrganizers,
    isCreating, 
    isUpdating, 
    isDeleting: isDeletingOrganizer 
  } = useOrganizers(viewingSlug || undefined);

  const { uploadImage, deleteImage, isUploading, isDeleting: isDeletingImage } = useImageUpload({
    onSuccess: (path) => form.setValue("photoUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("photoUrl", "", { shouldValidate: true }),
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
      photoUrl: organizer.photoUrl || "",
      bio: organizer.bio,
      organizingRole: organizer.organizingRole,
      displayOrder: organizer.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) return;
    if (confirm(`Bạn có chắc muốn xóa thành viên "${name}"?`)) {
      deleteOrganizer(id);
    }
  };

  const handleDeleteAll = async () => {
    if (isReadOnly) return;
    if (confirm("Cảnh báo: Bạn có chắc muốn xóa TẤT CẢ thành viên BTC?")) {
      deleteAllOrganizers();
    }
  };

  const onSubmit = (data: InsertOrganizer) => {
    if (isReadOnly) return;
    if (editingOrganizer) {
      updateOrganizer({ id: editingOrganizer.id, data });
    } else {
      createOrganizer(data);
    }
    setIsDialogOpen(false);
  };

  const groupedOrganizers = organizers.reduce((acc, organizer) => {
    const role = organizer.organizingRole;
    if (!acc[role]) acc[role] = [];
    acc[role].push(organizer);
    return acc;
  }, {} as Record<string, Organizer[]>);

  const roleOrder = ["Trưởng Ban", "Phó trưởng Ban", "Thành viên", "Thành viên TK"];

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
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-dashed">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải danh sách...</span>
          </div>
        ) : organizers.length > 0 ? (
          roleOrder.map(role => groupedOrganizers[role] && (
            <div key={role} className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest shadow-sm">
                  {role}
                </Badge>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedOrganizers[role]
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map(renderOrganizerCard)}
              </div>
            </div>
          ))
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <User className="h-8 w-8 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Ban tổ chức hiện đang trống.</p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">Bắt đầu thêm ngay &rarr;</Button>
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
                            onDrop={(files) => uploadImage(files, field.value || "")}
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Nhiệm vụ BTC</FormLabel>
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Thứ tự</FormLabel>
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
                        <Textarea {...field} rows={4} className="bg-slate-50 border-slate-200 resize-none" placeholder="Nhập giới thiệu..." />
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
                  {isCreating || isUpdating ? "Đang lưu..." : editingOrganizer ? "Lưu thay đổi" : "Xác nhận tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}