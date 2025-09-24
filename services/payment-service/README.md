# Payment Service (6029)

## Overview

- Express-based microservice providing payment intents, status queries, and invoice generation.
- Providers: placeholder for Stripe/PayPal (mocked in scaffold).
- Health endpoint for orchestrator.

## Endpoints

- `GET /health` → `{ status: "ok" }`
- `POST /api/payments/intents` body: `{ amount, currency, provider, metadata? }` → mock: `{ id, status, provider, clientSecret?|approvalUrl?, currency }`
- `GET /api/payments/:id` → mock payment payload
- `POST /api/invoices/:paymentId/generate` → mock: `{ url: "/tmp/invoices/<id>.pdf" }`

## Auth & Tenancy

- Uses shared-middleware strictTenantAuth under `/api/*` (scaffold uses a lightweight mock). Expect tenant via `x-tenant-id` header for local dev.
- Real implementation must use `tenantPrisma(tenantId)` for all DB access.

## Environment

- `PORT` (default: 6029)
- `DATABASE_URL` (PostgreSQL)
- `JWT_SECRET` (for shared-middleware)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`
- `INVOICE_STORAGE` (local|s3) — start with local
- Local invoices: `/tmp/invoices/`

## Run

- Dev: `npm run dev`
- Start: `npm start`

## Notes

- Webhook routes must use raw body middleware only on `/webhooks/*`.
- All `/api/*` routes behind strict tenant auth.

## Коммит и push

- Рекомендуемый коммит: `feat(payment): scaffold payment service (Closes #13)`
- Добавить в PR ссылку на Issue #13.

## Следующий шаг

- После пуша я подготовлю минимальный патч для Dev Orchestrator (порт 6029, GET /health) и предложу следующий инкремент: реальная интеграция shared-middleware и заготовки под Stripe/PayPal провайдеры.