#!/bin/bash
set -e

echo "------------------------------------------------"
echo "🚀 Starting Deployment Process..."
echo "------------------------------------------------"

# Check if PM2 is installed, install it if missing
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Attempting to install globally..."
    if command -v npm &> /dev/null; then
        # Try to install PM2. If it fails due to permissions, it will exit the script.
        npm install -g pm2
        echo "✅ PM2 installed successfully."
    else
        echo "❌ Error: npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
fi

# 1. Fetch latest changes
echo "📦 Step 1: Fetching latest updates from repository..."
git pull origin main

# 2. Install dependencies
echo "📥 Step 2: Installing dependencies..."
npm install --quiet

# 3. Build and Migration
echo "🛠️  Step 3: Syncing database schema and building application..."
npx drizzle-kit push
npm run build

# 4. Process Management
echo "🔄 Step 4: Managing server process via PM2..."
# Check if the application is already running
if pm2 list | grep -q "Conference"; then
    pm2 reload Conference
    echo "✅ Application 'Conference' reloaded successfully."
else
    pm2 start ecosystem.config.cjs --env production
    echo "🚀 Application 'Conference' started successfully."
fi

echo "------------------------------------------------"
echo "✨ Deployment Completed Successfully!"
echo "🌐 Your application is now live with the latest changes."
echo "------------------------------------------------"
