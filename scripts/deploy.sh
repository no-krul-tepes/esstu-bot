#!/bin/bash
# scripts/deploy.sh
# Скрипт для деплоя бота

set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Type check
echo "🔍 Type checking..."
bun run typecheck

# Build
echo "🏗️ Building..."
bun run build

# Restart service
echo "🔄 Restarting service..."
sudo systemctl restart schedule-bot

# Check status
echo "✅ Checking status..."
sudo systemctl status schedule-bot

echo "🎉 Deployment completed!"