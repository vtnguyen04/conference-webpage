#!/bin/bash
set -e

echo "------------------------------------------------"
echo "🚚 Starting ALL DATA migration to Docker..."
echo "------------------------------------------------"

# Kiểm tra quyền ghi
if [ -d "docker-data" ] && [ ! -w "docker-data" ]; then
    echo "❌ LỖI: Không có quyền ghi vào 'docker-data'."
    echo "👉 Hãy chạy: sudo ./migrate-to-docker.sh"
    exit 1
fi

mkdir -p docker-data/db
mkdir -p docker-data/uploads

# 1. Copy TOÀN BỘ thư mục server/data (bao gồm .db, .json, .pdf...)
if [ -d "server/data" ]; then
    echo "📄 Copying ALL files from server/data/..."
    # Dùng -r để copy thư mục, -f để ghi đè
    cp -rf server/data/* docker-data/db/
    echo "✅ All server data files copied."
else
    echo "⚠️  Warning: server/data directory not found!"
fi

# 2. Copy TOÀN BỘ uploads
if [ -d "public/uploads" ]; then
    echo "📂 Copying all uploads..."
    cp -rf public/uploads/* docker-data/uploads/
    echo "✅ All uploads copied."
fi

echo "------------------------------------------------"
echo "✅ Migration Finished Successfully!"
echo "Now run ./deploy-docker.sh to apply changes."
echo "------------------------------------------------"