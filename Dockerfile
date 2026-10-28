# ── Étape 1 : build du frontend Next.js ──────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --prefer-offline
COPY frontend/ ./
# API sur le même serveur → pas de préfixe d'URL
RUN NEXT_PUBLIC_API_URL="" npm run build

# ── Étape 2 : image de production PHP 8.2 + Nginx ────────────────────────────
FROM php:8.2-fpm-alpine

# Dépendances système
RUN apk add --no-cache nginx postgresql-client libpq-dev && \
    docker-php-ext-install pdo_pgsql && \
    rm -rf /var/cache/apk/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Code Laravel
WORKDIR /var/www
COPY backend/ .

# Dépendances PHP (prod seulement)
RUN composer install --no-dev --optimize-autoloader --no-interaction --quiet

# Frontend compilé → public/
COPY --from=frontend /app/out/ ./public/

# Configurations
COPY docker/nginx.conf     /etc/nginx/nginx.conf
COPY docker/php-fpm.conf   /usr/local/etc/php-fpm.d/zz-ophtacare.conf

# Permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache && \
    chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
CMD ["/entrypoint.sh"]
