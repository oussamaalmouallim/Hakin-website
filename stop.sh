#!/usr/bin/env bash
# H MODE — arrêt des serveurs de dev (ports 6011, 6012) et du conteneur Docker s'il tourne.
for port in 6011 6012; do
  pids=$(lsof -ti tcp:$port -sTCP:LISTEN || true)
  [ -n "$pids" ] && echo "Arrêt du port $port (PID $pids)" && kill $pids
done
command -v docker >/dev/null && [ -f "$(dirname "$0")/docker-compose.yml" ] && docker compose -f "$(dirname "$0")/docker-compose.yml" stop 2>/dev/null || true
echo "Terminé."
