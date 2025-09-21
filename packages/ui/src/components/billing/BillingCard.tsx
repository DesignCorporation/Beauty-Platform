import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, CreditCard, ArrowRight, AlertCircle } from 'lucide-react'
import {
  Subscription,
  SubscriptionResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  SubscriptionPlan,
  PLAN_DETAILS,
  getStatusBadgeVariant,
  getStatusText,
  formatDate,
  formatPrice,
  canUpgradeTo,
  isTrialExpiringSoon
} from '../../types/billing'
import { cn } from '../../lib/utils'

interface BillingCardProps {
  className?: string
  apiBaseUrl?: string
  onUpgradeClick?: (plan: SubscriptionPlan) => void
}

export function BillingCard({
  className,
  apiBaseUrl = '/api/subscriptions',
  onUpgradeClick
}: BillingCardProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState<SubscriptionPlan | null>(null)

  // Загрузка текущей подписки
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${apiBaseUrl}/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data: SubscriptionResponse = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch subscription')
        }

        setSubscription(data.subscription)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        console.error('Failed to fetch subscription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [apiBaseUrl])

  // Обработка upgrade подписки
  const handleUpgrade = async (targetPlan: SubscriptionPlan) => {
    try {
      setUpgradeLoading(targetPlan)
      setError(null)

      // Внешний обработчик
      if (onUpgradeClick) {
        onUpgradeClick(targetPlan)
        return
      }

      // Стандартный API запрос
      const requestData: CreateSubscriptionRequest = {
        plan: targetPlan,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/cancel`
      }

      const response = await fetch(`${apiBaseUrl}/create-subscription`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: CreateSubscriptionResponse = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to create subscription')
      }

      // Redirect к Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Failed to upgrade subscription:', err)
    } finally {
      setUpgradeLoading(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <Card className={cn("beauty-card", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Загрузка подписки...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("beauty-card", className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки подписки: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // No subscription state
  if (!subscription) {
    return (
      <Card className={cn("beauty-card", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Подписка</span>
          </CardTitle>
          <CardDescription>
            У вас нет активной подписки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button
              onClick={() => handleUpgrade('BASIC')}
              disabled={upgradeLoading !== null}
              className="w-full"
            >
              {upgradeLoading === 'BASIC' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Выбрать план Basic
            </Button>
            <Button
              onClick={() => handleUpgrade('PRO')}
              disabled={upgradeLoading !== null}
              variant="default"
              className="w-full"
            >
              {upgradeLoading === 'PRO' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Выбрать план Pro
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentPlan = PLAN_DETAILS[subscription.plan as SubscriptionPlan]
  const isTrialExpiring = isTrialExpiringSoon(subscription)

  return (
    <Card className={cn("beauty-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Текущий план</span>
          </div>
          <Badge variant={getStatusBadgeVariant(subscription.status)}>
            {getStatusText(subscription.status)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Управление подпиской Beauty Platform
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Plan Info */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
            <span className="text-2xl font-bold">
              {formatPrice(currentPlan.price)}/мес
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {currentPlan.description}
          </p>

          {/* Subscription Details */}
          <div className="space-y-1 text-sm">
            {subscription.trialEndsAt && subscription.status === 'TRIAL' && (
              <div className="flex justify-between">
                <span>Пробный период до:</span>
                <span className={isTrialExpiring ? 'text-orange-600 font-medium' : ''}>
                  {formatDate(subscription.trialEndsAt)}
                </span>
              </div>
            )}
            {subscription.currentPeriodEnd && subscription.status === 'ACTIVE' && (
              <div className="flex justify-between">
                <span>Следующий платеж:</span>
                <span>{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Trial Expiring Warning */}
        {isTrialExpiring && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ваш пробный период заканчивается скоро. Выберите план для продолжения работы.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade Buttons */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Доступные обновления:
          </div>

          {(['BASIC', 'PRO', 'ENTERPRISE'] as SubscriptionPlan[])
            .filter(plan => canUpgradeTo(subscription.plan, plan))
            .map((plan) => {
              const planDetails = PLAN_DETAILS[plan]
              const isLoading = upgradeLoading === plan

              return (
                <Button
                  key={plan}
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgradeLoading !== null}
                  variant={plan === 'PRO' ? 'default' : 'outline'}
                  className="w-full justify-between"
                >
                  <div className="flex items-center space-x-2">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Перейти на {planDetails.name}</span>
                    {planDetails.popular && (
                      <Badge variant="secondary" className="text-xs">
                        Популярный
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">
                      {formatPrice(planDetails.price)}/мес
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>
              )
            })}
        </div>

        {/* No Upgrades Available */}
        {['BASIC', 'PRO', 'ENTERPRISE'].every(plan => !canUpgradeTo(subscription.plan, plan as SubscriptionPlan)) && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              У вас максимальный план. Спасибо за доверие! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}