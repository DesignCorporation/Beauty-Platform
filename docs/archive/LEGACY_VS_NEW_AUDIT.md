# 🔍 LEGACY vs NEW PROJECT - СИСТЕМНЫЙ АУДИТ

> **Цель**: Сверить старый опыт с новым проектом, создать чек-лист переноса  
> **Подход**: Избежать мусора, оставить только ценное  
> **Результат**: Чистая документация + структурированный план  

---

## 📊 **СРАВНИТЕЛЬНЫЙ АНАЛИЗ**

### 🏗️ **АРХИТЕКТУРА**

| Компонент | Старый проект (/root/beauty) | Новый проект (/root/beauty-platform) | Статус |
|-----------|------------------------------|---------------------------------------|---------|
| **Порты** | 4000 API, 5174 Frontend | 6021 Auth, 6002 Admin, 6001 CRM | ✅ Обновлено |
| **Database** | beauty_crm + beauty_audit | beauty_platform_new | 🔄 Нужно сверить схему |
| **Auth** | JWT в localStorage | JWT в httpOnly cookies | ✅ Улучшено |
| **Архитектура** | Монолит | Microservices + DDD | ✅ Улучшено |
| **Frontend** | React SPA | React + Monorepo | ✅ Улучшено |

### 📋 **ЧТО НУЖНО ПЕРЕНЕСТИ:**

#### ✅ **ГОТОВО В НОВОМ:**
- Auth Service с JWT (улучшенная версия)
- Admin Panel интерфейс
- nginx конфигурация
- Monorepo структура

#### 🔄 **НУЖНО СВЕРИТЬ И АДАПТИРОВАТЬ:**
- Database schema (beauty_crm → beauty_platform_new)
- Audit system (отдельная БД)
- CRM компоненты (календарь, записи)
- UI библиотека (Shadcn/UI vs старая)

#### 📋 **НУЖНО ПЕРЕНЕСТИ:**
- Business logic (appointment numbering, audit trails)
- API endpoints (25+ endpoints)
- UI компоненты (SearchModal, NotificationDropdown)
- Working hours system

---

## 🎯 **ПОШАГОВЫЙ ПЛАН ПЕРЕНОСА**

### **ЭТАП 1: АУДИТ ТЕКУЩЕГО СОСТОЯНИЯ (1-2 часа)**

**1.1 Проверить что уже есть в новом проекте:**
```bash
# Database schema
- Сравнить beauty_platform_new с beauty_crm
- Проверить какие таблицы отсутствуют
- Audit БД beauty_audit существует?

# Auth system  
- JWT implementation готов ✅
- httpOnly cookies работают ✅
- Роли и разрешения настроены?

# Frontend apps
- Admin Panel готов ✅  
- Salon CRM существует?
- Client Booking создан?
```

**1.2 Создать GAP ANALYSIS:**
```markdown
ОТСУТСТВУЕТ В НОВОМ:
[ ] Audit система (отдельная БД)
[ ] CRM Calendar с записями  
[ ] Services management
[ ] Team management
[ ] Working hours system
[ ] Client management
[ ] 25+ API endpoints
[ ] UI компоненты (Search, Notifications)
```

### **ЭТАП 2: ПРИОРИТИЗАЦИЯ ПЕРЕНОСА (30 мин)**

**Критический приоритет (без этого не работает):**
1. Database schema alignment
2. Audit system setup  
3. Basic API endpoints (appointments, clients)
4. CRM Calendar interface

**Высокий приоритет (базовая функциональность):**  
5. Services management
6. Team management
7. Search functionality
8. Working hours

**Средний приоритет (улучшения UX):**
9. UI enhancements (notifications, user menu)
10. Analytics dashboard
11. Advanced features

### **ЭТАП 3: СОЗДАНИЕ MIGRATION CHECKLIST (30 мин)**

**3.1 Database Migration:**
```sql
-- Проверить какие таблицы нужно добавить:
[ ] appointments (с appointment_number логикой)
[ ] clients (с source tracking)
[ ] services (с категориями)
[ ] staff_schedules (рабочие часы мастеров)
[ ] salon_working_hours
[ ] beauty_audit БД (отдельная)
[ ] appointment_audit_log
[ ] audit_settings
```

**3.2 API Endpoints Migration:**
```typescript
// Критические endpoints для переноса:
[ ] GET/POST /api/v1/crm/appointments
[ ] GET/POST /api/v1/crm/clients  
[ ] GET/POST /api/v1/crm/services
[ ] GET/POST /api/v1/crm/staff
[ ] GET/PUT /api/v1/crm/working-hours
[ ] GET /api/v1/crm/audit/logs
[ ] Search endpoints (/search?q=)
[ ] Generate appointment number endpoint
```

**3.3 Frontend Components:**
```tsx
// Компоненты для переноса/создания:
[ ] CalendarGrid (календарь записей)
[ ] AppointmentModal (создание/редактирование)
[ ] SearchModal (полноэкранный поиск) 
[ ] NotificationDropdown
[ ] UserDropdown  
[ ] ServicesPage (управление услугами)
[ ] TeamPage (управление персоналом)
[ ] SettingsPage (с audit logs)
```

---

## 📋 **CHECKLIST ДЛЯ КАЖДОГО КОМПОНЕНТА**

### **ШАБЛОН ДЛЯ MIGRATION:**

```markdown
## [COMPONENT_NAME] Migration

### ✅ Pre-check:
- [ ] Старый компонент существует и работает
- [ ] Новая архитектура поддерживает функцию  
- [ ] Зависимости установлены

### 🔄 Migration steps:
1. [ ] Analyze old implementation
2. [ ] Adapt to new architecture (DDD, TypeScript)
3. [ ] Update for new UI library (Shadcn/UI)
4. [ ] Add proper error handling
5. [ ] Add TypeScript interfaces  
6. [ ] Add tenant isolation (tenantPrisma)
7. [ ] Add audit logging
8. [ ] Test functionality
9. [ ] Update documentation

### ✅ Post-check:
- [ ] Component works in new environment
- [ ] All features preserved  
- [ ] Security requirements met
- [ ] Performance acceptable
- [ ] Documentation updated
```

---

## 🎯 **НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ (СЛЕДУЮЩАЯ СЕССИЯ)**

### **1. СОЗДАТЬ ДЕТАЛЬНЫЙ GAP ANALYSIS (30 мин):**
```bash
# Выполнить команды сравнения:
diff -r /root/beauty/apps/api/src /root/beauty-platform/services/auth-service/src
psql -d beauty_crm -c "\dt" > old_tables.txt  
psql -d beauty_platform_new -c "\dt" > new_tables.txt
diff old_tables.txt new_tables.txt
```

### **2. СОЗДАТЬ MIGRATION PRIORITY LIST (30 мин):**
- Сортировать по критичности
- Оценить трудозатраты на каждый компонент
- Создать временные рамки

### **3. НАЧАТЬ С КРИТИЧНЫХ КОМПОНЕНТОВ (2+ часа):**
- Database schema alignment
- Basic API endpoints  
- CRM Calendar (самый важный компонент)

---

## 📚 **НОВАЯ СТРУКТУРА ДОКУМЕНТАЦИИ**

### **Предлагаю переписать документацию так:**

```
/docs/
├── migration/
│   ├── LEGACY_VS_NEW_AUDIT.md (этот файл)
│   ├── DATABASE_MIGRATION.md
│   ├── API_MIGRATION.md  
│   └── FRONTEND_MIGRATION.md
├── roadmap/
│   ├── CURRENT_ROADMAP.md (актуальная версия)
│   ├── LEGACY_ROADMAP.md (архив старого)
│   └── MIGRATION_PHASES.md
├── implementation/
│   ├── CRM_CALENDAR.md
│   ├── AUDIT_SYSTEM.md
│   ├── SERVICES_MANAGEMENT.md
│   └── TEAM_MANAGEMENT.md
└── reference/
    ├── API_ENDPOINTS.md
    ├── DATABASE_SCHEMA.md
    └── UI_COMPONENTS.md
```

---

## 🎯 **ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ**

### **После полной migration:**
- ✅ Все ценные функции из старого проекта перенесены
- ✅ Улучшенная архитектура (microservices, DDD)  
- ✅ Современные технологии (httpOnly cookies, Shadcn/UI)
- ✅ Чистый код без мусора
- ✅ Полная документация
- ✅ Production-ready система

### **Экономия времени:**
- **~200+ часов** готовой работы из старого проекта
- **~50+ часов** на анализ Fresha CRM  
- **~30+ часов** на troubleshooting (уже решенные проблемы)

**ИТОГО: ~280 часов работы доступны для переноса!** 🚀

---

**💡 ВЫВОД: У нас есть четкий план как системно перенести все ценное без мусора!**