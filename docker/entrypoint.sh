#!/usr/bin/env bash
set -e

cd /var/www/html

# Файл окружения.
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Синхронизируем .env с переменными окружения контейнера. Это нужно, потому что
# `php artisan serve` для дочернего процесса подставляет значения из .env.
update_env() {
    local key="$1" val="$2"
    if grep -q "^${key}=" .env; then
        # Экранируем | в значении для sed.
        sed -i "s|^${key}=.*|${key}=${val//|/\\|}|" .env
    else
        echo "${key}=${val}" >> .env
    fi
}
for key in APP_NAME APP_ENV APP_DEBUG APP_URL LOG_CHANNEL \
           DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD \
           SESSION_DRIVER CACHE_STORE QUEUE_CONNECTION ANTHROPIC_API_KEY ANTHROPIC_MODEL; do
    val="$(printenv "$key" || true)"
    if [ -n "$val" ]; then
        update_env "$key" "$val"
    fi
done

# Ключ приложения.
if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

# Ждём готовности PostgreSQL.
echo "Ожидание базы данных ${DB_HOST}:${DB_PORT}…"
until php -r "exit(@fsockopen(getenv('DB_HOST'), (int)getenv('DB_PORT')) ? 0 : 1);" 2>/dev/null; do
    sleep 1
done
echo "База данных доступна."

# Миграции и сиды (идемпотентны — сиды используют updateOrCreate).
php artisan migrate --force --seed

php artisan storage:link || true

exec "$@"
