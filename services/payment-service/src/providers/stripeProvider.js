// Stripe Payment Provider with SDK Integration
import Stripe from 'stripe';

// Check if we have a real Stripe secret key
const isRealStripeKey = process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_') &&
  !process.env.STRIPE_SECRET_KEY.includes('placeholder');

let stripe = null;

if (isRealStripeKey) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20'
  });
  console.log('[Stripe] Real API integration enabled');
} else {
  console.warn('[Stripe] Using mock implementation - set STRIPE_SECRET_KEY for live API');
}

/**
 * Create a Stripe payment intent
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in cents
 * @param {string} params.currency - Currency code (EUR, PLN, USD)
 * @param {string} [params.customerId] - Stripe customer ID
 * @param {Object} [params.metadata] - Payment metadata
 * @returns {Object} Unified payment response
 */
export async function createIntent({ amount, currency = 'EUR', customerId, metadata }) {
  if (!amount) throw new Error('amount required');

  // Real Stripe API call if we have valid API key
  if (stripe && isRealStripeKey) {
    try {
      console.log(`[Stripe] Creating real payment intent: ${amount/100} ${currency.toUpperCase()}`);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: currency.toLowerCase(),
        customer: customerId || undefined,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(`[Stripe] Payment intent created: ${paymentIntent.id} (${paymentIntent.status})`);

      return {
        id: paymentIntent.id,
        provider: 'stripe',
        status: paymentIntent.status, // Real status from Stripe
        clientSecret: paymentIntent.client_secret,
        currency: currency.toLowerCase(),
        metadata: metadata ?? null
      };

    } catch (error) {
      console.error('[Stripe] API Error:', error.message);

      // If API call fails, fall back to mock with error status
      const mockId = `pay_mock_error_${Math.random().toString(36).slice(2, 8)}`;
      return {
        id: mockId,
        provider: 'stripe',
        status: 'failed',
        clientSecret: `cs_${mockId}`,
        currency: currency.toLowerCase(),
        metadata: metadata ?? null,
        error: `Stripe API Error: ${error.message}`
      };
    }
  }

  // Mock implementation fallback
  console.log(`[Stripe] Using mock implementation: ${amount/100} ${currency.toUpperCase()}`);
  const mockId = `pay_mock_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: mockId,
    provider: 'stripe',
    status: 'requires_payment_method', // More realistic initial status
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

  const isRealWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_') &&
    !process.env.STRIPE_WEBHOOK_SECRET.includes('placeholder');

  // Real signature verification if we have valid webhook secret
  if (stripe && isRealWebhookSecret) {
    try {
      console.log('[Stripe] Verifying webhook signature with real secret');
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

  // Mock webhook parsing fallback
  console.warn('[Stripe] Using mock webhook parsing - set STRIPE_WEBHOOK_SECRET for real verification');

  try {
    const event = JSON.parse(rawBody.toString());
    return {
      eventId: event.id || `evt_mock_${Date.now()}`,
      type: event.type || 'payment_intent.succeeded',
      paymentId: event.data?.object?.id || null,
      rawEvent: event
    };
  } catch (error) {
    console.error('[Stripe] Failed to parse webhook body:', error.message);
    throw new Error('Invalid webhook payload');
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