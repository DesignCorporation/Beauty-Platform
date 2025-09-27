# Codex — шпаргалка для Codex CLI

*(обновлено: 22.09.2025)*

## Общая картина
- Проект **Beauty Platform**: монорепозиторий `/root/projects/beauty`.
- Фронт (apps):
  - `landing-page` (6000)
  - `salon-crm` (6001)
  - `admin-panel` (6002)
  - `client-booking` (6003)
- Бэкенды (services):
  - `api-gateway` (6020)
  - `auth-service` (6021)
  - `crm-api` (6022)
  - `mcp-server` (6025)
  - `images-api` (6026)
  - `backup-service` (6027)
- MCP-интеграции:
  - `services/codex-mcp` — Codex MCP bridge (stdio) с ресурсами `beauty://*`
  - `beauty-mcp-server` (legacy REST, читает `CLAUDE.md`)
- База: PostgreSQL `beauty_platform_new` с **tenant isolation** через `tenantPrisma(tenantId)`.

## Критические правила
1. Всегда использовать `tenantPrisma(tenantId)` — никаких прямых `prisma.*` без tenant.
2. JWT в httpOnly cookies (`beauty_access_token`, `beauty_refresh_token`), никакого localStorage.
3. UI — компоненты Shadcn/UI.
4. Никакого cross-tenant доступа.

## MCP для Codex (постоянная память)
- Codex CLI автоматически поднимает `services/codex-mcp` (stdio) через запись в `~/.codex/config.toml` — см. секцию `[mcp_servers.beauty-codex]`.
- Codex MCP мост читает файлы и предоставляет ресурсы:
  - `beauty://memory/claude`, `beauty://memory/codex` — актуальные `CLAUDE.md` и `Codex.md`.
  - `beauty://docs/overview` и `beauty://docs/section/{fileName}` — исходники секций документации admin-panel.
  - `beauty://docs/smart-memory`, `beauty://docs/agent-context/{agent}` и `beauty://docs/critical-rules` — обёртка над HTTP MCP (`services/mcp-server` на 6025).
  - `beauty://ui/overview` и `beauty://ui/component/{componentId}` — список и исходники Shadcn/UI компонентов (читаются из `packages/ui/src/components`).
- Код моста: `services/codex-mcp/src/server.ts` (TypeScript + `@modelcontextprotocol/sdk`). Все новые ресурсы добавляем здесь.
- Для динамических данных убедись, что HTTP MCP (`services/mcp-server`, порт 6025) запущен. Если оффлайн — ресурсы вернут предупреждение и позволят продолжить работу в офлайне.
- Проверка подключённых MCP: `codex mcp list`. Чтобы перезапустить только мост: `cd services/codex-mcp && pnpm dev` (живой режим) или `pnpm start` для единичного запуска.
- При обновлении памяти не забывай синхронизировать и `Codex.md`, и `CLAUDE.md` — мост подтянет изменения автоматически (кэш ~60 секунд).

## Dev Orchestrator Migration (27.09.2025)
- Master issue: **#27 Dev Orchestrator Migration - Master Tracking**.
- Активные подзадачи:
  - #21 Remove legacy bash auto-restore — стартовая задача (Stage 1: заглушки + чистка cron).
  - #22 Unified service registry — единый конфиг для gateway/orchestrator/UI.
  - #26 Gateway: prune unused services — отдельный фикс `/health` (должен быть закрыт первым).
- Завершено:
  - #23 Node.js process manager & auto-restore — новый сервис управления процессами (см. Stage 3 summary в `CLAUDE.md`).
  - 26.09.2025 — #24 Orchestrator REST API & health model: реализованы эндпоинты `/orchestrator/status-all`, `/services/:id/actions`, `/logs` + прокси в Gateway, разделение critical/optional.
  - 27.09.2025 — #25 Admin UI monitoring dashboard: обновили `apps/admin-panel/src/pages/ServicesMonitoringPage.tsx` под новый Orchestrator API, добавили кнопки `start/stop/restart/resetCircuit`, просмотр логов (stdout/stderr, 200 строк) и агрегированную сводку; проверено `pnpm --filter admin-panel build`.
- Рабочий протокол:
  - Каждую завершённую подзадачу закрывать с комментарием (что сделано, где PR, какие проверки) и отмечать чекбокс в #27.
  - При обновлении памяти фиксировать статус Stage 1/Stage 2. Текущий статус: **Stage 1 (legacy bash отключаем)**.
  - Временно все `/api/auto-restore/*` маршруты должны возвращать 503 с сообщением «Legacy auto-restore disabled». Admin UI отображает баннер о миграции.
  - Коммиты/PR помечать `fixes #NN` и `refs #27`, чтобы история эпика была связана.

## Аутентификация и токены
- Auth Service (`services/auth-service`) выдаёт JWT c полями `{ userId, tenantId, role, email, type }`.
- CRM API (`services/crm-api`) проверяет токен в middleware `src/middleware/auth.ts`.
  - После исправления 18.09.2025 middleware валидирует JWT и пишет лог в `/root/projects/beauty/logs/crm-api-auth.log`.
  - Лог полезен для проверки, какой `tenantId` реально приходит из фронта.
- Если список сотрудников/клиентов пуст, первое, что проверить — записи в `crm-api-auth.log` и наличие данных в БД для указанного tenant.

## Полезные логи
- `logs/auto-restore/*.log` — результаты скрипта smart-restore.
- `logs/crm-api-auth.log` — расшифрованные JWT (см. выше).
- `logs/auto-restore/readable.log` — общие события авто-восстановления.

## Автовосстановление и мониторинг
- `smart-restore-manager.sh` — центральный восстановитель (скрипты `restore-*.sh` просто делегируют сюда).
- Master orchestrator (`deployment/auto-restore/master-orchestrator.sh`) и health monitor (`health-monitor.sh`) хранят PID в `deployment/auto-restore/run/` и читают `.env`.
- Health monitor проверяет HTTP код; для API Gateway `503` считается «degraded», но засчитывается как успех (остальное — падение).
- ⚠️ Эти bash-скрипты считаются legacy и удаляются в рамках #21. Не добавлять новых зависимостей.
- Telegram-оповещения активированы (`TELEGRAM_BOT_TOKEN=8290990659:...`, `TELEGRAM_CHAT_ID=403608381`, `TELEGRAM_ENABLED=true`). Тест от бота `@Alarmbeauty_bot` уже отправлен.
- Если добавить чат, обновить `.env` и перезапустить orchestrator (`smart-restore-manager.sh restore auth-service` не нужен, достаточно перезапуска master/health).
- Логи: `logs/alerts.log`, `logs/critical-alerts.log`, `logs/health-monitor.log`, `logs/master-orchestrator.out`.
- Команды: `smart-restore-manager.sh status`, `restore <service>`, `restore-all`, `reset-circuit-breaker`.
- Client Portal подключён к auto-restore: `smart-restore-manager.sh restore client-portal` (скрипт `deployment/auto-restore/restore-client-portal.sh`, порт 6003, старт `npm run build && npm start`).
- Health Monitor: curl по IPv4, warmup 15 сек, 5 подряд фейлов, HTTP=000 при открытом порте → assumed healthy (см. `deployment/auto-restore/health-monitor.sh`).
- API Gateway + UI: `/api/monitoring/stop-service` (делегирует smart-restore stop), на странице Services Monitoring добавлены Stop/Restart/Auto-Restore.
- Client Portal обслуживается Smart Restore (`smart-restore-manager.sh restore client-portal`, `logs/restore-client-portal.log`). Старт командой `npm run build && npm start` через порт 6003.
- Salon CRM подключен к auto-restore (`smart-restore-manager.sh restore salon-crm`, логи: `logs/restore-salon-crm.log`, `logs/auto-restore/salon-crm-service.log`).
- Health monitor (`deployment/auto-restore/health-monitor.sh`) теперь шлёт Telegram, работает только по IPv4, ждёт 15 сек перед стартом и требует 5 подряд фейлов (таймаут curl 5/10 с). Временно лучше держать его выключенным до полной стабилизации; запуск: `nohup .../health-monitor.sh >/dev/null 2>&1 &`.
- Manual stop доступен: `smart-restore-manager.sh stop <service>` (использует `safe_stop_service`), в UI красная кнопка обращается к `/api/monitoring/stop-service`.

- **CRM API**: логирование JWT (см. выше). Перезапуск через `smart-restore-manager.sh restore crm-api`.
- **Auth Service**: access-токен 12ч, авто-refresh на фронте (см. CRM). В `.env` TTL тоже обновлён.
- **CRM UI**: обновлены `/team` и `/team/:id` — карточка персонала вынесена в `components/team/TeamMemberCard.tsx`, профиль мастера в `pages/StaffProfilePage.tsx` (вкладки «Обзор / Расписание / Настройки»), поддержка i18n и мультивалюты (`useCurrency`), акценты через `member.color`.

## Контрольный список при старте новой сессии
1. Прочитать `Codex.md` (этот файл) и `CLAUDE.md` для актуального контекста.
2. Проверить свежие логи (особенно `crm-api-auth.log`, `logs/auto-restore/*`).
3. Убедиться, что нужные сервисы running (health-check через `curl http://localhost:6020/health` + smart-restore status) и что HTTP MCP (`http://localhost:6025/health`) отвечает.
4. `codex mcp list` — убедиться, что `beauty-codex` в статусе `configured` (при необходимости перезапусти `pnpm start` в `services/codex-mcp`).
5. При правках не забывать обновлять `Codex.md` — фиксировать новые правила, багфиксы, полезные пути.

## План по обновлению файла
- В конце каждой задачи кратко фиксировать:
  - Что решали / что нашли (коротко).
  - Какие файлы/скрипты оказались полезны.
  - Новые правила или грабли.
- Синхронизировать стиль с пользователем (русский язык, кратко и по делу).

*(Не забыть: этот файл — для ускорения будущих сессий. Всегда дополнять полезной инфой по мере накопления опыта.)*

## Payment Service — краткая памятка (Stage 2–5)
- Порт: 6029, путь сервиса: `services/payment-service`
- Критические правила:
  - Все мутации только через `tenantPrisma(tenantId)`; в вебхуках: `globalPrisma` (read) → resolve tenantId → далее `tenantPrisma`.
  - `/api/*` за `@beauty-platform/shared-middleware` (JWT httpOnly). `/webhooks/*` без auth, только raw body + подписи.
  - Идемпотентность для POST: `/api/payments/intents`, `/api/refunds`, `/api/invoices/:paymentId/email` через заголовок `Idempotency-Key` (TTL 24h).
  - Дедупликация вебхуков по `PaymentEvent.eventId` (unique) — повторы → 200 OK без изменений.
- Эндпоинты:
  - POST `/api/payments/intents` — Stripe/PayPal, live при наличии ключей (fallback иначе).
  - POST `/api/refunds` — возвраты Stripe/PayPal (partial/full), идемпотентность.
  - POST `/api/invoices/:paymentId/generate` — PDF (Puppeteer) в `/tmp/invoices/<paymentId>.pdf` → `{ paymentId,url,size,generatedAt }`.
  - POST `/api/invoices/:paymentId/email` — отправка PDF через Notification Service (6028), автогенерация при отсутствии, идемпотентность.
  - Вебхуки: POST `/webhooks/stripe`, POST `/webhooks/paypal` — подписи/заголовки, dedupe, обновление статусов платежей/рефандов.
- Провайдеры:
  - Stripe: `paymentIntents.create`, `refunds.create`; `webhooks.constructEvent` при `whsec_*`; fallback без ключей.
  - PayPal: `orders.create` и refunds (captures/orders), sandbox/prod detection; заголовки вебхуков; fallback без ключей.
- ENV (минимум):
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`
  - `NOTIFY_SERVICE_URL` (напр. `http://localhost:6028/api/notify/email`), `NOTIFY_TOKEN`
  - `INVOICE_DEFAULT_LOCALE` (ru|en), `DATABASE_URL`, `JWT_SECRET`, `PORT=6029`
- База/Prisma:
  - Таблицы: `payments`, `payment_events`, `refunds`, `idempotency_keys`, `invoice_emails`.
  - В БД snake_case: `tenant_id`, `created_at`, `updated_at`, `provider_id`, `payment_id`, `event_id`, `received_at`, `provider_refund_id`, `request_hash`, `expires_at`, `provider_response`.
  - В `core/database/prisma/schema.prisma` использовать `@map("snake_case")` для всех соответствующих полей (иначе упадёт middleware tenant).
- Операционный чек-лист:
  - Конфликт порта: очистить 6029 — `sudo lsof -ti:6029 | xargs kill -9`; убедиться, что оркестратор не запускает дубликаты.
  - Health: `curl http://localhost:6029/health` → `{"status":"ok"}`.
  - Смоук без ключей: intents (оба провайдера), generate PDF, email (graceful при недоступности 6028), refunds (валидация), идемпотентность (повтор — тот же ответ).
