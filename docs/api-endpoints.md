# 🌐 API Endpoints Documentation

## Base URL
- **Development**: `http://localhost:6020`
- **Production**: `https://api.beauty.designcorp.eu`

All API requests go through the **API Gateway** (port 6020) which proxies to microservices.

## Authentication

### 🔐 Auth Service (`/api/auth`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Register new salon | `{email, password, salonName, phone}` |
| POST | `/api/auth/login` | User login | `{email, password}` |
| POST | `/api/auth/logout` | User logout | - |
| POST | `/api/auth/refresh` | Refresh JWT token | - |
| GET | `/api/auth/me` | Get current user | - |
| POST | `/api/auth/mfa/enable` | Enable 2FA | - |
| POST | `/api/auth/mfa/verify` | Verify 2FA code | `{code}` |
| POST | `/api/auth/mfa/disable` | Disable 2FA | `{code}` |
| POST | `/api/auth/mfa/complete-login` | Complete MFA login | `{code}` |
| GET | `/api/auth/admin/salons` | Get all salons (admin) | - |

## CRM API

### 📅 Appointments (`/api/appointments`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/appointments` | List appointments | `?date=YYYY-MM-DD&staffId=...` |
| GET | `/api/appointments/:id` | Get appointment details | - |
| POST | `/api/appointments` | Create appointment | `{clientId, serviceId, staffId, startAt, endAt}` |
| PUT | `/api/appointments/:id` | Update appointment | `{...fields}` |
| PATCH | `/api/appointments/:id/status` | Update status | `{status}` |
| DELETE | `/api/appointments/:id` | Cancel appointment | - |
| GET | `/api/appointments/calendar` | Calendar view | `?start=...&end=...` |
| POST | `/api/appointments/validate-time` | Check availability | `{staffId, startAt, endAt}` |

### 👥 Clients (`/api/clients`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/clients` | List clients | `?search=...&page=...` |
| GET | `/api/clients/:id` | Get client details | - |
| POST | `/api/clients` | Create client | `{firstName, lastName, email, phone}` |
| PUT | `/api/clients/:id` | Update client | `{...fields}` |
| DELETE | `/api/clients/:id` | Delete client | - |
| GET | `/api/clients/:id/history` | Client appointment history | - |

### 💇 Services (`/api/services`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/services` | List services | `?category=...&active=true` |
| GET | `/api/services/:id` | Get service details | - |
| POST | `/api/services` | Create service | `{name, price, duration, categoryId}` |
| PUT | `/api/services/:id` | Update service | `{...fields}` |
| DELETE | `/api/services/:id` | Delete service | - |
| GET | `/api/services/categories` | List categories | - |

### 👨‍💼 Staff (`/api/staff`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/staff` | List staff members | `?active=true` |
| GET | `/api/staff/:id` | Get staff details | - |
| POST | `/api/staff` | Add staff member | `{firstName, lastName, specialization}` |
| PUT | `/api/staff/:id` | Update staff | `{...fields}` |
| DELETE | `/api/staff/:id` | Remove staff | - |
| GET | `/api/staff/:id/schedule` | Get staff schedule | `?date=YYYY-MM-DD` |
| POST | `/api/staff/:id/schedule` | Set schedule | `{workingHours}` |

## Billing & Payments

### 💳 Subscriptions (`/api/subscriptions`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/subscriptions/me` | Current subscription | - |
| GET | `/api/subscriptions/plans` | Available plans | - |
| POST | `/api/subscriptions/create-subscription` | Subscribe to plan | `{planId, paymentMethodId}` |
| POST | `/api/subscriptions/cancel` | Cancel subscription | - |
| POST | `/api/subscriptions/resume` | Resume subscription | - |
| GET | `/api/subscriptions/invoices` | List invoices | - |
| GET | `/api/subscriptions/invoices/:id` | Download invoice | - |

### 💰 Payments (`/api/payments`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/payments` | List payments | `?status=...&from=...&to=...` |
| GET | `/api/payments/:id` | Payment details | - |
| POST | `/api/payments/create-intent` | Create payment intent | `{amount, currency}` |
| POST | `/api/payments/confirm` | Confirm payment | `{paymentIntentId}` |
| POST | `/api/payments/refund` | Refund payment | `{paymentId, amount}` |
| POST | `/api/payments/webhook/stripe` | Stripe webhook | Raw body |

## Notifications

### 🔔 Notifications (`/api/notifications`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/notifications/me` | User notifications | `?limit=20&unreadOnly=true` |
| GET | `/api/notifications/count` | Unread count | - |
| POST | `/api/notifications/:id/read` | Mark as read | - |
| POST | `/api/notifications/read-all` | Mark all as read | - |
| DELETE | `/api/notifications/:id` | Delete notification | - |
| GET | `/api/notifications/settings/me` | Get settings | - |
| PUT | `/api/notifications/settings/me` | Update settings | `{emailEnabled, smsEnabled}` |

## System & Monitoring

### 📊 Monitoring (`/api/monitoring`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/monitoring/services` | Service health status | - |
| GET | `/api/monitoring/services/:service` | Specific service status | - |
| POST | `/api/monitoring/restart-service` | Restart service | `{service}` |
| POST | `/api/monitoring/stop-service` | Stop service | `{service}` |
| GET | `/api/monitoring/alerts/status` | Alert system status | - |
| POST | `/api/monitoring/test-alert` | Test Telegram alert | - |

### 🔧 Auto-Restore (`/api/auto-restore`)

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/api/auto-restore/status` | System status | - |
| GET | `/api/auto-restore/circuit-breaker-status` | Circuit breaker status | - |
| POST | `/api/auto-restore/reset-circuit-breaker/:service` | Reset breaker | - |
| GET | `/api/auto-restore/alerts` | Get critical alerts | `?limit=50` |
| DELETE | `/api/auto-restore/alerts` | Clear old alerts | `?olderThan=7d` |

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-01-21T10:00:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2025-01-21T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Rate Limiting

- **Default**: 1000 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per minute
- **Payment endpoints**: 100 requests per minute
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Authentication Headers

```http
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_id>
X-Request-ID: <unique_request_id>
```

## CORS Configuration

Allowed origins:
- `http://localhost:*`
- `https://*.beauty.designcorp.eu`
- `https://beauty.designcorp.eu`

---

*Last updated: 2025-01-21*