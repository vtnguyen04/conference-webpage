#!/bin/bash

echo "------------------------------------------------"
echo "🔥 DANGER: High-level Docker Cleanup starting..."
echo "------------------------------------------------"

# 1. Dừng tất cả container đang chạy
echo "🛑 1. Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

# 2. Xóa tất cả container
echo "🗑️  2. Removing all containers..."
docker rm $(docker ps -aq) 2>/dev/null || true

# 3. Xóa tất cả images
echo "🖼️  3. Removing all images..."
docker rmi -f $(docker images -aq) 2>/dev/null || true

# 4. Xóa toàn bộ Volumes (Dữ liệu trong volume nội bộ của Docker)
echo "💾 4. Removing all Docker volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# 5. Dọn dẹp hệ thống (Networks, Build Cache, Dangling resources)
echo "🧹 5. Pruning system (Networks, Cache)..."
docker system prune -af --volumes

echo "------------------------------------------------"
echo "✨ Docker is now completely clean!"
echo "Note: Your 'docker-data/' folder on the host is NOT deleted."
echo "If you want to reset app data, run: sudo rm -rf docker-data/"
echo "------------------------------------------------"
