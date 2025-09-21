# Beauty Platform Auto-Restore System

Полная система автоматического восстановления для всех критических сервисов Beauty Platform.

## 🚨 Проблема

Критические сервисы Beauty Platform часто падают:
- **Auth Service (6021)**: 51+ перезапуск
- **CRM API (6022)**: 159+ перезапусков (критический!)
- **Admin Panel (6002)**: Регулярные сбои
- **API Gateway (6020)**: Проблемы с роутингом
- **MCP Server (6025)**: Коммуникационные сбои
- **Images API (6026)**: Memory issues

## ✅ Решение

Система автоматического восстановления с тремя уровнями защиты:

1. **PM2 Enhanced Configuration** - Агрессивные настройки auto-restart
2. **Health Monitoring** - Постоянная проверка каждые 30 секунд
3. **Auto-Restore Scripts** - Индивидуальное восстановление для каждого сервиса

## 🏗️ Архитектура

```
Master Orchestrator (главный контроллер)
├── Health Monitor (непрерывный мониторинг)
├── Backup System (автоматические backup'ы)
├── Alert System (уведомления и алерты)
├── Individual Restore Scripts (для каждого сервиса)
└── System Maintenance (автоматическая очистка)
```

## 📁 Структура файлов

```
/root/beauty-platform/deployment/auto-restore/
├── master-orchestrator.sh          # Главный контроллер
├── health-monitor.sh               # Мониторинг здоровья сервисов
├── backup-system.sh                # Система backup'ов
├── alert-system.sh                 # Система алертов
├── system-maintenance.sh           # Автоматическая очистка
├── enhanced-ecosystem.config.js    # Улучшенная PM2 конфигурация
├── restore-auth-service.sh         # Восстановление Auth Service
├── restore-crm-api.sh             # Восстановление CRM API (критический!)
├── restore-admin-panel.sh          # Восстановление Admin Panel
├── restore-api-gateway.sh          # Восстановление API Gateway
├── restore-mcp-server.sh           # Восстановление MCP Server
├── restore-images-api.sh           # Восстановление Images API
├── test-system.sh                  # Тестирование системы
└── README.md                       # Эта документация
```

## 🚀 Быстрый запуск

### 1. Запуск системы автовосстановления

```bash
cd /root/beauty-platform/deployment/auto-restore
chmod +x *.sh
./master-orchestrator.sh start
```

### 2. Проверка статуса

```bash
./master-orchestrator.sh status
```

### 3. Тестирование

```bash
./test-system.sh full
```

## ⚙️ Конфигурация

### PM2 Enhanced Settings

- **Auth Service**: max_restarts: 100, min_uptime: 5s
- **CRM API**: max_restarts: 200 (!), min_uptime: 3s, restart_delay: 1500ms
- **Admin Panel**: max_restarts: 50, min_uptime: 10s
- **API Gateway**: max_restarts: 75, min_uptime: 5s
- **MCP Server**: max_restarts: 60, min_uptime: 5s
- **Images API**: max_restarts: 50, max_memory_restart: 600M

### Health Check Settings

- **Интервал проверки**: 30 секунд
- **Порог для восстановления**: 3 неудачных попытки
- **Timeout для HTTP запросов**: 5 секунд
- **Проверяемые endpoint'ы**: /health, /api/status, /

## 🔧 Индивидуальные restore скрипты

### Особенности восстановления по сервисам:

#### CRM API (самый проблемный)
- Агрессивная очистка процессов
- Проверка системных ресурсов
- Fresh install dependencies
- Расширенная проверка здоровья (15 попыток)
- Emergency fallback режим

#### Auth Service  
- JWT токен проверки
- Database connectivity check
- Проверка порта на conflicts
- Enhanced security settings

#### Admin Panel
- Vite cache очистка
- Build verification
- React/TypeScript dependencies
- Расширенное время запуска

#### Images API
- Disk space проверка
- Image processing libraries check
- High memory settings (600M)
- Upload directories verification

## 🚨 Система алертов

### Уровни алертов:

1. **Warning** - обычные сбои (< 5 failures)
2. **Critical** - серьезные проблемы (≥ 5 failures) 
3. **Emergency** - массовые сбои (≥ 3 сервисов одновременно)

### Каналы уведомлений:

- **Logs**: `/root/beauty-platform/logs/alerts.log`
- **Email**: admin@beauty-platform.com
- **Webhook**: Slack/Discord (настраивается)

## 📊 Мониторинг

### Проверяемые параметры:

- **PM2 status** - статус процессов
- **Port connectivity** - доступность портов
- **HTTP health checks** - endpoint'ы здоровья
- **System resources** - CPU, Memory, Disk
- **Database connectivity** - связь с БД

### Логи и отчеты:

- **Health Monitor**: `/root/beauty-platform/logs/health-monitor.log`
- **Alerts**: `/root/beauty-platform/logs/health-alerts.log`
- **Daily Reports**: автоматически в 6:00 утра
- **System Status**: JSON snapshots каждые 10 минут

## 🔄 Автоматические задачи (Cron)

```bash
# Backup каждые 30 минут
*/30 * * * * /root/beauty-platform/deployment/auto-restore/backup-system.sh

# Ежедневные отчеты в 6:00
0 6 * * * /root/beauty-platform/deployment/auto-restore/alert-system.sh daily-report

# Системное обслуживание каждые 6 часов
0 */6 * * * /root/beauty-platform/deployment/auto-restore/system-maintenance.sh
```

## 🧪 Тестирование

### Полное тестирование системы:

```bash
./test-system.sh full
```

### Тестирование восстановления:

```bash
./test-system.sh restore
```

### Симуляция сбоя:

```bash
./test-system.sh simulate auth-service 6021
```

## 📈 Восстановление после сбоев

### Типичные сценарии:

1. **Одиночный сбой сервиса**:
   - Health Monitor обнаруживает (3 неудачных проверки)
   - Запускается соответствующий restore скрипт
   - Alert отправляется администратору
   - Сервис восстанавливается автоматически

2. **Массовый сбой (≥ 3 сервисов)**:
   - Emergency procedures активируются
   - Все проблемные сервисы восстанавливаются параллельно
   - Critical alert отправляется
   - Система ожидает стабилизации

3. **Критическая ошибка (база данных)**:
   - Database connectivity проверки
   - Попытка reconnect
   - Если не помогает - manual intervention требуется

## 🔧 Maintenance и очистка

Система автоматически выполняет:

- **Log rotation** - ротация больших логов (>100MB)
- **Cleanup** - удаление старых временных файлов
- **PM2 flush** - очистка PM2 логов
- **NPM cache** - проверка и очистка npm кеша
- **Backup cleanup** - удаление backup'ов старше 14 дней

## 📋 Команды управления

### Master Orchestrator:

```bash
./master-orchestrator.sh start    # Запуск системы
./master-orchestrator.sh stop     # Остановка системы  
./master-orchestrator.sh status   # Статус системы
./master-orchestrator.sh test     # Тест алертов
```

### Индивидуальные restore:

```bash
./restore-auth-service.sh         # Восстановить Auth Service
./restore-crm-api.sh             # Восстановить CRM API
./restore-admin-panel.sh         # Восстановить Admin Panel
# и т.д.
```

### Утилиты:

```bash
./backup-system.sh               # Создать backup
./system-maintenance.sh          # Запустить maintenance
./alert-system.sh daily-report   # Создать отчет
```

## 🎯 Результат

После внедрения системы:

1. **Автоматическое восстановление** всех критических сервисов
2. **Мгновенные алерты** о проблемах
3. **Регулярные backup'ы** конфигураций  
4. **Системная самодиагностика** и maintenance
5. **Подробное логирование** всех событий
6. **Emergency procedures** для критических ситуаций

## 🚨 Emergency контакты

В случае полного отказа системы:
- Проверить: `pm2 list`
- Логи: `/root/beauty-platform/logs/`
- Ручной restart: `pm2 restart all`
- Последний backup: `/root/beauty-platform/deployment/auto-restore/backups/`

## 💡 Рекомендации

1. **Мониторьте алерты** - они предупреждают о проблемах
2. **Проверяйте daily reports** - общая картина здоровья системы
3. **Запускайте тесты** после изменений в коде
4. **Бэкапьте** критичные конфигурации вручную перед major changes
5. **Следите за системными ресурсами** - CPU/Memory/Disk

---

**Beauty Platform Auto-Restore System** - надежное решение для production stability! 🚀