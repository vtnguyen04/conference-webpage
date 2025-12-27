import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Award, Trash2, UserCheck, Mail, Calendar, MoreHorizontal } from "lucide-react";
import type { Registration, Session } from "@shared/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RegistrationTableProps = {
  registrations: Registration[];
  isLoading: boolean;
  selectedRows: Record<string, boolean>;
  handleSelectAll: (checked: boolean | "indeterminate") => void;
  handleRowSelect: (id: string, checked: boolean) => void;
  sessionsMap: Map<string, Session>;
  handleCheckIn: (registrationId: string) => void;
  checkInMutation: any;
  handleDelete: (id: string) => void;
  isSessionActive: (session?: Session) => boolean;
};

const getRoleForRegistration = (registration: Registration) => {
  if (registration.role === 'moderator') 
    return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold text-[10px] uppercase tracking-tighter">Chủ tọa</Badge>;
  if (registration.role === 'speaker') 
    return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px] uppercase tracking-tighter">Báo cáo viên</Badge>;
  if (registration.role === 'both') 
    return <Badge className="bg-purple-50 text-purple-700 border-purple-100 font-bold text-[10px] uppercase tracking-tighter">Cả hai</Badge>;
  return <Badge variant="outline" className="text-slate-400 border-slate-200 font-bold text-[10px] uppercase tracking-tighter">Tham dự</Badge>;
};

export const RegistrationTable = ({
  registrations,
  isLoading,
  selectedRows,
  handleSelectAll,
  handleRowSelect,
  sessionsMap,
  handleCheckIn,
  checkInMutation,
  handleDelete,
  isSessionActive,
}: RegistrationTableProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="w-[50px] py-4 px-6 text-center">
              <Checkbox
                checked={registrations.length > 0 && Object.values(selectedRows).filter(Boolean).length === registrations.length}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-indigo-600"
              />
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-2">Họ và tên</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-2">Vai trò</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-2">Phiên</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-2">Trạng thái</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-2 text-center">Yêu cầu</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 py-4 px-6">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : registrations.length > 0 ? (
            registrations.map((registration) => {
              const session = sessionsMap.get(registration.sessionId);
              const sessionIsActive = isSessionActive(session);
              const isSelected = selectedRows[registration.id] || false;

              return (
                <TableRow key={registration.id} className={cn(
                  "group transition-colors border-slate-50",
                  isSelected ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                )}>
                  <TableCell className="py-4 px-6 text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(registration.id, !!checked)}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 leading-tight">
                        {registration.fullName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1 text-slate-300" />
                        {registration.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-2">{getRoleForRegistration(registration)}</TableCell>
                  <TableCell className="py-4 px-2">
                    <div className="flex flex-col max-w-[180px]">
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {session?.title || "N/A"}
                      </span>
                      {session && (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center mt-0.5">
                          <Calendar className="h-3 w-3 mr-1 text-slate-300" />
                          Hội trường: {session.room || "TBA"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-2">
                    <Badge variant={registration.status === "confirmed" ? "default" : "secondary"} className={cn(
                      "font-bold text-[10px] uppercase tracking-widest px-2 py-0.5",
                      registration.status === "confirmed" ? "bg-blue-500 hover:bg-blue-600" : ""
                    )}>
                      {registration.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-2 text-center">
                    {registration.cmeCertificateRequested && (
                      <Badge className="bg-amber-50 text-amber-600 border-amber-100 p-1.5 rounded-lg shadow-sm">
                        <Award className="h-3.5 w-3.5" />
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCheckIn(registration.id)} 
                        disabled={checkInMutation.isPending || registration.status === 'checked-in' || !sessionIsActive}
                        className={cn(
                          "h-8 text-[10px] font-extrabold uppercase tracking-tight px-3",
                          registration.status === 'checked-in' ? "opacity-50 cursor-not-allowed" : "text-emerald-600 hover:bg-emerald-50 border-emerald-100"
                        )}
                      >
                        <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Check-in
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => handleDelete(registration.id)}
                            className="py-2 px-3 text-xs font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Xóa bỏ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center bg-slate-50/30">
                <p className="text-slate-500 font-medium">Chưa có đăng ký nào.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};