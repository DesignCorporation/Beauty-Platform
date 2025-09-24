import express from 'express';
import dotenv from 'dotenv';
import { setupAuth } from '@beauty-platform/shared-middleware';
import { tenantPrisma } from '@beauty-platform/database';
import { createIntent as createStripeIntent, parseWebhookEvent as parseStripeWebhook, mapEventToStatus as mapStripeStatus } from './providers/stripeProvider.js';
import { createIntent as createPaypalIntent, parseWebhookEvent as parsePaypalWebhook, mapEventToStatus as mapPaypalStatus } from './providers/paypalProvider.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';

// Load environment variables
dotenv.config();

const app = express();

// Raw body only for webhooks (no JSON parsing)
app.use('/webhooks', express.raw({ type: '*/*' }));

// JSON parsing for API endpoints
app.use(express.json());

// Integrate shared middleware
const auth = setupAuth('payment-service');
app.use('/api', auth.strictTenantAuth);

// Apply idempotency middleware to specific endpoints
app.use('/api/payments/intents', idempotencyMiddleware({ required: true }));
app.use('/api/refunds', idempotencyMiddleware({ required: true }));

// Health endpoint for orchestrator
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ========================================
// WEBHOOK ENDPOINTS (Raw Body)
// ========================================

// Stripe webhook endpoint with DB integration
app.post('/webhooks/stripe', async (req, res) => {
  try {
    const event = parseStripeWebhook(req.body, req.headers);

    // Check for duplicate events in database
    const db = tenantPrisma(null); // Webhooks are global
    const existingEvent = await db.paymentEvent.findFirst({
      where: { eventId: event.eventId }
    });

    if (existingEvent) {
      console.log(`[Stripe] Duplicate webhook event ignored: ${event.eventId}`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Process the event and update payment status
    const newStatus = mapStripeStatus(event.type);
    let updatedPayment = null;

    if (event.paymentId && newStatus !== 'unknown') {
      // Find payment by providerId across all tenants
      const payment = await db.$queryRaw`
        SELECT * FROM payments WHERE provider_id = ${event.paymentId} LIMIT 1
      `;

      if (payment.length > 0) {
        const paymentRecord = payment[0];
        const tenantDb = tenantPrisma(paymentRecord.tenant_id);

        updatedPayment = await tenantDb.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: newStatus,
            providerId: event.paymentId // Update if not set
          }
        });

        console.log(`[Stripe] Updated payment ${paymentRecord.id} status: ${newStatus}`);
      }
    }

    // Create payment event record
    await db.paymentEvent.create({
      data: {
        paymentId: updatedPayment?.id || null,
        provider: 'stripe',
        eventType: event.type,
        eventId: event.eventId,
        payload: event.rawEvent
      }
    });

    console.log(`[Stripe] Processed webhook event: ${event.type} (${event.eventId})`);
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('[Stripe] Webhook processing error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PayPal webhook endpoint with DB integration
app.post('/webhooks/paypal', async (req, res) => {
  try {
    const event = parsePaypalWebhook(req.body, req.headers);

    // Check for duplicate events in database
    const db = tenantPrisma(null); // Webhooks are global
    const existingEvent = await db.paymentEvent.findFirst({
      where: { eventId: event.eventId }
    });

    if (existingEvent) {
      console.log(`[PayPal] Duplicate webhook event ignored: ${event.eventId}`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Process the event and update payment status
    const newStatus = mapPaypalStatus(event.type);
    let updatedPayment = null;

    if (event.paymentId && newStatus !== 'unknown') {
      // Find payment by providerId across all tenants
      const payment = await db.$queryRaw`
        SELECT * FROM payments WHERE provider_id = ${event.paymentId} LIMIT 1
      `;

      if (payment.length > 0) {
        const paymentRecord = payment[0];
        const tenantDb = tenantPrisma(paymentRecord.tenant_id);

        updatedPayment = await tenantDb.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: newStatus,
            providerId: event.paymentId // Update if not set
          }
        });

        console.log(`[PayPal] Updated payment ${paymentRecord.id} status: ${newStatus}`);
      }
    }

    // Create payment event record
    await db.paymentEvent.create({
      data: {
        paymentId: updatedPayment?.id || null,
        provider: 'paypal',
        eventType: event.type,
        eventId: event.eventId,
        payload: event.rawEvent
      }
    });

    console.log(`[PayPal] Processed webhook event: ${event.type} (${event.eventId})`);
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('[PayPal] Webhook processing error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// API ENDPOINTS (JSON + Auth)
// ========================================

// Create payment intent with DB persistence
app.post('/api/payments/intents', async (req, res) => {
  try {
    const { amount, currency = 'EUR', provider = 'stripe', customerId, metadata } = req.body || {};
    const tenantId = req.tenantId;

    if (!amount) {
      return res.status(400).json({ error: 'amount required' });
    }

    if (!['stripe', 'paypal'].includes(provider)) {
      return res.status(400).json({ error: 'provider must be stripe or paypal' });
    }

    // Create provider intent (mock for now)
    const fn = provider === 'paypal' ? createPaypalIntent : createStripeIntent;
    const providerResult = await fn({ amount, currency, customerId, metadata });

    // Create Payment record in database
    const db = tenantPrisma(tenantId);
    const payment = await db.payment.create({
      data: {
        provider: provider.toUpperCase(),
        providerId: null, // Will be set via webhook
        amount: parseInt(amount),
        currency: currency.toUpperCase(),
        status: providerResult.status,
        customerId,
        metadata: metadata || null
      }
    });

    // Return unified response with real payment ID
    const response = {
      ...providerResult,
      id: payment.id, // Use real DB ID instead of mock
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };

    console.log(`[API] Created payment intent: ${payment.id} (${provider})`);
    res.status(201).json(response);

  } catch (error) {
    console.error('[API] Error creating payment intent:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment by ID from database
app.get('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const db = tenantPrisma(tenantId);
    const payment = await db.payment.findFirst({
      where: { id }
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    // Return payment with normalized structure
    const response = {
      id: payment.id,
      provider: payment.provider.toLowerCase(),
      providerId: payment.providerId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency.toLowerCase(),
      customerId: payment.customerId,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };

    res.json(response);

  } catch (error) {
    console.error('[API] Error fetching payment:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel payment by ID
app.post('/api/payments/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual cancellation logic
    // - Call provider cancellation API
    // - Update database status

    res.json({ id, status: 'canceled' });
  } catch (error) {
    console.error('[API] Error canceling payment:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create refund with DB persistence
app.post('/api/refunds', async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body || {};
    const tenantId = req.tenantId;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId required' });
    }

    const db = tenantPrisma(tenantId);

    // Lookup payment in database
    const payment = await db.payment.findFirst({
      where: { id: paymentId }
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment must be succeeded to create refund',
        code: 'PAYMENT_NOT_REFUNDABLE'
      });
    }

    // Default to full refund if amount not specified
    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        error: 'Refund amount cannot exceed payment amount',
        code: 'REFUND_AMOUNT_INVALID'
      });
    }

    // Create refund record
    const refund = await db.refund.create({
      data: {
        paymentId: payment.id,
        amount: refundAmount,
        status: 'pending',
        reason: reason || null,
        providerRefundId: null // Will be set when processed
      }
    });

    // TODO: Call provider refund API
    // For now, just create the record

    console.log(`[API] Created refund: ${refund.id} for payment: ${paymentId}`);

    res.status(201).json({
      id: refund.id,
      paymentId: refund.paymentId,
      amount: refund.amount,
      status: refund.status,
      reason: refund.reason,
      providerRefundId: refund.providerRefundId,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt
    });

  } catch (error) {
    console.error('[API] Error creating refund:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate PDF invoice
app.post('/api/invoices/:paymentId/generate', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // TODO: Implement PDF generation with Puppeteer
    // - Fetch payment details from database
    // - Render invoice template (branded, i18n)
    // - Generate PDF using Puppeteer
    // - Save to local storage or S3
    // - Return URL/stream

    const invoiceUrl = `/tmp/invoices/${paymentId}_${Date.now()}.pdf`;

    res.json({
      paymentId,
      url: invoiceUrl,
      status: 'generated',
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error generating invoice:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 6029;
app.listen(PORT, () => {
  console.log(`[payment-service] listening on :${PORT}`);
});