# 🚀 Полный CI/CD Setup - Beauty Platform

Автоматический deployment через GitHub Actions + Webhook сервер

## 🎯 Что получается:

1. **Push в main** → GitHub Actions запускает CI
2. **CI проверяет** код (lint, test, build)
3. **CD отправляет webhook** на production сервер
4. **Webhook сервер** автоматически запускает `./beauty-dev.sh deploy`
5. **Автоматический deployment** с health-check'ами

---

## 📋 Настройка CI/CD Pipeline

### 1. 🔒 Настройка GitHub Secrets

В GitHub репозитории добавьте секрет:

1. Идите в **Settings** → **Secrets and variables** → **Actions**
2. Нажмите **New repository secret**
3. Добавьте:
   - **Name**: `WEBHOOK_SECRET`
   - **Value**: `beauty-platform-webhook-secret-2025`

### 2. 🔗 Запуск Webhook сервера

На production сервере:

```bash
# Запускаем webhook сервер
./beauty-dev.sh webhook start

# Проверяем статус
./beauty-dev.sh webhook status

# Смотрим логи
./beauty-dev.sh webhook logs
```

**Webhook endpoint**: `http://135.181.156.117:3333/webhook/deploy`

### 3. 🌐 Настройка NGINX (опционально)

Для HTTPS и красивого домена:

```nginx
# /etc/nginx/sites-available/webhook
server {
    listen 80;
    server_name webhook.beauty.designcorp.eu;

    location / {
        proxy_pass http://localhost:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Затем:
```bash
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔧 Команды управления

### Webhook сервер:
```bash
./beauty-dev.sh webhook start    # Запустить
./beauty-dev.sh webhook stop     # Остановить
./beauty-dev.sh webhook restart  # Перезапустить
./beauty-dev.sh webhook status   # Статус + health check
./beauty-dev.sh webhook logs     # Логи webhook'а
```

### CI/CD процесс:
```bash
./beauty-dev.sh deploy           # Ручной deployment
./beauty-dev.sh status           # Статус всех сервисов
./beauty-dev.sh rollback <name>  # Откат при проблемах
./beauty-dev.sh backup <name>    # Создать backup
```

---

## 📊 Monitoring & Logs

### Логи webhook сервера:
```bash
tail -f /root/projects/beauty/logs/webhook.log
tail -f /root/projects/beauty/logs/webhook-server.log
```

### Health checks:
```bash
# Webhook сервер
curl http://localhost:3333/health

# Все сервисы Beauty Platform
./beauty-dev.sh status
```

---

## 🔄 Полный Workflow

### 1. Development:
```bash
cd /root/projects/beauty
git checkout -b feature/new-feature

# Делаем изменения...

git add .
git commit -m "feat: добавил новую функцию"
git push origin feature/new-feature

# Создаем Pull Request на GitHub
```

### 2. Production Deployment:
```bash
# На GitHub: merge PR в main ветку
# 🚀 АВТОМАТИЧЕСКИ запускается:

# 1. GitHub Actions CI:
#    ✅ TypeScript check
#    ✅ Lint check
#    ✅ Tests
#    ✅ Build

# 2. GitHub Actions CD:
#    🔗 Отправляет webhook на сервер

# 3. Webhook сервер:
#    📥 Получает сигнал
#    🚀 Запускает ./beauty-dev.sh deploy
#    📦 git pull + build + test + deploy + health-check
#    ✅ Production обновлен!
```

### 3. В случае проблем:
```bash
# Смотрим что произошло
./beauty-dev.sh logs
./beauty-dev.sh webhook logs

# Откатываемся к предыдущей версии
./beauty-dev.sh rollback beauty-20250921-143022

# Проверяем статус
./beauty-dev.sh status
```

---

## 🛡️ Безопасность

### Webhook аутентификация:
- **Bearer token** в заголовке Authorization
- **Secret key** для проверки подлинности GitHub Actions
- **IP filtering** (опционально через NGINX)

### Backup стратегия:
- **Автоматический backup** перед каждым deployment'ом
- **Timestamp naming** для легкого поиска
- **Rollback в одну команду** при проблемах

---

## 🎉 Результат

**У вас теперь Enterprise-level CI/CD:**

✅ **Continuous Integration** - автоматические проверки кода
✅ **Continuous Deployment** - автоматический деплой в production
✅ **Health Monitoring** - проверка работоспособности после деплоя
✅ **Disaster Recovery** - быстрый откат при проблемах
✅ **Security** - аутентификация webhook'ов
✅ **Logging** - полное логирование всех операций

**Одна команда для всего**: `git push origin main` → production обновлен! 🚀