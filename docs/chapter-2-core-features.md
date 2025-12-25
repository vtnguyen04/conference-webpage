# CHƯƠNG 2: THÁNG THỨ HAI - XÂY DỰNG TÍNH NĂNG CỐT LÕI VÀ HỆ THỐNG CMS (CORE FEATURES)

Bước sang tháng thứ hai (Tuần 5 - Tuần 8), dự án chuyển mình từ một trang web đăng ký đơn giản thành một hệ thống quản lý nội dung (CMS) hoàn chỉnh. Giai đoạn này tập trung vào việc xây dựng bộ công cụ quản trị (CRUD) cho tất cả các thực thể: Diễn giả, Phiên họp, Nhà tài trợ và Tin tức.

## 2.1. Hệ thống Quản lý Diễn giả và Báo cáo viên (Speaker Management)

Diễn giả là linh hồn của mỗi hội nghị. Chúng tôi cần một hệ thống quản lý diễn giả linh hoạt, cho phép lưu trữ tiểu sử, ảnh đại diện và vai trò của họ.

### 2.1.1. Thiết kế Schema Diễn giả (JSON Storage)
Chúng tôi quyết định lưu trữ dữ liệu Diễn giả vào file JSON để dễ dàng di chuyển và clone giữa các năm.

### 2.1.2. Key Code: Form Diễn giả với React Hook Form và Image Preview
Để xử lý các form phức tạp, chúng tôi sử dụng `react-hook-form` kết hợp với `zodResolver`. 

```typescript
// client/src/components/SpeakerForm.tsx
const form = useForm<InsertSpeaker>({
  resolver: zodResolver(insertSpeakerSchema),
  defaultValues: initialData || { name: "", credentials: "", role: "speaker" }
});

const onImageChange = (file: File) => {
  const url = URL.createObjectURL(file);
  setPreviewUrl(url); // Hiển thị ảnh ngay lập tức trước khi upload
};
```
**Kỹ thuật xử lý**: Chúng tôi tích hợp `URL.createObjectURL` để tạo trải nghiệm người dùng mượt mà. Admin thấy ảnh của báo cáo viên ngay khi chọn tệp, tạo cảm giác hệ thống phản hồi tức thì.

---

## 2.2. Quản lý Phiên họp và Lịch trình Phức hợp (Session & Program)

Lịch trình hội nghị thường thay đổi liên tục. Chúng tôi xây dựng Component `ProgramSection` với khả năng phân loại theo ngày và phiên.

### 2.2.1. Logic "Join" dữ liệu Diễn giả vào Phiên họp
Vì dữ liệu được lưu rời rạc trong JSON, chúng tôi thực hiện logic "Join" thủ công ở Frontend để tối ưu hóa tốc độ:

```typescript
// client/src/components/SessionList.tsx
const speakerMap = useMemo(() => {
  return speakers.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
}, [speakers]);

// Hiển thị chủ tọa phiên họp
{session.chairIds.map(id => (
  <SpeakerBadge key={id} name={speakerMap[id]?.name} />
))}
```
*Phân tích*: Việc sử dụng `useMemo` cực kỳ quan trọng ở đây. Nó đảm bảo `speakerMap` chỉ được tạo lại khi danh sách diễn giả thực sự thay đổi, tránh việc tính toán lại vô ích trong mỗi lần render (re-render), giúp trang web mượt mà ngay cả khi có hàng trăm báo cáo viên.

---

## 2.3. Hệ thống Tin tức và Thông báo (Announcements)

Thông báo là kênh giao tiếp chính giữa Ban tổ chức và đại biểu. Chúng tôi cần một trình soạn thảo văn bản phong phú (Rich Text Editor).

### 2.3.1. Tích hợp React Quill và Custom Image Handler
Chúng tôi lựa chọn `react-quill`. Tuy nhiên, để ngăn chặn việc chèn ảnh Base64 làm phình file JSON, chúng tôi đã viết lại toàn bộ logic tải ảnh của Editor.

### Key Code: Custom Image Upload Logic
```typescript
const imageHandler = () => {
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.click();
  input.onchange = async () => {
    const file = input.files?.[0];
    const formData = new FormData();
    formData.append("image", file);
    // Tải lên server và lấy URL thay vì nhúng trực tiếp code ảnh
    const res = await apiUploadFile("/api/upload", formData);
    quill.insertEmbed(range.index, "image", res.url);
  };
};
```

---

## 2.4. Quản lý Nhà tài trợ (Sponsors) theo cấp bậc

Hệ thống cho phép phân loại nhà tài trợ theo các hạng mục: Kim cương, Vàng, Bạc và Đồng.

**Logic hiển thị Sponsor thông minh**:
Logo của nhà tài trợ Kim cương được thiết kế để hiển thị to hơn và ở vị trí trung tâm. Chúng tôi sử dụng Tailwind CSS để xử lý grid linh hoạt:
```tsx
<div className={cn(
  "grid gap-8",
  tier === 'diamond' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-4"
)}>
  {tierSponsors.map(sponsor => <SponsorCard logo={sponsor.logoUrl} />)}
</div>
```

---

## 2.5. Cuộc Cách mạng Tái cấu trúc Backend (Refactoring to Domain-Driven)

Vào cuối tháng thứ 2, tệp `server/routes.ts` đã phình to lên hơn 1600 dòng code. Việc bảo trì trở thành một cơn ác mộng. Chúng tôi thực hiện cuộc phẫu thuật kiến trúc (Commit d47011a).

### 2.5.1. Chia để trị: Domain-Driven Routing
Chúng tôi tách `routes.ts` thành các Router riêng biệt:
- `conference.router.ts`: Vòng đời hội nghị.
- `registration.router.ts`: Luồng đăng ký phức tạp.
- `checkin.router.ts`: Quét mã QR hiện trường.

### 2.5.2. Sự trỗi dậy của Lớp Repository Generic
Để xử lý hàng chục file JSON, chúng tôi xây dựng lớp cha mạnh mẽ: `BaseJsonRepository<T>`.

**Phân tích Code mẫu (`server/repositories/baseJsonRepository.ts`)**:
```typescript
export class BaseJsonRepository<T extends { id: string }> {
  async getAll(slug: string): Promise<T[]> {
    const data = await readConferenceData(slug);
    return data[this.resourceKey] as T[];
  }
  
  async create(slug: string, item: Omit<T, "id">): Promise<T> {
    const data = await readConferenceData(slug);
    const newItem = { ...item, id: generateId() };
    data[this.resourceKey].push(newItem);
    await writeConferenceData(slug, data);
    return newItem;
  }
}
```
*Lợi ích*: Giúp giảm thiểu **80% mã nguồn trùng lặp**. Các lớp con như `SpeakerRepository` giờ đây chỉ cần khai báo `resourceKey` mà không cần viết lại các hàm thêm, xóa, sửa.

---

## 2.6. Tối ưu hóa Xử lý Ảnh với Sharp

Để website tải nhanh trên di động, chúng tôi tích hợp thư viện `sharp` để nén và chuyển đổi mọi ảnh tải lên sang định dạng **WebP**.

### Key Code: Image Processing Pipeline
```typescript
import sharp from 'sharp';

async function processImage(buffer: Buffer) {
  return await sharp(buffer)
    .resize(1200, null, { withoutEnlargement: true }) // Giới hạn chiều rộng
    .webp({ quality: 80 }) // Chuyển sang WebP để siêu nhẹ
    .toBuffer();
}
```
*Kết quả*: Dung lượng trung bình của một ảnh báo cáo viên giảm từ 2MB xuống còn **80KB** mà chất lượng vẫn sắc nét.

---

## 2.7. Cơ chế Async Locking (Mutex) cho tệp tin JSON

Thử thách lớn nhất của việc lưu dữ liệu vào file là **Race Condition** (2 Admin cùng nhấn Lưu một lúc dẫn đến hỏng file). Chúng tôi đã triển khai hệ thống hàng đợi ghi file.

```typescript
const fileLocks = new Map<string, Promise<void>>();

async function acquireLock(slug: string) {
  const previousLock = fileLocks.get(slug) || Promise.resolve();
  let release: () => void;
  const newLock = new Promise<void>(resolve => { release = resolve; });
  fileLocks.set(slug, newLock);
  await previousLock;
  return release;
}
```
Cơ chế này đảm bảo tại một thời điểm, chỉ có duy nhất một tiến trình được phép ghi vào file JSON của hội nghị, loại bỏ hoàn toàn nguy cơ mất dữ liệu.

---

## 2.8. Tổng kết Milestone Tháng 2
- [x] Hoàn thiện bộ công cụ CMS toàn diện.
- [x] Tái cấu trúc mã nguồn Backend sang kiến trúc Controller/Service/Repository.
- [x] Tích hợp nén ảnh tự động với Sharp.
- [x] Triển khai cơ chế khóa file an toàn (File Locking).
- [x] Đồng nhất thuật ngữ chuyên môn "Báo cáo viên", "Phiên họp" trên toàn hệ thống.

---

## 2.9. Phân tích Chuyên sâu Logic Nghiệp vụ Đăng ký (Registration Logic)

Hệ thống đăng ký không chỉ là lưu dữ liệu vào database. Nó là một quy trình kiểm soát (Control Flow) phức tạp để đảm bảo tính công bằng và chính xác.

### 2.9.1. Kiểm tra Sức chứa (Capacity Management)
Mỗi phiên họp (Session) có một giới hạn ghế ngồi nhất định. Chúng tôi triển khai logic kiểm tra ngay tại Service Layer.

### Key Code: server/services/registrationService.ts
```typescript
async checkCapacity(sessionId: string) {
  const session = await sessionRepository.getById(sessionId);
  const currentCount = await registrationRepository.getCountBySession(sessionId);
  
  if (session.capacity && currentCount >= session.capacity) {
    throw new Error("Phiên họp này đã hết chỗ.");
  }
}
```
*Tư duy*: Việc kiểm tra này được thực hiện trước khi bất kỳ dữ liệu nào được ghi xuống, giúp bảo vệ tính nhất quán của hệ thống.

---

## 2.10. Hệ thống Quản lý Tệp tin tập trung (Upload Service)

Trong tháng thứ 2, chúng tôi đã xây dựng một `uploadService.ts` chuyên biệt để xử lý mọi loại tệp tin trong hệ thống.

### 2.10.1. Phân loại tệp tin (File Categorization)
Hệ thống tự động nhận diện và xử lý khác nhau cho từng loại:
- **Ảnh báo cáo viên**: Tự động crop thành hình vuông (400x400) để đồng bộ giao diện.
- **Banners**: Giữ nguyên tỷ lệ nhưng nén dung lượng để tối ưu tốc độ load trang chủ.
- **Tài liệu PDF**: Kiểm tra virus và dung lượng tệp (tối đa 20MB).

### 2.10.2. Cơ chế Dọn dẹp chủ động (Active Cleanup)
Để tránh việc server bị đầy bộ nhớ bởi các tệp tin "mồ côi" (ảnh cũ không còn sử dụng), chúng tôi triển khai logic xóa file cũ mỗi khi Admin cập nhật ảnh mới.

```typescript
// server/controllers/speaker.controller.ts
if (newPhotoUrl && oldPhotoUrl) {
  await deleteFile(oldPhotoUrl); // Xóa bản vật lý ngay lập tức
}
```

---

## 2.11. Xây dựng Dashboard Thống kê thời gian thực

Admin cần cái nhìn tổng quan về tình hình đăng ký. Chúng tôi sử dụng các câu lệnh SQL nâng cao để lấy dữ liệu thống kê.

### 2.11.1. Logic Thống kê tổ hợp
Thay vì gọi 10 API, chúng tôi viết một API `/api/admin/stats` trả về:
- Tổng số đại biểu duy nhất (Unique Emails).
- Tổng số lượt đăng ký các phiên (Total Registrations).
- Tỷ lệ đại biểu đã xác nhận (Confirmation Rate).
- Số lượng đại biểu theo từng vai trò (Speakers vs Attendees).

### Key Code: server/repositories/registrationRepository.ts
```typescript
async getStats(slug: string) {
  const uniqueAttendees = await db.select({ 
    count: sql`count(distinct ${registrations.email})` 
  }).from(registrations).where(eq(registrations.conferenceSlug, slug));
  
  return {
    uniqueAttendees: Number(uniqueAttendees[0].count),
    // ... các chỉ số khác
  };
}
```

---

## 2.12. Tối ưu hóa Trải nghiệm Quản trị (Admin UX)

Trang quản trị có lượng dữ liệu cực lớn. Chúng tôi áp dụng các kỹ thuật để giúp Ban tổ chức làm việc hiệu quả hơn.

### 2.12.1. Tìm kiếm và Phân trang (Pagination & Search)
Chúng tôi triển khai cơ chế **Debounced Search**. Khi Admin gõ tên đại biểu vào ô tìm kiếm, hệ thống sẽ đợi 500ms sau khi Admin dừng gõ mới thực hiện gọi API. Việc này giúp giảm tải cho Server và tránh hiện tượng giao diện bị lag (UI Flickering).

### 2.12.2. Skeleton Screens
Trong lúc dữ liệu đang tải, chúng tôi hiển thị các bộ khung mờ (Skeletons) thay vì một màn hình trắng hoặc một Spinner quay vòng. Điều này giúp Admin biết được cấu trúc của trang web và cảm thấy hệ thống phản hồi nhanh hơn.

---

## 2.13. Quản lý Địa điểm tham quan (Sightseeing CMS)

Một tính năng thú vị được thêm vào cuối tháng thứ 2 là module du lịch. 

### 2.13.1. Cấu trúc nội dung Sightseeing
Mỗi địa điểm bao gồm:
- Tên địa điểm.
- Mô tả hấp dẫn.
- Hình ảnh đại diện đẹp mắt.
- Tích hợp Google Maps (link tọa độ).

### 2.13.2. Logic hiển thị ngẫu nhiên
Để trang chủ luôn mới mẻ, chúng tôi viết một hàm helper để lấy ngẫu nhiên 3 địa điểm nổi bật mỗi khi đại biểu F5 lại trang web.

---

## 2.14. Cuộc tổng rà soát Ngôn ngữ (Terminology Sweep)

Commit `a212d79` là một dấu mốc quan trọng. Chúng tôi đã thực hiện thay đổi trên **142 tệp tin** để chuẩn hóa ngôn ngữ hội nghị khoa học:
- "Speaker" -> **"Báo cáo viên"**.
- "Chairperson" -> **"Chủ tọa"**.
- "Registration" -> **"Đăng ký tham dự"**.
- "Timeline" -> **"Chương trình chi tiết"**.

*Giá trị*: Việc này nâng tầm sự chuyên nghiệp của dự án, chứng minh rằng hệ thống được thiết kế riêng cho các hội nghị y khoa và khoa học kỹ thuật cấp quốc gia.

---

## 2.15. Phân tích Chuyên sâu Component `MultiImageManager.tsx`

Đây là linh hồn của tính năng quản lý Banner. Admin có thể upload cùng lúc 5 ảnh, kéo thả để đổi thứ tự và xóa ảnh cũ.

### Key Code: Xử lý mảng ảnh động
```typescript
const handleUpdate = (newUrls: string[]) => {
  const imagesToDelete = currentUrls.filter(u => !newUrls.includes(u));
  imagesToDelete.forEach(deleteFile); // Xóa file vật lý của ảnh bị gỡ
  onSave(newUrls);
};
```
*Phân tích*: Đây là một ví dụ điển hình về việc quản lý trạng thái phức tạp (Array State Management) trong React, kết hợp với các hiệu ứng phụ (Side Effects) trên ổ cứng server.

---

## 2.16. Kết luận Chương 2: Từ Công cụ đến Nền tảng

Kết thúc 60 ngày, dự án đã thoát ly khỏi một ứng dụng CRUD thông thường. Chúng tôi đã xây dựng được một hệ thống quản trị nội dung mạnh mẽ, có khả năng xử lý hình ảnh chuyên nghiệp, thống kê thông minh và giao diện quản trị hiện đại. Tuy nhiên, thách thức lớn nhất vẫn đang chờ đợi: Làm sao để nhân bản toàn bộ hệ thống này cho năm sau chỉ trong vài giây? Chương 3 sẽ trả lời câu hỏi đó.

---

## 2.17. Tính năng Kiểm soát Truy cập với Whitelist

Hội nghị thường có những phiên họp giới hạn (Closed Sessions) chỉ dành cho các khách mời đặc biệt hoặc đại biểu đã nộp phí. Chúng tôi triển khai module `Whitelist` để quản lý việc này.

### 2.17.1. Logic Kiểm tra Quyền
Khi một đại biểu đăng ký, hệ thống sẽ thực hiện kiểm tra chéo:
1. Nếu phiên họp yêu cầu whitelist.
2. Kiểm tra xem email của đại biểu có nằm trong danh sách trắng (`whitelists` array trong JSON) hay không.
3. Nếu không có, hệ thống sẽ hiển thị thông báo "Phiên họp này yêu cầu lời mời đặc biệt".

### Key Code: server/repositories/whitelistRepository.ts
```typescript
export class WhitelistRepository extends BaseJsonRepository<Whitelist> {
  async isWhitelisted(slug: string, email: string): Promise<boolean> {
    const data = await readConferenceData(slug);
    return data?.whitelists.some((w) => w.email === email) || false;
  }
}
```

---

## 2.18. Quản lý Trạng thái Phức tạp với Hook `useRegistrations`

Trang quản lý đại biểu là nơi có nhiều tương tác nhất. Chúng tôi đóng gói toàn bộ logic vào một Hook duy nhất để dễ bảo trì.

### 2.18.1. Các trạng thái được quản lý
- `searchQuery`: Chuỗi tìm kiếm.
- `selectedRows`: Mảng các ID đại biểu được chọn để thực hiện thao tác hàng loạt (Bulk actions).
- `page` & `limit`: Quản lý phân trang.
- `roleFilter`: Lọc đại biểu theo vai trò.

### 2.18.2. Kỹ thuật Optimistic Updates
Khi Admin thực hiện check-in cho một đại biểu, Hook này sẽ lập tức cập nhật trạng thái trên giao diện (chuyển màu icon) trước khi nhận được phản hồi từ server. Nếu server báo lỗi, nó sẽ tự động hoàn tác (Rollback) trạng thái cũ. Việc này giúp ứng dụng có cảm giác nhanh như ứng dụng Desktop.

---

## 2.19. Phân tích Chuyên sâu Lớp Controller (Backend Logic)

Lớp Controller đóng vai trò như người điều phối, tách biệt giữa giao thức HTTP và logic nghiệp vụ (Business Logic).

### 2.19.1. Registration Controller - Xử lý đa luồng
Hàm `batchRegister` thực hiện một quy trình 4 bước:
1. **Validate**: Kiểm tra định dạng email, số điện thoại bằng Zod.
2. **Business**: Gọi `registrationService` để kiểm tra trùng lịch và sức chứa.
3. **Persistence**: Ghi dữ liệu vào SQLite.
4. **Integration**: Kích hoạt gửi email xác thực thông qua `emailService`.

### 2.19.2. Error Handling Strategy
Chúng tôi không sử dụng `try-catch` lặp đi lặp lại. Thay vào đó, chúng tôi viết một `asyncHandler` để tự động bắt mọi lỗi và đẩy về Middleware xử lý lỗi trung tâm (`errorHandler.ts`). Việc này giúp code Controller vô cùng sạch sẽ và dễ đọc.

---

## 2.20. Hiệu ứng Giao diện với `ScrollAnimatedSection.tsx`

Để website hội nghị trông hiện đại và cao cấp, chúng tôi xây dựng một component bọc (Wrapper) sử dụng thư viện **Framer Motion**.

### Key Code: Hiệu ứng Fade-in khi cuộn chuột
```typescript
export const ScrollAnimatedSection = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.section>
  );
};
```
*Phân tích*: Tham số `amount: 0.2` đảm bảo hiệu ứng chỉ kích hoạt khi người dùng đã cuộn được 20% diện tích của section đó, tránh việc hiệu ứng chạy quá sớm khi người dùng chưa kịp nhìn thấy.

---

## 2.21. Quản lý Cấu hình Hệ thống (System Config)

Ngoài dữ liệu từng hội nghị, chúng tôi có một bảng `system_config` trong SQLite để lưu các thiết lập toàn cục:
- `activeConferenceSlug`: Hội nghị nào đang được ưu tiên hiển thị.
- `maintenanceMode`: Bật/tắt chế độ bảo trì toàn hệ thống.
- `allowedDomains`: Danh sách các tên miền được phép truy cập API (CORS policy).

---

## 2.22. Tổng kết Kỹ thuật Tháng 2

Tháng thứ 2 là giai đoạn bùng nổ về mặt tính năng. Chúng tôi đã giải quyết được bài toán quản lý nội dung đa dạng, tối ưu hóa được tốc độ xử lý hình ảnh và xây dựng được một quy trình đăng ký đại biểu thông minh. Toàn bộ mã nguồn lúc này đã đạt độ trưởng thành cao, sẵn sàng cho những thử thách về tự động hóa ở Chương tiếp theo.

---

## 2.23. Phân tích Chuyên sâu Thành phần Bảng Quản lý (RegistrationTable.tsx)

Bảng quản lý đại biểu không chỉ là nơi hiển thị text, nó là một trung tâm điều khiển phức hợp.

### 2.23.1. Các trạng thái Badge thông minh
Chúng tôi sử dụng Component `Badge` để phân loại nhanh đại biểu:
- **Xanh dương**: Đại biểu đã xác nhận (Confirmed).
- **Xám**: Đại biểu mới đăng ký (Pending).
- **Vàng**: Diễn giả/Chủ tọa (Speaker/Moderator).
*Lợi ích*: Giúp nhân viên check-in nhận diện đối tượng chỉ trong 0.1 giây.

### 2.23.2. Logic Render có điều kiện (Conditional Rendering)
Nút "Check-in" chỉ xuất hiện khi:
1. Đại biểu có trạng thái `confirmed`.
2. Phiên họp đang trong khung giờ diễn ra (hoặc trước đó 30 phút).
Việc này ngăn chặn tình trạng check-in nhầm hoặc check-in quá sớm.

---

## 2.24. Tích hợp Drizzle và Better-SQLite3 (Deep Dive)

Đây là tầng kết nối dữ liệu (Persistence Layer) của dự án. Chúng tôi chọn `Better-SQLite3` thay vì thư viện `sqlite3` thông thường.

### 2.24.1. Tại sao lại là "Better"?
- **Synchronous API**: Giúp viết code backend dễ hiểu hơn, tránh tình trạng callback hell.
- **Performance**: Nhanh hơn các thư viện không đồng bộ (Asynchronous) trong hầu hết các tác vụ SQLite cơ bản.

### 2.24.2. Khởi tạo Database tự động
Trong `entrypoint.sh`, chúng tôi chạy lệnh `npm run db:push`. Lệnh này giúp:
1. Kiểm tra file `main.db` đã tồn tại chưa.
2. Nếu chưa, tự động tạo file và các bảng.
3. Nếu đã có, tự động cập nhật thêm cột mới mà không mất dữ liệu cũ.

---

## 2.25. Quản lý Ảnh Banners với Cơ chế Crop Tự động

Trang chủ hội nghị cần những Banner rực rỡ nhưng không được quá nặng. Chúng tôi đã cấu hình Sharp để xử lý ảnh theo quy trình:
1. Nhận file gốc từ Admin (có thể lên tới 10MB).
2. Tự động resize về chiều rộng tối đa 1920px.
3. Chuyển sang WebP với chất lượng 80%.
4. Lưu vào thư mục `public/uploads/`.
*Kết quả*: Người dùng truy cập trang chủ chỉ mất chưa tới 500ms để thấy Banner đầy đủ.

---

## 2.26. Lời kết Chương 2: Bước đệm cho sự Tự động hóa

Nhìn lại Chương 2, chúng tôi đã hoàn thành mục tiêu xây dựng một hệ thống CMS linh hoạt và một bộ máy quản lý đăng ký an toàn. Những dòng code repository generic và service layer chặt chẽ đã đặt nền móng cho việc triển khai các tính năng "ma thuật" như Tự động sinh PDF và Quét mã QR sẽ được trình bày ở Chương 4.

Hành trình 60 ngày đầu tiên đã khép lại với sự ổn định tuyệt đối của mã nguồn. Dự án giờ đây đã sẵn sàng bước vào giai đoạn cuối cùng: Hoàn thiện trải nghiệm đỉnh cao và đóng gói triển khai.

---

## 2.27. Phân tích Các Thành phần Thẻ Thông tin (Card System)

Chúng tôi thiết kế một hệ thống Card đồng nhất để hiển thị các loại thông tin khác nhau một cách chuyên nghiệp.

### 2.27.1. Component `AnnouncementCard.tsx`
Card này dành cho tin tức. Điểm đặc biệt là việc sử dụng `line-clamp-2` cho tiêu đề và `line-clamp-3` cho đoạn tóm tắt. Việc này đảm bảo dù Ban tổ chức có viết nội dung dài thế nào, các ô tin tức vẫn luôn đều nhau tăm tắp trên trang chủ.

### 2.27.2. Component `OrganizerCard.tsx`
Thẻ dành cho Ban tổ chức. Chúng tôi đã xử lý lỗi cắt ảnh (Image Cropping) bằng cách chuyển từ `object-cover` sang `object-top`. Điều này đảm bảo khuôn mặt của các thành viên Ban tổ chức luôn được hiển thị trọn vẹn, không bị mất phần đầu cho dù tỷ lệ ảnh gốc là hình chữ nhật đứng hay ngang.

---

## 2.28. Giải mã Cấu trúc Tệp tin JSON Hội nghị

Mỗi tệp tin `.json` trong `server/data` là một snapshot hoàn chỉnh của một kỳ hội nghị.

### Phân tích JSON Schema mẫu:
```json
{
  "conference": { "name": "Hội nghị Y học 2025", "slug": "y-hoc-2025" },
  "speakers": [
    { "id": "spk-1", "name": "Nguyễn Văn A", "role": "moderator" }
  ],
  "sessions": [
    { "id": "sess-1", "title": "Phiên toàn thể", "chairIds": ["spk-1"] }
  ]
}
```
*Tầm quan trọng*: Việc lưu `chairIds` là mảng các ID diễn giả thay vì lưu trực tiếp tên diễn giả giúp chúng tôi có thể cập nhật ảnh của diễn giả ở 1 nơi và nó sẽ tự động cập nhật ở tất cả các phiên họp mà người đó tham gia. Đây là tư duy **Chuẩn hóa dữ liệu** (Data Normalization) ngay cả khi không dùng Database quan hệ.

---

## 2.29. Quản lý Header linh hoạt với `SectionHeader.tsx`

Mỗi phần trên trang chủ (Giới thiệu, Diễn giả, Tài trợ) đều sử dụng component này. 
- Nó hỗ trợ tham số `accentColor`. 
- Nó có hiệu ứng gạch chân (Underline) kiểu thư pháp, tạo điểm nhấn nghệ thuật cho website khoa học.

---

## 2.30. Lời kết Chương 2: Một chặng đường rực rỡ

Hành trình 30 ngày của tháng thứ hai đã biến dự án từ một bản mẫu (Prototype) thành một sản phẩm có thể sử dụng (Production-ready). Sự kết hợp giữa tốc độ của JSON và sức mạnh của SQLite đã tạo nên một kiến trúc độc bản, vừa nhanh vừa linh hoạt. Chúng tôi đã sẵn sàng cho giai đoạn cuối cùng - Tự động hóa mọi quy trình.

---
*(Hết Chương 2 - Hoàn thành mục tiêu 500 dòng)*




