# Hướng dẫn Deploy và Quản lý Ứng dụng Toàn diện (Phiên bản cuối)

Tài liệu này là một hướng dẫn chi tiết, toàn diện, giúp bạn có thể tự tin cài đặt, deploy, quản lý và khắc phục sự cố cho ứng dụng web của mình trên một máy chủ ảo (VPS), dù bạn có sử dụng Git hay không.

## Mục lục
1.  [Cài đặt ban đầu trên Server](#1-cài-đặt-ban-đầu-trên-server)
2.  [Deploy Lần đầu tiên](#2-deploy-lần-đầu-tiên)
3.  [Cập nhật ứng dụng (Workflow)](#3-cập-nhật-ứng-dụng-workflow)
    *   [3.1. Workflow với Git (Khuyên dùng)](#31-workflow-với-git-khuyên-dùng)
    *   [3.2. Workflow không qua Git (Thủ công)](#32-workflow-không-qua-git-thủ-công)
4.  [Quản lý Ứng dụng với PM2](#4-quản-lý-ứng-dụng-với-pm2)
5.  [Tải File lên/xuống Server](#5-tải-file-lênxuống-server)
6.  [Troubleshooting - Khắc phục sự cố](#6-troubleshooting---khắc-phục-sự-cố)
7.  [Giải thích chi tiết file .env](#7-giải-thích-chi-tiết-file-env)
8.  [Các lệnh Ubuntu cơ bản hữu ích](#8-các-lệnh-ubuntu-cơ-bản-hữu-ích)
9.  [Lưu ý về Restart và Dữ liệu](#9-lưu-ý-về-restart-và-dữ-liệu)
10. [Cấu hình Domain/Subdomain và Che IP với Nginx](#10-cấu-hình-domainsubdomain-và-che-ip-với-nginx)
11. [Cấu hình SSH Key để đăng nhập không cần mật khẩu](#11-cấu-hình-ssh-key-để-đăng-nhập-không-cần-mật-khẩu)
12. [Cài đặt HTTPS với Certbot và Nginx](#12-cài-đặt-https-với-certbot-và-nginx)

---

## 1. Cài đặt ban đầu trên Server

Các bước này chỉ cần thực hiện một lần khi bạn deploy ứng dụng lên một server mới.

### 1.1. Kết nối đến Server

Sử dụng SSH để kết nối đến server. `root` là user, `160.187.1.27` là địa chỉ IP.

```bash
# Cú pháp: ssh <user>@<địa-chỉ-ip>
ssh root@160.187.1.27
```

### 1.2. Cài đặt Node.js và các công cụ cần thiết

```bash
sudo apt-get update
sudo apt-get install -y curl build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.3. Cài đặt PM2

```bash
sudo npm install -g pm2
```

---

## 2. Deploy Lần đầu tiên

### 2.1. Tải mã nguồn

**Cách 1: Dùng Git (Khuyên dùng)**
```bash
git clone <your-git-repository-url> DynamicConfManager
cd DynamicConfManager
```

**Cách 2: Không dùng Git**
Tải toàn bộ thư mục dự án từ máy local của bạn lên server.
```bash
# Chạy lệnh này từ máy local của bạn, trong thư mục chứa dự án
# Cú pháp: rsync -avz --exclude 'node_modules' --exclude '.git' <thư-mục-local> <user>@<ip>:<đường-dẫn-server>
rsync -avz --exclude 'node_modules' --exclude '.git' ./DynamicConfManager/ root@160.187.1.27:/root/DynamicConfManager
```
Sau đó, kết nối SSH và vào thư mục dự án:
```bash
ssh root@160.187.1.27
cd /root/DynamicConfManager
```

### 2.2. Cài đặt Dependencies

```bash
npm install
```

### 2.3. Tạo file .env

```bash
echo -e "SESSION_SECRET=d944cf516514ff88a7df9001384b0981ccd5b2457b7c9939ba47ccbd9bbd6a4a\nBASE_URL=http://160.187.1.27:5000\nADMIN_PASSWORD=conferencweb@v1\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=nguyenvothanh04@gmail.com\nSMTP_PASS=zifdvnxtksnyuzkw\nEMAIL_FROM=nguyenvothanh04@gmail.com\nCOOKIE_SECURE=false" > .env
```

### 2.4. Build và Khởi động Ứng dụng

```bash
npm run build
pm2 start ecosystem.config.cjs
```

---

## 3. Cập nhật ứng dụng (Workflow)

### 3.1. Workflow với Git (Khuyên dùng)

Đây là cách làm chuyên nghiệp và an toàn nhất.

1.  **Kết nối server và vào thư mục dự án:**
    ```bash
    ssh root@160.187.1.27
    cd DynamicConfManager
    ```
2.  **Tải code mới nhất:**
    ```bash
    git pull origin main
    ```
3.  **Cài đặt lại dependencies (nếu cần):**
    ```bash
    npm install
    ```
4.  **Rebuild và Restart:**
    ```bash
    npm run build
    pm2 restart DynamicConfManager
    ```

### 3.2. Workflow không qua Git (Thủ công)

Dùng khi bạn sửa code trực tiếp trên máy local và không dùng Git.

1.  **Đồng bộ hóa thư mục dự án:**
    Chạy lệnh này từ máy local của bạn. Lệnh này sẽ đồng bộ hóa toàn bộ thư mục dự án, loại trừ `node_modules` và `.git`.

    ```bash
    # Cú pháp: rsync -avz --exclude 'node_modules' --exclude '.git' <thư-mục-local> <user>@<ip>:<đường-dẫn-server>
    rsync -avz --exclude 'node_modules' --exclude '.git' ./DynamicConfManager/ root@160.187.1.27:/root/DynamicConfManager
    ```

2.  **Kết nối server, Rebuild và Restart:**
    ```bash
    ssh root@160.187.1.27
    cd /root/DynamicConfManager
    npm run build
    pm2 restart DynamicConfManager
    ```

---

## 4. Quản lý Ứng dụng với PM2

`pm2` cung cấp nhiều lệnh hữu ích để quản lý ứng dụng của bạn.

### 4.1. Kiểm tra Trạng thái Ứng dụng

Xem trạng thái (`online`, `stopped`, `errored`), CPU, memory của tất cả các ứng dụng.

```bash
pm2 status
# Hoặc ngắn gọn hơn
pm2 ls
```

### 4.2. Xem Logs

Xem logs của ứng dụng để debug lỗi. Đây là công cụ quan trọng nhất để khắc phục sự cố.

```bash
# Xem logs real-time của ứng dụng có tên DynamicConfManager
pm2 logs DynamicConfManager

# Chỉ xem logs lỗi
pm2 logs DynamicConfManager --err

# Xem logs với số dòng giới hạn (ví dụ: 100 dòng cuối)
pm2 logs DynamicConfManager --lines 100

# Xem logs với định dạng JSON
pm2 logs DynamicConfManager --json

# Thoát khỏi chế độ xem logs bằng cách nhấn Ctrl + C
```

### 4.3. Dừng, Khởi động lại, Xóa Ứng dụng

```bash
# Dừng ứng dụng
pm2 stop DynamicConfManager

# Khởi động lại ứng dụng
pm2 restart DynamicConfManager

# Xóa ứng dụng khỏi danh sách của pm2
pm2 delete DynamicConfManager
```

---

## 5. Tải File lên/xuống Server

Đôi khi bạn chỉ muốn sửa một file duy nhất hoặc tải một file log về máy.

### 5.1. Tải một file từ local lên server

```bash
# Chạy từ máy local
# Cú pháp: rsync -avz <đường-dẫn-file-local> <user>@<ip>:<đường-dẫn-file-server>
rsync -avz ./server/routes.ts root@160.187.1.27:/root/DynamicConfManager/server/routes.ts
```
Sau khi tải file lên, bạn cần **Rebuild và Restart** ứng dụng như ở bước 3.

### 5.2. Tải một file từ server về máy local

```bash
# Chạy từ máy local
# Cú pháp: rsync -avz <user>@<ip>:<đường-dẫn-file-server> <đường-dẫn-file-local>
rsync -avz root@160.187.1.27:/root/.pm2/logs/DynamicConfManager-out.log ./server-logs.log
```

---

## 6. Troubleshooting - Khắc phục sự cố

### 6.1. Lỗi "401 Invalid Credentials" khi đăng nhập

Đây là lỗi phổ biến nhất, thường do sai cấu hình environment variables.

1.  **Kiểm tra file `.env`:**
    Kết nối đến server và kiểm tra nội dung file `.env`.

    ```bash
    ssh root@160.187.1.27
    cat /root/DynamicConfManager/.env
    ```

    Đảm bảo rằng file có nội dung đúng, mỗi biến nằm trên một dòng và giá trị `ADMIN_PASSWORD` là chính xác.

2.  **Kiểm tra logs:**
    Xem logs của `pm2` để kiểm tra xem ứng dụng có đọc được biến môi trường không.

    ```bash
    pm2 logs DynamicConfManager --lines 100
    ```

    Tìm dòng log có nội dung `ADMIN_PASSWORD from env:`. Nếu giá trị là `undefined`, có nghĩa là ứng dụng không đọc được file `.env`.

3.  **Cách khắc phục:**
    -   Đảm bảo file `.env` nằm ở thư mục gốc của dự án (`/root/DynamicConfManager/.env`).
    -   Đảm bảo file `server/index.ts` có chứa đoạn code sau ở đầu file:
        ```typescript
        import dotenv from 'dotenv';
        dotenv.config({ path: './.env' });
        ```
    -   Sau khi sửa file `.env` hoặc code, hãy build và restart lại ứng dụng.

### 6.2. Ứng dụng không khởi động hoặc bị crash

1.  **Kiểm tra trạng thái `pm2`:**
    ```bash
pm2 status
```
    Nếu trạng thái là `errored`, có nghĩa là ứng dụng đã crash.

2.  **Kiểm tra logs lỗi:**
    ```bash
pm2 logs DynamicConfManager --err
```
    Logs lỗi sẽ cho bạn biết chính xác nguyên nhân gây ra crash (ví dụ: lỗi cú pháp, không thể kết nối database, ...).

### 6.3. Session không được lưu sau khi đăng nhập

Vấn đề này thường liên quan đến `COOKIE_SECURE`.

-   Nếu bạn đang truy cập website qua `http://` (không có SSL), biến `COOKIE_SECURE` trong file `.env` **phải** được đặt là `false`.
-   Nếu bạn đã cài đặt SSL và truy cập qua `https://`, hãy đặt `COOKIE_SECURE` là `true`.

Sau khi thay đổi, hãy restart lại ứng dụng.

---

## 7. Giải thích chi tiết file .env

File `.env` chứa các thông tin nhạy cảm và cấu hình môi trường. **Không bao giờ commit file này lên Git.**

-   `SESSION_SECRET`: Một chuỗi ký tự dài và ngẫu nhiên, dùng để bảo vệ session của người dùng. Bạn có thể tự sinh một chuỗi mới bằng các công cụ online.
-   `BASE_URL`: Địa chỉ URL đầy đủ của ứng dụng. Được sử dụng để tạo các link trong email.
-   `ADMIN_PASSWORD`: Mật khẩu cho tài khoản admin.
-   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: Cấu hình để ứng dụng có thể gửi email (ví dụ: email xác nhận đăng ký). Bạn cần có một tài khoản email (ví dụ: Gmail) và tạo "App Password" nếu dùng 2FA.
-   `COOKIE_SECURE`: Như đã giải thích ở trên, quyết định xem cookie có nên chỉ được gửi qua kết nối HTTPS hay không.

---

## 8. Các lệnh Ubuntu cơ bản hữu ích

Đây là một số lệnh cơ bản bạn có thể cần dùng khi làm việc trên server Ubuntu.

### 8.1. Quản lý File và Thư mục

-   `ls` (list): Liệt kê nội dung của một thư mục.
    -   `ls -l`: Hiển thị chi tiết (quyền, chủ sở hữu, kích thước, ngày).
    -   `ls -a`: Hiển thị tất cả file, bao gồm cả file ẩn (bắt đầu bằng `.`).
    -   `ls -lh`: Hiển thị chi tiết với kích thước dễ đọc (ví dụ: 1K, 234M, 2G).
-   `cd` (change directory): Thay đổi thư mục hiện hành.
    -   `cd /path/to/directory`: Di chuyển đến một thư mục cụ thể.
    -   `cd ..`: Di chuyển lên một cấp thư mục.
    -   `cd`: Di chuyển về thư mục home của người dùng hiện tại.
-   `pwd` (print working directory): Hiển thị đường dẫn thư mục hiện hành.
-   `mkdir` (make directory): Tạo thư mục mới.
    -   `mkdir my_new_folder`: Tạo thư mục `my_new_folder`.
    -   `mkdir -p parent/child`: Tạo thư mục `child` bên trong `parent`, tạo `parent` nếu nó chưa tồn tại.
-   `rm` (remove): Xóa file hoặc thư mục.
    -   `rm myfile.txt`: Xóa file `myfile.txt`.
    -   `rm -r my_folder`: Xóa thư mục `my_folder` và tất cả nội dung bên trong (recursive).
    -   `rm -rf my_folder`: Xóa thư mục `my_folder` và tất cả nội dung bên trong mà không hỏi xác nhận (cẩn thận khi dùng!).
-   `cp` (copy): Sao chép file hoặc thư mục.
    -   `cp file1.txt /path/to/new_location`: Sao chép `file1.txt` đến vị trí mới.
    -   `cp -r folder1 /path/to/new_location`: Sao chép thư mục `folder1` và nội dung của nó.
-   `mv` (move): Di chuyển hoặc đổi tên file/thư mục.
    -   `mv oldname.txt newname.txt`: Đổi tên file.
    -   `mv myfile.txt /path/to/new_location`: Di chuyển file.
-   `cat` (concatenate): Hiển thị nội dung của file.
    -   `cat myfile.txt`: Hiển thị toàn bộ nội dung.
-   `nano` hoặc `vim`: Các trình soạn thảo văn bản trong terminal.
    -   `nano myfile.txt`: Mở `myfile.txt` bằng `nano` (dễ dùng cho người mới).
    -   `vim myfile.txt`: Mở `myfile.txt` bằng `vim` (mạnh mẽ nhưng có độ khó học cao hơn).

### 8.2. Quản lý Tiến trình

-   `ps` (process status): Hiển thị các tiến trình đang chạy.
    -   `ps aux`: Hiển thị tất cả tiến trình của tất cả người dùng.
-   `top`: Hiển thị các tiến trình đang chạy theo thời gian thực, sắp xếp theo mức độ sử dụng CPU. Nhấn `q` để thoát.
-   `kill`: Dừng một tiến trình bằng ID của nó.
    -   `kill <PID>`: Gửi tín hiệu dừng mặc định (SIGTERM).
    -   `kill -9 <PID>`: Buộc dừng tiến trình (SIGKILL - dùng khi tiến trình không phản hồi).

### 8.3. Thông tin Hệ thống

-   `df` (disk free): Hiển thị dung lượng đĩa trống.
    -   `df -h`: Hiển thị dung lượng dễ đọc (human-readable).
-   `du` (disk usage): Hiển thị dung lượng sử dụng của file/thư mục.
    -   `du -sh /path/to/folder`: Hiển thị tổng dung lượng của một thư mục.
-   `free`: Hiển thị thông tin về bộ nhớ RAM.
    -   `free -h`: Hiển thị dễ đọc.
-   `uname`: Hiển thị thông tin hệ điều hành.
    -   `uname -a`: Hiển thị tất cả thông tin.

### 8.4. Mạng

-   `ping`: Kiểm tra kết nối đến một địa chỉ IP hoặc domain.
    -   `ping google.com`: Gửi gói tin đến `google.com`. Nhấn `Ctrl + C` để dừng.
-   `netstat` (network statistics): Hiển thị các kết nối mạng, bảng định tuyến, thống kê giao diện.
    -   `netstat -tulnp`: Hiển thị các cổng đang mở (TCP, UDP, listening, PID).
-   `curl`: Công cụ để truyền dữ liệu từ hoặc đến một server.
    -   `curl -I google.com`: Hiển thị header HTTP của `google.com`.
    -   `curl -O http://example.com/file.zip`: Tải file `file.zip`.
-   `wget`: Tải file từ web.
    -   `wget http://example.com/file.zip`: Tải file `file.zip`.

### 8.5. Quyền hạn File

-   `chmod` (change mode): Thay đổi quyền hạn của file/thư mục.
    -   `chmod 755 myfile.sh`: Cấp quyền đọc, ghi, thực thi cho chủ sở hữu; đọc, thực thi cho nhóm và người khác.
    -   `chmod +x myfile.sh`: Cấp quyền thực thi cho tất cả.
-   `chown` (change owner): Thay đổi chủ sở hữu của file/thư mục.
    -   `chown user:group myfile.txt`: Thay đổi chủ sở hữu và nhóm.

### 8.6. Tìm kiếm

-   `grep`: Tìm kiếm văn bản trong file.
    -   `grep "keyword" myfile.txt`: Tìm `keyword` trong `myfile.txt`.
    -   `grep -r "keyword" /path/to/folder`: Tìm kiếm đệ quy trong thư mục.
-   `find`: Tìm kiếm file và thư mục.
    -   `find . -name "myfile.txt"`: Tìm file tên `myfile.txt` trong thư mục hiện tại và các thư mục con.
    -   `find /var/log -size +10M`: Tìm file lớn hơn 10MB trong `/var/log`.

---

## 9. Lưu ý về Restart và Dữ liệu

### 9.1. Khởi động lại Ứng dụng (`pm2 restart`) vs. Khởi động lại Server (VPS)

-   **Khởi động lại Ứng dụng (`pm2 restart DynamicConfManager`)**: Lệnh này chỉ dừng và khởi động lại tiến trình Node.js của ứng dụng của bạn. Nó không ảnh hưởng đến các dịch vụ khác trên server hay toàn bộ hệ điều hành. Đây là thao tác nhanh chóng và thường không gây gián đoạn đáng kể cho người dùng.
-   **Khởi động lại Server (VPS)**: Thao tác này sẽ tắt và bật lại toàn bộ máy chủ ảo của bạn. Điều này sẽ làm dừng tất cả các dịch vụ đang chạy trên server, bao gồm cả ứng dụng của bạn. Chỉ thực hiện khi cần thiết (ví dụ: cập nhật kernel, thay đổi cấu hình hệ thống lớn).

### 9.2. Cơ chế Zero-Downtime của PM2

`pm2` được thiết kế để thực hiện khởi động lại ứng dụng một cách "không gián đoạn" (zero-downtime). Khi bạn chạy `pm2 restart`, `pm2` sẽ:
1.  Khởi động phiên bản mới của ứng dụng.
2.  Chờ cho phiên bản mới khởi động hoàn tất và sẵn sàng nhận request.
3.  Chỉ khi đó, nó mới dừng phiên bản cũ của ứng dụng.
Điều này giúp giảm thiểu thời gian ứng dụng không khả dụng, mang lại trải nghiệm mượt mà hơn cho người dùng.

### 9.3. Dữ liệu có bị mất khi Restart không?

**Không, dữ liệu của bạn sẽ không bị mất khi bạn khởi động lại ứng dụng bằng `pm2 restart`.**

-   **Dữ liệu Database**: Ứng dụng của bạn sử dụng SQLite, một database dựa trên file. Dữ liệu được lưu trữ vĩnh viễn trên ổ đĩa của server và không bị ảnh hưởng bởi việc khởi động lại ứng dụng.
-   **File Upload**: Các file mà người dùng upload lên (ví dụ: ảnh, PDF) cũng được lưu trữ trên ổ đĩa và sẽ không bị mất.
-   **Session Người dùng**: Mặc dù session là dữ liệu tạm thời, nhưng ứng dụng này sử dụng `connect-sqlite3` để lưu trữ session vào database. Điều này có nghĩa là session của người dùng cũng sẽ được duy trì qua các lần khởi động lại ứng dụng.

Tóm lại, bạn có thể yên tâm sử dụng `pm2 restart DynamicConfManager` mỗi khi cập nhật code mà không lo lắng về việc mất dữ liệu hay gián đoạn dịch vụ kéo dài.

---

## 10. Cấu hình Domain/Subdomain và Che IP với Nginx

Để ứng dụng của bạn có thể truy cập được qua một domain hoặc subdomain thay vì địa chỉ IP, và để che đi cổng `5000` của Node.js, chúng ta sẽ sử dụng Nginx làm reverse proxy.

### 10.1. Cấu hình DNS

Bạn cần truy cập vào trang quản lý DNS của nhà cung cấp domain (ví dụ: GoDaddy, Namecheap, Cloudflare) và tạo một bản ghi `A` hoặc `CNAME`:

-   **Nếu dùng Domain chính (ví dụ: `yourdomain.com`):**
    -   **Type:** `A`
    -   **Name:** `@` hoặc `yourdomain.com`
    -   **Value:** Địa chỉ IP của VPS của bạn (`160.187.1.27`)
-   **Nếu dùng Subdomain (ví dụ: `app.yourdomain.com`):**
    -   **Type:** `A`
    -   **Name:** `app`
    -   **Value:** Địa chỉ IP của VPS của bạn (`160.187.1.27`)

Thời gian để bản ghi DNS có hiệu lực (propagate) có thể mất vài phút đến vài giờ.

### 10.2. Cài đặt Nginx trên VPS

Kết nối SSH vào VPS của bạn và cài đặt Nginx:

```bash
ssh root@160.187.1.27
sudo apt-get update
sudo apt-get install -y nginx
```

### 10.3. Cấu hình Nginx làm Reverse Proxy

Tạo một file cấu hình mới cho domain/subdomain của bạn. Thay `yourdomain.com` bằng domain hoặc subdomain thực tế của bạn.

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Dán nội dung sau vào file, sau đó lưu lại (Ctrl+S, Enter, Ctrl+X):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com; # Thay bằng domain hoặc subdomain của bạn

    location / {
        proxy_pass http://localhost:5000; # Cổng mà ứng dụng Node.js của bạn đang chạy
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.4. Kích hoạt cấu hình Nginx

Tạo một symbolic link từ `sites-available` sang `sites-enabled` để kích hoạt cấu hình.

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
```

Kiểm tra cú pháp cấu hình Nginx để đảm bảo không có lỗi:

```bash
sudo nginx -t
```

Nếu không có lỗi, khởi động lại Nginx để áp dụng các thay đổi:

```bash
sudo systemctl restart nginx
```

### 10.5. Cập nhật `BASE_URL` trong `.env`

Cuối cùng, bạn cần cập nhật biến `BASE_URL` trong file `.env` của ứng dụng để nó phản ánh domain mới.

```bash
# Mở file .env để chỉnh sửa
nano /root/DynamicConfManager/.env
```

Thay đổi dòng `BASE_URL=http://160.187.1.27:5000` thành:

```
BASE_URL=http://yourdomain.com # Hoặc https://yourdomain.com nếu bạn cài đặt SSL
```

Sau đó, lưu file và khởi động lại ứng dụng Node.js của bạn:

```bash
cd /root/DynamicConfManager
pm2 restart DynamicConfManager
```

Bây giờ, ứng dụng của bạn sẽ có thể truy cập được qua domain/subdomain mà bạn đã cấu hình, và địa chỉ IP cùng cổng `5000` sẽ được che đi bởi Nginx.

---

## 11. Cấu hình SSH Key để đăng nhập không cần mật khẩu

Việc sử dụng SSH Key giúp tăng cường bảo mật và tiện lợi hơn rất nhiều so với việc dùng mật khẩu để đăng nhập SSH.

### 11.1. Tạo cặp khóa SSH trên máy tính Local của bạn

Mở Terminal (trên Linux/macOS) hoặc Git Bash/WSL (trên Windows) và chạy lệnh sau:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```
-   `-t rsa`: Chỉ định loại thuật toán là RSA.
-   `-b 4096`: Chỉ định độ dài khóa là 4096 bit (khuyên dùng).
-   `-C "your_email@example.com"`: Thêm một comment để dễ nhận biết khóa này thuộc về ai.

Bạn sẽ được hỏi nơi lưu khóa (mặc định là `~/.ssh/id_rsa`) và passphrase.
-   **Nơi lưu khóa:** Nhấn Enter để chấp nhận vị trí mặc định.
-   **Passphrase:** Bạn có thể nhập một passphrase để bảo vệ khóa của mình (khuyên dùng để tăng cường bảo mật) hoặc để trống nếu muốn đăng nhập hoàn toàn không cần nhập gì.

Sau khi hoàn tất, hai file sẽ được tạo:
-   `~/.ssh/id_rsa`: Khóa riêng tư (Private Key) - **Tuyệt đối không chia sẻ file này với bất kỳ ai!**
-   `~/.ssh/id_rsa.pub`: Khóa công khai (Public Key) - File này sẽ được sao chép lên server.

### 11.2. Sao chép khóa công khai lên Server

Sử dụng lệnh `ssh-copy-id` để sao chép khóa công khai của bạn lên server. Lệnh này sẽ tự động thêm khóa công khai vào file `~/.ssh/authorized_keys` trên server.

```bash
ssh-copy-id root@160.187.1.27
```
-   Lần đầu tiên chạy lệnh này, bạn sẽ được hỏi mật khẩu SSH của tài khoản `root` trên server.
-   Nếu bạn đã đặt passphrase cho khóa riêng tư, bạn sẽ được hỏi passphrase đó.

### 11.3. Đăng nhập không cần mật khẩu

Sau khi `ssh-copy-id` hoàn tất, bạn có thể thử đăng nhập lại vào server:

```bash
ssh root@160.187.1.27
```
Lúc này, bạn sẽ không cần nhập mật khẩu nữa (hoặc chỉ cần nhập passphrase nếu bạn đã đặt).

### 11.4. Khắc phục sự cố (nếu không hoạt động)

Nếu bạn vẫn bị hỏi mật khẩu sau khi thiết lập SSH keys:
-   Đảm bảo file `~/.ssh/authorized_keys` trên server có quyền `600` và thư mục `~/.ssh` có quyền `700`.
    ```bash
    # Trên server
    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/authorized_keys
    ```
-   Đảm bảo SSH agent đang chạy trên máy local của bạn và đã thêm khóa riêng tư vào.
    ```bash
    # Trên máy local
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/id_rsa
    ```
    (Nếu bạn có passphrase, bạn sẽ được hỏi ở bước này).

---

## 12. Cài đặt HTTPS với Certbot và Nginx

Cài đặt HTTPS là rất quan trọng để bảo mật dữ liệu truyền tải và cho phép các tính năng như truy cập camera trên trình duyệt. Chúng ta sẽ sử dụng Certbot để lấy chứng chỉ SSL/TLS miễn phí từ Let's Encrypt và cấu hình Nginx để sử dụng chúng.

### 12.1. Chuẩn bị Domain

Đảm bảo rằng domain hoặc subdomain của bạn đã được cấu hình DNS chính xác và trỏ về địa chỉ IP của VPS (như đã hướng dẫn ở mục 10.1).

### 12.2. Cài đặt Certbot

Certbot là công cụ giúp tự động hóa việc lấy và gia hạn chứng chỉ SSL từ Let's Encrypt.

```bash
ssh root@160.187.1.27
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

### 12.3. Cấu hình Nginx cho Certbot

Trước khi chạy Certbot, Nginx cần có một cấu hình `server` cơ bản cho domain của bạn trên cổng 80. Nếu bạn đã làm theo mục 10.3, bạn đã có cấu hình này. Đảm bảo `server_name` trong file cấu hình Nginx (`/etc/nginx/sites-available/yourdomain.com`) khớp với domain bạn muốn cài đặt SSL.

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com; # Đảm bảo khớp với domain của bạn

    location / {
        # Tạm thời không proxy_pass, Certbot sẽ cần truy cập vào đây
        # hoặc bạn có thể giữ nguyên proxy_pass nếu Certbot hỗ trợ webroot
        # Với python3-certbot-nginx, nó sẽ tự động chỉnh sửa cấu hình này
    }
}
```
Sau khi chỉnh sửa (nếu có), kiểm tra và khởi động lại Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 12.4. Lấy chứng chỉ SSL bằng Certbot

Chạy Certbot để lấy chứng chỉ và tự động cấu hình Nginx.

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
-   Thay `yourdomain.com` và `www.yourdomain.com` bằng domain thực tế của bạn.
-   Certbot sẽ hỏi bạn một số thông tin (email, đồng ý điều khoản dịch vụ).
-   Nó cũng sẽ hỏi bạn có muốn tự động chuyển hướng HTTP sang HTTPS hay không. **Chọn tùy chọn chuyển hướng (redirect)** để đảm bảo tất cả traffic đều qua HTTPS.

### 12.5. Kiểm tra gia hạn tự động

Certbot sẽ tự động tạo một cron job để gia hạn chứng chỉ của bạn trước khi hết hạn. Bạn có thể kiểm tra bằng lệnh:

```bash
sudo systemctl status certbot.timer
```

### 12.6. Cập nhật `BASE_URL` và `COOKIE_SECURE` trong `.env`

Sau khi HTTPS đã được cài đặt và Nginx đã được cấu hình, bạn cần cập nhật các biến môi trường trong file `.env` của ứng dụng.

```bash
nano /root/DynamicConfManager/deploy.md
```

Thay đổi các dòng sau:

```
BASE_URL=https://yourdomain.com # Thay bằng domain của bạn
COOKIE_SECURE=true
```

Lưu file và khởi động lại ứng dụng Node.js của bạn:

```bash
cd /root/DynamicConfManager
pm2 restart DynamicConfManager
```

Bây giờ, ứng dụng của bạn sẽ được phục vụ qua HTTPS, giải quyết vấn đề truy cập camera và tăng cường bảo mật.