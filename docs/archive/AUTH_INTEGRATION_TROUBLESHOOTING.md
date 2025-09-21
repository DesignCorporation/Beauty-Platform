# 🔐 AUTH SERVICE INTEGRATION - TROUBLESHOOTING GUIDE

> **Создано**: 2025-08-13  
> **Статус**: ОБЯЗАТЕЛЬНО К ИЗУЧЕНИЮ перед интеграцией Auth Service  
> **Цель**: Избежать типичных ошибок при подключении фронтенда к Auth Service  

---

## 🚨 **КРИТИЧНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ**

### ❌ **ПРОБЛЕМА 1: 404 Not Found на /auth/* endpoints**

**Симптомы:**
```javascript
POST https://domain.com/auth/login 404 (Not Found)
POST https://domain.com/auth/refresh 404 (Not Found)
GET https://domain.com/auth/me 404 (Not Found)
```

**Причина:** nginx направляет `/auth/*` запросы на frontend приложение вместо Auth Service

**✅ РЕШЕНИЕ:** Добавить отдельную `location /auth/` в nginx конфигурацию:

```nginx
server {
    server_name your-app.beauty.designcorp.eu;
    
    # ⚠️ КРИТИЧНО: Auth API должен быть ПЕРЕД общим location /
    location /auth/ {
        proxy_pass http://127.0.0.1:6021;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS поддержка для аутентификации
        proxy_set_header Access-Control-Allow-Origin $http_origin;
        proxy_set_header Access-Control-Allow-Credentials true;
        proxy_set_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
        proxy_set_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRF-Token";
    }
    
    # Frontend приложение (React/Vue/Angular)
    location / {
        proxy_pass http://127.0.0.1:YOUR_FRONTEND_PORT;
        # ... остальные настройки
    }
}
```

---

### ❌ **ПРОБЛЕМА 2: 403 Forbidden с "Invalid JSON" ошибкой**

**Симптомы:**
```javascript
POST https://domain.com/auth/refresh 403 (Forbidden)
POST https://domain.com/auth/logout 403 (Forbidden)
// В логах Auth Service: "Invalid JSON in request body"
```

**Причина:** Auth Service слишком строго валидирует JSON и падает на пустом теле запроса

**✅ РЕШЕНИЕ:** Обновить JSON валидатор в Auth Service:

```typescript
// В services/auth-service/src/server.ts
app.use(express.json({ 
  limit: '10mb',
  verify: (_req, _res, buf) => {
    // ✅ КРИТИЧНО: Разрешаем пустое тело для refresh/logout
    if (buf.length === 0) return
    
    try {
      JSON.parse(buf.toString())
    } catch (e) {
      logger.error('Invalid JSON in request body')
      throw new Error('Invalid JSON')
    }
  }
}))
```

---

### ❌ **ПРОБЛЕМА 3: Cookies не сохраняются/не отправляются**

**Симптомы:**
```javascript
GET /auth/me 401 (Unauthorized)
// Cookies не приходят на сервер
```

**Причина:** Неправильная настройка CORS или отсутствие `credentials: 'include'`

**✅ РЕШЕНИЕ:** Проверить настройки в двух местах:

**1. Auth Service CORS:**
```typescript
app.use(cors({
  origin: [
    'http://localhost:YOUR_PORT',
    'https://your-app.beauty.designcorp.eu'
  ],
  credentials: true,  // ✅ КРИТИЧНО!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}))
```

**2. Frontend запросы:**
```typescript
// ✅ КРИТИЧНО: Всегда добавляй credentials: 'include'
const response = await fetch('/auth/login', {
  method: 'POST',
  credentials: 'include',  // ✅ КРИТИЧНО!
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
})
```

---

## 📋 **CHECKLIST ДЛЯ ИНТЕГРАЦИИ НОВОГО ФРОНТЕНДА**

### **ЭТАП 1: NGINX КОНФИГУРАЦИЯ**
- [ ] Добавлена `location /auth/` ПЕРЕД `location /`
- [ ] Правильно указан `proxy_pass http://127.0.0.1:6021`
- [ ] Добавлены CORS заголовки в nginx
- [ ] Выполнен `sudo nginx -t` (проверка конфигурации)
- [ ] Выполнен `sudo systemctl reload nginx`

### **ЭТАП 2: ПРОВЕРКА AUTH SERVICE**
- [ ] Auth Service запущен на порту 6021
- [ ] `curl http://localhost:6021/health` возвращает 200
- [ ] JSON валидатор разрешает пустое тело
- [ ] CORS настроен для нового домена

### **ЭТАП 3: FRONTEND КОД**
- [ ] Используется `credentials: 'include'` во всех auth запросах
- [ ] API_URL настроен как относительный путь `/auth`
- [ ] AuthContext не сохраняет токены в state/localStorage
- [ ] Обрабатываются 401 ошибки (нормальные после logout)

### **ЭТАП 4: ТЕСТИРОВАНИЕ**
- [ ] `curl https://domain.com/auth/health` → 200 OK
- [ ] `curl -X POST https://domain.com/auth/refresh` → 401 "NO_REFRESH_TOKEN"
- [ ] `curl -X POST https://domain.com/auth/logout` → 200 "Logged out"
- [ ] Логин в браузере работает
- [ ] Logout + перезагрузка показывает форму логина

---

## 🛠️ **КОМАНДЫ ДЛЯ ДИАГНОСТИКИ**

### **Проверка nginx:**
```bash
# Проверка конфигурации
sudo nginx -t

# Просмотр логов ошибок
sudo tail -f /var/log/nginx/error.log

# Просмотр логов доступа для домена
sudo tail -f /var/log/nginx/YOUR-DOMAIN.access.log
```

### **Проверка Auth Service:**
```bash
# Проверка что порт слушается
netstat -tlnp | grep 6021

# Прямая проверка health
curl http://localhost:6021/health

# Проверка через nginx
curl https://your-domain.com/auth/health
```

### **Проверка процессов:**
```bash
# Поиск Auth Service процесса
ps aux | grep "auth" | grep -v grep

# Логи Auth Service (если используете PM2)
pm2 logs auth-service
```

---

## 📚 **ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ**

- **Nginx документация**: `/root/beauty-platform/docs/shared/PORTS_FINAL_SCHEMA.md`
- **Безопасность**: `/root/beauty-platform/docs/security/ADMIN_PANEL_SECURITY_GUIDE.md`
- **Архитектура**: `/root/beauty-platform/docs/AI_HANDOVER_INSTRUCTIONS.md`

---

## 🎯 **ДЛЯ SALON CRM И CLIENT BOOKING**

При интеграции с другими приложениями:

1. **Обновить CORS в Auth Service** - добавить новые домены
2. **Создать отдельные nginx конфиги** - каждому приложению свой
3. **Проверить роли** - SALON_OWNER для CRM, CLIENT для booking
4. **Настроить audience в JWT** - разные audience для разных приложений

---

**🔐 СЛЕДУЯ ЭТОМУ ГАЙДУ, ПРОБЛЕМ С ИНТЕГРАЦИЕЙ НЕ БУДЕТ!** ✅

*Создано по результатам исправления Admin Panel интеграции 2025-08-13*