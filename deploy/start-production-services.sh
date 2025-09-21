#!/bin/bash

# 🚀 Start Production Services - Beauty Platform

set -e

echo "🔄 Starting all production services..."

# Переключаемся на production env
cd /var/www/beauty
cp .env.production .env

# Функция для запуска сервиса
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    local command=$4

    echo "▶️  Starting $service_name on port $port..."

    cd "/var/www/beauty/$service_path"

    # Убиваем старый процесс если есть
    pkill -f "node.*$port" || true

    # Запускаем новый
    nohup $command > "/var/www/beauty/logs/${service_name}.log" 2>&1 &

    # Сохраняем PID
    echo $! > "/var/www/beauty/logs/${service_name}.pid"

    echo "✅ $service_name started (PID: $!)"
}

# Создаем директорию для логов если нет
mkdir -p /var/www/beauty/logs

# Запускаем backend сервисы
start_service "api-gateway" "services/api-gateway" "6020" "npm start"
start_service "auth-service" "services/auth-service" "6021" "npm start"
start_service "crm-api" "services/crm-api" "6022" "npm start"
start_service "mcp-server" "services/mcp-server" "6025" "npm start"
start_service "images-api" "services/images-api" "6026" "npm start"

# Запускаем frontend приложения
start_service "landing-page" "apps/landing-page" "6000" "npm start"
start_service "salon-crm" "apps/salon-crm" "6001" "npm start"
start_service "admin-panel" "apps/admin-panel" "6002" "npm start"
start_service "client-booking" "apps/client-booking" "6003" "npm start"

echo ""
echo "🎉 All services started successfully!"
echo "📋 Check logs: tail -f /var/www/beauty/logs/*.log"
echo "🔍 Check status: ./beauty-dev.sh status"