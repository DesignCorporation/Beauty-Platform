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

## Providers

### Stripe Provider (`src/providers/stripeProvider.js`)
- **createIntent({ amount, currency, metadata })**: Creates payment intent, returns `{ id, provider: 'stripe', status: 'requires_action', clientSecret, currency, metadata }`
- **parseWebhookEvent(body, headers)**: Validates `Stripe-Signature` header, returns mock event object
- **Mock Implementation**: No real Stripe SDK integration yet

### PayPal Provider (`src/providers/paypalProvider.js`)
- **createIntent({ amount, currency, metadata })**: Creates payment intent, returns `{ id, provider: 'paypal', status: 'pending', approvalUrl, currency, metadata }`
- **parseWebhookEvent(body, headers)**: Validates `paypal-transmission-id` and `paypal-transmission-sig` headers, returns mock event object
- **Mock Implementation**: No real PayPal SDK integration yet

## Webhooks

### Stripe Webhooks
- **Endpoint**: `POST /webhooks/stripe`
- **Required Headers**: `Stripe-Signature`
- **Processing**: Signature validation → deduplication → event processing
- **Response**: `200 OK` (success/duplicate) or `400 Bad Request` (missing signature)

### PayPal Webhooks
- **Endpoint**: `POST /webhooks/paypal`
- **Required Headers**: `paypal-transmission-id`, `paypal-transmission-sig`
- **Processing**: Header validation → deduplication → event processing
- **Response**: `200 OK` (success/duplicate) or `400 Bad Request` (missing headers)

### Event Deduplication
- **In-Memory Storage**: Uses `Set()` for processed event IDs
- **Idempotency**: Duplicate events return `200 OK` without processing
- **Production Note**: Will be replaced with database-backed deduplication

## Environment Variables

### Required
- `PORT` (default: 6029)
- `JWT_SECRET` - Required for shared-middleware authentication
- `DATABASE_URL` - PostgreSQL connection string (for future Prisma integration)

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Stripe secret key (not used in Stage 2)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret (not used in Stage 2)

### PayPal Configuration
- `PAYPAL_CLIENT_ID` - PayPal app client ID (not used in Stage 2)
- `PAYPAL_SECRET` - PayPal app secret (not used in Stage 2)
- `PAYPAL_WEBHOOK_ID` - PayPal webhook ID (not used in Stage 2)

## API Examples

### Create Stripe Payment Intent
```bash
curl -X POST http://localhost:6029/api/payments/intents \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: TENANT" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"amount":1000,"currency":"EUR","provider":"stripe"}'

Response:
{
  "id": "pay_abc123",
  "provider": "stripe",
  "status": "requires_action",
  "clientSecret": "cs_pay_abc123",
  "currency": "EUR",
  "metadata": null
}
```

### Create PayPal Payment Intent
```bash
curl -X POST http://localhost:6029/api/payments/intents \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: TENANT" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"amount":1000,"currency":"EUR","provider":"paypal"}'

Response:
{
  "id": "pay_xyz789",
  "provider": "paypal",
  "status": "pending",
  "approvalUrl": "https://paypal.test/approve/pay_xyz789",
  "currency": "EUR",
  "metadata": null
}
```

### Stripe Webhook Test
```bash
curl -X POST http://localhost:6029/webhooks/stripe \
  --data-binary '{}' \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test"

Response: 200 OK
```

### PayPal Webhook Test
```bash
curl -X POST http://localhost:6029/webhooks/paypal \
  --data-binary '{}' \
  -H "Content-Type: application/json" \
  -H "PayPal-Transmission-Id: t1" \
  -H "PayPal-Transmission-Sig: s1"

Response: 200 OK
```

## Database Models

### Payment Model
```sql
CREATE TABLE payments (
  id         UUID PRIMARY KEY,
  provider   VARCHAR NOT NULL,           -- 'STRIPE', 'PAYPAL'
  provider_id VARCHAR,                   -- Provider's payment ID
  amount     INTEGER NOT NULL,           -- Amount in cents/units
  currency   VARCHAR NOT NULL,           -- 'EUR', 'USD', 'PLN'
  status     VARCHAR NOT NULL,           -- 'created', 'succeeded', 'failed', etc.
  tenant_id  VARCHAR NOT NULL,           -- Tenant isolation
  customer_id VARCHAR,                   -- Optional customer reference
  metadata   JSONB,                      -- Additional data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### PaymentEvent Model (Webhook Deduplication)
```sql
CREATE TABLE payment_events (
  id         UUID PRIMARY KEY,
  payment_id VARCHAR,                    -- Reference to payment
  provider   VARCHAR NOT NULL,           -- 'stripe', 'paypal'
  event_type VARCHAR NOT NULL,           -- Provider event type
  event_id   VARCHAR UNIQUE NOT NULL,    -- Provider event ID (for deduplication)
  payload    JSONB,                      -- Full webhook payload
  received_at TIMESTAMP DEFAULT NOW()
);
```

### Refund Model
```sql
CREATE TABLE refunds (
  id                 UUID PRIMARY KEY,
  payment_id         VARCHAR NOT NULL,
  amount             INTEGER NOT NULL,      -- Refund amount
  status             VARCHAR NOT NULL,      -- 'pending', 'succeeded', 'failed'
  reason             VARCHAR,              -- Optional refund reason
  provider_refund_id VARCHAR,              -- Provider's refund ID
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);
```

### IdempotencyKey Model (24h TTL)
```sql
CREATE TABLE idempotency_keys (
  key          VARCHAR PRIMARY KEY,      -- Client-provided idempotency key
  tenant_id    VARCHAR NOT NULL,         -- Tenant isolation
  request_hash VARCHAR NOT NULL,         -- SHA256 of request data
  response     JSONB NOT NULL,           -- Cached response
  created_at   TIMESTAMP DEFAULT NOW(),
  expires_at   TIMESTAMP NOT NULL        -- Auto-cleanup after 24h
);
```

## Idempotency System

### How It Works
1. **Client sends `Idempotency-Key` header** with POST requests
2. **System generates request hash** from method + path + stable body
3. **Database check**: If key exists and not expired, return cached response
4. **Process request**: If new, execute normally and cache response with 24h TTL
5. **Conflict detection**: Same key with different request data returns 409

### Usage Example
```bash
curl -X POST http://localhost:6029/api/payments/intents \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment-intent-12345" \
  -H "x-tenant-id: TENANT" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"amount":1000,"currency":"EUR","provider":"stripe"}'

# Repeat with same key -> returns cached response
# Change request data -> returns 409 Conflict
```

### Idempotency Key Requirements
- **Required** for POST `/api/payments/intents` and POST `/api/refunds`
- **Format**: Any string, recommend UUIDs or structured keys
- **TTL**: 24 hours automatic cleanup
- **Scope**: Per-tenant isolation

## Webhook Processing

### Stripe Webhooks
- **Real signature verification** using Stripe SDK
- **Supported events**:
  - `payment_intent.succeeded` → Payment status: 'succeeded'
  - `payment_intent.payment_failed` → Payment status: 'failed'
  - `payment_intent.canceled` → Payment status: 'canceled'
  - `payment_intent.requires_action` → Payment status: 'requires_action'
  - `payment_intent.processing` → Payment status: 'processing'

### PayPal Webhooks
- **Header validation**: transmission-id, transmission-sig format validation
- **Supported events**:
  - `PAYMENT.CAPTURE.COMPLETED` → Payment status: 'succeeded'
  - `PAYMENT.CAPTURE.DENIED` → Payment status: 'failed'
  - `CHECKOUT.ORDER.APPROVED` → Payment status: 'requires_action'
  - `CHECKOUT.ORDER.CANCELLED` → Payment status: 'canceled'

### Event Deduplication
- **Database-backed**: Uses `payment_events` table with unique `event_id`
- **Automatic**: Duplicate events return 200 OK without processing
- **Cross-tenant**: Events processed globally, payments updated per-tenant

## API Changes (Stage 3)

### POST /api/payments/intents
- **Creates Payment record** in database with `status: 'created'`
- **Returns real Payment.id** instead of mock ID
- **Idempotency**: Requires `Idempotency-Key` header
- **Status flow**: created → requires_action/pending → succeeded/failed

### GET /api/payments/:id
- **Reads from database** using `tenantPrisma(tenantId)`
- **Returns 404** if payment not found in tenant
- **Includes**: All payment fields + timestamps

### POST /api/refunds
- **Validates payment exists** and status is 'succeeded'
- **Creates Refund record** with status 'pending'
- **Idempotency**: Requires `Idempotency-Key` header
- **Amount validation**: Cannot exceed original payment amount

## Current Status

✅ **Stage 4 Complete**:
- **PDF Invoice Generation**: Professional PDF invoices using Puppeteer with RU/EN localization
- **Real Stripe SDK Integration**: Live API calls with fallback to mocks when keys unavailable
- **Real PayPal SDK Integration**: Live order creation with approval URLs and error handling
- **Environment-aware Configuration**: Graceful degradation when API keys are placeholders
- **Professional Invoice Templates**: HTML templates with currency formatting and business details
- **Multi-language Support**: Russian and English invoice localization
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **All Stage 3 Features**: Database operations, idempotency, webhooks, tenant isolation

🚧 **Next (Stage 5)**:
- Provider refund API integration
- Advanced webhook event processing (partial captures, refund events)
- Email delivery of PDF invoices
- Recurring payments support

## Stage 4 Features

### PDF Invoice Generation

Generate professional PDF invoices with full localization support:

```bash
POST /api/invoices/:paymentId/generate
Headers: x-tenant-id: salon1, Authorization: Bearer <token>
{
  "locale": "ru",
  "salonInfo": {
    "name": "Beauty Salon Premium",
    "address": "ул. Красная, 15, Москва, 101000",
    "taxNumber": "ИНН 7707123456",
    "email": "info@beautysalon.ru"
  }
}

Response:
{
  "paymentId": "cm123456",
  "url": "/tmp/invoices/cm123456.pdf",
  "size": 25678,
  "status": "generated",
  "generatedAt": "2025-09-24T23:00:00.000Z"
}
```

**Supported Features**:
- ✅ RU/EN localization with currency formatting
- ✅ Professional layout with salon branding
- ✅ Payment status badges and transaction details
- ✅ Automatic currency conversion (cents/units)
- ✅ PDF storage in `/tmp/invoices/` directory

### Real SDK Integration

#### Stripe Live API

When valid `STRIPE_SECRET_KEY` is provided:
```javascript
// Creates real Stripe payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // €20.00 in cents
  currency: 'eur',
  automatic_payment_methods: { enabled: true }
});
```

**Environment Detection**:
- ✅ Detects `sk_test_*` or `sk_live_*` keys
- ✅ Falls back to mocks if placeholder values
- ✅ Real webhook signature verification
- ❌ Mock implementation when keys unavailable

#### PayPal Live API

When valid `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` are provided:
```javascript
// Creates real PayPal order
const order = await paypalClient.execute(new orders.OrdersCreateRequest());
// Returns real approval URL for customer redirect
```

**Environment Detection**:
- ✅ Auto-detects sandbox vs production environment
- ✅ Creates real orders with approval URLs
- ✅ Handles PayPal API responses and errors
- ❌ Mock implementation when credentials unavailable

### Environment Configuration

#### Development with Mock APIs
```bash
STRIPE_SECRET_KEY="sk_test_placeholder"
PAYPAL_CLIENT_ID="placeholder_client_id"
# Result: Mock implementations with console warnings
```

#### Development with Real APIs
```bash
STRIPE_SECRET_KEY="sk_test_51ABC123..."
PAYPAL_CLIENT_ID="AXB123..."
PAYPAL_SECRET="ABC456..."
# Result: Real API calls to sandbox environments
```

#### Production with Real APIs
```bash
NODE_ENV=production
STRIPE_SECRET_KEY="sk_live_51XYZ789..."
PAYPAL_CLIENT_ID="AXB789..."
PAYPAL_SECRET="XYZ123..."
# Result: Real API calls to production environments
```