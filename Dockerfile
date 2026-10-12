# Redeploy trigger 2026-09-13 (RAM trim)
# Stage 1 — Build frontend assets
FROM node:24-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./ 
RUN npm ci

COPY resources/ ./resources/
COPY public/ ./public/
COPY vite.config.ts ./ 
COPY tsconfig.json* ./ 

RUN npm run build -- --outDir=public/build

# Stage 2 — Install PHP dependencies
FROM php:8.4-alpine AS vendor

WORKDIR /app

# ext-gd is required by phpoffice/phpspreadsheet (BEABA import via maatwebsite/excel)
RUN apk add --no-cache libzip-dev freetype-dev libpng-dev libjpeg-turbo-dev libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install exif zip gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --prefer-dist --no-interaction --no-scripts

# Stage 3 — Production image
FROM php:8.4-fpm-alpine AS production

WORKDIR /var/www/html

RUN apk add --no-cache \
    nginx supervisor postgresql-client libpq-dev libzip-dev zip unzip \
    freetype-dev libpng-dev libjpeg-turbo-dev libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip opcache gd exif bcmath \
    && rm -rf /var/cache/apk/* /tmp/*

# Copy vendor & built frontend
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

# Copy full source
COPY . .

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 storage bootstrap/cache

# Nginx + Supervisor + PHP-FPM configs
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php-fpm-www.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/uploads.ini /usr/local/etc/php/conf.d/uploads.ini
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN rm -f /usr/local/etc/php-fpm.d/www.conf.default /usr/local/etc/php-fpm.d/zz-docker.conf \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /run/php \
    && chown www-data:www-data /run/php

# Railway injects $PORT at runtime; nginx binds to it. Default/local compose uses 8080.
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
