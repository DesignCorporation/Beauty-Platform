import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { tenantPrisma } from '../prisma';

const router: Router = Router();

// 🔐 Инициализация Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// 🎣 POST /webhooks/stripe - обработка Stripe событий (RAW BODY!)
// ВАЖНО: Этот endpoint должен быть смонтирован с express.raw() middleware
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    // 🔐 Валидация Stripe signature (КРИТИЧНО!)
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`✅ Stripe webhook verified: ${event.type}`);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed:`, err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  try {
    // 🎯 Обработка различных типов событий
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`🔔 Unhandled Stripe event type: ${event.type}`);
    }

    // Всегда возвращаем 200 для Stripe
    res.status(200).json({ received: true });

  } catch (error) {
    console.error(`❌ Error processing webhook ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 📋 Обработчики событий

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`💳 Checkout completed: ${session.id}`);

  const tenantId = session.metadata?.tenantId;
  const plan = session.metadata?.plan;

  if (!tenantId) {
    console.error('❌ No tenantId in checkout session metadata');
    return;
  }

  try {
    const prisma = tenantPrisma(tenantId);

    // Получаем подписку от Stripe
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await prisma.subscription.upsert({
        where: { tenantId },
        create: {
          tenantId,
          plan: plan || 'BASIC',
          status: 'ACTIVE',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        update: {
          status: 'ACTIVE',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }
      });

      console.log(`✅ Subscription activated for tenant ${tenantId}`);
    }
  } catch (error) {
    console.error('❌ Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`🆕 Subscription created: ${subscription.id}`);

  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) {
    console.error('❌ No tenantId in subscription metadata');
    return;
  }

  try {
    const prisma = tenantPrisma(tenantId);

    await prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        plan: subscription.metadata?.plan || 'BASIC',
        status: subscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      update: {
        status: subscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }
    });

    console.log(`✅ Subscription record created for tenant ${tenantId}`);
  } catch (error) {
    console.error('❌ Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);

  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) {
    console.error('❌ No tenantId in subscription metadata');
    return;
  }

  try {
    const prisma = tenantPrisma(tenantId);

    let status = 'TRIAL';
    if (subscription.status === 'active') status = 'ACTIVE';
    if (subscription.status === 'canceled') status = 'CANCELLED';
    if (subscription.status === 'past_due') status = 'PAST_DUE';

    await prisma.subscription.updateMany({
      where: {
        tenantId,
        stripeSubscriptionId: subscription.id
      },
      data: {
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    });

    console.log(`✅ Subscription updated for tenant ${tenantId}, status: ${status}`);
  } catch (error) {
    console.error('❌ Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);

  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) {
    console.error('❌ No tenantId in subscription metadata');
    return;
  }

  try {
    const prisma = tenantPrisma(tenantId);

    await prisma.subscription.updateMany({
      where: {
        tenantId,
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: 'CANCELLED',
      }
    });

    console.log(`✅ Subscription cancelled for tenant ${tenantId}`);
  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`💰 Invoice payment succeeded: ${invoice.id}`);

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      console.error('❌ No tenantId in subscription metadata');
      return;
    }

    const prisma = tenantPrisma(tenantId);

    // Записываем успешный платеж
    await prisma.payment.create({
      data: {
        tenantId,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_paid || 0) / 100, // Convert from cents
        currency: invoice.currency?.toUpperCase() || 'EUR',
        status: 'SUCCEEDED',
        description: `Payment for subscription ${subscription.id}`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          periodStart: subscription.current_period_start,
          periodEnd: subscription.current_period_end,
        }
      }
    });

    console.log(`✅ Payment recorded for tenant ${tenantId}, amount: ${invoice.amount_paid}`);
  } catch (error) {
    console.error('❌ Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Invoice payment failed: ${invoice.id}`);

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      console.error('❌ No tenantId in subscription metadata');
      return;
    }

    const prisma = tenantPrisma(tenantId);

    // Записываем неудачный платеж
    await prisma.payment.create({
      data: {
        tenantId,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_due || 0) / 100, // Convert from cents
        currency: invoice.currency?.toUpperCase() || 'EUR',
        status: 'FAILED',
        description: `Failed payment for subscription ${subscription.id}`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          failureReason: 'payment_failed',
        }
      }
    });

    // Обновляем статус подписки
    await prisma.subscription.updateMany({
      where: {
        tenantId,
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: 'PAST_DUE',
      }
    });

    console.log(`⚠️ Payment failure recorded for tenant ${tenantId}`);
  } catch (error) {
    console.error('❌ Error handling invoice payment failed:', error);
  }
}

export default router;