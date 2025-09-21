# 🚨 BEAUTY PLATFORM - ФИНАЛЬНАЯ СХЕМА ПОРТОВ

> ⚠️ **ВНИМАНИЕ**: Эта схема НЕ ПОДЛЕЖИТ ИЗМЕНЕНИЮ!  
> 🔒 **ЗАПРЕЩЕНО**: Любые изменения портов без согласования с Tech Lead!

---

## 🛑 **ЗАНЯТЫЕ ПОРТЫ (НЕ ТРОГАТЬ!)**

```bash
# СИСТЕМА (критические порты)
22    # SSH
80    # HTTP
443   # HTTPS
5432  # PostgreSQL Main
6379  # Redis (Docker)
8080  # Docker Proxy

# LEGACY BEAUTY PLATFORM (старая версия)
3000, 3001, 3002, 3005  # PM2 processes
4000, 4001, 4021, 4022, 4024  # Beauty API services  
5174, 5175, 5176        # Beauty CRM services
7000                    # workerd
```

---

## ✅ **НОВАЯ СХЕМА - ДИАПАЗОН 6000-6099**

### **FRONTEND APPS (6000-6019)**
```bash
6000  # 🎯 Main Landing Page (Next.js)
6001  # 💼 Salon CRM (React + Vite)  
6002  # 🔧 Admin Panel (React + Vite)
6003  # 📱 Client Booking (React + Vite)
6004  # 🌐 Public Salon Sites (Next.js)

# РЕЗЕРВ для будущих фронтендов
6005-6019  # 🚧 Reserved for future frontend apps
```

### **BACKEND SERVICES (6020-6039)**
```bash
6020  # 🌉 API Gateway (Express) - ГЛАВНЫЙ ВХОД
6021  # 🔐 Auth Service (Express)
6022  # 📅 Booking Service (Express)
6023  # 📧 Notification Service (Express) 
6024  # 💰 Payment Service (Express)
6025  # 👥 User Management Service (Express)
6026  # 🏢 Salon Management Service (Express)

# РЕЗЕРВ для будущих микросервисов
6027-6039  # 🚧 Reserved for future backend services
```

### **DEVELOPMENT & TOOLS (6040-6059)**
```bash
6040  # 🧪 Test Runner / Jest
6041  # 📊 Storybook (UI Development)
6042  # 🔍 Development Proxy
6043  # 🗄️ Prisma Studio
6044  # 📈 Monitoring Dashboard
6045  # 🐛 Debug Server

# РЕЗЕРВ для dev tools
6046-6059  # 🚧 Reserved for development tools
```

### **DATABASES & INFRASTRUCTURE (6060-6099)**
```bash
6060  # 🐘 PostgreSQL Test DB
6061  # 🔴 Redis Test Instance  
6062  # 📦 MinIO File Storage
6063  # 🕐 Cron Job Server
6064  # 📊 Metrics Collector

# РЕЗЕРВ для инфраструктуры
6065-6099  # 🚧 Reserved for infrastructure
```

---

## 🌍 **PRODUCTION DOMAINS → PORTS**

| Domain | Port | Service | Status |
|--------|------|---------|--------|
| `beauty.designcorp.eu` | 6000 | Landing Page | 🚧 Planned |
| `crm.beauty.designcorp.eu` | 6001 | Salon CRM | 🚧 Planned |
| `admin.beauty.designcorp.eu` | 6002 | Admin Panel | 🚧 Planned |
| `book.beauty.designcorp.eu` | 6003 | Client Booking | 🚧 Planned |
| `api.beauty.designcorp.eu` | 6020 | API Gateway | 🚧 Planned |
| `{slug}.beauty.designcorp.eu` | 6004 | Salon Sites | 🚧 Planned |

---

## 🔧 **NGINX CONFIGURATION**

```nginx
# FRONTEND APPS
upstream beauty_landing { server localhost:6000; }
upstream beauty_crm { server localhost:6001; }
upstream beauty_admin { server localhost:6002; }
upstream beauty_booking { server localhost:6003; }
upstream beauty_salon_sites { server localhost:6004; }

# BACKEND SERVICES  
upstream beauty_api_gateway { server localhost:6020; }

# MAIN SITES
server {
    server_name beauty.designcorp.eu;
    location / { proxy_pass http://beauty_landing; }
}

server {
    server_name crm.beauty.designcorp.eu;
    location / { proxy_pass http://beauty_crm; }
}

server {
    server_name admin.beauty.designcorp.eu;
    location / { proxy_pass http://beauty_admin; }
}

server {
    server_name book.beauty.designcorp.eu;
    location / { proxy_pass http://beauty_booking; }
}

server {
    server_name api.beauty.designcorp.eu;
    location / { proxy_pass http://beauty_api_gateway; }
}

# WILDCARD для сайтов салонов
server {
    server_name ~^(?<salon_slug>.+)\.beauty\.designcorp\.eu$;
    location / { 
        proxy_pass http://beauty_salon_sites;
        proxy_set_header X-Salon-Slug $salon_slug;
    }
}
```

---

## 📋 **PROCESS MANAGEMENT (PM2)**

```bash
# Запуск всех сервисов
pm2 start ecosystem.config.js

# ecosystem.config.js
module.exports = {
  apps: [
    // FRONTEND
    { name: 'beauty-landing',     script: 'npm', args: 'start', port: 6000 },
    { name: 'beauty-crm',         script: 'npm', args: 'start', port: 6001 },
    { name: 'beauty-admin',       script: 'npm', args: 'start', port: 6002 },
    { name: 'beauty-booking',     script: 'npm', args: 'start', port: 6003 },
    { name: 'beauty-salon-sites', script: 'npm', args: 'start', port: 6004 },
    
    // BACKEND
    { name: 'beauty-api-gateway', script: 'npm', args: 'start', port: 6020 },
    { name: 'beauty-auth',        script: 'npm', args: 'start', port: 6021 },
    { name: 'beauty-booking-svc', script: 'npm', args: 'start', port: 6022 },
    { name: 'beauty-notify',      script: 'npm', args: 'start', port: 6023 },
    { name: 'beauty-payment',     script: 'npm', args: 'start', port: 6024 }
  ]
};
```

---

## 🚫 **СТРОГИЕ ПРАВИЛА:**

### ❌ **ЗАПРЕЩЕНО:**
- Изменять любые порты без обновления этого документа
- Использовать порты вне диапазона 6000-6099
- Запускать левые сервисы на этих портах
- Жестко кодить порты в коде (только через env переменные)

### ✅ **ОБЯЗАТЕЛЬНО:**
- Все порты должны быть в ENV переменных
- При добавлении нового сервиса - обновить этот документ
- При изменении портов - уведомить всю команду
- Тестировать порты перед деплоем

---

## 📝 **ENVIRONMENT VARIABLES**

```bash
# Frontend Apps
BEAUTY_LANDING_PORT=6000
BEAUTY_CRM_PORT=6001
BEAUTY_ADMIN_PORT=6002
BEAUTY_BOOKING_PORT=6003
BEAUTY_SALON_SITES_PORT=6004

# Backend Services
BEAUTY_API_GATEWAY_PORT=6020
BEAUTY_AUTH_PORT=6021
BEAUTY_BOOKING_SERVICE_PORT=6022
BEAUTY_NOTIFICATION_PORT=6023
BEAUTY_PAYMENT_PORT=6024

# Development
PRISMA_STUDIO_PORT=6043
STORYBOOK_PORT=6041
```

---

## 🔍 **MONITORING & HEALTH CHECKS**

```bash
# Проверка всех портов
curl -s http://localhost:6000/health  # Landing
curl -s http://localhost:6001/health  # CRM
curl -s http://localhost:6002/health  # Admin
curl -s http://localhost:6020/health  # API Gateway

# Автоматическая проверка
./scripts/check-ports.sh
```

---

## 📅 **CHANGELOG**

| Date | Author | Changes |
|------|--------|---------|
| 2025-08-12 | Claude + User | Создана финальная схема портов 6000-6099 |

---

# ⚠️ **ВАЖНО: ЭТА СХЕМА ФИНАЛЬНАЯ!**

**Любые изменения только через Pull Request с обновлением этого документа!**

🔒 **Port range 6000-6099 is RESERVED for Beauty Platform ONLY!**