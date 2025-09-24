// PayPal Payment Provider with SDK Integration
import crypto from 'crypto';
import { core, orders } from '@paypal/checkout-server-sdk';

// Проверяем наличие реальных PayPal credentials
const isRealPaypalCredentials = process.env.PAYPAL_CLIENT_ID &&
  process.env.PAYPAL_SECRET &&
  !process.env.PAYPAL_CLIENT_ID.includes('placeholder') &&
  !process.env.PAYPAL_SECRET.includes('placeholder');

let paypalClient = null;

if (isRealPaypalCredentials) {
  // Определяем среду: sandbox или production
  const environment = process.env.NODE_ENV === 'production'
    ? new core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
    : new core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);

  paypalClient = new core.PayPalHttpClient(environment);
  console.log('[PayPal] Real API integration enabled');
} else {
  console.warn('[PayPal] Using mock implementation - set PAYPAL_CLIENT_ID and PAYPAL_SECRET for live API');
}

/**
 * Create a PayPal payment intent (order)
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in currency units (not cents)
 * @param {string} params.currency - Currency code (EUR, PLN, USD)
 * @param {string} [params.customerId] - PayPal customer ID
 * @param {Object} [params.metadata] - Payment metadata
 * @returns {Object} Unified payment response
 */
export async function createIntent({ amount, currency = 'EUR', customerId, metadata }) {
  if (!amount) throw new Error('amount required');

  // Real PayPal API call if we have valid credentials
  if (paypalClient && isRealPaypalCredentials) {
    try {
      console.log(`[PayPal] Creating real order: ${amount} ${currency.toUpperCase()}`);

      const request = new orders.OrdersCreateRequest();
      request.headers['Prefer'] = 'return=representation';
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toString()
          },
          description: metadata?.description || 'Beauty Platform Payment',
          custom_id: customerId || undefined,
          invoice_id: metadata?.invoiceId || undefined
        }],
        application_context: {
          brand_name: 'Beauty Platform',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: metadata?.returnUrl || 'https://salon.beauty.designcorp.eu/payment/success',
          cancel_url: metadata?.cancelUrl || 'https://salon.beauty.designcorp.eu/payment/cancel'
        }
      });

      const response = await paypalClient.execute(request);
      const order = response.result;

      // Найти approval URL
      const approvalUrl = order.links.find(link => link.rel === 'approve')?.href || null;

      console.log(`[PayPal] Order created: ${order.id} (${order.status})`);

      return {
        id: order.id,
        provider: 'paypal',
        status: order.status.toLowerCase(), // CREATED -> created
        approvalUrl: approvalUrl,
        currency: currency.toLowerCase(),
        metadata: metadata ?? null
      };

    } catch (error) {
      console.error('[PayPal] API Error:', error.message);

      // If API call fails, fall back to mock with error status
      const mockId = `pay_paypal_error_${Math.random().toString(36).slice(2, 8)}`;
      return {
        id: mockId,
        provider: 'paypal',
        status: 'failed',
        approvalUrl: null,
        currency: currency.toLowerCase(),
        metadata: metadata ?? null,
        error: `PayPal API Error: ${error.message}`
      };
    }
  }

  // Mock implementation fallback
  console.log(`[PayPal] Using mock implementation: ${amount} ${currency.toUpperCase()}`);
  const mockId = `pay_paypal_mock_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: mockId,
    provider: 'paypal',
    status: 'created', // Mock всегда начинает с created
    approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${mockId}`,
    currency: currency.toLowerCase(),
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