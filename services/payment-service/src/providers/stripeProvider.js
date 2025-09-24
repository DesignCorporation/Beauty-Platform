// Stripe Payment Provider with SDK Integration
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

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

  // Mock ID for now (will be replaced with real Payment.id)
  const mockId = `pay_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: mockId,
    provider: 'stripe',
    status: 'created', // Will change to requires_action after webhook
    clientSecret: `cs_${mockId}`,
    currency: currency.toLowerCase(),
    metadata: metadata ?? null
  };
}

/**
 * Parse Stripe webhook event with SDK verification
 * @param {Buffer} rawBody - Raw webhook body
 * @param {Object} headers - Request headers
 * @returns {Object|null} Parsed event or null if invalid
 */
export function parseWebhookEvent(rawBody, headers) {
  const signature = headers['stripe-signature'];
  if (!signature) throw new Error('Stripe-Signature required');

  try {
    // Real signature verification using Stripe SDK
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    return {
      eventId: event.id,
      type: event.type,
      paymentId: event.data?.object?.id || null,
      rawEvent: event
    };

  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error.message);
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Map Stripe event type to payment status
 * @param {string} eventType - Stripe event type
 * @returns {string} - Payment status
 */
export function mapEventToStatus(eventType) {
  const statusMap = {
    'payment_intent.succeeded': 'succeeded',
    'payment_intent.payment_failed': 'failed',
    'payment_intent.canceled': 'canceled',
    'payment_intent.requires_action': 'requires_action',
    'payment_intent.processing': 'processing'
  };

  return statusMap[eventType] || 'unknown';
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