#!/usr/bin/env bash
# H MODE — démarrage (macOS). Dev : http://localhost:6011 · démo (prix fictifs) : ./start.sh demo → http://localhost:6012
set -euo pipefail
cd "$(dirname "$0")/ui"
[ -d node_modules ] || npm install
if [ "${1:-}" = "demo" ]; then npm run dev:demo; else npm run dev; fi
