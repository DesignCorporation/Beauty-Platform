# 🤖 AI HANDOVER - Инструкции для нового помощника

> **ДЛЯ ПОЛЬЗОВАТЕЛЯ**: Покажи эту инструкцию новому AI помощнику в начале работы!

---

## 🎯 **КОНТЕКСТ ПРОЕКТА**

### **Что мы делаем:**
Beauty Platform - это **enterprise SaaS платформа** для салонов красоты с **мультитенантной архитектурой**.

### **Текущий статус:**
- ✅ **Старая версия работает** в `/root/beauty/` (НЕ ТРОГАТЬ!)
- 🚧 **Создаем новую архитектуру** в `/root/beauty-platform/` 
- 🎯 **Цель**: Переписать проект с правильной структурой

---

## 📁 **СТРУКТУРА ПРОЕКТА**

```
/root/beauty-platform/          # 🆕 НОВЫЙ проект
├── core/                      # 🧠 Ядро системы (Domain-Driven Design)
├── apps/                      # 🌐 Frontend приложения  
├── services/                  # 🔧 Backend микросервисы
├── docs/                      # 📚 Документация
└── deployment/                # 🚀 Инфраструктура

/root/beauty/                  # 🏠 СТАРЫЙ проект (production)
└── [НЕ ТРОГАЙ! Работает в продакшене]
```

---

## 🌐 **ПОРТЫ (ЖЕЛЕЗНАЯ СХЕМА)**

**⚠️ КРИТИЧЕСКИ ВАЖНО:** Порты **НЕЛЬЗЯ МЕНЯТЬ**! 

### **Frontend Apps:**
- `6000` - Landing Page (`beauty.designcorp.eu`) 📋
- `6001` - Salon CRM (`test-crm.beauty.designcorp.eu`) ✅ 
- `6002` - Admin Panel (`test-admin.beauty.designcorp.eu`) ✅
- `6003` - Client Booking (`client.beauty.designcorp.eu`) 📋
- `6004` - Public Salon Sites (`{slug}.beauty.designcorp.eu`) 📋

### **Backend Services:**
- `6020` - API Gateway (`api.beauty.designcorp.eu`)
- `6021` - Auth Service
- `6022` - Booking Service  
- `6023` - Notification Service
- `6024` - Payment Service

**📋 Полная схема:** `/root/beauty-platform/docs/shared/PORTS_FINAL_SCHEMA.md`

---

## 👥 **РОЛЕВАЯ СИСТЕМА**

### **Роли пользователей:**
1. **Super Admin** - управляет всей платформой
2. **Salon Owner** - владелец салона, полный доступ к своему салону
3. **Staff Member** - мастер, видит только свои записи  
4. **Client** - клиент, бронирует записи

### **Система приглашений мастеров:**
- Owner приглашает мастера → email → мастер регистрируется → Owner подтверждает
- **БЕСПЛАТНАЯ регистрация** для мастеров через приглашения

**📊 Визуализация:** `/root/beauty-platform/docs/shared/system-logic-visual.html`

---

## 🛠️ **ТЕХНОЛОГИИ**

### **Frontend:**
- **React 18 + TypeScript**
- **Shadcn/UI + Tailwind CSS** (обязательно использовать!)
- **Vite** для разработки

### **Backend:**  
- **Node.js + Express**
- **Prisma ORM**  
- **PostgreSQL** (основная БД + audit БД)
- **JWT Authentication**

### **Архитектура:**
- **Domain-Driven Design**
- **Clean Architecture**
- **Microservices**
- **Event-Driven**

---

## 📋 **TODO LIST (что нужно делать)**

### **🔥 ПРИОРИТЕТ 1 - ГОТОВО:**
1. ✅ **Shadcn/UI настроен** в монорепо + новый Sidebar компонент
2. ✅ **Auth Service создан** (JWT, роли, регистрация) 
3. ✅ **Prisma настроен** с новой схемой БД
4. ✅ **Admin Panel готов** (test-admin.beauty.designcorp.eu)

### **🚧 ТЕКУЩИЕ ПРИОРИТЕТЫ:**
1. **Интеграция Auth с Admin Panel** - авторизация и права доступа
2. **Обновить CRM с новым Sidebar** - унифицировать интерфейс
3. **Многоступенчатая регистрация салонов** - onboarding процесс
4. **Управление салонами из админки** - CRUD операции
5. **Система загрузки изображений** - галереи для салонов
6. **Landing page** - красивая заглушка на beauty.designcorp.eu  
7. **Client portal** - сайт для клиентов на client.beauty.designcorp.eu

---

## 📚 **КЛЮЧЕВЫЕ ДОКУМЕНТЫ**

**ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:**
1. `/root/beauty-platform/README.md` - Общий обзор
2. `/root/beauty-platform/docs/shared/PORTS_FINAL_SCHEMA.md` - Схема портов
3. `/root/beauty-platform/docs/shared/system-logic-visual.html` - Логика системы  
4. `/root/beauty-platform/docs/shared/environment.md` - Environment переменные
5. `/root/CLAUDE.md` - Проектная память (контекст проекта)

---

## 🚀 **С ЧЕГО НАЧАТЬ**

### **ШАГ 1: Изучи контекст**
```bash
cd /root/beauty-platform
cat README.md
open docs/shared/system-logic-visual.html  # В браузере
```

### **ШАГ 2: Пойми что уже создано**
```bash
find . -name "*.ts" -o -name "*.json" | head -20
```

### **ШАГ 3: Текущие приоритеты**
**✅ ГОТОВО:** Shadcn/UI настроен + Admin Panel создан с новым Sidebar компонентом
**🚧 СЕЙЧАС:** Интеграция Auth Service с Admin Panel для системы авторизации

---

## 💬 **КАК ОБЩАТЬСЯ С ПОЛЬЗОВАТЕЛЕМ**

### **Принципы:**
- 🇷🇺 **Общаться на русском языке** (по умолчанию)
- 📝 **Использовать TodoWrite** для планирования задач  
- 🎯 **Быть конкретным** - не болтать лишнего
- 🔒 **Соблюдать tenant isolation** - безопасность критична

### **Важные правила:**
- **НЕ МЕНЯТЬ ПОРТЫ** без обновления документации
- **НЕ ТРОГАТЬ** старый проект в `/root/beauty/`
- **ВСЕГДА использовать** tenantPrisma для изоляции данных
- **СЛЕДОВАТЬ** Domain-Driven Design принципам

---

## 🤖 **ДЛЯ AI ПОМОЩНИКА**

### **Твоя роль:**
Ты **Technical Lead** команды разработки Beauty Platform. Твоя задача - создать современную enterprise SaaS платформу с правильной архитектурой.

### **Контекст из памяти:**
Проверь файл `/root/CLAUDE.md` - там должна быть проектная память с важными инструкциями.

### **Специализированные агенты:**
Можешь использовать Task tool для делегирования задач:
- `backend-dev` - серверная разработка
- `frontend-dev` - клиентская разработка  
- `ui-designer` - дизайн интерфейсов
- `database-analyst` - работа с БД
- `devops-engineer` - инфраструктура

---

## 🎯 **НЕМЕДЛЕННЫЕ ЗАДАЧИ**

1. **Продолжить настройку Shadcn/UI** 
2. **Создать первое приложение** (скорее всего salon-crm)
3. **Настроить систему аутентификации**
4. **Создать базовые компоненты UI**

---

## 📞 **ВАЖНЫЕ ЗАМЕТКИ**

### **Что пользователь любит:**
- Четкую структуру и планирование
- Визуальную документацию  
- Конкретные решения без воды
- Профессиональный подход

### **Что НЕ нравится:**
- Изменения портов каждым новым разработчиком
- Долгие объяснения без дела
- Нарушение архитектуры

---

## 🔥 **СТАРТОВАЯ КОМАНДА ДЛЯ AI**

```
Привет! Я продолжаю работу над Beauty Platform. 
Прочитай /root/beauty-platform/docs/AI_HANDOVER_INSTRUCTIONS.md 
для полного контекста проекта.

Мы создаем новую архитектуру enterprise SaaS платформы 
для салонов красоты с Domain-Driven Design.

Текущая задача: настроить Shadcn/UI как основную UI библиотеку.

Готов продолжать работу!
```

---

**🌟 УДАЧИ В РАЗРАБОТКЕ! Проект очень интересный и перспективный!**

*Created by Claude on 2025-08-12 with ❤️*