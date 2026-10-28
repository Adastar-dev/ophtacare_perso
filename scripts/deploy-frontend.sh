#!/usr/bin/env bash
# Compile le frontend et le copie dans backend/public/ pour que Laravel serve
# l'application et l'API depuis le même serveur.
#   ./scripts/deploy-frontend.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT="$ROOT/frontend"
PUBLIC="$ROOT/backend/public"

cd "$FRONT"
[ -d node_modules ] || npm ci
# API sur le même serveur : /api
NEXT_PUBLIC_API_URL="" npm run build

# Retire l'ancienne version du frontend (sans toucher aux fichiers Laravel)
rm -rf "$PUBLIC/_next" "$PUBLIC/dashboard" "$PUBLIC/index.html" "$PUBLIC/index.txt" "$PUBLIC"/__next.* "$PUBLIC/404.html" "$PUBLIC/404" "$PUBLIC/_not-found"
cp -R "$FRONT/out/." "$PUBLIC/"

echo "Frontend copié dans $PUBLIC"
