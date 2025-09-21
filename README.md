# 🌟 Beauty Platform - Enterprise SaaS

> **Современная мультитенантная платформа для салонов красоты**

## 🎯 **Что это такое?**

Beauty Platform - это enterprise-уровень SaaS решение для управления салонами красоты. Система построена по принципам **Domain-Driven Design** и **Clean Architecture** с полной мультитенантностью.

## 🏗️ **Архитектура проекта**

```
beauty-platform/
├── 🧠 core/              # Ядро системы - бизнес-логика
├── 🌐 apps/              # Веб-приложения
├── 🔧 services/          # Backend микросервисы
├── 📚 docs/              # Документация
└── 🚀 deployment/        # Инфраструктура
```

### **🧠 Core (Ядро системы)**
- **`core/domain/`** - Доменная модель (Appointment, Salon, Client, Staff)
- **`core/database/`** - Единая система работы с БД
- **`core/shared/`** - Общие типы, утилиты, константы
- **`core/config/`** - Конфигурации для всех приложений

### **🌐 Apps (Веб-приложения)**
- **`salon-crm/`** - CRM для салонов (порт 6001)
- **`admin-panel/`** - Админка суперадминов (порт 6002)
- **`client-booking/`** - Клиентское бронирование (порт 6003)
- **`public-websites/`** - Публичные сайты салонов (порт 6004)

### **🔧 Services (Backend)**
- **`auth-service/`** - Аутентификация и авторизация (порт 6021)
- **`api-gateway/`** - API Gateway (порт 6020)
- **`booking-service/`** - Система бронирования (порт 6022)
- **`notification-service/`** - Уведомления (порт 6023)
- **`payment-service/`** - Платежная система (порт 6024)

## 🚀 **Быстрый старт**

### **Установка**
```bash
# Клонировать проект
git clone [repository-url]
cd beauty-platform

# Установить зависимости
pnpm install

# Настроить переменные окружения
cp .env.example .env
```

### **Разработка**
```bash
# Запустить основные рабочие сервисы
pnpm --filter auth-service dev     # Auth Service (6021)
pnpm --filter admin-panel dev      # Admin Panel (6002)
pnpm --filter salon-crm dev        # Salon CRM (6001)

# Запустить MCP сервер (система обучения агентов)
pnpm --filter mcp-server dev       # MCP Server (6025)

# Проверить работу сервисов
curl http://localhost:6021/health  # Auth
curl http://localhost:6002/        # Admin
curl http://localhost:6001/        # CRM
```

### **Сборка**
```bash
# Собрать конкретный сервис/приложение
pnpm --filter auth-service build
pnpm --filter admin-panel build
pnpm --filter salon-crm build

# Собрать все (если настроено)
pnpm build
```

## 🛡️ **Принципы безопасности**

### **Tenant Isolation**
Каждый салон полностью изолирован от других:
```typescript
// ✅ ПРАВИЛЬНО: используй доменные сервисы
const appointments = await appointmentService.getByTenant(tenantId);

// ❌ ОПАСНО: прямые запросы без изоляции
const appointments = await prisma.appointment.findMany(); // ЗАПРЕЩЕНО!
```

## 🌍 **Мультиязычность**
- 🇷🇺 **Русский** (основной)
- 🇵🇱 **Polish**
- 🇬🇧 **English**
- 🇺🇦 **Ukrainian**

## 💰 **Поддерживаемые валюты**
- **EUR** (базовая)
- **PLN**, **UAH**, **USD**, **GBP**, **CZK**

## 📚 **Документация**

### **Для разработчиков**
- [🏗️ Архитектура системы](./docs/shared/architecture.md)
- [🧠 Доменная модель](./docs/shared/domain-model.md)
- [📊 API стандарты](./docs/shared/api-standards.md)
- [🚀 Развертывание](./docs/shared/deployment.md)

### **Для отдельных приложений**
- [💼 Salon CRM](./docs/apps/salon-crm/README.md)
- [🔧 Admin Panel](./docs/apps/admin-panel/README.md)
- [📱 Client Booking](./docs/apps/client-booking/README.md)

### **Для backend сервисов**
- [🔐 Auth Service](./docs/services/auth-service/README.md)
- [📅 Booking Service](./docs/services/booking-service/README.md)

## 🤝 **Команда**

Проект разрабатывается командой специализированных AI агентов:
- **👨‍💼 Product Manager** - планирование продукта
- **🏗️ Backend Developer** - серверная разработка
- **🎨 Frontend Developer** - клиентская разработка
- **🚀 DevOps Engineer** - инфраструктура
- **📊 Database Analyst** - работа с данными
- **🎨 UI Designer** - дизайн интерфейсов

## 📄 **Лицензия**

UNLICENSED - Проприетарное ПО DesignCorp

---

**Beauty Platform** - создаем будущее индустрии красоты! ✨