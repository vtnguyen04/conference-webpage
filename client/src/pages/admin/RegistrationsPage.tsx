import { AddRegistrationDialog } from "@/components/AddRegistrationDialog";
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
import { useRegistrations } from "@/hooks/useRegistrations";
import { RegistrationToolbar } from "@/components/admin/RegistrationToolbar";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Users, UserCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegistrationsPage() {
    const {
        searchQuery,
        setSearchQuery,
        handleExportCSV,
        isAddUserDialogOpen,
        setIsAddUserDialogOpen,
        roleFilter,
        setRoleFilter,
        numSelected,
        setBulkCheckinSessionId,
        activeSessions,
        handleBulkCheckin,
        bulkCheckinMutation,
        total,
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
        isAlertOpen,
        setIsAlertOpen,
        handleBulkCheckinConfirm,
        bulkCheckinSessionId,
        page,
        handleResendEmail,
        setPage,
        totalPages
    } = useRegistrations();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <AdminPageHeader 
                title="Quản lý Danh sách Đăng ký"
                description={`Hệ thống ghi nhận tổng cộng ${total} lượt đăng ký tham dự hội nghị.`}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tổng đăng ký</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{total}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đã tham dự</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">
                                    {registrations.filter(r => r.status === 'checked-in').length}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Award className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Yêu cầu Chứng nhận</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">
                                    {registrations.filter(r => r.certificateRequested).length}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <RegistrationToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleExportCSV={handleExportCSV}
                    setIsAddUserDialogOpen={setIsAddUserDialogOpen}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    numSelected={numSelected}
                    setBulkCheckinSessionId={setBulkCheckinSessionId}
                    activeSessions={activeSessions}
                    handleBulkCheckin={handleBulkCheckin}
                    bulkCheckinMutation={bulkCheckinMutation}
                />

                <RegistrationTable
                    registrations={registrations}
                    isLoading={isLoading}
                    selectedRows={selectedRows}
                    handleSelectAll={handleSelectAll}
                    handleRowSelect={handleRowSelect}
                    sessionsMap={sessionsMap}
                    handleCheckIn={handleCheckIn}
                    checkInMutation={checkInMutation}
                    handleDelete={handleDelete}
                    handleResendEmail={handleResendEmail}
                    isSessionActive={isSessionActive}
                />

                {totalPages > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPage((prev) => Math.max(1, prev - 1));
                                    }}
                                    className={cn("cursor-pointer", page <= 1 ? "pointer-events-none opacity-50" : "")}
                                />
                            </PaginationItem>
                            
                            {(() => {
                                const getVisiblePages = (current: number, total: number) => {
                                    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                                    if (current <= 3) return [1, 2, 3, 4, '...', total];
                                    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
                                    return [1, '...', current - 1, current, current + 1, '...', total];
                                };

                                return getVisiblePages(page, totalPages).map((item, index) => (
                                    <PaginationItem key={index}>
                                        {item === '...' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setPage(item as number);
                                                }}
                                                isActive={item === page}
                                                className="cursor-pointer"
                                            >
                                                {item}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ));
                            })()}
                            
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPage((prev) => Math.min(totalPages, prev + 1));
                                    }}
                                    className={cn("cursor-pointer", page >= totalPages ? "pointer-events-none opacity-50" : "")}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>

            <AddRegistrationDialog
                isOpen={isAddUserDialogOpen}
                onClose={() => setIsAddUserDialogOpen(false)}
            />

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent className="border-none shadow-2xl overflow-hidden p-0">
                    <div className="bg-indigo-600 h-2 w-full" />
                    <div className="p-6">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-extrabold text-slate-900">Xác nhận check-in hàng loạt?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium mt-2 leading-relaxed">
                                Bạn có chắc muốn check-in cho {numSelected} đại biểu đã chọn vào phiên
                                <br />
                                <span className="font-bold text-slate-900 italic mt-1 block">
                                    "{activeSessions.find(s => s.id === bulkCheckinSessionId)?.title}"?
                                </span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-3">
                            <AlertDialogCancel className="font-bold border-slate-200">Hủy</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleBulkCheckinConfirm} 
                                disabled={bulkCheckinMutation.isPending}
                                className="bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                            >
                                {bulkCheckinMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}