# ⚡ БЫСТРОЕ ВОССТАНОВЛЕНИЕ СИСТЕМЫ

## 🚨 EMERGENCY RECOVERY CHECKLIST

### 1. Проверка статуса всех сервисов (30 сек)
```bash
curl -s http://localhost:6020/api/monitoring/metrics-structured | jq '.data.summary'
```
**Ожидаемый результат:** `"totalServices": 10, "onlineServices": 10`

### 2. Auto-Restore всех упавших сервисов (2-5 мин)
```bash
/root/beauty-platform/deployment/auto-restore/smart-restore-manager.sh status
/root/beauty-platform/deployment/auto-restore/smart-restore-manager.sh restore all
```

### 3. Ручной запуск критичных сервисов
#### API Gateway (если красный):
```bash
cd /root/beauty-platform/services/api-gateway
npm run build && node dist/server.js &
```

#### Admin Panel (если недоступен):
```bash
cd /root/beauty-platform/apps/admin-panel
npm run dev &
```

#### Auth Service (если красный):
```bash
cd /root/beauty-platform/services/auth-service
MFA_MASTER_KEY=49dd29bc186073af4bdb05f6fd074317a6045409f1ef540696ed05ad09b38c1b npx tsx src/server.ts &
```

### 4. Проверка nginx (если 502 ошибки)
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Проверка базы данных (если ошибки подключения)
```bash
sudo systemctl status postgresql
PGPASSWORD=secure_password psql -h localhost -p 6100 -U beauty_platform_user -d beauty_platform_new -c "SELECT COUNT(*) FROM users;"
```

---

## 📊 КОНТРОЛЬНЫЕ ТОЧКИ

### ✅ Система ЗДОРОВА если:
- `/api/monitoring/metrics-structured` возвращает 200
- `"onlineServices": 10` 
- Admin Panel доступен на https://test-admin.beauty.designcorp.eu
- CRM доступен на https://test-crm.beauty.designcorp.eu

### ❌ Требует внимания если:
- API Gateway показывает "degraded" 
- Любой сервис показывает статус "offline"
- 502/503 ошибки в браузере
- Auto-Restore не может восстановить сервис

---

## 🔧 ЧАСТЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### Images API падает при Auto-Restore
**Причина:** Зависимости не установлены  
**Решение:** Проверить что в smart-restore-manager.sh убрано исключение images-api

### MCP Server не запускается
**Причина:** Неправильная команда запуска  
**Решение:** Использовать `npm run dev` вместо `node src/server.js`

### API Gateway показывает degraded
**Причина:** Один из backend сервисов недоступен  
**Решение:** Проверить все порты 6021, 6022, 6025, 6026, 6027

### PostgreSQL не отвечает
**Причина:** Служба остановлена или порт изменён  
**Решение:** `sudo systemctl start postgresql` и проверить порт 6100

---

## 📱 КОНТАКТЫ ЭКСТРЕННОГО ВОССТАНОВЛЕНИЯ

- **Документация:** `/root/beauty-platform/docs/SYSTEM_STABILIZATION_LOG_2025-09-11.md`
- **Auto-Restore:** `/root/beauty-platform/deployment/auto-restore/`
- **Logs:** `/var/log/nginx/` и вывод сервисов в терминале
- **Admin Panel:** https://test-admin.beauty.designcorp.eu (admin@beauty-platform.com / admin123)