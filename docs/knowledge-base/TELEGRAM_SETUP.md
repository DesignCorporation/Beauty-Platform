# 🤖 НАСТРОЙКА TELEGRAM АЛЕРТОВ - ПОШАГОВАЯ ИНСТРУКЦИЯ

## Шаг 1: Создание Telegram бота

1. **Откройте Telegram** и найдите @BotFather
2. **Отправьте команду**: `/newbot`
3. **Введите имя бота**: `Beauty Platform Monitor`
4. **Введите username**: `beauty_platform_monitor_bot` (или другой доступный)
5. **Сохраните токен** который выдаст BotFather

## Шаг 2: Получение Chat ID

1. **Добавьте бота** в группу или отправьте ему сообщение
2. **Отправьте команду**: `/start`
3. **Получите Chat ID** одним из способов:

### Способ 1 - Через API:
```bash
# Замените YOUR_BOT_TOKEN на токен от BotFather
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates"
```

### Способ 2 - Через @userinfobot:
1. Добавьте @userinfobot в чат
2. Получите Chat ID из сообщения

## Шаг 3: Настройка переменных окружения

Добавьте в файл `.env` или установите переменные:

```bash
# Telegram Configuration
export TELEGRAM_ENABLED=true
export TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
export TELEGRAM_CHAT_ID="YOUR_CHAT_ID_HERE"

# Thresholds
export THRESHOLD_RESPONSE_TIME=5000
export THRESHOLD_ERROR_RATE=5
export THRESHOLD_AVAILABILITY=99
```

## Шаг 4: Перезапуск сервиса

```bash
pm2 restart beauty-api-gateway-6020
```

## Шаг 5: Тестирование

Проверьте, что алерты работают:

```bash
# Тест API для алертов
curl -X POST http://localhost:6020/api/monitoring/test-alert
```

---

## 🎯 ГОТОВАЯ КОМАНДА ДЛЯ БЫСТРОЙ НАСТРОЙКИ:

```bash
# 1. Установите переменные (замените на ваши данные)
echo 'TELEGRAM_ENABLED=true' >> /root/beauty-platform/.env
echo 'TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN' >> /root/beauty-platform/.env  
echo 'TELEGRAM_CHAT_ID=YOUR_CHAT_ID' >> /root/beauty-platform/.env

# 2. Перезапустите Gateway
pm2 restart beauty-api-gateway-6020

# 3. Проверьте статус
curl http://localhost:6020/api/monitoring/metrics
```

## ✅ ПРОВЕРКА РАБОТЫ:

После настройки вы получите уведомления в Telegram при:
- 🔴 Падении критических сервисов (Auth, API Gateway)
- ⚠️ Деградации производительности (время ответа > 5 сек)
- ✅ Восстановлении сервисов
- 🔄 Перезапуске сервисов через админку

## 🎉 ВСЕ ГОТОВО!

Теперь у вас есть:
1. ✅ **Современный мониторинг** прямо в админке
2. ✅ **Real-time алерты** в Telegram
3. ✅ **Smart thresholds** и корреляция событий
4. ✅ **Детальное логирование** для быстрой отладки
5. ✅ **Управление сервисами** через веб-интерфейс

**Админка мониторинга**: https://test-admin.beauty.designcorp.eu/services-monitoring