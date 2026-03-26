#!/bin/bash
set -e

# --- Configuration ---
APP_NAME="conference-app"
IMAGE_NAME="conference-image"
PORT=5000
# Đổi tên thành 'data' cho đúng ý nghĩa (chứa cả .db và .json)
DATA_PATH_HOST="$(pwd)/docker-data/data"
UPLOADS_PATH_HOST="$(pwd)/docker-data/uploads"

echo "------------------------------------------------"
echo "🚀 Starting Docker Deployment..."
echo "------------------------------------------------"

if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found."
    exit 1
fi

if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Creating an empty one..."
    touch .env
fi

# 1. Fetch code
echo "Step 1: Fetching latest updates from repository..."
# Reset các file cấu hình có thể gây conflict trên server
git checkout package.json package-lock.json 2>/dev/null || true
# Bảo vệ các thay đổi local khác (như file .env) trước khi pull
git stash 2>/dev/null || true
git pull origin main
git stash pop 2>/dev/null || true

# 2. Prepare Directories
echo "Step 2: Preparing data volumes..."
mkdir -p "$DATA_PATH_HOST"
mkdir -p "$UPLOADS_PATH_HOST"

# 3. Build Image
echo "Step 3: Building Docker image..."
docker build -t $IMAGE_NAME .

# 4. Clean up Old Container & Port Conflicts
echo "Step 4: Cleaning up old container and port conflicts..."
docker rm -f $APP_NAME 2>/dev/null || true

CONFLICT_CONTAINER=$(docker ps -q --filter "publish=$PORT")
if [ -n "$CONFLICT_CONTAINER" ]; then
    echo "   Removing container $CONFLICT_CONTAINER using port $PORT..."
    docker rm -f $CONFLICT_CONTAINER
fi

# 5. Handle PM2 Conflict
echo "Step 5: Checking for non-docker conflicts..."
if command -v pm2 &> /dev/null && pm2 list | grep -q "Conference"; then
    echo "   Stopping PM2 'Conference'..."
    pm2 stop Conference 2>/dev/null || true
fi

# 6. Launch Container
echo "Step 6: Launching container..."
docker run -d \
  --name $APP_NAME \
  --restart unless-stopped \
  -p $PORT:5000 \
  -v "$DATA_PATH_HOST":/app/server/data \
  -v "$UPLOADS_PATH_HOST":/app/public/uploads \
  --env-file .env \
  $IMAGE_NAME

# 7. Force Sync Database Schema
echo "Step 7: Synchronizing database schema (forcing new columns)..."
# Chờ container khởi động xong một chút trước khi chạy sync
sleep 2
docker exec $APP_NAME npx drizzle-kit push --config drizzle.config.ts --force || echo "⚠️  Warning: Database sync might have had issues, check logs."

# 8. Clean up
echo "Step 8: Cleaning up unused Docker images..."
docker image prune -f

echo "------------------------------------------------"
echo "Done! Application is running."
echo "------------------------------------------------"
docker ps -f name=$APP_NAME
