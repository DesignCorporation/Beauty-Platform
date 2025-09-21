import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@beauty-platform/ui'

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Подписка и тарифы</h2>
        <p className="text-muted-foreground">
          Управление подпиской Beauty Platform и выбор тарифного плана
        </p>
      </div>

      <div className="space-y-8">
        {/* Implementation Status */}
        <Card className="beauty-card">
          <CardHeader>
            <CardTitle>✅ Billing компоненты созданы</CardTitle>
            <CardDescription>
              Полная реализация с TypeScript + Zod валидацией
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold">BillingCard.tsx</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Отображение текущего плана подписки</li>
                  <li>• API интеграция GET /api/subscriptions/me</li>
                  <li>• Upgrade кнопки с Stripe интеграцией</li>
                  <li>• Loading states и error handling</li>
                  <li>• Responsive дизайн</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">PlanTable.tsx</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Таблица всех доступных планов</li>
                  <li>• Desktop (4 колонки) и Mobile layouts</li>
                  <li>• Current plan badges и Popular badges</li>
                  <li>• Upgrade highlighting</li>
                  <li>• POST /api/subscriptions/create-subscription</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Типы и схемы:</h4>
              <p className="text-sm text-muted-foreground">
                Comprehensive billing types в `/packages/ui/src/types/billing.ts` с полными Zod схемами
                для runtime валидации, utility functions (formatPrice, formatDate, getStatusBadgeVariant),
                и план детали для TRIAL, BASIC, PRO, ENTERPRISE.
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Следующие шаги:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Решить проблему с импортом в Admin Panel</li>
                <li>• Добавить в CRM для salon owners</li>
                <li>• Интегрировать с Payment Service (6029)</li>
                <li>• Протестировать API endpoints</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}