#!/usr/bin/env bash
# H MODE — arrêt du serveur (port 6013), des anciens ports de dev (6011, 6012) et du Supabase local s'il tourne.
cd "$(dirname "$0")"
for port in 6013 6011 6012; do
  pids=$(lsof -ti tcp:$port -sTCP:LISTEN || true)
  [ -n "$pids" ] && echo "Arrêt du port $port (PID $pids)" && kill $pids
done
docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^supabase_.*_hmode$' && npx --yes supabase@2 stop >/dev/null 2>&1 && echo "Supabase local arrêté"
command -v docker >/dev/null && [ -f infra/docker-compose.yml ] && docker compose -f infra/docker-compose.yml stop 2>/dev/null || true
echo "Terminé."
