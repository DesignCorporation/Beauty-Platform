import express from 'express';

// Placeholder for shared-middleware integration
// In real repo use: import { setupAuth } from '@beauty-platform/shared-middleware'
function setupAuthMock() {
  return {
    strictTenantAuth: (req, res, next) => {
      const tenantId = req.headers['x-tenant-id'];
      if (!tenantId) return res.status(401).json({ error: 'tenant required' });
      req.tenantId = String(tenantId);
      next();
    }
  };
}

const app = express();

// Raw body only for webhooks (reserved)
app.use('/webhooks', express.raw({ type: '*/*' }));

// JSON for API
app.use(express.json());

// Integrate shared middleware (mocked here)
const auth = setupAuthMock();
app.use('/api', auth.strictTenantAuth);

// Health endpoint for orchestrator
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Mock: create payment intent
app.post('/api/payments/intents', (req, res) => {
  const { amount, currency = 'EUR', provider = 'stripe', metadata } = req.body || {};
  if (!amount) return res.status(400).json({ error: 'amount required' });
  const id = `pay_${Math.random().toString(36).slice(2, 10)}`;
  const response = {
    id,
    provider,
    status: provider === 'stripe' ? 'requires_action' : 'pending',
    ...(provider === 'stripe' ? { clientSecret: `cs_${id}` } : { approvalUrl: `https://paypal.test/approve/${id}` }),
    currency,
    metadata: metadata || null
  };
  res.status(201).json(response);
});

// Mock: get payment by id
app.get('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    providerId: id.replace('pay_', 'pi_'),
    provider: 'stripe',
    status: 'created',
    amount: 1000,
    currency: 'EUR',
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

// Mock: PDF generation
app.post('/api/invoices/:paymentId/generate', (req, res) => {
  const { paymentId } = req.params;
  res.json({ paymentId, url: `/tmp/invoices/${paymentId}.pdf`, status: 'generated' });
});

const PORT = process.env.PORT || 6029;
app.listen(PORT, () => {
  console.log(`[payment-service] listening on :${PORT}`);
});