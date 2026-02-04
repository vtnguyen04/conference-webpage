#!/bin/bash
set -e

# --- Configuration ---
APP_NAME="conference-app"
IMAGE_NAME="conference-image"
PORT=5000
DATA_PATH_HOST="$(pwd)/docker-data/db"
UPLOADS_PATH_HOST="$(pwd)/docker-data/uploads"

echo "------------------------------------------------"
echo "🚀 Starting Docker Deployment..."
echo "------------------------------------------------"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found."
    exit 1
fi

# 1. Fetch code
echo "Step 1: Pulling latest code..."
git pull origin main

# 2. Prepare Directories
echo "Step 2: Preparing data volumes..."
mkdir -p "$DATA_PATH_HOST"
mkdir -p "$UPLOADS_PATH_HOST"

# 3. Build Image
echo "Step 3: Building Docker image..."
docker build -t $IMAGE_NAME .

# 4. Stop Old Container
echo "Step 4: Cleaning up old container..."
# Find container ID by name, if it exists, stop and remove it
EXISTING_CONTAINER=$(docker ps -aq -f name=^/${APP_NAME}$)
if [ -n "$EXISTING_CONTAINER" ]; then
    echo "   Stopping and removing container: $APP_NAME"
    docker stop $APP_NAME
    docker rm $APP_NAME
fi

# 5. Run New Container
echo "Step 5: Launching container..."
docker run -d \
  --name $APP_NAME \
  --restart unless-stopped \
  -p $PORT:5000 \
  -v "$DATA_PATH_HOST":/app/server/data \
  -v "$UPLOADS_PATH_HOST":/app/public/uploads \
  --env-file .env \
  $IMAGE_NAME

echo "------------------------------------------------"
echo "Done! Application is running."
echo "------------------------------------------------"
docker ps -f name=^/${APP_NAME}$
