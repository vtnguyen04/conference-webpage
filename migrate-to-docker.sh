#!/bin/bash
set -e # Dừng ngay nếu có lỗi

echo "------------------------------------------------"
echo "🚚 Starting data migration to Docker..."
echo "------------------------------------------------"

# Kiểm tra quyền ghi (Write Permission)
# Nếu thư mục docker-data đã tồn tại và user hiện tại không ghi được (do root sở hữu)
if [ -d "docker-data" ] && [ ! -w "docker-data" ]; then
    echo "❌ LỖI: Không có quyền ghi vào thư mục 'docker-data'."
    echo "Nguyên nhân: Thư mục này do Docker tạo ra nên thuộc quyền Root."
    echo "👉 Giải pháp: Hãy chạy script này với sudo:"
    echo "   sudo ./migrate-to-docker.sh"
    exit 1
fi

mkdir -p docker-data/db
mkdir -p docker-data/uploads

if [ -f "server/data/main.db" ]; then
    echo "📄 Copying main.db..."
    # Dùng cp -f để ghi đè file cũ (nếu có)
    cp -f server/data/main.db docker-data/db/
    echo "✅ Database copied successfully."
fi

if [ -d "public/uploads" ]; then
    echo "📂 Copying uploads..."
    cp -rf public/uploads/* docker-data/uploads/
    echo "✅ Uploads copied successfully."
fi

echo "------------------------------------------------"
echo "✅ Migration Finished!"
echo "You can now run ./deploy-docker.sh"
echo "------------------------------------------------"
