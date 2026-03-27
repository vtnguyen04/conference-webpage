#!/bin/bash
set -e

# --- Configuration ---
APP_NAME="conference-app"
IMAGE_NAME="conference-image"
PORT=5000
DATA_PATH_HOST="$(pwd)/docker-data/data"
UPLOADS_PATH_HOST="$(pwd)/docker-data/uploads"

echo "------------------------------------------------"
echo "🚀 Starting Professional Docker Deployment..."
echo "------------------------------------------------"

# 1. Fetch code
echo "Step 1: Fetching latest updates..."
git stash 2>/dev/null || true
git pull origin main
git stash pop 2>/dev/null || true

# 2. Prepare Directories & Permissions
echo "Step 2: Preparing volumes and fix permissions (UID 1001)..."
mkdir -p "$DATA_PATH_HOST" "$UPLOADS_PATH_HOST"
# Ensure the fallback certificate exists on host if it's a fresh install
# (Optional, as the app now has a fallback in the image)

sudo chown -R 1001:1001 "$DATA_PATH_HOST" "$UPLOADS_PATH_HOST" 2>/dev/null || true

# 3. Build Image
echo "Step 3: Building Docker image..."
OLD_IMAGE_ID=$(docker images -q $IMAGE_NAME 2>/dev/null || true)
docker build -t $IMAGE_NAME .

# 4. Cleanup old containers and PORT conflicts
echo "Step 4: Cleaning up port conflicts..."
# Remove by name
docker rm -f $APP_NAME 2>/dev/null || true

# Remove any other container using the same port
CONFLICT_CONTAINER=$(docker ps -q --filter "publish=$PORT")
if [ -n "$CONFLICT_CONTAINER" ]; then
    echo "   Removing container $CONFLICT_CONTAINER using port $PORT..."
    docker rm -f $CONFLICT_CONTAINER
fi

# 5. Launch Container
echo "Step 5: Launching container..."
docker run -d \
  --name $APP_NAME \
  --restart unless-stopped \
  -p $PORT:5000 \
  -v "$DATA_PATH_HOST":/app/server/data \
  -v "$UPLOADS_PATH_HOST":/app/public/uploads \
  --env-file .env \
  $IMAGE_NAME

# 6. Cleanup System
echo "Step 6: Purging old images..."
if [ -n "$OLD_IMAGE_ID" ]; then
    echo "   Removing old image ID: $OLD_IMAGE_ID"
    docker image rm $OLD_IMAGE_ID 2>/dev/null || true
fi
docker image prune -f 2>/dev/null || true

echo "------------------------------------------------"
echo "✅ SUCCESS! Application is live."
echo "------------------------------------------------"
docker ps -f name=$APP_NAME
