#!/bin/sh

# Ensure data directory exists
mkdir -p server/data public/uploads

# Run database migrations and push schema
echo "Syncing database schema..."
npx drizzle-kit push
echo "Running database migrations..."
npm run db:migrate

# Start the application
echo "Starting application in production mode..."
exec npm start