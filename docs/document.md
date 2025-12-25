# SIÊU TÀI LIỆU KỸ THUẬT: HỆ THỐNG QUẢN LÝ HỘI NGHỊ KHOA HỌC (90 NGÀY PHÁT TRIỂN)

Chào sếp, đây là bản báo cáo tổng thể và chi tiết nhất về quá trình 3 tháng xây dựng và hoàn thiện dự án **Conference Webpage**. Bộ tài liệu này bao gồm hơn 5000 dòng phân tích, chia làm 9 chương và các phụ lục chuyên sâu.

---

## MỤC LỤC TÀI LIỆU

### [PHẦN 1: GIỚI THIỆU TỔNG QUAN](docs/introduction.md)
Giới thiệu mục tiêu dự án, stack công nghệ và tóm tắt lộ trình 90 ngày.

### [CHƯƠNG 1: THIẾT LẬP NỀN TẢNG VÀ KIẾN TRÚC](docs/chapter-1-foundation.md)
*Trọng tâm: Monorepo, Drizzle, Vite, Tailwind, Docker cơ bản.*
- Phân tích cấu trúc Monorepo chặt chẽ.
- Thiết kế Schema dữ liệu quan hệ ban đầu.
- Cơ chế xác thực Admin bằng Session bền bỉ.

### [CHƯƠNG 2: XÂY DỰNG TÍNH NĂNG CỐT LÕI (CMS)](docs/chapter-2-core-features.md)
*Trọng tâm: CRUD Diễn giả, Phiên họp, Nhà tài trợ, Tin tức, Xử lý ảnh WebP.*
- Quy trình xử lý form phức tạp với React Hook Form.
- Tối ưu hóa hình ảnh tự động với thư viện Sharp.
- Hệ thống Repository Generic giúp bứt tốc phát triển.

### [CHƯƠNG 3: BƯỚC NGOẶT KIẾN TRÚC (HYBRID STORAGE)](docs/chapter-3-architecture-pivot.md)
*Trọng tâm: Di cư Postgres sang SQLite/JSON, Multi-conference logic.*
- Tại sao chọn SQLite cho môi trường Offline-first.
- Cơ chế nhân bản hội nghị (Clone Conference) thần tốc.
- Giải pháp khóa file Async Mutex chống hỏng dữ liệu.

### [CHƯƠNG 4: TỰ ĐỘNG HÓA VÀ HỆ THỐNG QR/PDF](docs/chapter-4-automation-systems.md)
*Trọng tâm: Mã QR, PDF Certificate, Email Double Opt-in, Cron Jobs.*
- Thuật toán sinh mã QR mã hóa bảo mật.
- Engine PDF sinh chứng chỉ CME đạt chuẩn font Tiếng Việt.
- Luồng nhắc nhở đại biểu tự động qua email.

### [CHƯƠNG 5: BẢO MẬT VÀ TỐI ƯU HÓA HIỆU NĂNG](docs/chapter-5-security-and-optimization.md)
*Trọng tâm: Chống XSS/CSRF, Rate Limiting, WAL Mode, Lazy Loading.*
- Phân tích lớp phòng thủ dữ liệu đa tầng.
- Tối ưu hóa Bundle Size từ 2MB xuống 380KB.
- Kỹ thuật nâng cao khả năng chịu tải cho SQLite.

### [CHƯƠNG 6: TRIỂN KHAI VÀ QUY TRÌNH DEVOPS](docs/chapter-6-deployment-and-devops.md)
*Trọng tâm: Docker Multi-stage, PM2, Backup Scripts, Nginx Proxy.*
- Đóng gói ứng dụng đạt chuẩn Production.
- Chiến lược sao lưu ngoại vi (Off-site backup) tự động.
- Kịch bản phục hồi thảm họa trong 10 phút.

### [CHƯƠNG 7: HỆ THỐNG THIẾT KẾ UI/UX](docs/chapter-7-ui-ux-design.md)
*Trọng tâm: Design System, Shadcn UI Customization, Responsive logic.*
- Triết lý thiết kế Minimalism cho giới khoa học.
- Tối ưu hóa trải nghiệm di động (Touch targets, Navigation).
- Hệ thống thông báo và phản hồi thị giác (Toasts, Skeletons).

### [CHƯƠNG 8: LỘ TRÌNH PHÁT TRIỂN TƯƠNG LAI](docs/chapter-8-future-roadmap.md)
*Trọng tâm: AI Chatbot, Blockchain Certificate, Face Recognition.*
- Ứng dụng AI RAG để hỗ trợ đại biểu tra cứu tri thức.
- Tầm nhìn trở thành nền tảng SAAS toàn cầu.

### [CHƯƠNG 9: KẾT LUẬN VÀ BÀN GIAO](docs/chapter-9-conclusion-and-handover.md)
*Trọng tâm: Hướng dẫn Developer, Key Rotation, Server Migration.*
- Danh mục tài liệu và tài nguyên bàn giao chính thức.
- Hướng dẫn đội ngũ kỹ thuật tiếp nhận và mở rộng.

### [PHỤ LỤC: THAM CHIẾU API CHI TIẾT](docs/appendix-api-reference.md)
*Trọng tâm: Danh sách Endpoints, Request/Response mẫu, HTTP Status.*
- Tài liệu kỹ thuật chi tiết dành cho việc tích hợp Mobile App.

---
*Tài liệu được hoàn thiện vào ngày 25/12/2025*
*Đội ngũ Phát triển: vtnguyen04 & Gemini CLI*
