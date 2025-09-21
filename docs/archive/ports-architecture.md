# 🌐 Beauty Platform - Ports Architecture

> **Полная карта портов для разработки и продакшена**

## 🔧 **DEVELOPMENT PORTS**

### **Frontend Applications**
```bash
3000  # 🎯 Main Landing Page (Next.js)
3001  # 💼 Salon CRM (React + Vite)  
3002  # 🔧 Admin Panel (React + Vite)
3003  # 📱 Client Booking (React + Vite)
3004  # 🌐 Public Websites (Next.js)
```

### **Backend Services**  
```bash
4000  # 🔐 Auth Service (Express)
4001  # 📅 Booking Service (Express)
4002  # 📧 Notification Service (Express) 
4003  # 💰 Payment Service (Express)
4004  # 🌉 API Gateway (Express)
```

### **Infrastructure**
```bash
5432  # 🐘 PostgreSQL (Main DB)
5433  # 🐘 PostgreSQL (Audit DB)  
6379  # 🔴 Redis (Cache & Sessions)
9000  # 📦 MinIO (File Storage)
```

---

## 🚀 **PRODUCTION DOMAINS**

### **Public Domains**
```bash
https://beauty.designcorp.eu          # 🎯 Main Landing
https://crm.beauty.designcorp.eu      # 💼 Salon CRM
https://admin.beauty.designcorp.eu    # 🔧 Admin Panel  
https://book.beauty.designcorp.eu     # 📱 Client Booking
https://api.beauty.designcorp.eu      # 🌉 API Gateway
```

### **Salon Subdomains**
```bash
https://{salon-slug}.beauty.designcorp.eu  # 🌐 Individual salon sites
# Example: https://anna-salon.beauty.designcorp.eu
```

---

## 🔄 **SERVICE COMMUNICATION**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   Apps          │───▶│   (Port 4004)   │───▶│   Services      │
│   (3000-3004)   │    │                 │    │   (4000-4003)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Database      │              │
         └──────────────│   PostgreSQL    │◀─────────────┘
                        │   (5432/5433)   │
                        └─────────────────┘
```

---

## 📱 **APPLICATION MAPPING**

| App | Port | URL | Description |
|-----|------|-----|-------------|
| **Landing** | 3000 | `https://beauty.designcorp.eu` | Главная страница платформы |
| **Salon CRM** | 3001 | `https://crm.beauty.designcorp.eu` | CRM для владельцев салонов |
| **Admin Panel** | 3002 | `https://admin.beauty.designcorp.eu` | Админка суперадминов |
| **Client Booking** | 3003 | `https://book.beauty.designcorp.eu` | Клиентское бронирование |
| **Public Sites** | 3004 | `https://{slug}.beauty.designcorp.eu` | Сайты салонов |

---

## 🛡️ **NGINX CONFIGURATION**

```nginx
# Main sites
server {
    server_name beauty.designcorp.eu;
    location / { proxy_pass http://localhost:3000; }
}

server {
    server_name crm.beauty.designcorp.eu;
    location / { proxy_pass http://localhost:3001; }
}

server {
    server_name admin.beauty.designcorp.eu;
    location / { proxy_pass http://localhost:3002; }
}

# API Gateway
server {
    server_name api.beauty.designcorp.eu;
    location / { proxy_pass http://localhost:4004; }
}

# Wildcard for salon sites
server {
    server_name ~^(?<salon_slug>.+)\.beauty\.designcorp\.eu$;
    location / { 
        proxy_pass http://localhost:3004;
        proxy_set_header X-Salon-Slug $salon_slug;
    }
}
```

---

**💡 Все порты спланированы для избежания конфликтов!**