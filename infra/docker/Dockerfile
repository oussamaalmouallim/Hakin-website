# H MODE — image de production du site (vitrine + boutique + /admin) : fichiers statiques servis par nginx.
# Construite par la CI (GitHub Actions → ghcr.io) ou en local : ./deploy.sh
# Les variables VITE_ sont PUBLIQUES (URL et clé publique Supabase) : elles sont gravées dans le JavaScript au build.
# Aucun secret ici : pas de clé service_role, pas d'ADMIN_* (.dockerignore exclut tous les .env).

# ── 1. Build ───────────────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_PUBLISHABLE_KEY=""
ARG SITE_URL=""
ARG VERSION=local
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY SITE_URL=$SITE_URL VERSION_SITE=$VERSION
RUN npm run build

# ── 2. Service : nginx sans droits root, port 8080 ─────────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine
ARG VERSION=local
LABEL org.opencontainers.image.title="hmode-web" \
      org.opencontainers.image.description="H MODE — site vitrine et boutique (Vite + React), administration /admin" \
      org.opencontainers.image.source="https://github.com/oussamaalmouallim/Hakin-website" \
      org.opencontainers.image.version="$VERSION"
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY infra/docker/securite.conf /etc/nginx/conf.d/securite.inc
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/sante || exit 1
