// PayPal Payment Provider with header validation
import crypto from 'crypto';

/**
 * Create a PayPal payment intent
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in currency units (not cents)
 * @param {string} params.currency - Currency code (EUR, PLN, USD)
 * @param {string} [params.customerId] - PayPal customer ID
 * @param {Object} [params.metadata] - Payment metadata
 * @returns {Object} Unified payment response
 */
export async function createIntent({ amount, currency = 'EUR', metadata }) {
  if (!amount) throw new Error('amount required');

  // Mock ID for now (will be replaced with real Payment.id)
  const mockId = `pay_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: mockId,
    provider: 'paypal',
    status: 'created', // Will change to pending after webhook
    approvalUrl: `https://paypal.test/approve/${mockId}`,
    currency: currency.toUpperCase(),
    metadata: metadata ?? null
  };
}

/**
 * Parse PayPal webhook event with header validation
 * @param {Buffer} rawBody - Raw webhook body
 * @param {Object} headers - Request headers
 * @returns {Object|null} Parsed event or null if invalid
 */
export function parseWebhookEvent(rawBody, headers) {
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const certId = headers['paypal-cert-id'];
  const transmissionTime = headers['paypal-transmission-time'];

  if (!transmissionId || !transmissionSig) {
    throw new Error('PayPal headers required');
  }

  // Basic header format validation
  if (!validatePayPalHeaders(transmissionId, transmissionSig, certId, transmissionTime)) {
    throw new Error('Invalid PayPal webhook headers format');
  }

  try {
    // Parse the webhook body
    const event = JSON.parse(rawBody.toString());

    // TODO: Implement cryptographic signature verification
    // For production, verify signature against PayPal public key
    // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature

    console.log('[PayPal] Webhook event received (basic validation only):', event.event_type);

    return {
      eventId: event.id || `WH_mock_${Date.now()}`,
      type: event.event_type || 'PAYMENT.CAPTURE.COMPLETED',
      paymentId: event.resource?.id || null,
      rawEvent: event
    };

  } catch (error) {
    console.error('[PayPal] Failed to parse webhook body:', error.message);
    throw new Error('Invalid PayPal webhook payload');
  }
}

/**
 * Validate PayPal webhook headers format
 * @param {string} transmissionId
 * @param {string} transmissionSig
 * @param {string} certId
 * @param {string} transmissionTime
 * @returns {boolean}
 */
function validatePayPalHeaders(transmissionId, transmissionSig, certId, transmissionTime) {
  // Basic format validation for PayPal headers
  const transmissionIdPattern = /^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/i;
  const transmissionTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

  if (!transmissionIdPattern.test(transmissionId)) {
    console.warn('[PayPal] Invalid transmission ID format');
    return false;
  }

  if (transmissionTime && !transmissionTimePattern.test(transmissionTime)) {
    console.warn('[PayPal] Invalid transmission time format');
    return false;
  }

  return true;
}

/**
 * Map PayPal event type to payment status
 * @param {string} eventType - PayPal event type
 * @returns {string} - Payment status
 */
export function mapEventToStatus(eventType) {
  const statusMap = {
    'PAYMENT.CAPTURE.COMPLETED': 'succeeded',
    'PAYMENT.CAPTURE.DENIED': 'failed',
    'PAYMENT.CAPTURE.PENDING': 'processing',
    'CHECKOUT.ORDER.APPROVED': 'requires_action',
    'CHECKOUT.ORDER.CANCELLED': 'canceled'
  };

  return statusMap[eventType] || 'unknown';
}

/**
 * Get payment status by ID
 * @param {string} paymentId - PayPal order ID
 * @returns {Object} Payment status
 */
export async function getPaymentStatus(paymentId) {
  // TODO: Implement real PayPal retrieval
  // const paypal = require('@paypal/checkout-server-sdk');
  // const request = new paypal.orders.OrdersGetRequest(paymentId);
  // const order = await client.execute(request);

  // Mock implementation
  return {
    id: paymentId,
    provider: 'paypal',
    status: 'completed',
    amount: 20.00,
    currency: 'eur'
  };
}