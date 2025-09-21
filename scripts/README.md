# 🛠️ Beauty Platform Scripts

## 🤖 AI Agent Scripts

### `ai-onboarding.sh`
**Автоматический онбординг для новых AI агентов**

```bash
# Полный онбординг (3 минуты):
/root/beauty-platform/scripts/ai-onboarding.sh
```

**Что делает:**
1. Показывает AI Quick Start Guide
2. Читает актуальную MCP память
3. Проверяет состояние всех сервисов
4. Показывает доступные роли агентов
5. Предоставляет ссылки на документацию

### `check-system-status.sh`
**Проверка состояния всех критических сервисов**

```bash
# Быстрая проверка системы:
/root/beauty-platform/scripts/check-system-status.sh
```

**Проверяет:**
- ✅ Backend сервисы (6021, 6025, 6026)
- ✅ Frontend приложения (6001, 6002)
- ✅ PostgreSQL подключение
- ✅ Структуру проекта
- ✅ Документацию

**Выводит:**
- 🔴 Красный - критические проблемы
- 🟡 Желтый - предупреждения
- 🟢 Зеленый - все работает

## 🚀 Использование

### Для новых AI агентов:
```bash
# 1. Быстрый старт:
/root/beauty-platform/scripts/ai-onboarding.sh

# 2. Определи свою роль:
curl -s http://localhost:6025/memory/agents/backend-dev
curl -s http://localhost:6025/memory/agents/frontend-dev
# и т.д.

# 3. Начинай работу следуя AI_QUICK_START.md
```

### Для диагностики проблем:
```bash
# Проверка системы:
/root/beauty-platform/scripts/check-system-status.sh

# Если что-то не работает, смотри рекомендации в выводе
```

## 📝 Требования

- Bash 4.0+
- curl
- lsof
- PostgreSQL client (psql)
- Node.js процессы на портах 6021, 6025, 6026

## 🔧 Установка

Скрипты уже настроены и готовы к использованию:

```bash
# Права уже выставлены, но на всякий случай:
chmod +x /root/beauty-platform/scripts/*.sh
```

## 💡 Интеграция

Эти скрипты интегрированы в:
- `AI_QUICK_START.md` - ссылки на автоматизацию
- `CLAUDE.md` - команды быстрого старта
- MCP Server - автоматические проверки

---

**Создано**: Beauty Platform Development Team  
**Обновлено**: 2025-08-16