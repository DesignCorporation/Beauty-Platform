import express from 'express';
import dotenv from 'dotenv';
import { setupAuth } from '@beauty-platform/shared-middleware';
import * as stripeProvider from './providers/stripeProvider.js';
import * as paypalProvider from './providers/paypalProvider.js';

// Load environment variables
dotenv.config();

const app = express();

// In-memory store for processed webhook events (idempotency)
const processedWebhookEvents = new Set();

// Raw body only for webhooks (no JSON parsing)
app.use('/webhooks', express.raw({ type: '*/*' }));

// JSON parsing for API endpoints
app.use('/api', express.json());

// Integrate shared middleware
const auth = setupAuth('payment-service');
app.use('/api', auth.strictTenantAuth);

// Health endpoint for orchestrator
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ========================================
// WEBHOOK ENDPOINTS (Raw Body)
// ========================================

// Stripe webhook endpoint
app.post('/webhooks/stripe', (req, res) => {
  try {
    const event = stripeProvider.parseWebhookEvent(req.body, req.headers);

    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook signature or payload' });
    }

    // Check for duplicate events (idempotency)
    if (processedWebhookEvents.has(event.id)) {
      console.log(`[Stripe] Duplicate webhook event ignored: ${event.id}`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Process the event
    console.log(`[Stripe] Processing webhook event: ${event.type} (${event.id})`);
    processedWebhookEvents.add(event.id);

    // TODO: Implement actual webhook processing logic
    // - Update payment status in database
    // - Send notifications
    // - Trigger business logic

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe] Webhook processing error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PayPal webhook endpoint
app.post('/webhooks/paypal', (req, res) => {
  try {
    const event = paypalProvider.parseWebhookEvent(req.body, req.headers);

    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook signature or payload' });
    }

    // Check for duplicate events (idempotency)
    if (processedWebhookEvents.has(event.id)) {
      console.log(`[PayPal] Duplicate webhook event ignored: ${event.id}`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Process the event
    console.log(`[PayPal] Processing webhook event: ${event.event_type} (${event.id})`);
    processedWebhookEvents.add(event.id);

    // TODO: Implement actual webhook processing logic
    // - Update payment status in database
    // - Send notifications
    // - Trigger business logic

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[PayPal] Webhook processing error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// API ENDPOINTS (JSON + Auth)
// ========================================

// Create payment intent with provider delegation
app.post('/api/payments/intents', async (req, res) => {
  try {
    const { amount, currency = 'EUR', provider = 'stripe', customerId, metadata } = req.body || {};

    if (!amount) {
      return res.status(400).json({ error: 'amount required' });
    }

    if (!['stripe', 'paypal'].includes(provider)) {
      return res.status(400).json({ error: 'provider must be stripe or paypal' });
    }

    // Delegate to appropriate provider
    let paymentIntent;
    if (provider === 'stripe') {
      paymentIntent = await stripeProvider.createIntent({ amount, currency, customerId, metadata });
    } else {
      paymentIntent = await paypalProvider.createIntent({ amount, currency, customerId, metadata });
    }

    res.status(201).json(paymentIntent);
  } catch (error) {
    console.error('[API] Error creating payment intent:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment by ID (structural compatibility, still mock)
app.get('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement database lookup
    // const payment = await tenantPrisma(req.tenantId).payment.findUnique({
    //   where: { id }
    // });

    // Mock implementation for now - determine provider from ID structure
    const isStripe = id.includes('stripe');
    const provider = isStripe ? 'stripe' : 'paypal';

    const mockPayment = {
      id,
      providerId: id.replace('pay_', isStripe ? 'pi_' : 'PAYID-'),
      provider,
      status: 'created',
      amount: isStripe ? 1000 : 10.00, // Stripe: cents, PayPal: currency units
      currency: 'EUR',
      customerId: null,
      metadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json(mockPayment);
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

// Create refund
app.post('/api/refunds', async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body || {};

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId required' });
    }

    // TODO: Implement actual refund logic
    // - Lookup payment in database
    // - Call provider refund API
    // - Create refund record

    const refundId = `re_${Math.random().toString(36).slice(2, 10)}`;

    res.status(201).json({
      id: refundId,
      paymentId,
      amount: amount || null,
      reason: reason || null,
      status: 'pending'
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