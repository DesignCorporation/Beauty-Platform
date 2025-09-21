# 🔔 Notification Service

Beauty Platform Notification Service - микросервис для управления уведомлениями (Email, SMS, Push, In-App).

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Копирование переменных окружения
cp .env.example .env

# Генерация Prisma клиента
npm run prisma:generate

# Запуск в dev режиме
npm run dev
```

## 📍 Endpoints

### Health Check
- `GET /health` - Базовый health check
- `GET /status` - Детальный статус сервиса

### API (TODO)
- `POST /api/notifications` - Отправка уведомления
- `GET /api/notifications/me` - Мои уведомления
- `PUT /api/notifications/:id/read` - Отметить как прочитанное

## 🔧 Конфигурация

### Переменные окружения
- `PORT` - Порт сервиса (по умолчанию: 6028)
- `DATABASE_URL` - Строка подключения к PostgreSQL
- `JWT_SECRET` - Секрет для JWT токенов

## 🏗️ Архитектура

```
src/
├── index.ts              # Точка входа
├── routes/               # API роуты
│   └── health.ts        # Health check endpoints
├── middleware/          # Middleware функции
│   └── tenantAuth.ts   # JWT аутентификация
├── services/           # Бизнес-логика (TODO)
├── types/              # TypeScript типы
│   └── auth.ts        # Типы аутентификации
└── utils/              # Утилиты (TODO)
```

## 📦 Scripts

- `npm run dev` - Запуск в dev режиме с hot reload
- `npm run build` - Сборка проекта
- `npm run start` - Запуск production версии
- `npm run prisma:generate` - Генерация Prisma клиента
- `npm run prisma:migrate` - Миграции БД

## 🔗 Интеграция

Этот сервис является частью Beauty Platform экосистемы:
- **Порт**: 6028
- **Auth**: Использует shared JWT токены
- **Database**: Подключается к основной БД
- **Monitoring**: Интегрируется с API Gateway

## 📋 TODO

- [ ] Добавить Redis для queue системы
- [ ] Реализовать Email/SMS провайдеры
- [ ] Добавить WebSocket для real-time уведомлений
- [ ] Интегрировать с основной Prisma схемой
- [ ] Добавить unit тесты
- [ ] Настроить Docker
- [ ] Добавить в auto-restore систему

## 📈 Мониторинг

Сервис предоставляет endpoints для мониторинга:
- Health check доступен на `/health`
- Детальный статус на `/status`
- Логи выводятся в консоль (TODO: файловое логирование)

---

*Создан: 20.09.2025*
*Версия: 1.0.0*
*Команда: Design Corporation*