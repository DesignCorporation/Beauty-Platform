import express from 'express';
import dotenv from 'dotenv';
import { setupAuth } from '@beauty-platform/shared-middleware';
import { createIntent as createStripeIntent, parseWebhookEvent as parseStripeWebhook } from './providers/stripeProvider.js';
import { createIntent as createPaypalIntent, parseWebhookEvent as parsePaypalWebhook } from './providers/paypalProvider.js';

// Load environment variables
dotenv.config();

const app = express();

// In-memory deduplication
const processed = new Set();
const isDuplicate = (id) => processed.has(id);
const markProcessed = (id) => processed.add(id);

// Raw body only for webhooks (no JSON parsing)
app.use('/webhooks', express.raw({ type: '*/*' }));

// JSON parsing for API endpoints
app.use(express.json());

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
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Stripe-Signature required' });

  const evt = parseStripeWebhook(req.body, req.headers);
  if (isDuplicate(evt.eventId)) return res.status(200).end();

  markProcessed(evt.eventId);
  return res.status(200).end();
});

// PayPal webhook endpoint
app.post('/webhooks/paypal', (req, res) => {
  const tid = req.headers['paypal-transmission-id'];
  const tsig = req.headers['paypal-transmission-sig'];
  if (!tid || !tsig) return res.status(400).json({ error: 'PayPal headers required' });

  const evt = parsePaypalWebhook(req.body, req.headers);
  if (isDuplicate(evt.eventId)) return res.status(200).end();

  markProcessed(evt.eventId);
  return res.status(200).end();
});

// ========================================
// API ENDPOINTS (JSON + Auth)
// ========================================

// Create payment intent with provider delegation
app.post('/api/payments/intents', async (req, res) => {
  const { provider = 'stripe' } = req.body || {};
  const fn = provider === 'paypal' ? createPaypalIntent : createStripeIntent;
  const result = await fn(req.body);
  return res.status(201).json(result);
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