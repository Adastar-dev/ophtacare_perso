#!/bin/sh
set -e

# DATABASE_URL (une seule variable avec tout dedans) est prioritaire sur DB_*
if [ -z "${DATABASE_URL}" ]; then
  : ${DB_HOST:?DB_HOST ou DATABASE_URL obligatoire}
  : ${DB_DATABASE:?DB_DATABASE ou DATABASE_URL obligatoire}
  : ${DB_USERNAME:?DB_USERNAME ou DATABASE_URL obligatoire}
  : ${DB_PASSWORD:?DB_PASSWORD ou DATABASE_URL obligatoire}
fi

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
DATABASE_URL=${DATABASE_URL:-}
DB_HOST=${DB_HOST:-}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-}
DB_USERNAME=${DB_USERNAME:-}
DB_PASSWORD=${DB_PASSWORD:-}
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

php artisan migrate --force --no-interaction
php artisan config:cache
php artisan route:cache

php-fpm -D
exec nginx -g 'daemon off;'
