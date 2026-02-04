#!/bin/bash
echo "Moving existing data to Docker volumes..."

mkdir -p docker-data/db
mkdir -p docker-data/uploads

if [ -f "server/data/main.db" ]; then
    echo "Moving main.db..."
    cp server/data/main.db docker-data/db/
fi

if [ -d "public/uploads" ]; then
    echo "Moving uploads content..."
    cp -r public/uploads/* docker-data/uploads/
fi

echo "Migration finished. You can now run ./deploy-docker.sh"