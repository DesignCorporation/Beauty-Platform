// PayPal Payment Provider
// TODO: Add real PayPal SDK integration

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

  const id = `pay_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    provider: 'paypal',
    status: 'pending',
    approvalUrl: `https://paypal.test/approve/${id}`,
    currency,
    metadata: metadata ?? null
  };
}

/**
 * Parse PayPal webhook event
 * @param {Buffer} rawBody - Raw webhook body
 * @param {Object} headers - Request headers
 * @returns {Object|null} Parsed event or null if invalid
 */
export function parseWebhookEvent(body, headers) {
  const tid = headers['paypal-transmission-id'];
  const tsig = headers['paypal-transmission-sig'];
  if (!tid || !tsig) throw new Error('PayPal headers required');

  // mock parse
  return {
    eventId: `evt_${Math.random().toString(36).slice(2, 8)}`,
    type: 'PAYMENT.CAPTURE.COMPLETED',
    paymentId: 'pay_mock',
    status: 'succeeded'
  };
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