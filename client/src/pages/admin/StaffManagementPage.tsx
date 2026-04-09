import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminView } from "@/hooks/useAdminView";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { apiRequest } from "@/services/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import React, { useState } from "react";

export default function StaffManagementPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        assignedSessionIds: [] as string[]
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const fetchStaffAccounts = async () => {
        return await apiRequest("GET", "/api/admin/staff");
    };

    const { data: staffList = [], refetch } = useQuery({
        queryKey: ["/api/admin/staff"],
        queryFn: fetchStaffAccounts,
    });

    const { viewingSlug } = useAdminView();
    const { sessions = [] } = useSessions(viewingSlug || undefined);

    if (user?.role !== "superadmin") {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Truy cập bị từ chối</h2>
                <p className="text-slate-500 mt-2">Bạn không có quyền xem trang này.</p>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSessionToggle = (sessionId: string) => {
        setFormData(prev => ({
            ...prev,
            assignedSessionIds: prev.assignedSessionIds.includes(sessionId)
                ? prev.assignedSessionIds.filter(id => id !== sessionId)
                : [...prev.assignedSessionIds, sessionId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast({ title: "Lỗi mật khẩu", description: "Mật khẩu xác nhận không trùng khớp.", variant: "destructive" });
            return;
        }

        try {
            await apiRequest("POST", "/api/admin/staff", formData);
            toast({ title: "Thành công", description: "Đã tạo tài khoản staff." });
            setIsAddOpen(false);
            setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", assignedSessionIds: [] });
            refetch();
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.message || "Không thể tạo tài khoản.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa staff này không?")) return;
        try {
            await apiRequest("DELETE", `/api/admin/staff/${id}`);
            toast({ title: "Thành công", description: "Đã xóa tài khoản staff." });
            refetch();
        } catch (_error: any) {
            toast({ title: "Lỗi", description: "Không thể xóa.", variant: "destructive" });
        }
    };

    const now = new Date();
    const activeSessionsInfo = sessions.filter(session => {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const isSameDay = now.getFullYear() === startTime.getFullYear() &&
                          now.getMonth() === startTime.getMonth() &&
                          now.getDate() === startTime.getDate();
        if (isSameDay) {
          const currentHour = now.getHours();
          if (currentHour >= 7 && currentHour < 17) return true;
        }
        return (startTime <= now && endTime >= now) || startTime > now; // Allow upcoming sessions and currently active sessions
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Nhân sự</h1>
                    <p className="text-slate-500 mt-1">Quản lý các tài khoản nhân viên và phân công phiên làm việc.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <UserPlus className="w-4 h-4 mr-2" /> Thêm Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
                        <DialogHeader className="p-6 bg-slate-900 text-white">
                            <DialogTitle className="text-xl font-bold">Thêm tài khoản Staff</DialogTitle>
                            <p className="text-sm text-slate-400 mt-1">Điền thông tin chi tiết để cấp quyền truy cập phần mềm.</p>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Họ</label>
                                    <Input name="lastName" value={formData.lastName} onChange={handleChange} required className="bg-slate-50 border-slate-200" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Tên</label>
                                    <Input name="firstName" value={formData.firstName} onChange={handleChange} required className="bg-slate-50 border-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Email</label>
                                <Input name="email" type="email" value={formData.email} onChange={handleChange} required className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2 relative">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Mật khẩu</label>
                                    <div className="relative">
                                        <Input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required minLength={6} className="bg-slate-50 border-slate-200 pr-10" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-9 w-9 text-slate-400 hover:text-indigo-600">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2 relative">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Xác nhận mật khẩu</label>
                                    <div className="relative">
                                        <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} required minLength={6} className="bg-slate-50 border-slate-200 pr-10" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-0 h-9 w-9 text-slate-400 hover:text-indigo-600">
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <label className="text-[11px] font-bold text-indigo-600 uppercase mb-2 block">Phân công quản lý Phiên (Sessions)</label>
                                <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {activeSessionsInfo.length === 0 ? (
                                        <div className="text-sm text-slate-500 text-center py-2">Không có phiên nào đang active.</div>
                                    ) : (
                                        activeSessionsInfo.map((session: any) => (
                                            <div key={session.id} className="flex items-start space-x-3">
                                                <Checkbox
                                                    id={session.id}
                                                    checked={formData.assignedSessionIds.includes(session.id)}
                                                    onCheckedChange={() => handleSessionToggle(session.id)}
                                                    className="mt-1"
                                                />
                                                <div className="space-y-1">
                                                    <label htmlFor={session.id} className="text-sm font-medium leading-none cursor-pointer">
                                                        {session.title}
                                                    </label>
                                                    <p className="text-xs text-slate-500">{new Date(session.startTime).toLocaleDateString("vi-VN")} - {session.room}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 -mx-6 -mb-6 p-6 mt-8 flex justify-end gap-3 border-t border-slate-100">
                                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="font-bold text-slate-500">
                                    Hủy bỏ
                                </Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100">
                                    Xác nhận tạo mới
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow>
                            <TableHead>Họ Tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phiên được phân công</TableHead>
                            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staffList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-slate-500">Chưa có tài khoản staff nào.</TableCell>
                            </TableRow>
                        ) : (
                            staffList.map((staff: any) => (
                                <TableRow key={staff.id}>
                                    <TableCell className="font-medium">{staff.lastName} {staff.firstName}</TableCell>
                                    <TableCell>{staff.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {staff.assignedSessionIds?.length > 0 ? (
                                                staff.assignedSessionIds.map((id: string) => {
                                                    const s = sessions.find((s: any) => s.id === id);
                                                    return <Badge key={id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal truncate max-w-[200px]" title={s?.title}>{s?.title || id}</Badge>;
                                                })
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Chưa phân công</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(staff.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
