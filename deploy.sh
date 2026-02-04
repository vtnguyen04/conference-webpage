#!/bin/bash
set -e

echo "------------------------------------------"
echo "Dang bat dau quy trinh cap nhat code..."
echo "------------------------------------------"

echo "1. Dang keo code moi tu repository..."
git pull origin main

echo "2. Dang cai dat thu vien (dependencies)..."
npm install --quiet

echo "3. Dang build code va cap nhat cau truc Database..."
npm run build

echo "4. Dang khoi dong lai server qua PM2..."
if pm2 list | grep -q "Conference"; then
    pm2 reload Conference
    echo "Da reload ung dung 'Conference'."
else
    pm2 start ecosystem.config.cjs --env production
    echo "Da khoi dong moi ung dung 'Conference'."
fi

echo "------------------------------------------"
echo "Cap nhat hoan tat va an toan!"
echo "Website cua ban da san sang voi phien ban moi."
echo "------------------------------------------"