#!/bin/sh

# Ensure data directory exists
mkdir -p server/data public/uploads

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

# Start the application
echo "Starting application in production mode..."
npm start