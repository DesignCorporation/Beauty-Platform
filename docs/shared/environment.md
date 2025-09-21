# 🌍 Beauty Platform - Environment Configuration

> **Общие переменные окружения для всех приложений и сервисов**

## 🔧 **Порты приложений**

### **Frontend Applications (6000-6019)**
```bash
PORT_LANDING_PAGE=6000     # Главная страница
PORT_SALON_CRM=6001        # CRM для салонов  
PORT_ADMIN_PANEL=6002      # Админ-панель суперадминов
PORT_CLIENT_BOOKING=6003   # Клиентское бронирование  
PORT_PUBLIC_WEBSITES=6004  # Публичные сайты салонов
```

### **Backend Services (6020-6039)**
```bash
PORT_API_GATEWAY=6020      # API Gateway (главный вход)
PORT_AUTH_SERVICE=6021     # Сервис аутентификации ✅ WORKING
PORT_BOOKING_SERVICE=6022  # Сервис бронирования
PORT_NOTIFICATION_SERVICE=6023  # Сервис уведомлений
PORT_PAYMENT_SERVICE=4003  # Сервис платежей
```

## 🌐 **Домены**

### **Production Domains**
```bash
DOMAIN_CRM=crm.beauty.designcorp.eu
DOMAIN_ADMIN=admin.beauty.designcorp.eu
DOMAIN_CLIENT=booking.beauty.designcorp.eu
DOMAIN_API=api.beauty.designcorp.eu
```

### **Development Domains**
```bash
DOMAIN_CRM_DEV=localhost:5174
DOMAIN_ADMIN_DEV=localhost:4020
DOMAIN_CLIENT_DEV=localhost:4021
DOMAIN_API_DEV=localhost:3000
```

## 🗄️ **База данных**

### **Main Database (PostgreSQL)**
```bash
DATABASE_URL="postgresql://beauty_user:password@localhost:5432/beauty_platform"
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=beauty_platform
DATABASE_USER=beauty_user
DATABASE_PASSWORD=your_secure_password
```

### **Audit Database (PostgreSQL)**
```bash
AUDIT_DATABASE_URL="postgresql://beauty_user:password@localhost:5432/beauty_audit"
AUDIT_DATABASE_NAME=beauty_audit
```

### **Cache (Redis)**
```bash
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""
```

## 🔐 **Безопасность**

### **JWT Configuration**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### **Encryption**
```bash
ENCRYPTION_KEY=your-32-character-encryption-key!!
BCRYPT_ROUNDS=12
```

## 🌍 **Локализация**

### **Supported Languages**
```bash
DEFAULT_LANGUAGE=ru
SUPPORTED_LANGUAGES=ru,pl,en,uk
```

### **Supported Currencies**
```bash
DEFAULT_CURRENCY=EUR
SUPPORTED_CURRENCIES=EUR,PLN,UAH,USD,GBP,CZK
```

## 📧 **External Services**

### **Email (SMTP)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Beauty Platform <noreply@beauty.designcorp.eu>"
```

### **SMS (Twilio)**
```bash
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

### **File Storage (S3/MinIO)**
```bash
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=beauty-platform
S3_REGION=us-east-1
```

## 🚀 **Development Environment**

### **.env.example**
```bash
# Copy this to .env and fill in your values

# Application
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL="postgresql://beauty_user:password@localhost:5432/beauty_platform"
AUDIT_DATABASE_URL="postgresql://beauty_user:password@localhost:5432/beauty_audit"

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key!!

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis (optional for development)
REDIS_URL="redis://localhost:6379"
```

## 📊 **Production Environment**

### **Environment Variables**
```bash
NODE_ENV=production
LOG_LEVEL=warn
PM2_INSTANCES=2

# Performance
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=128

# Security
HELMET_ENABLED=true
CORS_ORIGIN="https://crm.beauty.designcorp.eu,https://admin.beauty.designcorp.eu"
```

## 🔍 **Debugging**

### **Development Debug**
```bash
DEBUG=beauty:*
DEBUG_DEPTH=3
DEBUG_COLORS=true
```

### **Production Monitoring**
```bash
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

---

**💡 Tip:** Всегда используй переменные окружения вместо хардкода значений!