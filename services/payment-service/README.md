# Payment Service (6029)

## Overview

Express-based microservice providing unified payment processing through multiple providers (Stripe/PayPal), webhook handling, and invoice generation.

**Architecture**:
- Provider-agnostic payment interface
- Secure webhook processing with signature verification
- Multi-tenant authentication via shared-middleware
- In-memory event deduplication (production will use database)

## Endpoints

### Health
- `GET /health` → `{ status: "ok" }`

### API Endpoints (Authenticated)
- `POST /api/payments/intents` → Create payment intent via provider
- `GET /api/payments/:id` → Get payment status
- `POST /api/payments/:id/cancel` → Cancel payment
- `POST /api/refunds` → Create refund
- `POST /api/invoices/:paymentId/generate` → Generate PDF invoice

### Webhook Endpoints (Raw Body)
- `POST /webhooks/stripe` → Stripe webhook events
- `POST /webhooks/paypal` → PayPal webhook events

## Providers

### Supported Payment Providers
- **Stripe**: Credit cards, SEPA, Apple Pay, Google Pay
- **PayPal**: PayPal wallet, PayPal Credit

### Provider Interface
Each provider implements:
- `createIntent({ amount, currency, customerId, metadata })` → Payment intent
- `parseWebhookEvent(rawBody, headers)` → Validated webhook event
- `getPaymentStatus(paymentId)` → Current payment status

### Provider Selection
```javascript
// Auto-delegated based on 'provider' field
POST /api/payments/intents
{
  "amount": 2000,        // Stripe: cents, PayPal: currency units
  "currency": "EUR",
  "provider": "stripe",  // "stripe" | "paypal"
  "metadata": { "orderId": "12345" }
}
```

## Webhooks

### Stripe Webhooks
- **Endpoint**: `POST /webhooks/stripe`
- **Headers**: `Stripe-Signature` (required)
- **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.
- **Verification**: Signature validation against `STRIPE_WEBHOOK_SECRET`

### PayPal Webhooks
- **Endpoint**: `POST /webhooks/paypal`
- **Headers**: `paypal-transmission-id`, `paypal-transmission-sig` (required)
- **Events**: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, etc.
- **Verification**: Signature validation with PayPal certificates

### Event Processing
- **Idempotency**: Duplicate events ignored by event ID
- **Error Handling**: Failed events logged, 500 response for retries
- **Security**: All webhook payloads signature-verified before processing

## Auth & Tenancy

- **Authentication**: `@beauty-platform/shared-middleware` with `strictTenantAuth`
- **Tenant Isolation**: All API endpoints require `x-tenant-id` header
- **JWT Verification**: Uses `JWT_SECRET` for token validation
- **Database Access**: Future implementation will use `tenantPrisma(tenantId)`

## Environment Variables

### Required
```bash
PORT=6029                    # Service port
DATABASE_URL=postgresql://   # PostgreSQL connection
JWT_SECRET=your_jwt_secret   # Shared-middleware auth
```

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_test_... # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_  # Webhook endpoint secret
```

### PayPal Configuration
```bash
PAYPAL_CLIENT_ID=your_client_id    # PayPal app client ID
PAYPAL_SECRET=your_app_secret      # PayPal app secret
PAYPAL_WEBHOOK_ID=your_webhook_id  # PayPal webhook ID
```

### Optional
```bash
INVOICE_STORAGE=local        # Invoice storage: local|s3
# Local invoices stored in: /tmp/invoices/
```

## API Examples

### Create Stripe Payment Intent
```bash
POST /api/payments/intents
Headers: x-tenant-id: salon1, Authorization: Bearer <token>
{
  "amount": 2000,           # €20.00 in cents
  "currency": "EUR",
  "provider": "stripe",
  "customerId": "cus_abc123",
  "metadata": { "appointmentId": "456" }
}

Response:
{
  "id": "pay_stripe_xyz789",
  "provider": "stripe",
  "status": "requires_action",
  "clientSecret": "pay_stripe_xyz789_secret_def456",
  "currency": "EUR",
  "amount": 2000
}
```

### Create PayPal Payment Intent
```bash
POST /api/payments/intents
Headers: x-tenant-id: salon1, Authorization: Bearer <token>
{
  "amount": 20.00,          # €20.00 in currency units
  "currency": "EUR",
  "provider": "paypal"
}

Response:
{
  "id": "pay_paypal_abc123",
  "provider": "paypal",
  "status": "pending",
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "currency": "EUR",
  "amount": 20.00
}
```

### Cancel Payment
```bash
POST /api/payments/pay_stripe_xyz789/cancel
Headers: x-tenant-id: salon1, Authorization: Bearer <token>

Response:
{
  "id": "pay_stripe_xyz789",
  "status": "canceled"
}
```

### Create Refund
```bash
POST /api/refunds
Headers: x-tenant-id: salon1, Authorization: Bearer <token>
{
  "paymentId": "pay_stripe_xyz789",
  "amount": 1000,           # Partial refund €10.00
  "reason": "Customer request"
}

Response:
{
  "id": "re_abc12345",
  "paymentId": "pay_stripe_xyz789",
  "amount": 1000,
  "reason": "Customer request",
  "status": "pending"
}
```

## Run

- **Development**: `npm run dev` (with --watch)
- **Production**: `npm start`

## Implementation Status

✅ **Completed (Stage 2)**:
- Integrated real shared-middleware authentication
- Provider structure (Stripe/PayPal) with unified interface
- Webhook endpoints with raw body processing
- API endpoint provider delegation
- Event deduplication (in-memory)
- Signature verification stubs

🚧 **Next (Stage 3)**:
- Prisma models: payments, payment_events, refunds
- Database-backed idempotency
- Real Stripe/PayPal SDK integration
- PDF invoice generation with Puppeteer

## Notes

- **Security**: Webhook signature verification prevents unauthorized events
- **Scalability**: In-memory deduplication is temporary; production uses database
- **Error Handling**: All endpoints include proper async/await error handling
- **Logging**: Structured logging for webhook events and API operations

## Коммит и push

- Рекомендуемый коммит: `feat(payment): scaffold payment service (Closes #13)`
- Добавить в PR ссылку на Issue #13.

## Следующий шаг

- После пуша я подготовлю минимальный патч для Dev Orchestrator (порт 6029, GET /health) и предложу следующий инкремент: реальная интеграция shared-middleware и заготовки под Stripe/PayPal провайдеры.