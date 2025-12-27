import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Session } from "@shared/types";
import { Download, PlusCircle, Search, Filter, Users, CheckCircle2 } from "lucide-react";

type RegistrationToolbarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleExportCSV: () => void;
  setIsAddUserDialogOpen: (isOpen: boolean) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  numSelected: number;
  setBulkCheckinSessionId: (id: string) => void;
  activeSessions: Session[];
  handleBulkCheckin: () => void;
  bulkCheckinMutation: any;
};

export const RegistrationToolbar = ({
  searchQuery,
  setSearchQuery,
  handleExportCSV,
  setIsAddUserDialogOpen,
  roleFilter,
  setRoleFilter,
  numSelected,
  setBulkCheckinSessionId,
  activeSessions,
  handleBulkCheckin,
  bulkCheckinMutation,
}: RegistrationToolbarProps) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-10 w-full md:w-80 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-slate-50 border-slate-200 text-xs font-bold uppercase tracking-tight">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="Vai trò" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">Tất cả vai trò</SelectItem>
              <SelectItem value="attendee" className="text-xs font-medium">Tham dự</SelectItem>
              <SelectItem value="speaker" className="text-xs font-medium">Báo cáo viên</SelectItem>
              <SelectItem value="moderator" className="text-xs font-medium">Chủ tọa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="h-10 border-slate-200 text-slate-600 font-bold px-4 hover:bg-slate-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
          <Button 
            onClick={() => setIsAddUserDialogOpen(true)}
            className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 shadow-lg shadow-indigo-100"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {numSelected > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-indigo-900 uppercase tracking-tight">
                Đã chọn {numSelected} đại biểu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select onValueChange={setBulkCheckinSessionId}>
              <SelectTrigger className="w-[240px] h-9 bg-white border-indigo-200 text-[11px] font-bold text-indigo-700">
                <SelectValue placeholder="Chọn phiên đang diễn ra..." />
              </SelectTrigger>
              <SelectContent>
                {activeSessions.length > 0 ? activeSessions.map(session => (
                  <SelectItem key={session.id} value={session.id} className="text-xs">{session.title}</SelectItem>
                )) : <p className="p-4 text-xs text-slate-400 italic">Không có phiên nào đang diễn ra.</p>}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={handleBulkCheckin} 
              disabled={bulkCheckinMutation.isPending}
              className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4"
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              Check-in hàng loạt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};