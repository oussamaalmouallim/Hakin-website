#!/usr/bin/env bash
# H MODE — build de production servi par nginx dans Docker : http://localhost:6111
set -euo pipefail
cd "$(dirname "$0")"
docker compose up -d --build
echo "Production locale : http://localhost:${HMODE_PORT:-6111}"
