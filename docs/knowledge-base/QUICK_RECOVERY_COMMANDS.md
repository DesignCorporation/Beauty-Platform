# ⚡ БЫСТРОЕ ВОССТАНОВЛЕНИЕ - КОМАНДЫ НА СЛУЧАЙ ПРОБЛЕМ

## 🚨 **ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ (30 секунд):**

```bash
# ЕСЛИ АДМИНКА СЛОМАЛАСЬ - БЫСТРЫЙ ОТКАТ:
sudo nano /etc/nginx/sites-enabled/test-admin.beauty.designcorp.eu

# Найти строку (около 31):
location /api/auth/ {
    proxy_pass http://127.0.0.1:6020/;  # ← Gateway

# Заменить на:
location /api/auth/ {
    proxy_pass http://127.0.0.1:6021/auth/;  # ← Прямое соединение

# Применить:
sudo systemctl reload nginx

# РЕЗУЛЬТАТ: Админка будет работать через 10 секунд ✅
```

---

## 📊 **ПРОВЕРКА СТАТУСА СИСТЕМЫ:**

```bash
# 1. Все сервисы запущены?
pm2 list | grep beauty

# 2. Админка отвечает?  
curl -s -o /dev/null -w '%{http_code}' https://test-admin.beauty.designcorp.eu
# Должно быть: 200

# 3. API работает?
curl -s https://test-admin.beauty.designcorp.eu/api/auth/me
# Должно быть: {"success":false,"error":"NO_TOKEN",...}

# 4. Gateway живой?
curl -s http://localhost:6020/info
# Должно быть: {"name":"Beauty Platform API Gateway",...}
```

---

## 🔧 **КОМАНДЫ ДЛЯ ПРОДОЛЖЕНИЯ РАБОТЫ:**

### **Начать сессию:**
```bash
cd /root/beauty-platform
cat /root/GATEWAY_COMPLETE_DOCUMENTATION.md  # Прочитать состояние
```

### **Тестировать проблему:**
```bash
# POST timeout (проблема):
timeout 10 curl -v -X POST http://localhost:6020/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'

# Логи Gateway:
pm2 logs beauty-api-gateway --lines 10
```

### **Исправлять Gateway:**
```bash
cd /root/beauty-platform/services/api-gateway
nano src/routes/proxy.ts  # Исправить handleProxyResponse
pm2 restart beauty-api-gateway
```

---

## 📂 **ВАЖНЫЕ ФАЙЛЫ:**

```bash
# Документация:
/root/GATEWAY_COMPLETE_DOCUMENTATION.md    ← ГЛАВНЫЙ ФАЙЛ

# Код:
/root/beauty-platform/services/api-gateway/src/routes/proxy.ts  ← Исправлять здесь
/etc/nginx/sites-enabled/test-admin.beauty.designcorp.eu       ← Переключение архитектур

# Логи:
pm2 logs beauty-api-gateway
/var/log/nginx/test-admin.beauty.designcorp.eu.error.log
```

---

## ⚠️ **ПРАВИЛА БЕЗОПАСНОСТИ:**

1. **НИКОГДА не трогай рабочую админку без плана отката**
2. **ВСЕГДА тестируй Gateway на localhost:6020 сначала** 
3. **ДЕРЖИ готовую команду отката в терминале**
4. **ДЕЛАЙ бэкапы nginx конфига перед изменениями**

```bash
# Бэкап nginx:
sudo cp /etc/nginx/sites-enabled/test-admin.beauty.designcorp.eu \
       /etc/nginx/sites-enabled/test-admin.beauty.designcorp.eu.backup
```

---

**🎯 ЦЕЛЬ: Исправить POST timeout в Gateway за 30 минут**  
**📋 ПЛАН: Диагностика → Исправление → Тестирование → Переключение**