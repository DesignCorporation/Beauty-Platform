import { z } from 'zod';

// 🏷️ Базовые типы
export type SubscriptionPlan = 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'PAUSED';

// 📊 Zod схемы для runtime валидации
export const SubscriptionPlanSchema = z.enum(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']);
export const SubscriptionStatusSchema = z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'PAST_DUE', 'PAUSED']);

export const SubscriptionSchema = z.object({
  id: z.string(),
  plan: SubscriptionPlanSchema,
  status: SubscriptionStatusSchema,
  currentPeriodStart: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
  trialEndsAt: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const SubscriptionResponseSchema = z.object({
  subscription: SubscriptionSchema.nullable(),
  success: z.boolean(),
  message: z.string().optional(),
});

export const CreateSubscriptionRequestSchema = z.object({
  plan: SubscriptionPlanSchema,
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export const CreateSubscriptionResponseSchema = z.object({
  url: z.string(),
  sessionId: z.string().optional(),
  subscriptionId: z.string().optional(),
  success: z.boolean(),
  message: z.string().optional(),
});

// 🎨 TypeScript интерфейсы (инferred от Zod схем)
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;
export type CreateSubscriptionResponse = z.infer<typeof CreateSubscriptionResponseSchema>;

// 💰 План интерфейс
export interface Plan {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  currency: string;
  popular?: boolean;
  features: string[];
}

// 📋 Константы планов
export const PLAN_DETAILS: Record<SubscriptionPlan, Plan> = {
  TRIAL: {
    id: 'TRIAL',
    name: 'Trial',
    description: '14-дневный пробный период',
    price: 0,
    currency: 'EUR',
    features: ['Все функции', 'Без ограничений', '14 дней бесплатно']
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    description: 'Идеально для небольших салонов',
    price: 30,
    currency: 'EUR',
    features: [
      'До 3 мастеров',
      'Онлайн-запись',
      'CRM клиентов (до 500)',
      'Базовая аналитика',
      'Email поддержка'
    ]
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    description: 'Для растущих салонов',
    price: 75,
    currency: 'EUR',
    popular: true,
    features: [
      'До 10 мастеров',
      'Все функции Basic',
      'SMS уведомления',
      'ИИ-аналитика',
      'Мобильное приложение',
      'Приоритетная поддержка'
    ]
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Для крупных салонов и сетей',
    price: 150,
    currency: 'EUR',
    features: [
      'Безлимит мастеров',
      'Все функции Pro',
      'Мультифилиальность',
      'API доступ',
      'Персональный менеджер',
      'SLA 99.9%'
    ]
  }
};

// 🎨 Утилиты для UI
export const getStatusBadgeVariant = (status: SubscriptionStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'TRIAL':
      return 'secondary';
    case 'ACTIVE':
      return 'default';
    case 'CANCELLED':
    case 'PAST_DUE':
      return 'destructive';
    case 'PAUSED':
      return 'outline';
    default:
      return 'outline';
  }
};

export const getStatusText = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'TRIAL':
      return 'Пробный период';
    case 'ACTIVE':
      return 'Активна';
    case 'CANCELLED':
      return 'Отменена';
    case 'PAST_DUE':
      return 'Просрочена';
    case 'PAUSED':
      return 'Приостановлена';
    default:
      return 'Неизвестно';
  }
};

export const formatPrice = (price: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const isTrialExpiringSoon = (subscription: Subscription, daysThreshold: number = 3): boolean => {
  if (subscription.status !== 'TRIAL' || !subscription.trialEndsAt) {
    return false;
  }

  const trialEnd = new Date(subscription.trialEndsAt);
  const now = new Date();
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysLeft <= daysThreshold && daysLeft > 0;
};

export const canUpgradeTo = (currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean => {
  const planOrder: Record<SubscriptionPlan, number> = {
    TRIAL: 0,
    BASIC: 1,
    PRO: 2,
    ENTERPRISE: 3
  };

  return planOrder[targetPlan] > planOrder[currentPlan];
};