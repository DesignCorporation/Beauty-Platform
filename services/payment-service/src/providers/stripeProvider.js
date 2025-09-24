// Stripe Payment Provider
// TODO: Add real Stripe SDK integration

/**
 * Create a Stripe payment intent
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in cents
 * @param {string} params.currency - Currency code (EUR, PLN, USD)
 * @param {string} [params.customerId] - Stripe customer ID
 * @param {Object} [params.metadata] - Payment metadata
 * @returns {Object} Unified payment response
 */
export async function createIntent({ amount, currency = 'EUR', metadata }) {
  if (!amount) throw new Error('amount required');

  const id = `pay_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    provider: 'stripe',
    status: 'requires_action',
    clientSecret: `cs_${id}`,
    currency,
    metadata: metadata ?? null
  };
}

/**
 * Parse Stripe webhook event
 * @param {Buffer} rawBody - Raw webhook body
 * @param {Object} headers - Request headers
 * @returns {Object|null} Parsed event or null if invalid
 */
export function parseWebhookEvent(body, headers) {
  const sig = headers['stripe-signature'];
  if (!sig) throw new Error('Stripe-Signature required');

  // mock parse
  return {
    eventId: `evt_${Math.random().toString(36).slice(2, 8)}`,
    type: 'payment_intent.succeeded',
    paymentId: 'pay_mock',
    status: 'succeeded'
  };
}

/**
 * Get payment status by ID
 * @param {string} paymentId - Stripe payment intent ID
 * @returns {Object} Payment status
 */
export async function getPaymentStatus(paymentId) {
  // TODO: Implement real Stripe retrieval
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

  // Mock implementation
  return {
    id: paymentId,
    provider: 'stripe',
    status: 'succeeded',
    amount: 2000,
    currency: 'eur'
  };
}