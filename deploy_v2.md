# Hướng dẫn triển khai ứng dụng với HTTPS (Nginx & Let's Encrypt)

Tài liệu này cung cấp hướng dẫn chi tiết để triển khai ứng dụng Node.js của bạn trên VPS Ubuntu, cấu hình Nginx làm reverse proxy, thiết lập HTTPS bằng Let's Encrypt (Certbot) và bảo mật cổng ứng dụng bằng UFW.

## 1. Giới thiệu

Mục tiêu của tài liệu này là hướng dẫn bạn từng bước để:
*   Cài đặt và cấu hình Nginx làm máy chủ reverse proxy.
*   Tự động lấy và gia hạn chứng chỉ SSL/TLS miễn phí từ Let's Encrypt bằng Certbot.
*   Chuyển hướng tất cả lưu lượng HTTP sang HTTPS.
*   Chặn truy cập trực tiếp vào cổng ứng dụng của bạn bằng tường lửa UFW.

## 2. Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn có:
*   Một máy chủ ảo (VPS) chạy Ubuntu (phiên bản 20.04 LTS hoặc mới hơn được khuyến nghị).
*   Ứng dụng Node.js của bạn đang chạy và lắng nghe trên cổng `5000` (hoặc cổng khác, bạn sẽ cần điều chỉnh cấu hình).
*   Một tên miền (ví dụ: `hnkhktd.csyh.online`) đã được trỏ đến địa chỉ IP công cộng của VPS của bạn thông qua bản ghi `A` trong cài đặt DNS.
*   Truy cập SSH với quyền `root` hoặc người dùng có quyền `sudo` trên VPS.

## 3. Hướng dẫn thiết lập HTTPS chi tiết

Thực hiện các lệnh sau trên VPS của bạn thông qua SSH.

### 3.1. Cài đặt Nginx

Cập nhật danh sách gói và cài đặt Nginx:

```bash
sudo apt update
sudo apt install -y nginx
```

Kiểm tra trạng thái Nginx để đảm bảo nó đang chạy:

```bash
sudo systemctl status nginx
```

Bạn sẽ thấy `active (running)`.

### 3.2. Cấu hình Nginx làm Reverse Proxy

Tạo một file cấu hình Nginx mới cho tên miền của bạn. Thay thế `hnkhktd.csyh.online` bằng tên miền thực tế của bạn.

```bash
sudo nano /etc/nginx/sites-available/hnkhktd.csyh.online
```

Dán nội dung sau vào file, sau đó lưu (`Ctrl+X`, `Y`, `Enter`):

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name hnkhktd.csyh.online;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt cấu hình bằng cách tạo một symbolic link:

```bash
sudo ln -s /etc/nginx/sites-available/hnkhktd.csyh.online /etc/nginx/sites-enabled/
```

Kiểm tra cú pháp cấu hình Nginx để đảm bảo không có lỗi:

```bash
sudo nginx -t
```

Nếu bạn thấy `test is successful`, hãy khởi động lại Nginx để áp dụng các thay đổi:

```bash
sudo systemctl restart nginx
```

### 3.3. Điều chỉnh tường lửa UFW

Nếu UFW chưa hoạt động, chúng ta cần kích hoạt nó và cho phép các cổng cần thiết.

Cho phép cổng SSH (22) để tránh mất kết nối:

```bash
sudo ufw allow 22
```

Kích hoạt UFW. Bạn sẽ được hỏi xác nhận, gõ `y` và `Enter`:

```bash
sudo ufw enable
```

Cho phép Nginx Full (cổng 80 và 443):

```bash
sudo ufw allow 'Nginx Full'
```

Kiểm tra trạng thái UFW:

```bash
sudo ufw status verbose
```

Bạn sẽ thấy `Status: active` và các quy tắc cho cổng 22, 80, 443.

### 3.4. Cài đặt Certbot và lấy chứng chỉ SSL

Cài đặt Certbot và plugin Nginx của nó:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Chạy Certbot để tự động lấy chứng chỉ SSL và cấu hình Nginx. Thay thế `your_email@example.com` bằng địa chỉ email của bạn:

```bash
sudo certbot --nginx -d hnkhktd.csyh.online --non-interactive --agree-tos -m nguyenvothanh04@gmail.com --redirect
```

*   `--non-interactive`: Chạy Certbot mà không cần tương tác.
*   `--agree-tos`: Tự động đồng ý với Điều khoản dịch vụ của Let's Encrypt.
*   `-m nguyenvothanh04@gmail.com`: Địa chỉ email của bạn để nhận thông báo gia hạn.
*   `--redirect`: Tự động cấu hình Nginx để chuyển hướng HTTP sang HTTPS.

Nếu thành công, bạn sẽ thấy thông báo `Congratulations! You have successfully enabled HTTPS on https://hnkhktd.csyh.online`.

### 3.5. Chặn truy cập trực tiếp vào cổng ứng dụng (5000)

Để đảm bảo tất cả lưu lượng truy cập đều đi qua Nginx và được bảo mật bằng HTTPS, chúng ta sẽ chặn truy cập trực tiếp từ bên ngoài vào cổng 5000 của ứng dụng:

```bash
sudo ufw deny 5000
```

Kiểm tra lại trạng thái UFW để xác nhận quy tắc đã được thêm:

```bash
sudo ufw status verbose
```

Bạn sẽ thấy `5000 DENY IN Anywhere`.

## 4. Xác minh

*   **Truy cập HTTPS:** Mở trình duyệt và truy cập `https://hnkhktd.csyh.online`. Đảm bảo trang web tải qua HTTPS và có biểu tượng khóa an toàn.
*   **Chuyển hướng HTTP:** Thử truy cập `http://hnkhktd.csyh.online`. Nó sẽ tự động chuyển hướng sang HTTPS.
*   **Chặn cổng 5000:** Thử truy cập `http://hnkhktd.csyh.online:5000/`. Bạn sẽ không thể truy cập được từ bên ngoài.

## 5. Sửa đổi và thay đổi

### 5.1. Cập nhật cấu hình Nginx

Để thay đổi cấu hình Nginx (ví dụ: thay đổi cổng `proxy_pass` nếu ứng dụng của bạn chạy trên cổng khác):

1.  Chỉnh sửa file cấu hình:
    ```bash
    sudo nano /etc/nginx/sites-available/hnkhktd.csyh.online
    ```
2.  Sau khi chỉnh sửa, kiểm tra cú pháp:
    ```bash
    sudo nginx -t
    ```
3.  Nếu không có lỗi, khởi động lại Nginx:
    ```bash
    sudo systemctl restart nginx
    ```

### 5.2. Gia hạn chứng chỉ SSL

Certbot tự động thiết lập một cron job hoặc systemd timer để gia hạn chứng chỉ của bạn trước khi chúng hết hạn. Bạn có thể kiểm tra quá trình gia hạn tự động bằng cách chạy thử:

```bash
sudo certbot renew --dry-run
```

Nếu không có lỗi, quá trình gia hạn tự động đang hoạt động.

### 5.3. Quản lý quy tắc UFW

*   **Xem tất cả các quy tắc:**
    ```bash
    sudo ufw status verbose
    ```
*   **Xóa một quy tắc:** Để xóa một quy tắc, bạn cần biết số của nó. Liệt kê các quy tắc với số:
    ```bash
    sudo ufw status numbered
    ```
    Sau đó, xóa quy tắc theo số (ví dụ, để xóa quy tắc số 3):
    ```bash
    sudo ufw delete 3
    ```
*   **Tạm thời vô hiệu hóa UFW:**
    ```bash
    sudo ufw disable
    ```
    **Cảnh báo:** Điều này sẽ mở tất cả các cổng. Chỉ sử dụng khi cần thiết và kích hoạt lại ngay sau đó.
*   **Kích hoạt lại UFW:**
    ```bash
    sudo ufw enable
    ```

### 5.4. Thay đổi cổng ứng dụng Node.js

Nếu bạn thay đổi cổng mà ứng dụng Node.js của bạn lắng nghe (ví dụ: từ 5000 sang 3000):

1.  **Cập nhật cấu hình Nginx:**
    Chỉnh sửa file `/etc/nginx/sites-available/hnkhktd.csyh.online` và thay đổi `proxy_pass http://localhost:5000;` thành `proxy_pass http://localhost:3000;` (hoặc cổng mới của bạn).
    Sau đó, kiểm tra và khởi động lại Nginx như mô tả ở mục 5.1.

2.  **Cập nhật quy tắc UFW (nếu cần):**
    Nếu bạn muốn chặn cổng mới và bỏ chặn cổng cũ, bạn sẽ cần:
    *   Xóa quy tắc chặn cổng cũ (ví dụ: 5000):
        ```bash
        sudo ufw delete deny 5000
        ```
    *   Thêm quy tắc chặn cổng mới (ví dụ: 3000):
        ```bash
        sudo ufw deny 3000
        ```
    *   Kiểm tra lại UFW status.

## 6. Khắc phục sự cố

*   **Trang web không tải:**
    *   Kiểm tra xem Nginx có đang chạy không: `sudo systemctl status nginx`
    *   Kiểm tra lỗi cấu hình Nginx: `sudo nginx -t`
    *   Kiểm tra log Nginx: `sudo tail -f /var/log/nginx/error.log`
    *   Đảm bảo ứng dụng Node.js của bạn đang chạy trên cổng 5000.
    *   Kiểm tra trạng thái UFW: `sudo ufw status verbose` để đảm bảo cổng 80 và 443 được cho phép.

*   **Chứng chỉ SSL không hợp lệ:**
    *   Đảm bảo tên miền của bạn trỏ đúng IP của VPS.
    *   Chạy lại Certbot: `sudo certbot --nginx -d hnkhktd.csyh.online`
    *   Kiểm tra log Certbot: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

*   **Lỗi "502 Bad Gateway" hoặc "504 Gateway Timeout":**
    *   Điều này thường có nghĩa là Nginx không thể kết nối với ứng dụng Node.js của bạn.
    *   Đảm bảo ứng dụng Node.js của bạn đang chạy và lắng nghe trên cổng 5000.
    *   Kiểm tra log ứng dụng Node.js của bạn.
    *   Kiểm tra xem có bất kỳ quy tắc tường lửa nào đang chặn Nginx kết nối với `localhost:5000` không (thường không xảy ra với `localhost`).
