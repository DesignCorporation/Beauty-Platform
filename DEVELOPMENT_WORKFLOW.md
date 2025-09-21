# 🔄 DEVELOPMENT WORKFLOW - Beauty Platform

## 📁 Структура проекта

```
/root/
├── projects/beauty/           # 🟢 DEVELOPMENT (работаем здесь)
├── beauty-platform/          # 🔴 LEGACY (удалить после миграции)
├── www-link/ -> /var/www/    # 🔗 Ссылка на production
└── /var/www/beauty/          # 🟡 PRODUCTION (автодеплой)
```

## 🚀 Git Workflow

### 1. Development (локальная разработка)
```bash
# Работаем в /root/projects/beauty/
cd /root/projects/beauty
git checkout -b feature/new-feature
# делаем изменения
git add .
git commit -m "feat: добавил новую функцию"
git push origin feature/new-feature
```

### 2. Staging (тестирование)
```bash
# Мерджим в main ветку через GitHub PR
git checkout main
git pull origin main
# запускаем тесты и проверяем
npm run build
npm run test
```

### 3. Production Deploy
```bash
# Автоматический деплой через скрипт
./deploy/deploy-production.sh
```

## 🔧 Environment Setup

### Development URLs (localhost)
- Landing: http://localhost:6000
- CRM: http://localhost:6001
- Admin: http://localhost:6002
- Client: http://localhost:6003
- API Gateway: http://localhost:6020
- Auth Service: http://localhost:6021
- CRM API: http://localhost:6022

### Production URLs (домен)
- Landing: https://beauty.designcorp.eu
- CRM: https://salon.beauty.designcorp.eu
- Admin: https://admin.beauty.designcorp.eu
- Client: https://client.beauty.designcorp.eu

## 🛠️ Команды разработки

### Запуск development сервера
```bash
cd /root/projects/beauty
npm run dev:all        # запустить все сервисы
npm run dev:frontend   # только фронтенд
npm run dev:backend    # только бэкенд
```

### Деплой на production
```bash
./deploy/deploy-production.sh  # полный деплой
./deploy/deploy-frontend.sh    # только фронтенд
./deploy/deploy-backend.sh     # только бэкенд
```

## 📋 Checklist перед деплоем

- [ ] Тесты проходят (`npm run test`)
- [ ] TypeScript компилируется (`npm run typecheck`)
- [ ] Линтер не ругается (`npm run lint`)
- [ ] Build успешен (`npm run build`)
- [ ] Проверены URL в .env файлах
- [ ] Обновлена документация