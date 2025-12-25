
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
import { Download, PlusCircle, Search } from "lucide-react";

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
  bulkCheckinMutation: any; // Simplified for brevity
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
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý đăng ký</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="attendee">Tham dự</SelectItem>
                  <SelectItem value="speaker">Báo cáo viên</SelectItem>
                  <SelectItem value="moderator">Chủ tọa</SelectItem>
                </SelectContent>
              </Select>
              {numSelected > 0 && (
                <>
                  <Select onValueChange={setBulkCheckinSessionId}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Chọn phiên đang diễn ra..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSessions.length > 0 ? activeSessions.map(session => (
                        <SelectItem key={session.id} value={session.id}>{session.title}</SelectItem>
                      )) : <p className="p-4 text-sm text-muted-foreground">Không có phiên nào đang diễn ra.</p>}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleBulkCheckin} disabled={bulkCheckinMutation.isPending}>
                    Check-in hàng loạt ({numSelected})
                  </Button>
                </>
              )}
            </div>
          </div>
    </>
  );
};
