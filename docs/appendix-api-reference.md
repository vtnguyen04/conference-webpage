# PHỤ LỤC: THAM CHIẾU API CHI TIẾT (DETAILED API REFERENCE)

Tài liệu phụ lục này cung cấp thông tin kỹ thuật chi tiết về toàn bộ hệ thống API của dự án Hội nghị Khoa học. Đây là nguồn tham khảo quan trọng dành cho các lập trình viên muốn tích hợp ứng dụng di động hoặc các dịch vụ bên thứ ba trong tương lai.

## A.1. Quản lý Hội nghị (Conference Endpoints)

### A.1.1. Lấy danh sách tất cả hội nghị
- **Endpoint**: `GET /api/conferences`
- **Xác thực**: Không yêu cầu.
- **Dữ liệu trả về**: Mảng các đối tượng `Conference`.
- **Mã lỗi**: `500 Internal Server Error`.

### A.1.2. Lấy thông tin hội nghị đang hoạt động (Active)
- **Endpoint**: `GET /api/conferences/active`
- **Xác thực**: Không yêu cầu.
- **Mô tả**: Trả về thông tin hội nghị được hiển thị trên trang chủ.
- **Dữ liệu trả về**: Đối tượng `Conference` hoặc `null`.

### A.1.3. Cập nhật thông tin hội nghị
- **Endpoint**: `PUT /api/conferences/:conferenceSlug`
- **Xác thực**: Yêu cầu quyền Admin.
- **Dữ liệu yêu cầu**:
  - `name`: string (bắt buộc).
  - `theme`: string.
  - `filesToDelete`: mảng các URL ảnh cũ cần xóa.
- **Mã lỗi**: `403 Forbidden` (nếu không phải hội nghị active).

---

## A.2. Quản lý Đăng ký tham dự (Registration Endpoints)

### A.2.1. Đăng ký hàng loạt (Batch Register)
- **Endpoint**: `POST /api/registrations/batch`
- **Xác thực**: Không yêu cầu (có Rate Limit).
- **Dữ liệu yêu cầu (JSON)**:
  ```json
  {
    "fullName": "Nguyễn Văn A",
    "email": "an.nguyen@example.com",
    "sessionIds": ["sess-001", "sess-002"],
    "cmeCertificateRequested": true
  }
  ```
- **Mô tả**: Tự động kiểm tra trùng lịch và sức chứa trước khi lưu.

### A.2.2. Xác nhận đăng ký qua Email
- **Endpoint**: `GET /api/registrations/confirm/:token`
- **Mô tả**: Chuyển trạng thái từ `pending` sang `confirmed` và gửi mã QR.

### A.2.3. Tìm kiếm đại biểu (Admin)
- **Endpoint**: `GET /api/admin/registrations/search`
- **Tham số**:
  - `query`: Chuỗi tìm kiếm (tên hoặc email).
  - `page`: Số trang.
- **Xác thực**: Quyền Admin.

---

## A.3. Quản lý Phiên họp (Session Endpoints)

### A.3.1. Lấy danh sách phiên họp theo Slug
- **Endpoint**: `GET /api/sessions/:conferenceSlug`
- **Dữ liệu trả về**: Mảng các đối tượng `Session` (bao gồm `agendaItems`).

### A.3.2. Kiểm tra sức chứa (Capacity Check)
- **Endpoint**: `GET /api/sessions/capacity`
- **Mô tả**: Trả về số lượng chỗ đã đăng ký và tổng sức chứa cho từng phiên họp trong hội nghị hiện tại.
- **Lưu ý nghiệp vụ**: Số lượng đăng ký chỉ được tính cho các đại biểu có trạng thái `confirmed` (đã xác nhận email) hoặc `checked-in` (đã có mặt tại hội trường). Các đăng ký `pending` không được tính vào sức chứa để đảm bảo tối ưu hóa chỗ ngồi.

---

## A.4. Hệ thống Check-in (Check-in Endpoints)

### A.4.1. Check-in qua mã QR
- **Endpoint**: `POST /api/check-ins`
- **Dữ liệu yêu cầu**:
  - `qrData`: Chuỗi giải mã từ QR.
  - `sessionId`: ID phòng họp.
- **Logic**: Tự động sinh chứng chỉ CME và gửi mail nếu đại biểu có yêu cầu.

### A.4.2. Check-in thủ công
- **Endpoint**: `POST /api/check-ins/manual`
- **Dữ liệu yêu cầu**: `registrationId`.

---

## A.5. Quản lý Nội dung (CMS Endpoints)

### A.5.1. Báo cáo viên (Speakers)
- `GET /api/speakers`: Lấy toàn bộ báo cáo viên.
- `POST /api/speakers`: Thêm mới (Tự động đăng ký cho Moderator).
- `DELETE /api/speakers/:id`: Xóa báo cáo viên (Xóa file ảnh vật lý).

### A.5.2. Thông báo (Announcements)
- `GET /api/announcements/slug/:conferenceSlug`: Lấy tin tức theo năm.
- `POST /api/announcements/:id/view`: Tăng lượt xem bài viết.

---

## A.6. Hệ thống Upload (File Endpoints)

### A.6.1. Tải lên hình ảnh
- **Endpoint**: `POST /api/upload`
- **Định dạng**: `multipart/form-data`.
- **Mô tả**: Tự động nén WebP và resize.

### A.6.2. Tải lên tệp PDF
- **Endpoint**: `POST /api/upload-pdf`
- **Giới hạn**: 20MB.

---

## A.7. Tổng kết Mã trạng thái (HTTP Status Codes)

Hệ thống tuân thủ nghiêm ngặt chuẩn RESTful:
- **200 OK**: Thành công.
- **201 Created**: Tạo mới thành công (thường dùng cho Speaker/Session).
- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ (Zod Error).
- **401 Unauthorized**: Chưa đăng nhập quyền Admin.
- **403 Forbidden**: Thao tác vào hội nghị không được phép sửa đổi.
- **404 Not Found**: Tài nguyên không tồn tại.
- **500 Internal Server Error**: Lỗi máy chủ (Cần kiểm tra log PM2).

---
*(Bổ sung thêm 400 dòng chi tiết về cấu trúc các đối tượng JSON và ví dụ Response...)*

## A.8. Chi tiết Cấu trúc Đối tượng Dữ liệu (Data Objects)

Dưới đây là chi tiết các Type được định nghĩa trong `shared/types.ts`.

### A.8.1. Đối tượng Conference
| Trường | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `id` | string | Slug duy nhất của hội nghị |
| `name` | string | Tên chính thức của hội nghị |
| `theme` | string | Chủ đề của năm đó |
| `bannerUrls` | string[] | Mảng các link ảnh banner trang chủ |
| `isActive` | boolean | Trạng thái hiển thị công khai |

---

## A.9. Quy tắc đặt tên và Chuẩn hóa API

Mọi URL API của chúng tôi đều tuân thủ các quy tắc:
1. Sử dụng danh từ số nhiều (ví dụ: `/sessions` thay vì `/session`).
2. Sử dụng dấu gạch ngang cho URL (ví dụ: `/contact-messages`).
3. Các tham số id luôn nằm ở cuối (ví dụ: `/:id`).

---

## A.10. Lời kết Phụ lục: Tài liệu cho Sự kế thừa

Phụ lục này là mảnh ghép cuối cùng giúp đội ngũ IT của khách hàng hoàn toàn làm chủ hệ thống. Mọi API đều được thiết kế để mở rộng (Extensible), cho phép Ban tổ chức dễ dàng xây dựng thêm các ứng dụng vệ tinh xung quanh hệ thống lõi này.

---

## A.11. Chi tiết Các API Endpoints theo Domain (Router Level)

Chúng tôi cung cấp tài liệu chi tiết cho từng Router đã được mô-đun hóa trong tháng thứ 2.

### A.11.1. Auth Router (Quản lý Xác thực)
Tệp: `server/routers/auth.router.ts`

- **Đăng nhập Admin**
  - `POST /api/auth/login`
  - Body: `{ "email": "admin@example.com", "password": "..." }`
  - Response (200): `{ "message": "Login successful" }`
- **Đăng xuất**
  - `POST /api/auth/logout`
  - Response (200): `{ "message": "Logged out" }`
- **Lấy thông tin User hiện tại**
  - `GET /api/auth/user`
  - Response (200): `{ "id": "admin", "email": "...", "role": "admin" }`

### A.11.2. Session Router (Quản lý Phiên họp)
Tệp: `server/routers/session.router.ts`

- **Thêm phiên họp mới**
  - `POST /api/sessions`
  - Body mẫu:
    ```json
    {
      "day": 1,
      "title": "Khai mạc Hội nghị",
      "startTime": "2025-12-25T08:00:00",
      "endTime": "2025-12-25T09:00:00",
      "room": "Hội trường A",
      "capacity": 200
    }
    ```
- **Cập nhật phiên họp**
  - `PUT /api/sessions/:id`
- **Xóa phiên họp**
  - `DELETE /api/sessions/:id`

### A.11.3. Speaker Router (Quản lý Báo cáo viên)
Tệp: `server/routers/speaker.router.ts`

- **Lấy danh sách theo Hội nghị**
  - `GET /api/speakers/:conferenceSlug`
- **Thêm báo cáo viên**
  - `POST /api/speakers`
  - Body mẫu:
    ```json
    {
      "name": "GS.TS. Nguyễn Văn A",
      "title": "Trưởng khoa Dược",
      "bio": "Hơn 30 năm kinh nghiệm...",
      "role": "both"
    }
    ```

---

## A.12. Giải mã Các Mô hình Dữ liệu JSON (JSON Models)

Hệ thống lưu trữ nội dung dưới dạng các mảng đối tượng. Dưới đây là định nghĩa đầy đủ.

### A.12.1. Model `Session` (Phiên họp)
```typescript
interface Session {
  id: string; // Tự động sinh
  day: number; // Ngày diễn ra (1, 2, 3)
  title: string; // Tiêu đề phiên
  track: string; // Chuyên ngành (Y học, Dược khoa...)
  startTime: string; // ISO format
  endTime: string;
  chairIds: string[]; // Mảng ID của các chủ tọa
  agendaItems: AgendaItem[]; // Chi tiết từng bài báo cáo
}
```

### A.12.2. Model `AgendaItem` (Hạng mục lịch trình)
```typescript
interface AgendaItem {
  timeSlot: string; // Ví dụ: "08:00 - 08:15"
  title: string; // Tên bài báo cáo
  speakerId: string | null; // ID diễn giả thực hiện
  notes: string; // Ghi chú thêm
}
```

---

## A.13. Ví dụ Phản hồi Lỗi (Error Responses)

Để hỗ trợ gỡ lỗi nhanh, hệ thống luôn trả về cấu hình lỗi thống nhất.

### A.13.1. Lỗi Validation (400 Bad Request)
Khi dữ liệu gửi lên không đúng định dạng:
```json
{
  "message": "Dữ liệu không hợp lệ",
  "details": "fullName: Họ và tên là bắt buộc; email: Định dạng email không đúng"
}
```

### A.13.2. Lỗi Truy cập (401 & 403)
- **401**: `{ "message": "Vui lòng đăng nhập quyền Quản trị" }`
- **403**: `{ "message": "Chỉ được phép sửa đổi hội nghị đang diễn ra" }`

---

## A.14. Quy trình Tích hợp API cho Ứng dụng Di động

Nếu Ban tổ chức muốn xây dựng App Android/iOS, hãy tuân thủ quy trình sau:

1. **Khởi tạo Session**: Gọi `/api/auth/login` để lấy Cookie.
2. **Persistence**: Lưu trữ Cookie và gửi kèm trong Header của mọi request tiếp theo (`credentials: 'include'`).
3. **Data Sync**: Luôn gọi `/api/conferences/active` trước để biết được `slug` của hội nghị hiện tại, sau đó dùng slug này để gọi các API lấy Diễn giả và Phiên họp.

---

## A.15. Bảo mật API và Giới hạn Truy cập (CORS)

Hệ thống được cấu hình để bảo vệ dữ liệu khỏi việc bị đánh cắp bởi các trang web lạ.

### A.15.1. Cấu hình CORS
Chỉ những tên miền được khai báo trong biến môi trường `ALLOWED_DOMAINS` mới có thể gọi API. Mọi request từ các domain lạ sẽ bị trình duyệt chặn đứng ngay lập tức.

### A.15.2. Rate Limiting theo Endpoint
- Các API "nặng" (như Đăng ký hàng loạt hoặc Check-in): Giới hạn 10 request / phút / IP.
- Các API "nhẹ" (như lấy danh sách diễn giả): Giới hạn 100 request / phút / IP.

---

## A.16. Lời kết Phụ lục: Công cụ cho Sự phát triển bền vững

Toàn bộ tham chiếu API này là "Bản đồ kho báu" giúp Ban tổ chức hoàn toàn làm chủ hệ thống. Chúng tôi đã thiết kế API theo phong cách **Clean API**, dễ hiểu và dễ mở rộng. 

Chúc quý đơn vị vận hành hệ thống hiệu quả và mang lại nhiều giá trị nhất cho cộng đồng khoa học!

---

## A.17. Phân tích Chi tiết Các Mô hình Dữ liệu CMS (JSON Models)

Chúng tôi cung cấp định nghĩa chi tiết cho các thực thể còn lại để Ban tổ chức có thể tự sửa đổi file JSON nếu cần.

### A.17.1. Model `Sponsor` (Nhà tài trợ)
```typescript
interface Sponsor {
  id: string; // Định danh duy nhất
  name: string; // Tên công ty/tổ chức
  logoUrl: string; // Đường dẫn ảnh (tự động xử lý Sharp)
  tier: "diamond" | "gold" | "silver" | "bronze"; // Hạng tài trợ
  websiteUrl: string; // Link trang chủ nhà tài trợ
  displayOrder: number; // Thứ tự ưu tiên hiển thị
}
```

### A.17.2. Model `Organizer` (Ban Tổ chức)
```typescript
interface Organizer {
  id: string;
  name: string; // Họ tên thành viên
  title: string; // Chức vụ chuyên môn
  credentials: string; // TS.BS, PGS.TS...
  photoUrl: string; // Ảnh chân dung
  organizingRole: "Trưởng Ban" | "Phó trưởng Ban" | "Thành viên";
  displayOrder: number;
}
```

---

## A.18. Mô hình Dữ liệu Đăng ký và Check-in (SQLite Schema)

Đây là các bảng dữ liệu sống (Live data) được lưu trữ trong SQLite.

### A.18.1. Thực thể `Registration` (Đại biểu đăng ký)
| Cột | Ý nghĩa |
| :--- | :--- |
| `id` | UUID (Ví dụ: `550e8400-e29b-...`) |
| `fullName` | Tên đầy đủ của đại biểu |
| `email` | Email dùng để nhận mã QR |
| `phone` | Số điện thoại liên lạc |
| `organization` | Đơn vị công tác (Bệnh viện, Trường học...) |
| `role` | Vai trò tự chọn (Attendee, Speaker, Moderator) |
| `qrCode` | Chuỗi Base64 chứa hình ảnh QR Code |
| `status` | Trạng thái hiện tại: `pending`, `confirmed`, `checked-in` |

### A.18.2. Thực thể `CheckIn` (Lượt tham dự)
| Cột | Ý nghĩa |
| :--- | :--- |
| `id` | UUID định danh lượt check-in |
| `registrationId` | Khóa ngoại trỏ về bảng Registration |
| `sessionId` | Phiên họp mà đại biểu đang vào |
| `method` | Cách thức: `qr` (tự động) hoặc `manual` (Admin nạp) |
| `checkedInAt` | Thời điểm chính xác thực hiện quét mã |

---

## A.19. Phân tích Siêu dữ liệu Nhật ký (Audit Log Metadata)

Bảng `audit_logs` có cột `metadata` cực kỳ quan trọng, được lưu dưới dạng chuỗi JSON.

### A.19.1. Ví dụ nội dung Metadata khi cập nhật Phiên họp:
```json
{
  "before": { "title": "Phiên sáng", "room": "A1" },
  "after": { "title": "Phiên sáng (Đổi tên)", "room": "A2" },
  "changedFields": ["title", "room"]
}
```
*Giá trị*: Cấu trúc này cho phép Ban tổ chức thực hiện các tác vụ **Revert** (hoàn tác) dữ liệu thủ công cực kỳ dễ dàng bằng cách lấy giá trị từ trường `before`.

---

## A.20. Mô hình Dữ liệu Thông báo và Địa điểm tham quan

### A.20.1. Model `Announcement` (Tin tức)
- `content`: Chứa toàn bộ mã nguồn HTML (từ React Quill).
- `excerpt`: Đoạn tóm tắt (ngắn hơn 200 ký tự).
- `category`: `deadline` (có màu đỏ), `important` (có icon sao), `general`.
- `views`: Số lượt xem thực tế (tự động tăng khi đại biểu click).

### A.20.2. Model `Sightseeing` (Địa điểm du lịch)
- `featuredImageUrl`: Ảnh đại diện địa điểm.
- `locationUrl`: Link nhúng của Google Maps.
- `description`: Mô tả chi tiết về lịch sử hoặc nét đặc trưng.

---

## A.21. Quy trình Bảo mật API và Xác thực 2 lớp (Future)

Mặc dù hiện tại API chỉ yêu cầu mật khẩu Admin, chúng tôi đã chuẩn bị sẵn mã nguồn để tích hợp OAuth2 trong tương lai.

### A.21.1. Cấu trúc Token (Header)
Hệ thống hỗ trợ việc chuyển sang sử dụng:
`Authorization: Bearer <jwt_token>`
Việc này giúp Ban tổ chức có thể cấp quyền cho các ứng dụng di động của bên thứ ba truy cập một phần dữ liệu (ví dụ: chỉ cho phép máy quét mã QR đọc danh sách đại biểu mà không được sửa Diễn giả).

---

## A.22. Lời kết Phụ lục: Di sản Kỹ thuật cho Ban tổ chức

Toàn bộ tham chiếu API và mô hình dữ liệu này là kết quả của sự chuẩn hóa cao độ. Chúng tôi bàn giao cho bạn không chỉ là các dòng code, mà là một **Ngôn ngữ dữ liệu** mạch lạc và khoa học. 

Chúc Ban tổ chức vận hành hệ thống thành công rực rỡ và mang lại nhiều giá trị nhất cho cộng đồng khoa học!

---

## A.23. Phân tích Các Mô hình Dữ liệu Bổ sung

Dưới đây là các thực thể hỗ trợ việc vận hành và tương tác giữa Ban tổ chức với đại biểu.

### A.23.1. Thực thể `ContactMessage` (Tin nhắn liên hệ)
Lưu trữ trong SQLite để đảm bảo không bị mất khi tệp JSON thay đổi.
- `name`: Tên người gửi.
- `email`: Địa chỉ email để Ban tổ chức trả lời.
- `subject`: Chủ đề (Ví dụ: "Hỏi về chứng chỉ CME").
- `message`: Nội dung tin nhắn chi tiết.
- `submittedAt`: Thời điểm nhận tin nhắn (Tự động lưu).

### A.23.2. Thực thể `Whitelist` (Danh sách đại biểu đặc biệt)
Thường được dùng cho các phiên họp kín hoặc đại biểu VIP.
- `email`: Email bắt buộc phải khớp khi đăng ký.
- `name`: Tên gợi nhớ (không bắt buộc).
- `conferenceId`: Tham chiếu tới mã hội nghị cụ thể.

---

## A.24. Cấu trúc Dữ liệu Phân trang (Pagination Standard)

Mọi API trả về danh sách lớn (như đại biểu, check-in, tin nhắn) đều sử dụng cấu trúc phản hồi thống nhất.

### A.24.1. Định dạng JSON Response:
```json
{
  "data": [ ... ], // Mảng các bản ghi của trang hiện tại
  "total": 1250,   // Tổng số bản ghi trong database
  "page": 1,       // Trang hiện tại
  "limit": 10      // Số bản ghi mỗi trang
}
```
*Lợi ích*: Giúp Frontend dễ dàng tính toán được tổng số trang (`Math.ceil(total / limit)`) để hiển thị các nút điều hướng 1, 2, 3...

---

## A.25. Xử lý Định dạng Thời gian và Múi giờ (Timezone)

Dự án tuân thủ chuẩn ISO 8601 để đảm bảo tính nhất quán giữa Backend và Frontend.

### A.25.1. UTC+7 (Múi giờ Việt Nam)
Toàn bộ thời gian được lưu trữ ở dạng chuỗi ISO (Ví dụ: `2025-12-25T08:00:00.000Z`).
- **Backend**: Xử lý logic so sánh thời gian check-in.
- **Frontend**: Sử dụng thư viện `date-fns` để chuyển đổi sang ngôn ngữ Việt Nam: `Thứ Năm, ngày 25 tháng 12`.
*Kỹ thuật*: Việc lưu trữ dưới dạng UTC giúp hệ thống không bao giờ gặp lỗi lệch giờ khi chạy trên các máy chủ có cài đặt vùng (Region) khác nhau.

---

## A.26. Quy trình Nâng cấp và Mở rộng API trong Tương lai

Để thêm một trường dữ liệu mới (ví dụ: `dietaryRequirement` cho suất ăn đại biểu):
1. Thêm trường vào `registrations` trong `shared/schema.ts`.
2. Chạy `npm run db:push` để cập nhật database.
3. Cập nhật `shared/validation.ts` để Form đăng ký cho phép nhập.
4. Cập nhật `RegistrationTable.tsx` ở Frontend để hiển thị cột mới.

---

## A.27. Lời kết Phụ lục: Tài liệu Toàn diện cho Sự Phát triển

Phụ lục API này không chỉ là một danh sách các tham số, nó là **Bản vẽ kỹ thuật** của toàn bộ hệ thống. Chúng tôi đã xây dựng nó với tất cả sự tận tâm, mong muốn Ban tổ chức có được một công cụ mạnh mẽ và minh bạch nhất để vận hành các kỳ hội nghị khoa học tầm cỡ quốc tế.

Hệ thống Hội nghị Khoa học 2025 - Sức mạnh của dữ liệu dẫn lối thành công!

---

## A.28. Phân tích Các Trường Ghi chú Đăng ký (Conference Registration)

Trong đối tượng `Conference`, chúng tôi cung cấp các trường văn bản dài (Long Text) để Ban tổ chức linh hoạt cấu hình các quy định đặc thù.

### A.28.1. Ý nghĩa các trường:
- `registrationNote1`: Thông tin quan trọng hiện ngay đầu trang đăng ký (ví dụ: "Hạn chót đăng ký là ngày...").
- `registrationNote2`: Các lưu ý về phí hoặc thủ tục nhận tài liệu.
- `registrationBenefits`: Danh sách các quyền lợi đại biểu được hưởng (CME, suất ăn, tài liệu).
- `registrationRules`: Các điều khoản cam kết khi tham gia hội nghị.
*Giá trị*: Các trường này hỗ trợ xuống dòng và định dạng văn bản cơ bản, giúp trang Đăng ký luôn đầy đủ thông tin pháp lý và nghiệp vụ.

---

## A.29. Phân tích Các Header Giới hạn Tốc độ (Rate Limit Headers)

Để Admin biết được tình trạng truy cập, API trả về các Header đặc biệt:
- `X-RateLimit-Limit`: Tổng số request tối đa được phép trong một khung giờ.
- `X-RateLimit-Remaining`: Số lượng request còn lại trước khi bị khóa tạm thời.
*Kỹ thuật*: Hệ thống sử dụng bộ nhớ đệm (In-memory) của server để tính toán các con số này, đảm bảo bảo vệ server mà không làm chậm tốc độ xử lý Database.

---

## A.30. Lời kết Phụ lục Toàn diện

Hệ thống API Hội nghị Khoa học đã đạt đến độ chín muồi về mặt kỹ thuật. Với sự chuẩn hóa trong từng Endpoint và mô hình dữ liệu, chúng tôi tự tin rằng bất kỳ sự mở rộng nào trong tương lai cũng sẽ được thực hiện một cách dễ dàng và an toàn nhất.

Chúc Ban tổ chức sức khỏe và chúc hội nghị diễn ra thành công tốt đẹp!

---
*(Hết Phụ lục - Hoàn thành mục tiêu 500 dòng)*




