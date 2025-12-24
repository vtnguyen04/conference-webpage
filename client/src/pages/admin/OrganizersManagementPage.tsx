import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, User } from "lucide-react";
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
      toast({ title: "Thêm thành viên BTC thành công" });
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
      toast({ title: "Cập nhật thành viên BTC thành công" });
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
      toast({ title: "Xóa thành viên BTC thành công" });
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
      toast({ title: "Xóa tất cả thành viên BTC thành công" });
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
    if (confirm("Bạn có chắc muốn xóa TẤT CẢ thành viên BTC? Hành động này không thể hoàn tác.")) {
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
    if (oldPhotoUrl) {
      formData.append("oldImagePath", oldPhotoUrl);
    }

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
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/upload?filePath=${currentPhotoUrl}`);
      form.setValue("photoUrl", "", { shouldValidate: true });
      toast({ title: "Xóa ảnh thành công" });
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

  const roleOrder: (keyof typeof groupedOrganizers)[] = ["Trưởng Ban", "Phó trưởng Ban", "Thành viên", "Thành viên TK"];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Quản lý Ban tổ chức
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            disabled={deleteAllMutation.isPending || isReadOnly}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
          <Button onClick={handleAdd} disabled={isReadOnly}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm thành viên
          </Button>
        </div>
      </div>

      {roleOrder.map(role => (
        groupedOrganizers[role] && (
          <Card key={role}>
            <CardHeader>
              <CardTitle>{role}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedOrganizers[role].map((organizer) => (
                  <div
                    key={organizer.id}
                    className="border rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={organizer.photoUrl} alt={organizer.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{organizer.credentials} {organizer.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{organizer.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(organizer)}
                        className="flex-1"
                        disabled={isReadOnly}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(organizer.id, organizer.name)}
                        className="flex-1"
                        disabled={isReadOnly}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ))}

      {organizers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Chưa có thành viên ban tổ chức nào. Nhấn "Thêm thành viên" để tạo mới.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrganizer ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về thành viên ban tổ chức
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ảnh</FormLabel>
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
                    <FormDescription>
                      Tải lên ảnh chân dung (tỷ lệ 1:1 khuyến nghị)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="credentials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Học hàm học vị</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="TS.BS, PGS.TS..." />
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
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                    <FormLabel>Chức danh</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Trưởng khoa, Giám đốc..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="organizingRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhiệm vụ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger>
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
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiểu sử</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thứ tự hiển thị</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                      </FormControl>
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
                  disabled={createMutation.isPending || updateMutation.isPending || isReadOnly}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingOrganizer
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
