# syntax=docker/dockerfile:1
# Docker-артефакт ЕППБ. Сборка фронтенда идёт в PHP-стадии, т.к. Laravel Wayfinder
# генерирует TS-хелперы роутов через `php artisan` во время `vite build`.

FROM php:8.4-cli AS app
WORKDIR /var/www/html

# Системные зависимости и расширения PHP (в т.ч. PostgreSQL).
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libzip-dev libpq-dev libicu-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip bcmath intl \
    && rm -rf /var/lib/apt/lists/*

# Node 22 (Debian bookworm, glibc — совместим с php:8.4-cli) для сборки Vite.
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

# Composer.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Зависимости PHP (кэшируемый слой).
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --no-progress

# Зависимости JS (кэшируемый слой).
COPY package.json package-lock.json ./
RUN npm ci

# Исходники приложения.
COPY . .

# Автозагрузка (package:discover) и сборка фронтенда (php доступен для wayfinder).
RUN composer dump-autoload --optimize \
    && npm run build \
    && npm prune --omit=dev \
    && chmod -R 775 storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
