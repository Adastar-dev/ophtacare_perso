#!/bin/sh
set -e

# ── 1. Fichier .env généré depuis les variables d'environnement ───────────────
cat > /var/www/.env <<EOF
APP_NAME=OphtaCare
APP_ENV=production
APP_KEY=${APP_KEY:?APP_KEY obligatoire}
APP_DEBUG=false
APP_URL=${APP_URL:?APP_URL obligatoire}
APP_TIMEZONE=${APP_TIMEZONE:-Africa/Dakar}

FRONTEND_URL=${APP_URL}
SANCTUM_TOKEN_EXPIRATION=${SANCTUM_TOKEN_EXPIRATION:-129600}

APP_LOCALE=fr
APP_FALLBACK_LOCALE=en

BCRYPT_ROUNDS=12

LOG_CHANNEL=stderr
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=${DB_HOST:?DB_HOST obligatoire}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:?DB_DATABASE obligatoire}
DB_USERNAME=${DB_USERNAME:?DB_USERNAME obligatoire}
DB_PASSWORD=${DB_PASSWORD:?DB_PASSWORD obligatoire}
DB_SSLMODE=require

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
EOF

# ── 2. Migrations ─────────────────────────────────────────────────────────────
php artisan migrate --force --no-interaction

# ── 3. Cache de configuration et de routes ────────────────────────────────────
php artisan config:cache
php artisan route:cache

# ── 4. Démarrage de php-fpm puis nginx ────────────────────────────────────────
php-fpm -D
exec nginx -g 'daemon off;'
