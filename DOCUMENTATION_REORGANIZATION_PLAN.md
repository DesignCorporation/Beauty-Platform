# 📚 ПЛАН РЕОРГАНИЗАЦИИ ДОКУМЕНТАЦИИ
> **Beauty Platform Documentation Restructuring Plan**

**Дата создания:** 19.09.2025
**Статус:** В разработке
**Ответственный:** Claude Code Assistant

## 🎯 ЦЕЛИ РЕОРГАНИЗАЦИИ

### Основные проблемы:
- ❌ **73 файла** документации разбросаны хаотично
- ❌ **25 файлов в корне** проекта (должно быть 3-4)
- ❌ Дублирование информации и устаревшие файлы
- ❌ Отсутствие навигации и системы

### Цели реорганизации:
- ✅ Логичная **4-уровневая иерархия** документации
- ✅ Единый **навигационный индекс**
- ✅ **Удаление дублей** и устаревших файлов
- ✅ **Стандартизация** форматирования
- ✅ **Улучшенная навигация** между разделами

## 📂 НОВАЯ СТРУКТУРА ДОКУМЕНТАЦИИ

```
beauty-platform/
├── README.md                    # Главная страница проекта
├── CLAUDE.md                    # AI память (сохранить как есть)
├── CHANGELOG.md                 # История изменений (новый)
│
├── docs/                        # 📚 ОСНОВНАЯ ДОКУМЕНТАЦИЯ
│   ├── README.md               # Навигационный индекс
│   │
│   ├── 01-getting-started/     # 🚀 БЫСТРЫЙ СТАРТ
│   │   ├── README.md
│   │   ├── installation.md
│   │   ├── development.md
│   │   └── first-steps.md
│   │
│   ├── 02-architecture/        # 🏗️ АРХИТЕКТУРА
│   │   ├── README.md
│   │   ├── overview.md
│   │   ├── services.md
│   │   ├── database.md
│   │   └── api-gateway.md
│   │
│   ├── 03-development/         # 👨‍💻 РАЗРАБОТКА
│   │   ├── README.md
│   │   ├── coding-standards.md
│   │   ├── testing.md
│   │   ├── debugging.md
│   │   └── contribution.md
│   │
│   ├── 04-deployment/          # 🚀 РАЗВЕРТЫВАНИЕ
│   │   ├── README.md
│   │   ├── production.md
│   │   ├── monitoring.md
│   │   └── backup.md
│   │
│   ├── 05-security/            # 🛡️ БЕЗОПАСНОСТЬ
│   │   ├── README.md
│   │   ├── authentication.md
│   │   ├── authorization.md
│   │   ├── tenant-isolation.md
│   │   └── mfa.md
│   │
│   ├── 06-features/            # ⚡ ФУНКЦИИ
│   │   ├── README.md
│   │   ├── calendar.md
│   │   ├── clients.md
│   │   ├── payments.md
│   │   └── notifications.md
│   │
│   ├── 07-api/                 # 📡 API ДОКУМЕНТАЦИЯ
│   │   ├── README.md
│   │   ├── authentication.md
│   │   ├── appointments.md
│   │   ├── clients.md
│   │   └── services.md
│   │
│   ├── 08-ai-agents/           # 🤖 AI АГЕНТЫ
│   │   ├── README.md
│   │   ├── setup.md
│   │   ├── training.md
│   │   ├── mcp-integration.md
│   │   └── agents-guide.md
│   │
│   ├── 09-business/            # 💼 БИЗНЕС-ЛОГИКА
│   │   ├── README.md
│   │   ├── domain-model.md
│   │   ├── workflows.md
│   │   └── requirements.md
│   │
│   └── 10-troubleshooting/     # 🔧 УСТРАНЕНИЕ ПРОБЛЕМ
│       ├── README.md
│       ├── common-issues.md
│       ├── recovery.md
│       └── faq.md
│
└── archive/                     # 📦 АРХИВ
    ├── legacy-docs/
    ├── session-logs/
    └── deprecated/
```

## 🔄 ПЛАН МИГРАЦИИ

### ФАЗА 1: ПОДГОТОВКА (30 мин)
1. **Создать новую структуру папок**
2. **Создать навигационные README.md** во всех разделах
3. **Создать главный индекс** документации

### ФАЗА 2: ПЕРЕМЕЩЕНИЕ ФАЙЛОВ (60 мин)
1. **Переместить файлы** по новым категориям
2. **Объединить дублирующие** документы
3. **Переименовать файлы** согласно стандартам

### ФАЗА 3: ОЧИСТКА (30 мин)
1. **Удалить устаревшие** файлы
2. **Переместить временные** файлы в архив
3. **Очистить корень** проекта

### ФАЗА 4: СТАНДАРТИЗАЦИЯ (45 мин)
1. **Обновить ссылки** между документами
2. **Стандартизировать форматирование**
3. **Добавить оглавления** в крупные файлы

## 📋 ДЕТАЛЬНЫЙ ПЛАН ПЕРЕМЕЩЕНИЯ

### ФАЙЛЫ ДЛЯ ПЕРЕМЕЩЕНИЯ:

**01-getting-started/**
- `FAST_DEV_ONBOARDING.md` → `installation.md`
- `INSTRUCTIONS_FOR_NEW_DEV.md` → `development.md`
- `AI_QUICK_START.md` → `first-steps.md`

**02-architecture/**
- `docs/TECHNICAL_SPECIFICATIONS.md` → `overview.md`
- `docs/API_GATEWAY_INTEGRATION.md` → `api-gateway.md`
- `docs/GATEWAY_ARCHITECTURE_UPDATE.md` → объединить с `api-gateway.md`

**03-development/**
- `docs/CRM_DEVELOPMENT_PROCESS.md` → `coding-standards.md`
- `docs/AGENT_TRAINING_GUIDE.md` → объединить с AI секцией

**04-deployment/**
- `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` → `production.md`
- `docs/ENTERPRISE_DEPLOYMENT_GUIDE.md` → `production.md`
- `deployment/auto-restore/README.md` → `monitoring.md`

**05-security/**
- `docs/security/` (все файлы) → переместить как есть
- Обновить внутренние ссылки

**06-features/**
- `docs/features/CALENDAR_SYSTEM_DOCUMENTATION.md` → `calendar.md`
- `docs/features/MULTI_STEP_REGISTRATION_IMPROVEMENTS.md` → `clients.md`

**08-ai-agents/**
- `AGENTS.md` → `agents-guide.md`
- `AI_TEAM_STRATEGY.md` → `training.md`
- `MCP_INTEGRATION_STRATEGY.md` → `mcp-integration.md`
- `docs/AI_ASSISTANT_SETUP.md` → `setup.md`

### ФАЙЛЫ ДЛЯ УДАЛЕНИЯ:
```
❌ SESSION_HANDOVER_*.md
❌ CURRENT_SESSION_WORK.md
❌ NEXT_SESSION_TODO.md
❌ AI_MEMORY_UPDATE.md
❌ CURRENT_SYSTEM_STATUS.md
❌ PM2_CLEANUP_REPORT.md
❌ GEMINI_TASK_*.md
```

### ФАЙЛЫ ДЛЯ АРХИВИРОВАНИЯ:
```
📦 docs/archive/sessions/
📦 docs/archive/legacy/
📦 Lending.md → archive/legacy/
```

### ФАЙЛЫ, КОТОРЫЕ НЕ ТРОГАЕМ:
```
🔒 Codex.md - оставить в корне как есть
🔒 CLAUDE.md - оставить в корне как есть
🔒 README.md - оставить в корне как есть
```

## ⏱️ ВРЕМЕННЫЕ РАМКИ

**Общее время:** ~2.5 часа
**Приоритет:** Высокий
**Зависимости:** Нет

### Порядок выполнения:
1. **Создание структуры** (30 мин)
2. **Перемещение ключевых файлов** (60 мин)
3. **Очистка и архивирование** (30 мин)
4. **Обновление ссылок** (45 мин)

## ✅ КРИТЕРИИ УСПЕХА

### После реорганизации:
- ✅ **≤ 5 файлов** в корне проекта
- ✅ **Логичная иерархия** из 10 основных разделов
- ✅ **Единый навигационный индекс** в `docs/README.md`
- ✅ **Все ссылки работают** корректно
- ✅ **Стандартизированное форматирование**
- ✅ **Отсутствие дублей** и устаревших файлов

### Метрики улучшения:
- **Время поиска информации:** сокращение в 3-4 раза
- **Удобство навигации:** единый стиль и структура
- **Поддержка документации:** упрощение обновлений

---

**Status:** Ready for implementation 🚀
**Next Action:** Начать ФАЗУ 1 - создание структуры папок