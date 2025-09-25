# Payment Service - Stage 5: Email Delivery

Beauty Platform Payment Service с интеграцией email delivery через Notification Service (6028).

## 🚀 Quick Start

```bash
# Установить зависимости
pnpm install

# Настроить переменные окружения
cp .env.example .env
# Отредактировать DATABASE_URL и другие настройки

# Запустить в dev режиме
pnpm dev

# Генерировать Prisma клиент
pnpm prisma:generate

# Запустить миграции
pnpm prisma:migrate
```

## 📧 Email Delivery Integration

### Environment Variables

```env
# Email Integration
NOTIFY_SERVICE_URL="http://localhost:6028"        # Notification Service URL
NOTIFY_TOKEN=""                                    # Bearer token (опционально)
INVOICE_DEFAULT_LOCALE="ru"                       # Локаль по умолчанию (ru|en)
```

### API Endpoints

#### 1. Send Invoice Email

**Endpoint:** `POST /api/invoices/:paymentId/email`
**Headers:**
- `x-tenant-id` (required) - Tenant ID для изоляции данных
- `Idempotency-Key` (required) - Уникальный ключ для предотвращения дублирования

**Request Body:**
```json
{
  "to": "customer@example.com",
  "locale": "ru",                    // Optional: ru|en (default: ru)
  "subject": "Custom Subject"        // Optional: auto-generated if not provided
}
```

**Response (200 - Email Sent):**
```json
{
  "emailId": "email_abc123...",
  "paymentId": "payment_xyz456...",
  "to": "customer@example.com",
  "subject": "Счет-фактура №PDF-123",
  "locale": "ru",
  "status": "sent",
  "queued": true,
  "timestamp": "2025-09-25T07:00:00.000Z"
}
```

**Response (202 - Email Queued):**
```json
{
  "emailId": "email_abc123...",
  "paymentId": "payment_xyz456...",
  "to": "customer@example.com",
  "subject": "Счет-фактура №PDF-123",
  "locale": "ru",
  "status": "queued",
  "queued": true,
  "timestamp": "2025-09-25T07:00:00.000Z"
}
```

**Response (202 - Service Unavailable):**
```json
{
  "emailId": "email_abc123...",
  "paymentId": "payment_xyz456...",
  "to": "customer@example.com",
  "subject": "Счет-фактура №PDF-123",
  "locale": "ru",
  "status": "failed",
  "queued": false,
  "reason": "notification_service_unavailable",
  "message": "Email queued but notification service is currently unavailable",
  "timestamp": "2025-09-25T07:00:00.000Z"
}
```

#### 2. Check Email Status

**Endpoint:** `GET /api/invoices/:paymentId/email/:emailId`
**Headers:**
- `x-tenant-id` (required)

**Response:**
```json
{
  "id": "email_abc123...",
  "paymentId": "payment_xyz456...",
  "to": "customer@example.com",
  "subject": "Счет-фактура №PDF-123",
  "locale": "ru",
  "status": "sent",
  "sentAt": "2025-09-25T07:00:00.000Z",
  "createdAt": "2025-09-25T07:00:00.000Z",
  "providerResponse": {
    "success": true,
    "emailId": "notify_service_email_id",
    "status": "sent"
  }
}
```

## 📋 Usage Examples

### 1. Send Invoice Email (Russian)

```bash
curl -X POST "http://localhost:6029/api/invoices/payment_123/email" \\
  -H "x-tenant-id: your_tenant_id" \\
  -H "Idempotency-Key: unique_key_123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "customer@example.com",
    "locale": "ru"
  }'
```

### 2. Send Invoice Email (English with Custom Subject)

```bash
curl -X POST "http://localhost:6029/api/invoices/payment_123/email" \\
  -H "x-tenant-id: your_tenant_id" \\
  -H "Idempotency-Key: unique_key_456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "customer@example.com",
    "locale": "en",
    "subject": "Your Beauty Salon Invoice #123"
  }'
```

### 3. Check Email Status

```bash
curl -X GET "http://localhost:6029/api/invoices/payment_123/email/email_abc123" \\
  -H "x-tenant-id: your_tenant_id"
```

### 4. Idempotency Test (Same Request)

```bash
# Первый запрос - создает email
curl -X POST "http://localhost:6029/api/invoices/payment_123/email" \\
  -H "x-tenant-id: your_tenant_id" \\
  -H "Idempotency-Key: same_key_789" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "customer@example.com"}'

# Второй запрос с тем же ключом - возвращает cached ответ
curl -X POST "http://localhost:6029/api/invoices/payment_123/email" \\
  -H "x-tenant-id: your_tenant_id" \\
  -H "Idempotency-Key: same_key_789" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "customer@example.com"}'
```

## 🔧 Email Content Templates

### Russian (default)
- **Subject:** `Счет-фактура №{paymentId_last8}`
- **HTML Content:** Русский template с суммой, датой, деталями платежа
- **Currency Format:** Intl.NumberFormat('ru-RU', {style: 'currency'})

### English
- **Subject:** `Invoice #{paymentId_last8}`
- **HTML Content:** English template with amount, date, payment details
- **Currency Format:** Intl.NumberFormat('en-US', {style: 'currency'})

## 📊 Features

✅ **Mandatory Idempotency:** Предотвращение дублирования через Idempotency-Key
✅ **Auto PDF Generation:** Автоматическая генерация PDF если отсутствует
✅ **Graceful Fallback:** 202 ответ при недоступности Notification Service
✅ **Multi-language:** Русский/English контент и форматирование
✅ **Tenant Isolation:** Полная изоляция данных между tenant'ами
✅ **Request Hash Validation:** Проверка конфликтов idempotency ключей
✅ **24h TTL Cache:** Автоматическая очистка кэша idempotency

## 🗃️ Database Models

### InvoiceEmail
```prisma
model InvoiceEmail {
  id               String    @id @default(cuid())
  tenantId         String
  paymentId        String
  to               String
  subject          String
  locale           String    @default("ru")
  status           String    @default("queued")
  providerResponse Json?
  sentAt           DateTime?
  metadata         Json?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@map("invoice_emails")
}
```

### IdempotencyKey (shared)
```prisma
model IdempotencyKey {
  id          String   @id @default(cuid())
  key         String
  tenantId    String
  requestHash String
  response    Json
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@unique([key, tenantId])
  @@map("idempotency_keys")
}
```

## ⚠️ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `MISSING_TENANT_ID` | 400 | x-tenant-id header отсутствует |
| `MISSING_IDEMPOTENCY_KEY` | 400 | Idempotency-Key header отсутствует |
| `VALIDATION_ERROR` | 400 | Невалидное body запроса |
| `IDEMPOTENCY_CONFLICT` | 409 | Конфликт idempotency key с другим запросом |
| `PAYMENT_NOT_FOUND` | 404 | Payment не найден |
| `PDF_GENERATION_FAILED` | 500 | Ошибка генерации PDF |
| `EMAIL_PROCESSING_FAILED` | 500 | Общая ошибка обработки email |

## 🔗 Integration with Notification Service

Payment Service интегрируется с Notification Service (port 6028) для отправки email:

**URL:** `${NOTIFY_SERVICE_URL}/api/notify/email`
**Method:** POST
**Headers:** Authorization: Bearer ${NOTIFY_TOKEN} (если настроен)

**Payload:**
```json
{
  "to": "customer@example.com",
  "subject": "Invoice #123",
  "html": "<h2>Invoice</h2><p>Amount: €20.00</p>...",
  "text": "Invoice\\nAmount: €20.00\\n...",
  "attachments": [{
    "filename": "invoice-123.pdf",
    "path": "/tmp/invoices/payment_id.pdf"
  }]
}
```

## 🧪 Stage 5 Implementation Notes

- **Mock PDF Generation:** Создает валидный PDF файл с базовой информацией
- **Simulated Email:** Notification Service логирует отправку без реального SMTP
- **Production Ready:** Архитектура готова для реального email провайдера
- **TODO:** Добавить puppeteer для полноценной PDF генерации
- **TODO:** Настроить реальный SMTP провайдер в Notification Service

---

**Current Status:** Stage 5 - Email delivery integration (60% complete)
**Next Milestone:** Documentation completion & final testing