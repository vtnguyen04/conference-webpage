#!/bin/sh
set -e

echo "------------------------------------------------"
echo "🚀 Container Starting..."
echo "------------------------------------------------"

# Run database migrations
# Chúng ta sử dụng file đã được bundle để không cần tsx/typescript
echo "Step 1: Running database migrations..."
npm run db:migrate

# Start the application
echo "Step 2: Starting application..."
exec npm start
