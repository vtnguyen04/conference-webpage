import React, { Suspense } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
const DashboardPage = React.lazy(() => import("@/pages/admin/DashboardPage"));
const ConferencePage = React.lazy(() => import("@/pages/admin/ConferencePage"));
const SessionsPage = React.lazy(() => import("@/pages/admin/SessionsPage"));
const SpeakersManagementPage = React.lazy(() => import("@/pages/admin/SpeakersManagementPage"));
const OrganizersManagementPage = React.lazy(() => import("@/pages/admin/OrganizersManagementPage"));
const SponsorsManagementPage = React.lazy(() => import("@/pages/admin/SponsorsManagementPage"));
const AnnouncementsManagementPage = React.lazy(() => import("@/pages/admin/AnnouncementsManagementPage"));
const RegistrationsPage = React.lazy(() => import("@/pages/admin/RegistrationsPage"));
const CheckinPage = React.lazy(() => import("@/pages/admin/CheckinPage"));
const AnalyticsPage = React.lazy(() => import("@/pages/admin/AnalyticsPage"));
const SightseeingManagementPage = React.lazy(() => import("@/pages/admin/SightseeingManagementPage"));
const ContactMessagesPage = React.lazy(() => import("@/pages/admin/ContactMessagesPage"));
const ConferencesManagementPage = React.lazy(() => import("@/pages/admin/ConferencesManagementPage"));
import Login from "@/pages/Login";
const NotFound = React.lazy(() => import("@/pages/NotFound"));
/**
 * Component gốc của ứng dụng Admin.
 * Cấu trúc đã được làm phẳng để tránh lỗi lồng ghép của router.
 */
export function AdminApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isAuthenticated && location === "/admin/login") {
    return <Redirect to="/admin" />;
  }
  return (
    <Switch>
      <Route path="/admin/login" component={Login} />
        {/* Sử dụng một "catch-all" Route không có path để xử lý TẤT CẢ các trường hợp còn lại */}
        <Route>
          {/* Đặt SidebarProvider ở đây để bao bọc tất cả các trang cần context của nó */}
          <SidebarProvider>
            <ProtectedRoute>
              <AdminLayout>
                {/* Bên trong khu vực được bảo vệ, chúng ta có một Switch thứ hai để chọn đúng trang */}
                <Suspense fallback={<div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <Switch>
                    {/* Đảm bảo thứ tự vẫn đúng: cụ thể nhất ở trên */}
                    <Route path="/admin/conference" component={ConferencePage} />
                    <Route path="/admin/conferences" component={ConferencesManagementPage} />
                    <Route path="/admin/sessions" component={SessionsPage} />
                    <Route path="/admin/speakers" component={SpeakersManagementPage} />
                    <Route path="/admin/organizers" component={OrganizersManagementPage} />
                    <Route path="/admin/sponsors" component={SponsorsManagementPage} />
                    <Route path="/admin/announcements" component={AnnouncementsManagementPage} />
                    <Route path="/admin/sightseeing" component={SightseeingManagementPage} />
                    <Route path="/admin/registrations" component={RegistrationsPage} />
                    <Route path="/admin/checkin" component={CheckinPage} />
                    <Route path="/admin/analytics" component={AnalyticsPage} />
                    <Route path="/admin/contact-messages" component={ContactMessagesPage} />
                    {/* Route gốc /admin ở cuối cùng */}
                    <Route path="/admin" component={DashboardPage} />
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          </SidebarProvider>
         </Route>
    </Switch>
  );
}
