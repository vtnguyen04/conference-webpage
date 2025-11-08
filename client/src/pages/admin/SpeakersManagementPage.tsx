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
import type { Speaker, InsertSpeaker, Conference } from "@shared/schema";
import { insertSpeakerSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";

export default function SpeakersManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers"],
  });

  const { data: activeConference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
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
      role: "speaker",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSpeaker) => {
      return await apiRequest("POST", "/api/speakers", data);
    },
    onSuccess: () => {
      toast({ title: "Tạo diễn giả thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/speakers"] });
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
      toast({ title: "Cập nhật diễn giả thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/speakers"] });
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
      toast({ title: "Xóa diễn giả thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/speakers"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/admin/speakers/all");
    },
    onSuccess: () => {
      toast({ title: "Xóa tất cả diễn giả thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/speakers"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    setEditingSpeaker(null);
    form.reset({
      name: "",
      title: "",
      credentials: "",
      specialty: "",
      photoUrl: "",
      bio: "",
      role: "speaker",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    form.reset({
      name: speaker.name,
      title: speaker.title,
      credentials: speaker.credentials,
      specialty: speaker.specialty,
      photoUrl: speaker.photoUrl,
      bio: speaker.bio,
      role: speaker.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa diễn giả "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("Bạn có chắc muốn xóa TẤT CẢ diễn giả? Hành động này không thể hoàn tác.")) {
      deleteAllMutation.mutate();
    }
  };

  const onSubmit = (data: InsertSpeaker) => {
    if (editingSpeaker) {
      updateMutation.mutate({ id: editingSpeaker.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const moderators = speakers.filter((s) => s.role === "moderator" || s.role === "both");
  const regularSpeakers = speakers.filter((s) => s.role === "speaker" || s.role === "both");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-speakers-mgmt-title">
          Quản lý diễn giả & chủ tọa
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            data-testid="button-delete-all-speakers"
            disabled={deleteAllMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
          <Button onClick={handleAdd} data-testid="button-add-speaker">
            <Plus className="mr-2 h-4 w-4" />
            Thêm diễn giả
          </Button>
        </div>
      </div>

      {moderators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chủ tọa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {moderators.map((speaker) => (
                <div
                  key={speaker.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                  data-testid={`speaker-item-${speaker.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{speaker.credentials} {speaker.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{speaker.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{speaker.specialty}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(speaker)}
                      data-testid={`button-edit-speaker-${speaker.id}`}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(speaker.id, speaker.name)}
                      data-testid={`button-delete-speaker-${speaker.id}`}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {regularSpeakers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diễn giả</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularSpeakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                  data-testid={`speaker-item-${speaker.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{speaker.credentials} {speaker.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{speaker.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{speaker.specialty}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(speaker)}
                      data-testid={`button-edit-speaker-${speaker.id}`}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(speaker.id, speaker.name)}
                      data-testid={`button-delete-speaker-${speaker.id}`}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {speakers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Chưa có diễn giả nào. Nhấn "Thêm diễn giả" để tạo mới.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpeaker ? "Chỉnh sửa diễn giả" : "Thêm diễn giả mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về diễn giả/chủ tọa
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ảnh diễn giả</FormLabel>
                    <FormControl>
                      <ImageUploader
                        currentImageUrl={field.value}
                        onUploadSuccess={(newPath) => field.onChange(newPath)}
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
                        <Input {...field} placeholder="TS.BS, PGS.TS..." data-testid="input-speaker-credentials" />
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
                        <Input {...field} data-testid="input-speaker-name" />
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
                      <Input {...field} placeholder="Trưởng khoa, Giám đốc..." data-testid="input-speaker-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chuyên khoa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tim mạch, Tiêu hóa..." data-testid="input-speaker-specialty" />
                    </FormControl>
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
                      <Textarea {...field} rows={4} data-testid="input-speaker-bio" />
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
                    <FormLabel>Vai trò</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-speaker-role">
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="speaker">Diễn giả</SelectItem>
                        <SelectItem value="moderator">Chủ tọa</SelectItem>
                        <SelectItem value="both">Cả hai</SelectItem>
                      </SelectContent>
                    </Select>
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
                  data-testid="button-submit-speaker"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingSpeaker
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
