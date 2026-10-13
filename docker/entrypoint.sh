#!/bin/sh
set -e

# 0. Bind nginx to the port Railway provides. Falls back to 8080 (never 9000 —
#    that used to collide with PHP-FPM and break public networking).
LISTEN_PORT="${PORT:-8080}"
echo "Configuring nginx to listen on port ${LISTEN_PORT}"
sed -i "s/listen __PORT__;/listen ${LISTEN_PORT};/" /etc/nginx/nginx.conf

# Ensure PHP-FPM socket directory exists
mkdir -p /run/php
chown www-data:www-data /run/php

# 1. Setup directories
if [ -d /var/www/html/storage ]; then
    mkdir -p \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/framework/cache \
        /var/www/html/storage/logs \
        /var/www/html/storage/app/public \
        /var/www/html/bootstrap/cache

    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
    chmod -R ug+rwx /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
fi

# 2. Laravel setup
if [ -f /var/www/html/artisan ]; then
    cd /var/www/html

    # sqlite in this container is wiped on every deploy. Never boot production on it.
    if [ "${APP_ENV:-production}" = "production" ] && [ "${DB_CONNECTION:-pgsql}" != "pgsql" ]; then
        echo "FATAL: production DB_CONNECTION=${DB_CONNECTION:-unset}. Must be pgsql (persistent Postgres)."
        exit 1
    fi

    # One PHP process for the whole boot. Mail implements ShouldQueue, so this
    # must stay sync: there is no queue worker, and a worker would block sleep.
    export QUEUE_CONNECTION=sync
    if [ -z "${LOG_CHANNEL:-}" ]; then
        export LOG_CHANNEL=stderr
    fi
    if [ -z "${LOG_LEVEL:-}" ]; then
        export LOG_LEVEL=warning
    fi

    if [ -n "${RAILWAY_VOLUME_MOUNT_PATH:-}" ]; then
        echo "Persistent volume mounted at ${RAILWAY_VOLUME_MOUNT_PATH}"
    else
        echo "WARNING: No Railway volume detected (RAILWAY_VOLUME_MOUNT_PATH unset)."
        echo "         Admin uploads under storage/app/public will be wiped on every redeploy."
        echo "         Attach a volume mounted at /var/www/html/storage/app/public (see README)."
    fi

    echo "Preparing Laravel (migrate, seed, cache)..."
    php artisan app:prepare

    echo "Laravel ready. Public HTTP must target port ${LISTEN_PORT} (nginx), not 9000."
fi

exec "$@"
