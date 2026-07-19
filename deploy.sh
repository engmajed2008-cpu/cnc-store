#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# E3lani — deploy.sh
# Run on your STC Cloud VM:  bash deploy.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

echo "▶ [1/7] Pulling latest code..."
git pull origin main

echo "▶ [2/7] Copying env file..."
[ -f .env ] || cp .env.example .env
echo "   ⚠  Edit .env with real API keys before first deploy!"

echo "▶ [3/7] Building Docker image..."
docker compose build --no-cache app

echo "▶ [4/7] Running DB migrations (if any)..."
# docker compose run --rm app npm run db:migrate

echo "▶ [5/7] Starting / restarting containers..."
docker compose up -d --remove-orphans

echo "▶ [6/7] Waiting for health check..."
sleep 10
docker compose ps

echo "▶ [7/7] Pruning old images..."
docker image prune -f --filter "until=24h"

echo ""
echo "✅ Deployment complete! Site: https://e3lani.com"
