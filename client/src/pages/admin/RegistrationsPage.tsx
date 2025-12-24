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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useRegistrations } from "@/hooks/useRegistrations";
import { RegistrationToolbar } from "@/components/admin/RegistrationToolbar";
import { RegistrationTable } from "@/components/admin/RegistrationTable";

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
                total={total}
            />

            <AddRegistrationDialog
                isOpen={isAddUserDialogOpen}
                onClose={() => setIsAddUserDialogOpen(false)}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách đăng ký ({total})</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>

            <Pagination>
                {/* Pagination content remains the same and can be added here */}
            </Pagination>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận check-in hàng loạt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn check-in cho {numSelected} người đã chọn vào phiên
                            "{activeSessions.find(s => s.id === bulkCheckinSessionId)?.title}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkCheckinConfirm} disabled={bulkCheckinMutation.isPending}>
                            {bulkCheckinMutation.isPending ? "Đang check-in..." : "Xác nhận"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
