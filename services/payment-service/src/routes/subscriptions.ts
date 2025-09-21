import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { tenantPrisma } from '../prisma';
import { tenantAuth, requireRole } from '../middleware/tenantAuth';

const router: Router = Router();

// 🔐 Инициализация Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// 📝 Validation schemas
const CreateSubscriptionSchema = z.object({
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).default('BASIC'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// 💳 GET /subscriptions/me - получить активную подписку
router.get('/me', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID required',
        message: 'Invalid authentication'
      });
    }

    console.log(`🔍 Getting subscription for tenant: ${tenantId}`);

    const prisma = tenantPrisma(tenantId);
    const subscription = await prisma.subscription.findFirst({
      where: {
        status: {
          in: ['TRIAL', 'ACTIVE']
        }
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!subscription) {
      return res.json({
        subscription: null,
        status: 'NO_SUBSCRIPTION',
        message: 'No active subscription found'
      });
    }

    res.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        createdAt: subscription.createdAt
      },
      recentPayments: subscription.payments
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch subscription'
    });
  }
});

// 💳 POST /create-subscription - создать Stripe Checkout Session
router.post('/create-subscription', tenantAuth, requireRole(['SALON_OWNER', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req;

    if (!tenantId || !user) {
      return res.status(400).json({
        error: 'Authentication required',
        message: 'Invalid user or tenant'
      });
    }

    // Валидация входных данных
    const validationResult = CreateSubscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors
      });
    }

    const { plan, successUrl, cancelUrl } = validationResult.data;

    console.log(`💳 Creating subscription for tenant ${tenantId}, plan: ${plan}`);

    const prisma = tenantPrisma(tenantId);

    // Проверяем существующую подписку
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        status: {
          in: ['TRIAL', 'ACTIVE']
        }
      }
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return res.status(400).json({
        error: 'Subscription exists',
        message: 'Active subscription already exists'
      });
    }

    // Определяем цену по плану (в евроцентах)
    let priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData;

    switch (plan) {
      case 'BASIC':
        priceData = {
          currency: 'eur',
          product_data: {
            name: 'Beauty Platform - Basic Plan',
            description: 'До 3 мастеров, онлайн-запись, CRM клиентов'
          },
          unit_amount: 3000, // 30 EUR
          recurring: { interval: 'month' }
        };
        break;
      case 'PRO':
        priceData = {
          currency: 'eur',
          product_data: {
            name: 'Beauty Platform - Pro Plan',
            description: 'До 10 мастеров, SMS уведомления, ИИ-аналитика'
          },
          unit_amount: 7500, // 75 EUR
          recurring: { interval: 'month' }
        };
        break;
      case 'ENTERPRISE':
        priceData = {
          currency: 'eur',
          product_data: {
            name: 'Beauty Platform - Enterprise Plan',
            description: 'Безлимит мастеров, полная аналитика, приоритетная поддержка'
          },
          unit_amount: 15000, // 150 EUR
          recurring: { interval: 'month' }
        };
        break;
      default:
        throw new Error('Invalid plan');
    }

    // Создаем Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: priceData,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl || 'https://test-admin.beauty.designcorp.eu/subscription/success',
      cancel_url: cancelUrl || 'https://test-admin.beauty.designcorp.eu/subscription/cancel',
      customer_email: user.email,
      metadata: {
        tenantId,
        userId: user.userId,
        plan
      },
      subscription_data: {
        trial_period_days: 14, // 14 дней пробного периода
        metadata: {
          tenantId,
          plan
        }
      }
    });

    // Создаем или обновляем запись подписки
    const subscription = await prisma.subscription.upsert({
      where: {
        tenantId
      },
      create: {
        tenantId,
        plan,
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 дней
      },
      update: {
        plan,
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }
    });

    console.log(`✅ Checkout session created: ${session.id} for tenant ${tenantId}`);

    res.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create subscription'
    });
  }
});

export default router;