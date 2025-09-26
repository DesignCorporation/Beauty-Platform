import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import {
  Activity,
  ShieldAlert,
  HeartPulse,
  Wrench,
  ServerCog,
  Database,
  CloudLightning,
  Terminal,
  FileText,
  Radar
} from 'lucide-react';

export const AutoRestoreSection: React.FC = () => {
  const apiEndpointsCode = `// HTTP API (Smart Auto-Restore v3.2 — 19.09.2025)\nGET  /api/auto-restore/status                      // агрегированный статус Smart Manager\nGET  /api/auto-restore/circuit-breaker-status[:id] // анализ попыток за окно 60 мин\nPOST /api/auto-restore/restore/:service            // точечное восстановление\nPOST /api/auto-restore/restore-all                 // { services: string[] }\nGET  /api/auto-restore/logs/:service?              // JSON и readable логи\nGET  /api/auto-restore/alerts                      // .alert файлы критических инцидентов\nDELETE /api/auto-restore/alerts?olderThan=7d       // очистка алертов\nPOST /api/auto-restore/reset-circuit-breaker/:svc  // ручной сброс предохранителя\n\n// Monitoring API (services/api-gateway/src/routes/monitoring.ts)\nPOST /api/monitoring/stop-service                  // безопасный stop → Smart Manager\nPOST /api/monitoring/restart-service               // stop + restore + сбор логов\nGET  /api/monitoring/auto-restore/status           // процессы master/health + PID файлы\nPOST /api/monitoring/auto-restore/toggle           // старт/стоп Gemini master-orchestrator\nGET  /api/monitoring/auto-restore/logs             // master, health, alerts, backup, maintenance\nPOST /api/monitoring/auto-restore/force-check      // запускает test-system.sh (полная диагностика)\nGET  /api/monitoring/auto-restore/quick-status     // быстрый отчёт из dashboard.sh`;

  const cliCommands = `# Рабочие сценарии (выполняем из deployment/auto-restore)\n./smart-restore-manager.sh status\n./smart-restore-manager.sh restore crm-api\n./smart-restore-manager.sh stop salon-crm\n./smart-restore-manager.sh circuit-breaker-status\n./smart-restore-manager.sh reset-circuit-breaker auth-service\n./smart-restore-manager.sh restore-all\n\n# Диагностика и поддержка\n./test-system.sh full              # комплексные проверки master/health + restore-скриптов\n./dashboard.sh                     # TUI для emergency restore и логов\ntail -f /root/beauty-platform/logs/health-monitor.log\ntail -f /root/beauty-platform/logs/master-orchestrator.log`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Smart Auto-Restore System v3.2
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Полностью автоматизированный комплекс восстановления сервисов Beauty Platform. Обновление от 19.09.2025
            синхронизировано с master-orchestrator, Gemini мониторингом и API Gateway.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-2">Текущий статус</h3>
            <ul className="list-disc pl-6 space-y-1 text-emerald-800 text-sm">
              <li>Master orchestrator и health-monitor работают (PID: <code>/var/run/beauty-auto-restore.pid</code>, <code>/var/run/beauty-health-monitor.pid</code>).</li>
              <li>Circuit breaker: максимум 3 попытки восстановления за 60 минут, алерты → <code>logs/auto-restore/alerts/</code> + Telegram.</li>
              <li>Services Monitoring в админке показывает живой статус, журнал алертов и управление предохранителями.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="w-5 h-5 text-indigo-600" />
              Компоненты стека
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <ServerCog className="w-4 h-4 mt-1 text-indigo-500" />
              <div>
                <strong>smart-restore-manager.sh</strong> — ядро восстановления: graceful stop, health-check, circuit breaker, JSON-логирование.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HeartPulse className="w-4 h-4 mt-1 text-pink-500" />
              <div>
                <strong>health-monitor.sh</strong> — проверяет 8 критических сервисов (6020–6027) + фронты 6001–6003 и PostgreSQL раз в 30 сек, триггерит restore после 5 фейлов.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CloudLightning className="w-4 h-4 mt-1 text-amber-500" />
              <div>
                <strong>alert-system.sh</strong> — Telegram, webhook, email, JSON-алерты и ежедневные отчеты.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 mt-1 text-sky-500" />
              <div>
                <strong>dashboard.sh</strong>, <strong>test-system.sh</strong>, <strong>backup-system.sh</strong>, <strong>system-maintenance.sh</strong> — TUI, self-test, регулярные бэкапы (каждые 30 мин) и обслуживание (каждые 6 часов).
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Radar className="w-4 h-4 mt-1 text-purple-500" />
              <div>
                <strong>master-orchestrator.sh</strong> — запускает стек, настраивает cron и мониторит ресурсы (RAM, disk, CPU) с алертами.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Поток восстановления
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <ol className="list-decimal space-y-2 pl-5">
              <li><strong>Мониторинг:</strong> health-monitor фиксирует падение (HTTP, порт и PM2/fallback).</li>
              <li><strong>Диагностика:</strong> smart-restore-manager проверяет директорию, зависимости, конфликтующие процессы, пытается graceful stop.</li>
              <li><strong>Запуск:</strong> стартует соответствующую команду (npm/pnpm/node/systemctl) и ожидает 30 сек до подтверждения здоровья.</li>
              <li><strong>Логирование и алерты:</strong> события пишутся в <code>logs/auto-restore/*</code>, критические случаи создают <code>.alert</code> с инструкцией по reset, плюс Telegram уведомление.</li>
              <li><strong>Взаимодействие с UI:</strong> Admin Panel отображает статус и позволяет вручную запустить restore/reset при необходимости.</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5 text-blue-600" />
            Поддерживаемые сервисы
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Фронтенды</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>admin-panel</strong> (6002) — <code>npm run dev</code></li>
              <li><strong>salon-crm</strong> (6001) — <code>npm run dev</code></li>
              <li><strong>client-portal</strong> (6003) — <code>npm run build && npm start</code></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Бэкенды</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>api-gateway</strong> (6020) — <code>npm start</code> (200/503 = healthy/degraded)</li>
              <li><strong>auth-service</strong> (6021) — TSX сервер с MFA ключом</li>
              <li><strong>crm-api</strong> (6022), <strong>mcp-server</strong> (6025), <strong>images-api</strong> (6026), <strong>backup-service</strong> (6027)</li>
              <li><strong>postgresql</strong> — <code>systemctl start postgresql</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartPulse className="w-5 h-5 text-pink-600" />
            Мониторинг, логи и алерты
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Основные локации</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>logs/auto-restore/</code> — JSON логи по сервисам, <code>smart-restore.log</code>, <code>readable.log</code>.</li>
              <li><code>logs/auto-restore/alerts/*.alert</code> — критические случаи + команды восстановления.</li>
              <li><code>logs/master-orchestrator.log</code>, <code>logs/health-monitor.log</code>, <code>logs/alerts.log</code>, <code>logs/health-alerts.log</code>.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Рассылки и отчёты</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Telegram: реальные алерты через <code>TELEGRAM_BOT_TOKEN</code> / <code>TELEGRAM_CHAT_ID</code>.</li>
              <li>Webhook + email (опционально) через <code>alert-system.sh</code>.</li>
              <li>Ежедневные отчёты: <code>logs/daily-report-YYYYMMDD.txt</code>.</li>
              <li>Health snapshot JSON: <code>logs/health-status-*.json</code> каждые ~90 минут.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-slate-600" />
            API Surface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            REST маршруты живут в <code>services/api-gateway/src/routes/auto-restore.ts</code> и <code>services/api-gateway/src/routes/monitoring.ts</code>,
            используются админкой и MCP.
          </p>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-x-auto">
            <code>{apiEndpointsCode}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="w-5 h-5 text-gray-700" />
            CLI Playbook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>Базовые команды для on-call дежурных. Все скрипты уже исполняемые, запускать из каталога <code>deployment/auto-restore</code>.</p>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-x-auto">
            <code>{cliCommands}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ServerCog className="w-5 h-5 text-teal-600" />
            Интеграция с Admin Panel и MCP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>ServicesMonitoringPage.tsx</strong> — живой статус, restart/stop, auto-restore toggle, просмотр circuit breaker и .alert файлов, запуск force-check.</li>
            <li><strong>Monitoring API</strong> — доступен UI и внешним агентам (Claude/Gemini) для автоматизации и диагностики.</li>
            <li><strong>Codex MCP</strong> транслирует раздел в ресурс <code>beauty://docs/auto-restore</code>, чтобы AI-ассистенты опирались на актуальные данные.</li>
            <li>Любые изменения в скриптах или мониторинге синхронизируем с этим разделом, чтобы сохранить единый источник правды.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
