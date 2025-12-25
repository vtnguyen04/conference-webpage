
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
import { Award, Trash2, UserCheck } from "lucide-react";
import type { Registration, Session } from "@shared/types";

type RegistrationTableProps = {
  registrations: Registration[];
  isLoading: boolean;
  selectedRows: Record<string, boolean>;
  handleSelectAll: (checked: boolean | "indeterminate") => void;
  handleRowSelect: (id: string, checked: boolean) => void;
  sessionsMap: Map<string, Session>;
  handleCheckIn: (registrationId: string) => void;
  checkInMutation: any; // Simplified for brevity
  handleDelete: (id: string) => void;
  isSessionActive: (session?: Session) => boolean;
};

const getRoleForRegistration = (registration: Registration) => {
  if (registration.role === 'moderator') return <Badge variant="outline">Chủ tọa</Badge>;
  if (registration.role === 'speaker') return <Badge variant="outline">Báo cáo viên</Badge>;
  if (registration.role === 'both') return <Badge variant="outline">Cả hai</Badge>;
  return <Badge variant="secondary">Tham dự</Badge>; // Default to participant
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={registrations.length > 0 && Object.values(selectedRows).filter(Boolean).length === registrations.length}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          <TableHead>Họ và tên</TableHead>
          <TableHead>Vai trò</TableHead>
          <TableHead>Phiên</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Yêu cầu</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={7} className="text-center">Đang tải...</TableCell></TableRow>
        ) : registrations.length > 0 ? (
          registrations.map((registration) => {
            const session = sessionsMap.get(registration.sessionId);
            const sessionIsActive = isSessionActive(session);
            return (
              <TableRow key={registration.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows[registration.id] || false}
                    onCheckedChange={(checked) => handleRowSelect(registration.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{registration.fullName}</div>
                  <div className="text-sm text-muted-foreground">{registration.email}</div>
                </TableCell>
                <TableCell>{getRoleForRegistration(registration)}</TableCell>
                <TableCell>{session?.title || "N/A"}</TableCell>
                <TableCell><Badge variant={registration.status === "confirmed" ? "default" : "secondary"}>{registration.status}</Badge></TableCell>
                <TableCell>{registration.cmeCertificateRequested && <Badge variant="secondary"><Award className="h-3 w-3" /></Badge>}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleCheckIn(registration.id)} disabled={checkInMutation.isPending || registration.status === 'checked-in' || !sessionIsActive}>
                    <UserCheck className="mr-2 h-4 w-4" /> Check-in
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(registration.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow><TableCell colSpan={7} className="text-center h-24">Chưa có đăng ký nào.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
};
