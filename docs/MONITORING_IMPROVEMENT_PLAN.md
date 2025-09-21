# 📊 ПЛАН УЛУЧШЕНИЯ МОНИТОРИНГА СЕРВИСОВ

## 🚨 ТЕКУЩИЕ ПРОБЛЕМЫ
- Mock данные в production (`mockStatuses`)
- Нет реального API для проверки статусов  
- Кнопки рестарта не работают
- Система автовосстановления работает только локально

## 🔥 ПЛАН МОДЕРНИЗАЦИИ (Context7 best practices)

### 🎯 Quick Wins (1 день):
1. Убрать mock данные - реальные health checks
2. Исправить CORS headers
3. Добавить loading states  
4. Улучшить error handling

### 🎯 Средний срок (неделя):
1. Создать Monitoring API service (порт 6028)
2. PM2 интеграция - реальные кнопки
3. WebSocket real-time updates
4. Auto-restore UI интеграция

### 🎯 Долгосрочно (месяц):
1. Dashy-like modern dashboard
2. Alerts system
3. Historical data + графики
4. Health score система

## 📝 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Real-time Service Status API:
```typescript
const checkServiceHealth = async (service: ServiceConfig) => {
  const startTime = Date.now()
  const response = await fetch(`${service.url}/health`, { timeout: 5000 })
  return {
    name: service.name,
    status: response.ok ? 'online' : 'offline',
    responseTime: Date.now() - startTime,
    uptime: await getServiceUptime(service)
  }
}
```

### PM2 Integration:
```typescript  
const pm2Operations = {
  restart: (name: string) => exec(`pm2 restart ${name}`),
  logs: (name: string) => exec(`pm2 logs ${name} --lines 50`)
}
```

### WebSocket Updates:
- 15-секундные обновления как в Dashy
- Real-time статусы без перезагрузки
- Live метрики и графики

## 🚀 ПРИОРИТЕТ: ПОСЛЕ РЕЛИЗА CRM БЕТА ВЕРСИИ

**Сначала доделываем CRM, потом возвращаемся к мониторингу!**