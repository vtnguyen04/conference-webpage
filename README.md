# Hệ Thống Quản Lý Hội Nghị Khoa Học (Full-stack)

Hệ thống quản lý hội nghị, quản lý nội dung đa hội thảo và quản trị thông tin chi tiết các phiên làm việc, diễn giả, nhà tài trợ.

---

## Mục lục
1. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
2. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
3. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
4. [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
5. [Triển khai với Docker](#triển-khai-với-docker)
6. [Các lệnh quản trị](#các-lệnh-quản-trị)

---

## Công nghệ sử dụng

- **Frontend**: React.js (Vite), Tailwind CSS, Shadcn/UI.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (Drizzle ORM) & JSON Storage.
- **Dịch vụ**: Sharp (Xử lý ảnh), Nodemailer (Email), Node-cron (Automation).

---

## Cấu trúc thư mục (Project Structure)

```text
conference-webpage/
├── client/                     # PHÂN HỆ FRONTEND (REACT + VITE)
│   └── src/
│       ├── services/           # Lớp 1: Giao tiếp API thuần túy (Centralized Services)
│       ├── hooks/              # Lớp 2: Logic nghiệp vụ tập trung (Custom React Hooks)
│       ├── components/         # Lớp 3: Giao diện hiển thị (UI Components & Admin Pages)
│       │   ├── admin/          # Các component đặc thù cho CMS Admin
│       │   └── ui/             # Thư viện UI cơ sở (Shadcn/UI)
│       ├── pages/              # Các trang chính (AdminApp & PublicApp)
│       ├── lib/                # Cấu hình thư viện (QueryClient, Utils)
│       └── AdminApp.tsx        # Cấu trúc điều hướng phân hệ quản trị
├── server/                     # PHÂN HỆ BACKEND (NODE.JS + EXPRESS)
│   ├── routers/                # Định nghĩa các điểm cuối API (RESTful Routes)
│   ├── controllers/            # Điều hướng yêu cầu và phản hồi (HTTP Handlers)
│   ├── services/               # Xử lý nghiệp vụ nặng (Email, PDF, Automation)
│   ├── repositories/           # Lớp truy cập dữ liệu (Hybrid JSON/SQLite Data Layer)
│   ├── middlewares/            # Kiểm soát quyền truy cập, lỗi và hội nghị hoạt động
│   └── data/                   # Lưu trữ bền vững (SQLite .db và nội dung .json)
├── shared/                     # CHUẨN HÓA DỮ LIỆU (TYPESCRIPT & VALIDATION)
│   ├── schema.ts               # Định nghĩa cấu trúc bảng (Drizzle ORM)
│   ├── validation.ts           # Ràng buộc dữ liệu (Zod Schemas)
│   └── types.ts                # Định nghĩa kiểu dữ liệu toàn hệ thống
├── public/                     # TÀI NGUYÊN TĨNH
│   └── uploads/                # Hình ảnh và tệp tin đại biểu tải lên
└── Dockerfile                  # Quy trình đóng gói Container hóa
```

---

## Yêu cầu hệ thống

- **Node.js**: Phiên bản 20.x trở lên.
- **NPM**: Phiên bản 10.x trở lên.

---

## Hướng dẫn cài đặt

### 1. Clone mã nguồn
```bash
git clone https://github.com/vtnguyen04/conference-webpage.git
cd conference-webpage
```

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Cấu hình biến môi trường (.env)
Tạo file `.env` tại thư mục gốc:
```env
PORT=5000
NODE_ENV=development
ADMIN_PASSWORD=admin_secret_key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_FROM="Ban Tổ Chức <noreply@conference.vn>"

BASE_URL=http://localhost:5000
```

### 4. Khởi tạo Database
```bash
npm run db:push
```

### 5. Chạy dự án
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:5000`

---

## Triển khai với Docker

### Build và Chạy
```bash
# Build image
docker build -t conference-app .

# Chạy container
docker run -d \
  -p 5000:5000 \
  --name conference-web \
  --env-file .env \
  -v $(pwd)/server/data:/app/server/data \
  -v $(pwd)/public/uploads:/app/public/uploads \
  conference-app
```

---

## Các lệnh quản trị

- **Kiểm tra lỗi Type**: `npm run check`
- **Giao diện quản trị Database**: `npx drizzle-kit studio`
- **Build cho Production**: `npm run build`

---
*Tài liệu được cập nhật ngày 28/12/2025 theo tiêu chuẩn Enterprise CMS.*
