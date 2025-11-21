// src/AdminApp.tsx

import { Switch, Route, Redirect, useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar";

// Admin pages
import DashboardPage from "@/pages/admin/DashboardPage";
import ConferencePage from "@/pages/admin/ConferencePage";
import SessionsPage from "@/pages/admin/SessionsPage";
import SpeakersManagementPage from "@/pages/admin/SpeakersManagementPage";
import OrganizersManagementPage from "@/pages/admin/OrganizersManagementPage";
import SponsorsManagementPage from "@/pages/admin/SponsorsManagementPage";
import AnnouncementsManagementPage from "@/pages/admin/AnnouncementsManagementPage";
import RegistrationsPage from "@/pages/admin/RegistrationsPage";
import CheckinPage from "@/pages/admin/CheckinPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import SightseeingManagementPage from "@/pages/admin/SightseeingManagementPage";
import ContactMessagesPage from "@/pages/admin/ContactMessagesPage";
import ConferencesManagementPage from "@/pages/admin/ConferencesManagementPage";

// Shared pages
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Component gốc của ứng dụng Admin.
 * Cấu trúc đã được làm phẳng để tránh lỗi lồng ghép của router.
 */
export function AdminApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // BƯỚC 1: TRONG KHI ĐANG KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP, HIỂN THỊ SPINNER
  // Điều này ngăn chặn mọi quyết định điều hướng vội vàng.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // BƯỚC 2: NẾU NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP VÀ ĐANG CỐ VÀO TRANG LOGIN,
  // TỰ ĐỘNG CHUYỂN HỌ ĐẾN TRANG ADMIN.
  if (isAuthenticated && location === "/admin/login") {
    return <Redirect to="/admin" />;
  }
  
  // BƯỚC 3: SAU KHI ĐÃ XỬ LÝ CÁC TRƯỜNG HỢP TRÊN, TIẾN HÀNH ĐIỀU HƯỚNG BÌNH THƯỜNG
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
              </AdminLayout>
            </ProtectedRoute>
          </SidebarProvider>
         </Route>
    </Switch>
  );
}
