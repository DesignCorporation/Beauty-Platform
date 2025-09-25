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

      // 🔄 Refund events (Stage 5)
      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;

      case 'refund.created':
        await handleRefundCreated(event);
        break;

      case 'refund.updated':
        await handleRefundUpdated(event);
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

// 🎣 POST /webhooks/paypal - обработка PayPal событий (RAW BODY!)
router.post('/paypal', async (req: Request, res: Response) => {
  const transmissionId = req.headers['paypal-transmission-id'] as string;
  const certId = req.headers['paypal-cert-id'] as string;
  const transmissionSig = req.headers['paypal-transmission-sig'] as string;
  const transmissionTime = req.headers['paypal-transmission-time'] as string;
  const authAlgo = req.headers['paypal-auth-algo'] as string;

  // Basic validation of required headers
  if (!transmissionId || !transmissionSig) {
    console.error('❌ Missing PayPal webhook headers');
    return res.status(400).json({ error: 'Missing required PayPal headers' });
  }

  let event;

  try {
    // Parse PayPal webhook payload
    event = JSON.parse(req.body.toString());
    console.log(`📦 PayPal webhook received: ${event.event_type}`);

    // In a real implementation, you would verify the webhook signature here
    // For now, we'll log a warning about signature verification
    console.warn('⚠️ PayPal webhook signature verification not implemented - accepting event');

  } catch (err) {
    console.error('❌ Failed to parse PayPal webhook payload:', err);
    return res.status(400).json({ error: 'Invalid PayPal webhook payload' });
  }

  try {
    // 🎯 Process PayPal refund events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePayPalCaptureRefunded(event);
        break;

      case 'PAYMENT.CAPTURE.PENDING':
        await handlePayPalCapturePending(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePayPalCaptureDenied(event);
        break;

      default:
        console.log(`ℹ️ Unhandled PayPal event type: ${event.event_type}`);
        break;
    }

  } catch (error) {
    console.error('❌ Error processing PayPal webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.json({ received: true });
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

// ========================================
// 🔄 REFUND EVENT HANDLERS (Stage 5)
// ========================================

async function handleChargeRefunded(event: Stripe.Event) {
  console.log(`🔄 Charge refunded: ${event.id}`);

  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.error('❌ No payment_intent in charge.refunded event');
    return;
  }

  // Process each refund in the charge
  for (const refund of charge.refunds?.data || []) {
    await processStripeRefundEvent(event.id, 'charge.refunded', refund, paymentIntentId);
  }
}

async function handleRefundCreated(event: Stripe.Event) {
  console.log(`🔄 Refund created: ${event.id}`);

  const refund = event.data.object as Stripe.Refund;
  const paymentIntentId = refund.payment_intent as string;

  await processStripeRefundEvent(event.id, 'refund.created', refund, paymentIntentId);
}

async function handleRefundUpdated(event: Stripe.Event) {
  console.log(`🔄 Refund updated: ${event.id}`);

  const refund = event.data.object as Stripe.Refund;
  const paymentIntentId = refund.payment_intent as string;

  await processStripeRefundEvent(event.id, 'refund.updated', refund, paymentIntentId);
}

async function processStripeRefundEvent(
  eventId: string,
  eventType: string,
  refund: Stripe.Refund,
  paymentIntentId: string
) {
  try {
    // Find payment across all tenants (global lookup)
    const { PrismaClient } = require('@prisma/client');
    const globalPrisma = new PrismaClient();

    const payment = await globalPrisma.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId
      }
    });

    await globalPrisma.$disconnect();

    if (!payment) {
      console.error(`❌ Payment not found for payment_intent: ${paymentIntentId}`);
      return;
    }

    // Use tenant-specific Prisma client
    const prisma = tenantPrisma(payment.tenantId);

    // Check for duplicate event (dedupe by eventId)
    const existingEvent = await prisma.paymentEvent.findFirst({
      where: { eventId }
    });

    if (existingEvent) {
      console.log(`⚠️ Duplicate Stripe refund event ${eventId}, skipping`);
      return;
    }

    // Find or create refund record
    let dbRefund = await prisma.refund.findFirst({
      where: {
        tenantId: payment.tenantId,
        providerRefundId: refund.id
      }
    });

    const refundStatus = mapStripeRefundStatus(refund.status);

    if (!dbRefund) {
      // Create new refund record from webhook
      dbRefund = await prisma.refund.create({
        data: {
          tenantId: payment.tenantId,
          paymentId: payment.id,
          provider: 'stripe',
          providerRefundId: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refundStatus,
          reason: refund.reason || 'stripe_webhook',
          metadata: {
            createdViaWebhook: true,
            stripeRefund: refund
          }
        }
      });
    } else {
      // Update existing refund status
      dbRefund = await prisma.refund.update({
        where: { id: dbRefund.id },
        data: {
          status: refundStatus,
          metadata: {
            ...dbRefund.metadata as object,
            updatedViaWebhook: true,
            stripeRefund: refund
          }
        }
      });
    }

    // Create payment event (with unique eventId for deduplication)
    await prisma.paymentEvent.create({
      data: {
        tenantId: payment.tenantId,
        provider: 'stripe',
        eventType,
        eventId,
        paymentId: payment.id,
        refundId: dbRefund.id,
        payload: {
          eventId,
          refundId: refund.id,
          paymentIntentId,
          amount: refund.amount,
          status: refund.status,
          stripeEvent: event
        },
        processed: true
      }
    });

    // Update payment aggregated status if fully refunded
    if (refundStatus === 'succeeded') {
      const totalRefunded = await prisma.refund.aggregate({
        where: {
          paymentId: payment.id,
          status: 'succeeded'
        },
        _sum: { amount: true }
      });

      const paymentAmountCents = Math.round(Number(payment.amount) * 100);
      const totalRefundedCents = totalRefunded._sum.amount || 0;

      if (totalRefundedCents >= paymentAmountCents) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' }
        });

        console.log(`✅ Payment ${payment.id} marked as fully REFUNDED`);
      }
    }

    console.log(`✅ Stripe refund event processed: ${eventType} for ${refund.id} (${refundStatus})`);

  } catch (error: any) {
    // Handle duplicate key error (eventId unique constraint)
    if (error.code === 'P2002' && error.meta?.target?.includes('eventId')) {
      console.log(`⚠️ Duplicate Stripe refund event ${eventId} (unique constraint), skipping`);
      return;
    }

    console.error(`❌ Error processing Stripe refund event ${eventId}:`, error);
  }
}

function mapStripeRefundStatus(stripeStatus: string): 'pending' | 'succeeded' | 'failed' {
  switch (stripeStatus) {
    case 'succeeded':
      return 'succeeded';
    case 'pending':
      return 'pending';
    case 'failed':
    case 'canceled':
      return 'failed';
    default:
      console.warn(`⚠️ Unknown Stripe refund status: ${stripeStatus}, defaulting to pending`);
      return 'pending';
  }
}

// ========================================
// 🔄 PAYPAL REFUND EVENT HANDLERS (Stage 5)
// ========================================

async function handlePayPalCaptureRefunded(event: any) {
  console.log(`🔄 PayPal capture refunded: ${event.id}`);

  const resource = event.resource;
  const refundId = resource.id;
  const captureId = resource.links?.find((link: any) => link.rel === 'up')?.href?.split('/').pop();

  if (!captureId) {
    console.error('❌ Cannot extract capture ID from PayPal refund event');
    return;
  }

  await processPayPalRefundEvent(event.id, 'PAYMENT.CAPTURE.REFUNDED', resource, captureId);
}

async function handlePayPalCapturePending(event: any) {
  console.log(`🔄 PayPal capture pending: ${event.id}`);

  const resource = event.resource;
  const captureId = resource.id;

  // Only process if this is a refund-related pending event
  if (resource.status === 'PENDING' && resource.reason_code === 'REFUND') {
    await processPayPalRefundEvent(event.id, 'PAYMENT.CAPTURE.PENDING', resource, captureId);
  }
}

async function handlePayPalCaptureDenied(event: any) {
  console.log(`🔄 PayPal capture denied: ${event.id}`);

  const resource = event.resource;
  const captureId = resource.id;

  await processPayPalRefundEvent(event.id, 'PAYMENT.CAPTURE.DENIED', resource, captureId);
}

async function processPayPalRefundEvent(
  eventId: string,
  eventType: string,
  resource: any,
  captureId: string
) {
  try {
    // Find payment across all tenants (global lookup)
    const { PrismaClient } = require('@prisma/client');
    const globalPrisma = new PrismaClient();

    const payment = await globalPrisma.payment.findFirst({
      where: {
        OR: [
          { metadata: { path: ['captureId'], equals: captureId } },
          { metadata: { path: ['orderId'], equals: captureId } },
          { stripePaymentIntentId: captureId } // fallback for mixed metadata
        ]
      }
    });

    await globalPrisma.$disconnect();

    if (!payment) {
      console.error(`❌ Payment not found for PayPal capture: ${captureId}`);
      return;
    }

    // Use tenant-specific Prisma client
    const prisma = tenantPrisma(payment.tenantId);

    // Check for duplicate event (dedupe by eventId)
    const existingEvent = await prisma.paymentEvent.findFirst({
      where: { eventId }
    });

    if (existingEvent) {
      console.log(`⚠️ Duplicate PayPal refund event ${eventId}, skipping`);
      return;
    }

    const refundStatus = mapPayPalRefundStatus(eventType, resource.status);

    // Find existing refund or create new one
    let dbRefund = await prisma.refund.findFirst({
      where: {
        tenantId: payment.tenantId,
        paymentId: payment.id,
        provider: 'paypal'
      }
    });

    if (!dbRefund) {
      // Create new refund record from webhook
      dbRefund = await prisma.refund.create({
        data: {
          tenantId: payment.tenantId,
          paymentId: payment.id,
          provider: 'paypal',
          providerRefundId: resource.id || `paypal_${captureId}_${Date.now()}`,
          amount: resource.amount ? Math.round(parseFloat(resource.amount.value) * 100) : 0,
          currency: resource.amount?.currency_code?.toLowerCase() || 'eur',
          status: refundStatus,
          reason: resource.reason_code || 'paypal_webhook',
          metadata: {
            createdViaWebhook: true,
            paypalResource: resource,
            captureId
          }
        }
      });
    } else {
      // Update existing refund status
      dbRefund = await prisma.refund.update({
        where: { id: dbRefund.id },
        data: {
          status: refundStatus,
          metadata: {
            ...dbRefund.metadata as object,
            updatedViaWebhook: true,
            paypalResource: resource
          }
        }
      });
    }

    // Create payment event (with unique eventId for deduplication)
    await prisma.paymentEvent.create({
      data: {
        tenantId: payment.tenantId,
        provider: 'paypal',
        eventType,
        eventId,
        paymentId: payment.id,
        refundId: dbRefund.id,
        payload: {
          eventId,
          captureId,
          refundId: resource.id,
          status: resource.status,
          paypalEvent: resource
        },
        processed: true
      }
    });

    // Update payment aggregated status if fully refunded
    if (refundStatus === 'succeeded') {
      const totalRefunded = await prisma.refund.aggregate({
        where: {
          paymentId: payment.id,
          status: 'succeeded'
        },
        _sum: { amount: true }
      });

      const paymentAmountCents = Math.round(Number(payment.amount) * 100);
      const totalRefundedCents = totalRefunded._sum.amount || 0;

      if (totalRefundedCents >= paymentAmountCents) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' }
        });

        console.log(`✅ Payment ${payment.id} marked as fully REFUNDED`);
      }
    }

    console.log(`✅ PayPal refund event processed: ${eventType} for ${captureId} (${refundStatus})`);

  } catch (error: any) {
    // Handle duplicate key error (eventId unique constraint)
    if (error.code === 'P2002' && error.meta?.target?.includes('eventId')) {
      console.log(`⚠️ Duplicate PayPal refund event ${eventId} (unique constraint), skipping`);
      return;
    }

    console.error(`❌ Error processing PayPal refund event ${eventId}:`, error);
  }
}

function mapPayPalRefundStatus(eventType: string, resourceStatus?: string): 'pending' | 'succeeded' | 'failed' {
  switch (eventType) {
    case 'PAYMENT.CAPTURE.REFUNDED':
      return 'succeeded';
    case 'PAYMENT.CAPTURE.PENDING':
      return 'pending';
    case 'PAYMENT.CAPTURE.DENIED':
      return 'failed';
    default:
      // Fallback to resource status
      switch (resourceStatus?.toUpperCase()) {
        case 'COMPLETED':
          return 'succeeded';
        case 'PENDING':
          return 'pending';
        case 'DENIED':
        case 'FAILED':
          return 'failed';
        default:
          console.warn(`⚠️ Unknown PayPal refund status: ${eventType}/${resourceStatus}, defaulting to pending`);
          return 'pending';
      }
  }
}

export default router;