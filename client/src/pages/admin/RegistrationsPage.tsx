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
import { Users, UserCheck, Award } from "lucide-react";

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
        bulkCheckinSessionId
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
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Yêu cầu CME</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">
                                    {registrations.filter(r => r.cmeCertificateRequested).length}
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
                    isSessionActive={isSessionActive}
                />
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