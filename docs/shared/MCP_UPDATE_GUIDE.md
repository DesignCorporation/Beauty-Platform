# 🔄 MCP UPDATE GUIDE - Как обновляется контекст агентов

> **Цель**: Объяснить как MCP сервер получает актуальную информацию  
> **Дата**: 2025-08-13  

---

## 🧠 **КАК РАБОТАЕТ ОБНОВЛЕНИЕ MCP:**

### **1. 📊 Источники данных:**
```
Админка DocumentationPage.tsx → JSON API → MCP Server → Агенты
```

### **2. 🔄 Автоматическое обновление:**
**СЕЙЧАС (MVP версия):**
- MCP сервер перезапускается = новые данные
- Кэш обновляется каждые 5 минут
- Данные захардкожены в `/services/mcp-server/src/server.ts`

**ПЛАНИРУЕТСЯ (полная версия):**
- Админка изменилась → webhook → MCP обновление
- Git commit → автоматическое обновление контекста
- API endpoints реально работают с админкой

### **3. 🛠️ Как обновить MCP сейчас:**

#### **Способ 1: Перезапуск сервера**
```bash
# Остановить MCP сервер (Ctrl+C)
# Изменить данные в /services/mcp-server/src/server.ts
pnpm --filter mcp-server dev  # Перезапустить
```

#### **Способ 2: Обновить данные в коде**
```typescript
// В файле /services/mcp-server/src/server.ts
// Найти mockData и обновить:

const mockData = {
  sections: [
    {
      id: 'overview',
      title: 'Beauty Platform Overview',
      keyPoints: [
        'Новая информация здесь...',  // ← Обновить
        // ...
      ]
    }
  ]
}
```

#### **Способ 3: Очистить кэш**
```bash
# MCP сервер сам обновит кэш через 5 минут
# Или перезапустить для немедленного обновления
```

---

## 🎯 **ТЕКУЩИЕ ENDPOINT'Ы MCP:**

### **Работающие endpoints:**
```bash
# Контекст для разных агентов
curl http://localhost:6025/mcp/agent-context/backend-dev
curl http://localhost:6025/mcp/agent-context/frontend-dev
curl http://localhost:6025/mcp/agent-context/devops-engineer
curl http://localhost:6025/mcp/agent-context/database-analyst

# Состояние проекта
curl http://localhost:6025/mcp/project-state

# Критические правила
curl http://localhost:6025/mcp/critical-rules

# Health check
curl http://localhost:6025/health
```

### **Что возвращают:**
- **Специализированные инструкции** для каждого типа агента
- **Критические правила безопасности** (tenant isolation и т.д.)
- **Текущее состояние сервисов** (Auth, Admin, MCP работают)
- **Прогресс проекта** (40%)

---

## 🔮 **БУДУЩИЕ УЛУЧШЕНИЯ MCP:**

### **Этап 1: Live API integration (1-2 дня)**
```typescript
// Вместо mockData делать реальные запросы:
const response = await fetch('http://localhost:6002/api/documentation');
const documentation = await response.json();
```

### **Этап 2: Webhook updates (2-3 дня)**  
```bash
# Админка изменилась → POST webhook → MCP обновление
POST /mcp/update-webhook
{
  "trigger": "documentation_changed",
  "section": "architecture",
  "data": {...}
}
```

### **Этап 3: Git integration (3-5 дней)**
```bash
# Git commit → автоматическое обновление MCP
git commit -m "Update docs" → webhook → MCP refresh
```

---

## 💡 **ПРАКТИЧЕСКИЕ СОВЕТЫ:**

### **Для разработчиков:**
1. **Проверяй MCP перед началом работы:**
   ```bash
   curl http://localhost:6025/mcp/agent-context/твоя-роль
   ```

2. **Если данные устарели:**
   ```bash
   # Перезапусти MCP сервер
   # Или подожди 5 минут (автообновление кэша)
   ```

3. **Обновляешь документацию в админке?**
   ```bash
   # Пока нужно вручную обновить MCP данные
   # В будущем будет автоматически
   ```

### **Для продуктового менеджера:**
- MCP сервер показывает актуальное состояние проекта
- Агенты получают правильный контекст для работы
- Система масштабируется по мере роста документации

---

## 🔍 **КАК ПРОВЕРИТЬ ЧТО MCP РАБОТАЕТ:**

### **Тест 1: Базовая проверка**
```bash
curl http://localhost:6025/health
# Должно вернуть: {"status":"ok",...}
```

### **Тест 2: Получение контекста агента**
```bash
curl http://localhost:6025/mcp/agent-context/backend-dev | jq
# Должно вернуть специализированные инструкции
```

### **Тест 3: Состояние проекта**
```bash
curl http://localhost:6025/mcp/project-state | jq
# Должно показать прогресс 40% и активные сервисы
```

### **Тест 4: Критические правила**
```bash
curl http://localhost:6025/mcp/critical-rules | jq
# Должно вернуть правила безопасности (tenantPrisma и т.д.)
```

---

## 📝 **CHANGELOG MCP:**

### **2025-08-13:**
- ✅ Создан MCP сервер на порту 6025
- ✅ Добавлены endpoints для контекста агентов
- ✅ Реализован кэш с TTL 5 минут
- ✅ Протестирована интеграция с агентами

### **Следующие обновления:**
- 📋 Live API integration с админкой
- 📋 Webhook система для автообновления
- 📋 Git hooks для синхронизации

---

**💡 ИТОГ**: MCP сервер работает и обеспечивает агентов актуальным контекстом. Обновление пока ручное, но система готова к автоматизации.