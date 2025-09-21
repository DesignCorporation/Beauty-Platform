# 🗄️ Database Entity Relationship Diagram

## Overview
Beauty Platform использует PostgreSQL с multi-tenant архитектурой. Каждый салон (tenant) имеет изолированные данные.

## ERD Diagram

```mermaid
erDiagram
    Tenant ||--o{ User : has
    Tenant ||--o{ Salon : owns
    Tenant ||--o{ Client : has
    Tenant ||--o{ Service : offers
    Tenant ||--o{ Staff : employs
    Tenant ||--o{ Appointment : manages
    Tenant ||--o{ Payment : processes
    Tenant ||--o{ Subscription : subscribes

    User ||--o{ Notification : receives
    User ||--o{ NotificationSettings : configures
    User ||--o{ RefreshToken : has
    User ||--|| Staff : "can be"

    Salon ||--o{ WorkingHours : defines
    Salon ||--o{ SalonImage : displays

    Client ||--o{ Appointment : books
    Client ||--o{ Payment : makes

    Service ||--o{ Appointment : "booked for"
    Service }o--|| ServiceCategory : "belongs to"

    Staff ||--o{ Appointment : performs
    Staff ||--o{ StaffSchedule : has
    Staff ||--o{ StaffService : provides

    Appointment ||--o{ Payment : generates
    Appointment ||--|| AppointmentStatus : has

    Subscription ||--o{ Invoice : generates
    Subscription ||--o{ Payment : requires

    Tenant {
        string id PK
        string name
        string domain
        json settings
        datetime createdAt
        datetime updatedAt
    }

    User {
        string id PK
        string tenantId FK
        string email UK
        string password
        string role
        boolean mfaEnabled
        string mfaSecret
        datetime createdAt
    }

    Salon {
        string id PK
        string tenantId FK
        string name
        string address
        string phone
        string email
        json workingHours
        json settings
        datetime createdAt
    }

    Client {
        string id PK
        string tenantId FK
        string firstName
        string lastName
        string email
        string phone
        date birthDate
        json preferences
        datetime lastVisit
        datetime createdAt
    }

    Service {
        string id PK
        string tenantId FK
        string categoryId FK
        string name
        text description
        decimal price
        string currency
        int duration
        boolean active
        datetime createdAt
    }

    Staff {
        string id PK
        string tenantId FK
        string userId FK
        string firstName
        string lastName
        string specialization
        string color
        decimal rating
        boolean active
        datetime createdAt
    }

    Appointment {
        string id PK
        string tenantId FK
        string appointmentNumber UK
        string clientId FK
        string serviceId FK
        string staffId FK
        datetime startAt
        datetime endAt
        string status
        decimal price
        text notes
        datetime createdAt
    }

    Payment {
        string id PK
        string tenantId FK
        string appointmentId FK
        string subscriptionId FK
        string clientId FK
        decimal amount
        string currency
        string status
        string paymentMethod
        json stripeData
        datetime paidAt
        datetime createdAt
    }

    Subscription {
        string id PK
        string tenantId FK
        string plan
        string status
        datetime currentPeriodStart
        datetime currentPeriodEnd
        decimal amount
        string currency
        boolean cancelAtPeriodEnd
        json stripeData
        datetime createdAt
    }

    Invoice {
        string id PK
        string tenantId FK
        string subscriptionId FK
        string invoiceNumber UK
        decimal amount
        string currency
        string status
        datetime dueDate
        string pdfUrl
        datetime createdAt
    }

    Notification {
        string id PK
        string tenantId FK
        string userId FK
        string type
        string title
        text message
        json data
        boolean isRead
        datetime readAt
        datetime createdAt
    }

    NotificationSettings {
        string id PK
        string tenantId FK
        string userId FK
        boolean emailEnabled
        boolean smsEnabled
        boolean pushEnabled
        json emailTypes
        json smsTypes
        datetime updatedAt
    }
```

## Key Relationships

### Multi-Tenant Architecture
- **ВСЕГДА** используется `tenantId` для изоляции данных
- Каждая таблица (кроме системных) содержит `tenantId`
- Доступ через `tenantPrisma(tenantId)` helper

### Core Relationships
1. **Tenant → User**: Один tenant может иметь много пользователей
2. **User → Staff**: Пользователь может быть сотрудником
3. **Client → Appointment → Service/Staff**: Клиент бронирует услугу у мастера
4. **Appointment → Payment**: Запись генерирует платеж
5. **Subscription → Invoice → Payment**: Подписка генерирует счета

### Security Constraints
- Уникальность email в рамках tenant
- Уникальность appointment number глобально
- Cascade delete для зависимых записей
- Soft delete для критических данных (clients, appointments)

## Indexes

### Performance Optimization
```sql
-- Tenant isolation
CREATE INDEX idx_tenant ON all_tables(tenantId);

-- Authentication
CREATE UNIQUE INDEX idx_user_email ON users(tenantId, email);
CREATE INDEX idx_refresh_token ON refresh_tokens(token, userId);

-- Appointments
CREATE INDEX idx_appointment_date ON appointments(tenantId, startAt);
CREATE INDEX idx_appointment_staff ON appointments(tenantId, staffId, startAt);
CREATE INDEX idx_appointment_client ON appointments(tenantId, clientId);

-- Payments
CREATE INDEX idx_payment_status ON payments(tenantId, status, createdAt);
CREATE INDEX idx_payment_stripe ON payments(stripePaymentIntentId);

-- Notifications
CREATE INDEX idx_notification_unread ON notifications(tenantId, userId, isRead);
```

## Migration Strategy

### Prisma Migrations
```bash
# Generate migration
npx prisma migrate dev --name add_feature_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Seed Data
```bash
# Run seed script
npx prisma db seed
```

## Data Types Mapping

| PostgreSQL | Prisma | TypeScript |
|------------|--------|------------|
| UUID | String | string |
| TEXT | String | string |
| DECIMAL | Decimal | number |
| TIMESTAMP | DateTime | Date |
| JSON | Json | any/object |
| BOOLEAN | Boolean | boolean |
| INTEGER | Int | number |

## Best Practices

1. **Always use transactions** for multi-table operations
2. **Implement soft delete** for audit trail
3. **Use UUID** for primary keys
4. **Add indexes** for foreign keys and frequently queried fields
5. **Regular backups** with point-in-time recovery
6. **Monitor query performance** with EXPLAIN ANALYZE

---

*Last updated: 2025-01-21*