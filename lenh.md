# Hướng dẫn cập nhật file lên server

Đây là danh sách các file đã được thay đổi hoặc tạo mới. Bạn cần upload các file này lên server `160.187.1.27` vào thư mục `DynamicConfManager`.

## Lệnh để upload file

Bạn có thể sử dụng các lệnh `rsync` sau để upload tất cả các file. `rsync` hiệu quả hơn `scp` vì nó chỉ chuyển các phần đã thay đổi của file.

**Lưu ý:** Thay `user@160.187.1.27:/path/to/` bằng thông tin đúng của bạn.

```bash
# Upload các file đã sửa đổi và file mới
rsync -avz shared/schema.ts user@160.187.1.27:/path/to/DynamicConfManager/shared/schema.ts
rsync -avz server/routes.ts user@160.187.1.27:/path/to/DynamicConfManager/server/routes.ts
rsync -avz server/jsonStorage.ts user@160.187.1.27:/path/to/DynamicConfManager/server/jsonStorage.ts
rsync -avz client/src/components/AdminLayout.tsx user@160.187.1.27:/path/to/DynamicConfManager/client/src/components/AdminLayout.tsx
rsync -avz client/src/AdminApp.tsx user@160.187.1.27:/path/to/DynamicConfManager/client/src/AdminApp.tsx
rsync -avz client/src/pages/public/HomePage.tsx user@160.187.1.27:/path/to/DynamicConfManager/client/src/pages/public/HomePage.tsx
rsync -avz client/src/components/PublicLayout.tsx user@160.187.1.27:/path/to/DynamicConfManager/client/src/components/PublicLayout.tsx
rsync -avz server/data/hoi-nghi-y-hoc-lan-4-2025.json user@160.187.1.27:/path/to/DynamicConfManager/server/data/hoi-nghi-y-hoc-lan-4-2025.json
rsync -avz client/src/pages/admin/OrganizersManagementPage.tsx user@160.187.1.27:/path/to/DynamicConfManager/client/src/pages/admin/OrganizersManagementPage.tsx
rsync -avz client/src/pages/public/OrganizersPage.tsx user@160.187.1.27:/path/to/DynamicConfManager/client/src/pages/public/OrganizersPage.tsx
```

## Lệnh để restart server

Sau khi đã upload tất cả các file, bạn cần SSH vào server và restart ứng dụng bằng PM2.

```bash
# SSH vào server
ssh user@160.187.1.27

# Liệt kê các ứng dụng đang chạy bằng pm2 để tìm tên ứng dụng
pm2 list

# Restart ứng dụng (thay 'your_app_name' bằng tên ứng dụng của bạn)
pm2 restart your_app_name
```
