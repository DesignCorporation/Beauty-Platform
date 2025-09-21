# 🌐 Beauty Platform - UPDATED Ports Architecture

> **Обновленная карта портов с учетом уже занятых на сервере**

## ⚠️ **ЗАНЯТЫЕ ПОРТЫ НА СЕРВЕРЕ:**
```bash
# Уже используются:
3000, 3001, 3002     # PM2 processes
4000, 4001, 4021, 4022, 4024  # Beauty API services  
5174, 5175, 5176     # Beauty CRM services
5432                 # PostgreSQL
6379                 # Redis
7000                 # workerd
8080                 # Docker proxy
```

---

## 🔧 **НОВАЯ СХЕМА ПОРТОВ**

### **Frontend Applications**
```bash
6100  # 🎯 Main Landing Page (Next.js)
6101  # 💼 Salon CRM (React + Vite)  
6102  # 🔧 Admin Panel (React + Vite)
6103  # 📱 Client Booking (React + Vite)
6104  # 🌐 Public Websites (Next.js)
```

### **Backend Services**  
```bash
6200  # 🔐 Auth Service (Express)
6201  # 📅 Booking Service (Express)
6202  # 📧 Notification Service (Express) 
6203  # 💰 Payment Service (Express)
6204  # 🌉 API Gateway (Express)
```

### **Development/Testing Ports**
```bash
6300  # 🧪 Test Runner
6301  # 📊 Storybook
6302  # 🔍 Development Tools
6303  # 🗄️ Database UI (Prisma Studio)
```

---

## 🚀 **PRODUCTION DOMAINS (Unchanged)**

### **Public Domains**
```bash
https://beauty.designcorp.eu          # 🎯 Main Landing → 6100
https://crm.beauty.designcorp.eu      # 💼 Salon CRM → 6101  
https://admin.beauty.designcorp.eu    # 🔧 Admin Panel → 6102
https://book.beauty.designcorp.eu     # 📱 Client Booking → 6103
https://api.beauty.designcorp.eu      # 🌉 API Gateway → 6204
```

### **Salon Subdomains**
```bash
https://{salon-slug}.beauty.designcorp.eu  # 🌐 Salon sites → 6104
```

---

## 🛡️ **UPDATED NGINX CONFIGURATION**

```nginx
# Main sites
server {
    server_name beauty.designcorp.eu;
    location / { proxy_pass http://localhost:6100; }
}

server {
    server_name crm.beauty.designcorp.eu;
    location / { proxy_pass http://localhost:6101; }
}

server {
    server_name admin.beauty.designcorp.eu;
    location / { proxy_pass http://localhost:6102; }
}

server {
    server_name book.beauty.designcorp.eu;
    location / { proxy_pass http://localhost:6103; }
}

# API Gateway
server {
    server_name api.beauty.designcorp.eu;
    location / { proxy_pass http://localhost:6204; }
}

# Wildcard for salon sites
server {
    server_name ~^(?<salon_slug>.+)\.beauty\.designcorp\.eu$;
    location / { 
        proxy_pass http://localhost:6104;
        proxy_set_header X-Salon-Slug $salon_slug;
    }
}
```

---

## 📱 **APPLICATION MAPPING**

| App | Port | URL | Description |
|-----|------|-----|-------------|
| **Landing** | 6100 | `https://beauty.designcorp.eu` | Главная страница платформы |
| **Salon CRM** | 6101 | `https://crm.beauty.designcorp.eu` | CRM для владельцев салонов |
| **Admin Panel** | 6102 | `https://admin.beauty.designcorp.eu` | Админка суперадминов |
| **Client Booking** | 6103 | `https://book.beauty.designcorp.eu` | Клиентское бронирование |
| **Public Sites** | 6104 | `https://{slug}.beauty.designcorp.eu` | Сайты салонов |

---

## 🔄 **SERVICE COMMUNICATION**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   Apps          │───▶│   (Port 6204)   │───▶│   Services      │
│   (6100-6104)   │    │                 │    │   (6200-6203)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Database      │              │
         └──────────────│   PostgreSQL    │◀─────────────┘
                        │   (5432 exists) │
                        └─────────────────┘
```

---

## 💡 **ПОЯСНЕНИЯ:**

✅ **Порты 6100-6299** свободны на сервере  
✅ **Не конфликтуют** с существующими сервисами  
✅ **Логично сгруппированы** по типу сервиса  
✅ **Легко запомнить** и масштабировать  

**Теперь можем безопасно разрабатывать!** 🚀