import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Clock, MapPin, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Session, InsertSession, Speaker } from "@shared/schema";
import { insertSessionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminView } from "@/hooks/useAdminView";

export default function SessionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", viewingSlug],
    queryFn: async () => {
      if (!viewingSlug) return [];
      return await apiRequest("GET", `/api/sessions/${viewingSlug}`);
    },
    enabled: !!viewingSlug,
  });

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers", viewingSlug],
    queryFn: async () => {
      if (!viewingSlug) return [];
      return await apiRequest("GET", `/api/speakers/${viewingSlug}`);
    },
    enabled: !!viewingSlug,
  });

  const form = useForm<InsertSession>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      day: 1,
      title: "",
      track: "",
      description: "",
      descriptionMd: "",
      startTime: "",
      endTime: "",
      room: "",
      type: "",
      chairIds: [],
      agendaItems: [],
      materials: [],
      capacity: null,
    },
  });

  const { fields: agendaFields, append: appendAgenda, remove: removeAgenda } = useFieldArray({
    control: form.control,
    name: "agendaItems",
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSession) => {
      return await apiRequest("POST", "/api/sessions", data);
    },
    onSuccess: () => {
      toast({ title: "Tạo phiên họp thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/sessions", viewingSlug] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertSession }) => {
      return await apiRequest("PUT", `/api/sessions/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Cập nhật phiên họp thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/sessions", viewingSlug] });
      setIsDialogOpen(false);
      setEditingSession(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Xóa phiên họp thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/sessions", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/admin/sessions/all");
    },
    onSuccess: () => {
      toast({ title: "Xóa tất cả phiên họp thành công" });
      queryClient.refetchQueries({ queryKey: ["/api/sessions", viewingSlug] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (isReadOnly) return;
    setEditingSession(null);
    form.reset({
      day: 1,
      title: "",
      track: "",
      description: "",
      descriptionMd: "",
      startTime: "",
      endTime: "",
      room: "",
      type: "",
      chairIds: [],
      agendaItems: [],
      materials: [],
      capacity: null,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (session: Session) => {
    if (isReadOnly) return;
    setEditingSession(session);
    form.reset({
      day: session.day,
      title: session.title,
      track: session.track,
      description: session.description,
      descriptionMd: session.descriptionMd || "",
      startTime: session.startTime,
      endTime: session.endTime,
      room: session.room,
      type: session.type,
      chairIds: session.chairIds || [],
      agendaItems: session.agendaItems || [],
      materials: session.materials || [],
      capacity: session.capacity || null,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (isReadOnly) return;
    if (confirm(`Bạn có chắc muốn xóa phiên họp "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = async () => {
    if (isReadOnly) return;
    if (confirm("Bạn có chắc muốn xóa TẤT CẢ phiên họp? Hành động này không thể hoàn tác.")) {
      deleteAllMutation.mutate();
    }
  };

  const onSubmit = (data: InsertSession) => {
    if (isReadOnly) return;
    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const sessionsByDay = sessions.reduce((acc, session) => {
    if (!acc[session.day]) {
      acc[session.day] = [];
    }
    acc[session.day].push(session);
    return acc;
  }, {} as Record<number, Session[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-sessions-title">
          Quản lý phiên họp
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            data-testid="button-delete-all-sessions"
            disabled={deleteAllMutation.isPending || isReadOnly}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
          <Button onClick={handleAdd} data-testid="button-add-session" disabled={isReadOnly}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm phiên họp
          </Button>
        </div>
      </div>

      {Object.keys(sessionsByDay).sort().map((day) => (
        <Card key={day}>
          <CardHeader>
            <CardTitle>Ngày {day}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionsByDay[Number(day)].map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                  data-testid={`session-item-${session.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 text-sm text-primary font-semibold">
                          <Clock className="h-4 w-4" />
                          {format(new Date(session.startTime), "HH:mm", { locale: vi })} -{" "}
                          {format(new Date(session.endTime), "HH:mm", { locale: vi })}
                        </div>
                        {session.track && (
                          <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                            {session.track}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{session.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.room || "TBA"}
                        </span>
                        <span className="bg-muted px-2 py-0.5 rounded text-xs">
                          {session.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(session)}
                        data-testid={`button-edit-session-${session.id}`}
                        disabled={isReadOnly}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(session.id, session.title)}
                        data-testid={`button-delete-session-${session.id}`}
                        disabled={isReadOnly}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {sessions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Chưa có phiên họp nào. Nhấn "Thêm phiên họp" để tạo mới.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Chỉnh sửa phiên họp" : "Thêm phiên họp mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về phiên họp
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-session-day"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="track"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Track</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Toàn thể, Phẫu thuật..." data-testid="input-session-track" />
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
                    <FormLabel>Tiêu đề</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-session-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả ngắn</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-session-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chairIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chủ tọa</FormLabel>
                    <FormDescription>
                      Chọn một hoặc nhiều chủ tọa cho phiên họp này.
                    </FormDescription>
                    <ScrollArea className="h-40 rounded-md border">
                      <div className="p-4">
                        {speakers
                          .filter(
                            (speaker) =>
                              speaker.role === "moderator" ||
                              speaker.role === "both"
                          )
                          .map((speaker) => (
                            <FormField
                              key={speaker.id}
                              control={form.control}
                              name="chairIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={speaker.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          speaker.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                speaker.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) =>
                                                    value !== speaker.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {speaker.credentials} {speaker.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                      </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giờ bắt đầu</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-session-start" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giờ kết thúc</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-session-end" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phòng/Hội trường</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Hội trường 3D" data-testid="input-session-room" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                                        <FormLabel>Loại phiên</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="Khai mạc, Báo cáo, Thảo luận..." data-testid="input-session-type" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                      
                                  <FormField
                                    control={form.control}
                                    name="capacity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Sức chứa (để trống nếu không giới hạn)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                            data-testid="input-session-capacity"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Chương trình chi tiết (Agenda)</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendAgenda({ timeSlot: "", title: "", speakerId: null })}
                    data-testid="button-add-agenda-item"
                    disabled={isReadOnly}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm mục
                  </Button>
                </div>
                <FormDescription>
                  Thêm các mục chương trình theo thời gian (ví dụ: Khai mạc, Báo cáo, Thảo luận)
                </FormDescription>
                {agendaFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Mục {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAgenda(index)}
                        data-testid={`button-remove-agenda-${index}`}
                        disabled={isReadOnly}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`agendaItems.${index}.timeSlot`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thời gian</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="07g00-07g30" data-testid={`input-agenda-time-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`agendaItems.${index}.speakerId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Báo cáo viên (tùy chọn)</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "_none_" ? null : value)} 
                              value={field.value || "_none_"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid={`select-agenda-speaker-${index}`}>
                                  <SelectValue placeholder="Không có báo cáo viên" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="_none_">Không có báo cáo viên</SelectItem>
                                {speakers.map((speaker) => (
                                  <SelectItem key={speaker.id} value={speaker.id}>
                                    {speaker.credentials} {speaker.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`agendaItems.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiêu đề</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Khai mạc, Báo cáo chuyên đề..." data-testid={`input-agenda-title-${index}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`agendaItems.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} placeholder="Ghi chú bổ sung..." data-testid={`input-agenda-notes-${index}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                {agendaFields.length === 0 && (
                  <div className="text-center py-6 border rounded-lg border-dashed">
                    <p className="text-sm text-muted-foreground">
                      Chưa có mục nào. Nhấn "Thêm mục" để bắt đầu.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || isReadOnly}
                  data-testid="button-submit-session"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingSession
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