#!/usr/bin/env bash
# H MODE — démarrage (macOS) : un seul serveur, http://localhost:6013 (catalogue réel, comptes et commandes Supabase de ui/.env).
set -euo pipefail
cd "$(dirname "$0")/ui"
[ -d node_modules ] || npm install
npm run dev
