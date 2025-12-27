import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Clock, MapPin, X, Calendar as CalendarIcon, Info, Users, Layout, MoreHorizontal } from "lucide-react";
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
import type { Session, InsertSession, Speaker } from "@shared/types";
import { insertSessionSchema } from "@shared/validation";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
      toast({ title: "Thành công", description: "Đã tạo phiên họp mới." });
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
      toast({ title: "Thành công", description: "Đã cập nhật phiên họp." });
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
      toast({ title: "Thành công", description: "Đã xóa phiên họp." });
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

  const renderSessionItem = (session: Session) => (
    <div
      key={session.id}
      className="group relative bg-white border border-slate-200/60 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold ring-1 ring-indigo-100">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(session.startTime), "HH:mm", { locale: vi })} -{" "}
              {format(new Date(session.endTime), "HH:mm", { locale: vi })}
            </div>
            {session.track && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase">
                {session.track}
              </Badge>
            )}
            <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
              {session.type}
            </Badge>
          </div>
          
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {session.title}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed">
              {session.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-300" />
              {session.room || "Chưa xác định"}
            </span>
            {session.capacity && (
              <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Users className="h-3.5 w-3.5 mr-1.5 text-slate-300" />
                Sức chứa: {session.capacity}
              </span>
            )}
            {session.agendaItems && session.agendaItems.length > 0 && (
              <span className="flex items-center text-xs font-bold text-indigo-400 uppercase tracking-widest">
                <Layout className="h-3.5 w-3.5 mr-1.5" />
                {session.agendaItems.length} mục chương trình
              </span>
            )}
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex md:flex-col gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 font-medium">
                <DropdownMenuItem onClick={() => handleEdit(session)} className="text-indigo-600">
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(session.id, session.title)} className="text-rose-600">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Xóa bỏ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Lịch trình & Phiên họp"
        description="Xây dựng kịch bản hội nghị, quản lý các phiên báo cáo và phân bổ thời gian cho từng chuyên đề."
        onAdd={handleAdd}
        addLabel="Thêm phiên họp"
        isReadOnly={isReadOnly}
      />

      <div className="space-y-10">
        {Object.keys(sessionsByDay).length > 0 ? (
          Object.keys(sessionsByDay).sort().map((day) => (
            <div key={day} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {day}
                </div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center">
                  Ngày {day} của hội nghị
                  <span className="ml-3 h-[1px] flex-1 bg-slate-100 min-w-[100px]" />
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {sessionsByDay[Number(day)].map(renderSessionItem)}
              </div>
            </div>
          ))
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <CalendarIcon className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                Chưa có dữ liệu phiên họp. Hãy bắt đầu xây dựng lịch trình.
              </p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">
                Tạo phiên họp đầu tiên &rarr;
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingSession ? "Cập nhật phiên họp" : "Thêm phiên họp mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Cấu hình thông tin thời gian, địa điểm và chương trình chi tiết.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Basic Info Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                      <Info className="h-4 w-4" />
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Thông tin cơ bản</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Ngày thứ mấy</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="bg-slate-50 border-slate-200" />
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Track / Nhóm</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Toàn thể, Phẫu thuật..." className="bg-slate-50 border-slate-200" />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tiêu đề phiên họp</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nhập tiêu đề..." className="bg-slate-50 border-slate-200 font-bold" />
                        </FormControl>
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Giờ bắt đầu</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} className="bg-slate-50 border-slate-200" />
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Giờ kết thúc</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} className="bg-slate-50 border-slate-200" />
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Hội trường</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Hội trường 3D..." className="bg-slate-50 border-slate-200" />
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
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Loại phiên</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Khai mạc, Báo cáo..." className="bg-slate-50 border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                      <Users className="h-4 w-4" />
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Chủ tọa & Quản lý</h4>
                  </div>

                  <FormField
                    control={form.control}
                    name="chairIds"
                    render={() => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Chọn Chủ tọa (Moderators)</FormLabel>
                        <ScrollArea className="h-32 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                          <div className="space-y-2">
                            {speakers
                              .filter(s => s.role === "moderator" || s.role === "both")
                              .map((speaker) => (
                                <FormField
                                  key={speaker.id}
                                  control={form.control}
                                  name="chairIds"
                                  render={({ field }) => (
                                    <div className="flex items-center space-x-3 py-1">
                                      <Checkbox
                                        checked={field.value?.includes(speaker.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), speaker.id])
                                            : field.onChange(field.value?.filter(v => v !== speaker.id));
                                        }}
                                        className="border-slate-300 data-[state=checked]:bg-indigo-600"
                                      />
                                      <span className="text-xs font-medium text-slate-700">
                                        {speaker.credentials} {speaker.name}
                                      </span>
                                    </div>
                                  )}
                                />
                              ))}
                          </div>
                        </ScrollArea>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Mô tả tóm tắt</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} className="bg-slate-50 border-slate-200 resize-none" placeholder="Nhập mô tả ngắn về mục đích của phiên họp..." />
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
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Sức chứa tối đa (Tùy chọn)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                            placeholder="Không giới hạn"
                            className="bg-slate-50 border-slate-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Agenda Items Section */}
              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                      <Layout className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Chương trình chi tiết (Agenda)</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Xác định các mục nhỏ trong phiên họp</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendAgenda({ timeSlot: "", title: "", speakerId: null })}
                    className="h-8 border-slate-200 text-indigo-600 font-bold hover:bg-indigo-50"
                    disabled={isReadOnly}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Thêm mục
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agendaFields.map((field, index) => (
                    <div key={field.id} className="relative border border-slate-100 rounded-xl p-4 bg-slate-50/30 group">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAgenda(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isReadOnly}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <FormField
                          control={form.control}
                          name={`agendaItems.${index}.timeSlot`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-400 uppercase">Thời lượng</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="08:00 - 08:15" className="h-8 bg-white text-xs border-slate-200" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`agendaItems.${index}.speakerId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-400 uppercase">Báo cáo viên</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value === "_none_" ? null : value)} 
                                value={field.value || "_none_"}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 bg-white text-xs border-slate-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="_none_">Không có</SelectItem>
                                  {speakers.map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs">
                                      {s.credentials} {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`agendaItems.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase">Tên bài báo cáo / Công việc</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-8 bg-white text-xs font-bold border-slate-200" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                
                {agendaFields.length === 0 && (
                  <div className="text-center py-8 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-xs text-slate-400 font-medium italic">Chưa có mục chương trình chi tiết nào được thiết lập.</p>
                  </div>
                )}
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
                    ? "Đang lưu trữ..."
                    : editingSession
                    ? "Cập nhật dữ liệu"
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