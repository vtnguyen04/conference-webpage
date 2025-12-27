import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Trash2, Copy, Building, Calendar, MoreHorizontal, Power, ExternalLink, Settings2, Info } from 'lucide-react';
import { useConferences } from '@/hooks/useConferences';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ConferencesManagementPage: React.FC = () => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [newConferenceName, setNewConferenceName] = useState<string>('');

  const { 
    conferences, 
    isLoading, 
    isError, 
    error, 
    activateConference, 
    deleteConference, 
    cloneConference,
    isActivating,
    isDeleting,
    isCloning
  } = useConferences();

  const handleDeleteClick = (slug: string) => {
    setSelectedSlug(slug);
    setIsAlertOpen(true);
  };

  const handleCloneClick = (slug: string) => {
    setSelectedSlug(slug);
    const currentYear = new Date().getFullYear();
    setNewConferenceName(`Bản sao của ${conferences?.find(c => c.slug === slug)?.name} ${currentYear}`);
    setIsCloneDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSlug) {
      deleteConference(selectedSlug);
    }
  };

  const handleConfirmClone = () => {
    if (selectedSlug && newConferenceName) {
      cloneConference({ fromSlug: selectedSlug, newConferenceName });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="rounded-xl border-rose-100 bg-rose-50">
        <AlertTitle className="font-bold uppercase tracking-tight">Lỗi hệ thống</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Quản lý Hệ thống Hội nghị"
        description="Quản lý vòng đời của tất cả hội nghị trong hệ thống. Bạn có thể kích hoạt, sao chép hoặc lưu trữ dữ liệu."
      />

      <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-[45%] text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-6">Thông tin hội nghị</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-6">Trạng thái vận hành</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-6">Ngày bắt đầu</TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-6">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conferences && conferences.length > 0 ? (
              conferences.map((conference) => (
                <TableRow key={conference.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ring-1",
                        conference.isActive ? "bg-indigo-600 ring-indigo-500 shadow-indigo-100" : "bg-slate-100 ring-slate-200 text-slate-400"
                      )}>
                        <Building className={cn("h-5 w-5", conference.isActive ? "text-white" : "text-slate-400")} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {conference.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          Slug: {conference.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    {conference.isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 px-3 py-1 font-bold text-[10px] uppercase tracking-tighter">
                        <CheckCircle className="h-3 w-3 mr-1.5 animate-pulse text-emerald-500" />
                        Đang hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 px-3 py-1 font-bold text-[10px] uppercase tracking-tighter">
                        <XCircle className="h-3 w-3 mr-1.5" />
                        Lưu trữ / Đóng
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="flex items-center text-xs font-bold text-slate-600">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                      {new Date(conference.startDate).toLocaleDateString('vi-VN')}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        onClick={() => handleCloneClick(conference.slug)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Sao chép
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cấu hình hệ thống</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="py-2.5 font-medium flex items-center gap-3 cursor-pointer">
                            <Settings2 className="h-4 w-4 text-slate-500" /> Cấu hình chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem className="py-2.5 font-medium flex items-center gap-3 cursor-pointer">
                            <ExternalLink className="h-4 w-4 text-slate-500" /> Xem bản Preview
                          </DropdownMenuItem>
                          {!conference.isActive && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="py-2.5 font-bold text-indigo-600 flex items-center gap-3 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer"
                                onClick={() => activateConference(conference.slug)}
                                disabled={isActivating}
                              >
                                <Power className="h-4 w-4" /> {isActivating ? 'Đang kích hoạt...' : 'Kích hoạt hội nghị này'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="py-2.5 font-bold text-rose-600 flex items-center gap-3 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                                onClick={() => handleDeleteClick(conference.slug)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" /> {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Building className="h-10 w-10 text-slate-200" />
                    <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu hội nghị nào.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-rose-600 h-2 w-full" />
          <div className="p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-extrabold text-slate-900">Xác nhận xóa hệ thống?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 font-medium mt-2 leading-relaxed">
                Hành động này <span className="text-rose-600 font-bold underline">không thể hoàn tác</span>. Toàn bộ cơ sở dữ liệu của hội nghị <span className="font-bold text-slate-900">"{selectedSlug}"</span> bao gồm danh sách đăng ký, file ảnh, báo cáo viên sẽ bị xóa sạch khỏi máy chủ.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="font-bold border-slate-200">Hủy bỏ</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-100"
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xử lý...' : 'Vâng, xóa nó'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent className="max-w-md p-0 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">Sao chép cấu hình</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tạo một hội nghị mới dựa trên dữ liệu của "{selectedSlug}".
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newConferenceName" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Tên hội nghị mới
              </Label>
              <Input
                id="newConferenceName"
                type="text"
                value={newConferenceName}
                onChange={(e) => setNewConferenceName(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 font-bold focus:bg-white transition-all"
                placeholder="Ví dụ: Hội nghị Khoa học 2026..."
              />
            </div>
            
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                Hệ thống sẽ sao chép toàn bộ danh sách Diễn giả, Phiên họp, Nhà tài trợ từ bản cũ sang bản mới để tiết kiệm thời gian nhập liệu.
              </p>
            </div>
          </div>
          <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)} className="font-bold border-slate-200">Hủy</Button>
            <Button 
              onClick={handleConfirmClone} 
              disabled={isCloning}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-100"
            >
              {isCloning ? 'Đang sao chép...' : 'Tạo bản sao mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConferencesManagementPage;