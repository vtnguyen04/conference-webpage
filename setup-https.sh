#!/bin/bash
set -e

echo "------------------------------------------------"
echo "🔒 Auto HTTPS Setup Script (Nginx + Let's Encrypt)"
echo "------------------------------------------------"

# 1. Kiểm tra quyền Root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Script này cần chạy với quyền root."
  echo "👉 Hãy chạy: sudo ./setup-https.sh"
  exit 1
fi

# 2. Nhập thông tin (Nếu chưa truyền vào tham số)
DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ]; then
    echo -n "🌐 Nhập tên miền của bạn (ví dụ: myweb.com): "
    read DOMAIN
fi

if [ -z "$EMAIL" ]; then
    echo -n "📧 Nhập email quản trị (để nhận thông báo SSL): "
    read EMAIL
fi

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Lỗi: Tên miền và Email không được để trống."
    exit 1
fi

echo "------------------------------------------------"
echo "Target Domain: $DOMAIN (and www.$DOMAIN)"
echo "Admin Email:   $EMAIL"
echo "------------------------------------------------"

# 3. Cài đặt Nginx & Certbot
echo "📦 Đang cài đặt Nginx và Certbot..."
apt-get update -qq > /dev/null
apt-get install -y nginx certbot python3-certbot-nginx

# 4. Tạo cấu hình Nginx
echo "⚙️  Đang tạo cấu hình Nginx..."
CONFIG_PATH="/etc/nginx/sites-available/$DOMAIN"

# Lưu ý: Các biến có dấu \ phía trước sẽ được giữ nguyên cho Nginx
cat > "$CONFIG_PATH" <<EOF
server {
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 5. Kích hoạt cấu hình
echo "🔌 Đang kích hoạt site..."
ln -sf "$CONFIG_PATH" /etc/nginx/sites-enabled/

# Xóa trang mặc định nếu có (để tránh xung đột)
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "   Đã tắt trang mặc định của Nginx."
    rm /etc/nginx/sites-enabled/default
fi

# 6. Kiểm tra và Reload Nginx
echo "🔄 Đang khởi động lại Nginx..."
nginx -t
systemctl reload nginx

# 7. Chạy Certbot để lấy chứng chỉ SSL
echo "🔐 Đang đăng ký chứng chỉ SSL (Có thể mất 30s)..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect

echo "------------------------------------------------"
echo "✅ HOÀN TẤT! Website của bạn đã có HTTPS."
echo "👉 Truy cập ngay: https://$DOMAIN"
echo "------------------------------------------------"
