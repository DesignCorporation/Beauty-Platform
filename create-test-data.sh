#!/bin/bash

# Скрипт для создания тестовых данных через Beauty Platform API

set -e

API_BASE="http://localhost:6020/api"
AUTH_BASE="$API_BASE/auth" 
CRM_BASE="$API_BASE/crm"

# Тестовые данные для входа
EMAIL="owner@beauty-test-salon.ru"
PASSWORD="owner123"

# Временный файл для cookies
COOKIE_FILE="/tmp/beauty-platform-cookies.txt"

echo "🚀 Создание тестовых данных для Beauty Platform CRM"
echo "=================================================="
echo ""

# Функция для логина
login() {
    echo "🔐 Выполняется вход в систему..."
    
    # Получаем CSRF токен
    echo "  📝 Получение CSRF токена..."
    CSRF_RESPONSE=$(curl -s -c "$COOKIE_FILE" "$AUTH_BASE/csrf-token")
    CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$CSRF_TOKEN" ]; then
        echo "❌ Ошибка: не удалось получить CSRF токен"
        echo "Ответ сервера: $CSRF_RESPONSE"
        exit 1
    fi
    
    echo "  ✅ CSRF токен получен: $CSRF_TOKEN"
    
    # Выполняем вход
    echo "  🔑 Аутентификация пользователя..."
    LOGIN_RESPONSE=$(curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $CSRF_TOKEN" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
        "$AUTH_BASE/login")
    
    # Проверяем успех входа
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo "  ✅ Вход выполнен успешно!"
        USER_NAME=$(echo "$LOGIN_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        echo "  👋 Добро пожаловать, $USER_NAME!"
    else
        echo "❌ Ошибка входа:"
        echo "$LOGIN_RESPONSE"
        exit 1
    fi
}

# Функция для создания услуги
create_service() {
    local name="$1"
    local description="$2"
    local duration="$3"
    local price="$4"
    
    echo "🛍️ Создание услуги: $name"
    
    SERVICE_RESPONSE=$(curl -s -b "$COOKIE_FILE" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $CSRF_TOKEN" \
        -d "{\"name\":\"$name\",\"description\":\"$description\",\"duration\":$duration,\"price\":$price}" \
        "$CRM_BASE/api/services")
    
    # Проверяем успех создания
    if echo "$SERVICE_RESPONSE" | grep -q '"id":'; then
        SERVICE_ID=$(echo "$SERVICE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo "  ✅ Услуга создана: $name (ID: $SERVICE_ID)"
        return 0
    else
        echo "  ❌ Ошибка создания услуги:"
        echo "  $SERVICE_RESPONSE"
        return 1
    fi
}

# Функция для создания клиента
create_client() {
    local name="$1"
    local email="$2"
    local phone="$3"
    local birthday="$4"
    local notes="$5"
    
    echo "👤 Создание клиента: $name"
    
    CLIENT_RESPONSE=$(curl -s -b "$COOKIE_FILE" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $CSRF_TOKEN" \
        -d "{\"name\":\"$name\",\"email\":\"$email\",\"phone\":\"$phone\",\"birthday\":\"$birthday\",\"notes\":\"$notes\"}" \
        "$CRM_BASE/api/clients")
    
    # Проверяем успех создания
    if echo "$CLIENT_RESPONSE" | grep -q '"id":'; then
        CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo "  ✅ Клиент создан: $name (ID: $CLIENT_ID)"
        return 0
    else
        echo "  ❌ Ошибка создания клиента:"
        echo "  $CLIENT_RESPONSE"
        return 1
    fi
}

# Основной процесс
main() {
    # Шаг 1: Вход в систему
    login
    echo ""
    
    # Шаг 2: Создание тестовых услуг
    echo "📋 СОЗДАНИЕ ТЕСТОВЫХ УСЛУГ"
    echo "=========================="
    
    create_service "Стрижка женская" "Классическая женская стрижка с укладкой" 60 1500
    sleep 1
    
    create_service "Окрашивание волос" "Полное окрашивание волос профессиональными красителями" 120 3500
    sleep 1
    
    create_service "Мелирование" "Частичное осветление прядей волос" 180 4500
    sleep 1
    
    create_service "Укладка" "Профессиональная укладка волос" 45 800
    sleep 1
    
    create_service "Маникюр" "Классический маникюр с покрытием гель-лак" 90 1200
    sleep 1
    
    echo ""
    echo "👥 СОЗДАНИЕ ТЕСТОВЫХ КЛИЕНТОВ"
    echo "============================="
    
    create_client "Иванова Анна Сергеевна" "anna.ivanova@example.com" "+7 (999) 123-45-67" "1990-03-15" "Предпочитает натуральные оттенки. Чувствительная кожа головы."
    sleep 1
    
    create_client "Петрова Мария Владимировна" "maria.petrova@example.com" "+7 (999) 234-56-78" "1985-07-22" "Регулярный клиент. Любит экспериментировать с цветом."
    sleep 1
    
    create_client "Сидорова Елена Александровна" "elena.sidorova@example.com" "+7 (999) 345-67-89" "1992-11-08" "Первое посещение. Хочет кардинально поменить образ."
    sleep 1
    
    create_client "Козлова Татьяна Игоревна" "tatyana.kozlova@example.com" "+7 (999) 456-78-90" "" "VIP клиент. Предпочитает утреннее время."
    sleep 1
    
    echo ""
    echo "🎉 СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ ЗАВЕРШЕНО!"
    echo "===================================="
    echo "✅ Созданы тестовые услуги и клиенты"
    echo ""
    echo "🔗 Теперь вы можете:"
    echo "  • Открыть https://test-crm.beauty.designcorp.eu"
    echo "  • Перейти в раздел 'Услуги' и увидеть созданные услуги"
    echo "  • Перейти в раздел 'Клиенты' и увидеть созданных клиентов"
    echo "  • Создать первую запись в календаре!"
    echo ""
    
    # Удаляем временный файл с cookies
    rm -f "$COOKIE_FILE"
}

# Запускаем основную функцию
main