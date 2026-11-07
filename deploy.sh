#!/usr/bin/env bash
# H MODE — production locale : image Docker (build de web/ servi par nginx) → http://localhost:6111
# Lit seulement les valeurs publiques de web/.env (URL et clé publique Supabase) pour le build.
# Image déjà construite par la CI : HMODE_IMAGE=ghcr.io/oussamaalmouallim/hakin-website:latest ./deploy.sh --sans-build
set -euo pipefail
cd "$(dirname "$0")"
env_file=()
[ -f web/.env ] && env_file=(--env-file web/.env)
if [ "${1:-}" = "--sans-build" ]; then
  docker compose "${env_file[@]}" -f infra/docker-compose.yml up -d --no-build
else
  docker compose "${env_file[@]}" -f infra/docker-compose.yml up -d --build
fi
echo "Production locale : http://localhost:${HMODE_PORT:-6111}  (santé : /sante)"
