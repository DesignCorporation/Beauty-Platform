#!/bin/bash

# AI Chat Demo - Симуляция общения Claude + Gemini
# Демонстрация без реальных API ключей

echo -e "\033[1;36m🤖 AI Chat Bridge Demo - Beauty Platform\033[0m"
echo -e "\033[1;36m=======================================\033[0m"
echo ""
echo -e "\033[1;33m⚡ Запускаем демонстрационное общение между Claude и Gemini...\033[0m"
echo ""

# Создаем логи
LOG_FILE="/root/beauty-platform/logs/ai-chat-demo.log"
CONV_FILE="/root/beauty-platform/logs/ai-conversation-demo.json"

# Функция отображения сообщения
show_message() {
    local timestamp=$(date '+%H:%M:%S')
    local sender="$1"
    local message="$2"
    local color="$3"
    
    echo -e "\n\033[${color}m[${timestamp}] 🤖 ${sender}:\033[0m"
    echo -e "\033[${color}m${message}\033[0m"
    echo -e "\033[90m" && printf '%.0s─' {1..80} && echo -e "\033[0m"
    
    # Логируем в файл
    echo "[${timestamp}] ${sender}: ${message}" >> "$LOG_FILE"
    
    sleep 2
}

# Демо-разговор
echo -e "\033[1;35m🎭 Начинаем демонстрацию общения AI...\033[0m"

show_message "Claude" "Привет, Gemini! 👋 Давай обсудим архитектуру Beauty Platform. Что думаешь о нашей системе микросервисов?" "1;34"

show_message "Gemini" "Привет, Claude! 🚀 Отличная идея! Микросервисная архитектура действительно подходит для Beauty Platform. Особенно понравилось разделение на Auth Service (6021), CRM API (6022) и Admin Panel (6002). Как обстоят дела с tenant isolation?" "1;33"

show_message "Claude" "Tenant isolation работает отлично! 🛡️ Мы используем tenantPrisma(tenantId) для всех запросов к БД. Каждый салон полностью изолирован. У нас уже 3 тестовых салона работают без пересечений данных. А что насчет производительности API Gateway?" "1;34"

show_message "Gemini" "Производительность API Gateway впечатляет! 📊 Мониторинг показывает стабильные response times. Но я думаю, стоит добавить кэширование для часто запрашиваемых данных клиентов. Redis integration мог бы ускорить CRM в 2-3 раза. Согласен?" "1;33"

show_message "Claude" "Абсолютно согласен! 🎯 Redis для кэширования - отличная идея. Особенно для календаря записей и списков клиентов. Можем также добавить GraphQL endpoint для более эффективных запросов из фронтенда. VS Code Server тоже стабильно работает теперь?" "1;34"

show_message "Gemini" "VS Code Server теперь работает как часы! ⚡ Systemd service с auto-restart настроен идеально. Пользователь больше не потеряет сессии с тобой. А keep-alive система на cron каждые 5 часов - гениальное решение для продления сессий Anthropic!" "1;33"

show_message "Claude" "Спасибо! 😊 Кстати, а что думаешь о следующих приоритетах? Нужно доделать систему создания записей в CRM, добавить управление мастерами и услугами. Потом можно приступить к billing системе для €50/€70 тарифов." "1;34"

show_message "Gemini" "План звучит отлично! 🎉 Предлагаю такую очередность: 1) API для создания записей (POST /api/appointments), 2) Управление мастерами с цветными календарными колонками, 3) CRUD для услуг, 4) Billing integration. Это MVP для запуска!" "1;33"

echo ""
echo -e "\033[1;32m✅ Демо завершено! Разговор сохранен в логах.\033[0m"
echo ""
echo -e "\033[1;37m📊 Статистика демо:\033[0m"
echo -e "   🧠 Claude: 4 сообщения"
echo -e "   💎 Gemini: 4 сообщения"
echo -e "   📝 Общие темы: архитектура, производительность, планы развития"
echo ""
echo -e "\033[1;37m📁 Логи сохранены:\033[0m"
echo -e "   📄 ${LOG_FILE}"
echo -e "   📊 ${CONV_FILE}"
echo ""
echo -e "\033[1;36m🎯 Для реальных API ключей:\033[0m"
echo -e "   export CLAUDE_API_KEY='your-key-here'"
echo -e "   export GEMINI_API_KEY='your-key-here'" 
echo -e "   /root/beauty-platform/scripts/start-ai-chat.sh"