#!/bin/bash

# 🚀 Production Deploy Script - Beauty Platform
# Автоматический деплой с /root/projects/beauty в /var/www/salon-crm

set -e  # Выход при любой ошибке

echo "🚀 Starting production deployment..."

# Проверяем что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден. Запустите из корня проекта!"
    exit 1
fi

echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git status

# Показываем что изменилось
CHANGES=$(git log HEAD..origin/main --oneline)
if [ -n "$CHANGES" ]; then
    echo "📋 Новые изменения:"
    echo "$CHANGES"
    echo
fi

# Проверяем что все изменения закоммичены
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Внимание: есть незакоммиченные изменения!"
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🔄 Updating to latest version..."
git pull origin main

echo "📦 Building project..."
npm run build

echo "🧪 Running tests..."
npm run test || {
    echo "❌ Тесты не прошли! Деплой остановлен."
    exit 1
}

echo "🔍 TypeScript check..."
npm run typecheck || {
    echo "❌ TypeScript ошибки! Деплой остановлен."
    exit 1
}

echo "🔄 Copying files to production..."

# Создаем бэкап текущей версии
BACKUP_DIR="/var/www/backups/beauty-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"
sudo cp -r /var/www/beauty/* "$BACKUP_DIR/" 2>/dev/null || true

# Останавливаем сервисы
echo "⏹️  Stopping services..."
sudo systemctl stop nginx || true
pkill -f "node.*6001" || true
pkill -f "node.*6020" || true
pkill -f "node.*6021" || true
pkill -f "node.*6022" || true

# Копируем новые файлы
sudo rsync -av --delete \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.env.local \
    /root/projects/beauty/ /var/www/beauty/

# Устанавливаем зависимости в production
cd /var/www/beauty
sudo chown -R www-data:www-data .
sudo -u www-data npm ci --only=production

# Запускаем сервисы
echo "🔄 Starting services..."
cd /root/projects/beauty
./deploy/start-production-services.sh

echo "🏥 Running health checks..."
sleep 5  # Даем сервисам время запуститься

# Health check function
check_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -n "Checking $name... "

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "✅ OK"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "❌ FAILED"
    return 1
}

# Проверяем все сервисы
HEALTH_FAILED=0

check_service "API Gateway" "http://localhost:6020/health" || HEALTH_FAILED=1
check_service "Auth Service" "http://localhost:6021/health" || HEALTH_FAILED=1
check_service "CRM API" "http://localhost:6022/health" || HEALTH_FAILED=1
check_service "MCP Server" "http://localhost:6025/health" || HEALTH_FAILED=1
check_service "Images API" "http://localhost:6026/health" || HEALTH_FAILED=1

check_service "Landing Page" "http://localhost:6000" || HEALTH_FAILED=1
check_service "Salon CRM" "http://localhost:6001" || HEALTH_FAILED=1
check_service "Admin Panel" "http://localhost:6002" || HEALTH_FAILED=1
check_service "Client Portal" "http://localhost:6003" || HEALTH_FAILED=1

if [ $HEALTH_FAILED -eq 1 ]; then
    echo ""
    echo "⚠️  Некоторые сервисы не прошли health check!"
    echo "🔍 Проверьте логи для диагностики проблем."
    echo "📋 Команда для проверки: ./beauty-dev.sh status"
    exit 1
fi

echo ""
echo "✅ Production deployment completed successfully!"
echo "🌐 Production URLs:"
echo "   Landing: https://beauty.designcorp.eu"
echo "   CRM: https://salon.beauty.designcorp.eu"
echo "   Admin: https://admin.beauty.designcorp.eu"
echo "   Client: https://client.beauty.designcorp.eu"