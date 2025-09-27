import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { tenantPrisma } from '../prisma';
import { normalizeAndValidateCurrency, currencyForProvider } from '../utils/currency';
import crypto from 'crypto';

const router = Router();

// 💳 Payments API - Stage 6: Multi-currency support

// Zod schema for payment intent creation
const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().optional(), // Will be normalized/validated by currency utils
  provider: z.enum(['stripe', 'paypal']),
  customerId: z.string().min(1, 'Customer ID is required'),
  description: z.string().optional()
});

/**
 * POST /payments/intents
 * Create payment intent with multi-currency support
 */
router.post('/intents', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Validate required headers
    if (!tenantId) {
      return res.status(400).json({
        error: 'Missing x-tenant-id header',
        code: 'MISSING_TENANT_ID'
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Missing Idempotency-Key header',
        code: 'MISSING_IDEMPOTENCY_KEY'
      });
    }

    // Validate request body
    const validation = createPaymentIntentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: validation.error.errors
      });
    }

    const { amount, provider, customerId, description } = validation.data;

    // 💰 CURRENCY NORMALIZATION AND VALIDATION
    let normalizedCurrency;
    try {
      normalizedCurrency = normalizeAndValidateCurrency({
        input: validation.data.currency,
        tenantId
      });
    } catch (currencyError: any) {
      return res.status(currencyError.status || 400).json({
        error: currencyError.message,
        code: currencyError.code || 'CURRENCY_ERROR'
      });
    }

    const currency = normalizedCurrency.currency; // Uppercase for DB/response
    const providerCurrency = currencyForProvider(currency); // Lowercase for SDK

    const prisma = tenantPrisma(tenantId);

    // Generate request hash for idempotency
    const requestData = {
      method: 'POST',
      path: '/payments/intents',
      body: { ...req.body, currency } // Normalize currency in hash
    };
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(requestData))
      .digest('hex');

    // Check for existing idempotency key
    const existingIdempotency = await prisma.idempotencyKey.findUnique({
      where: {
        key: idempotencyKey
      }
    });

    if (existingIdempotency) {
      // Check if request hash matches
      if (existingIdempotency.requestHash !== requestHash) {
        return res.status(409).json({
          error: 'Idempotency key conflict',
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Same idempotency key used for different request'
        });
      }

      // Return cached response
      return res.status(201).json(existingIdempotency.response);
    }

    // Generate payment ID
    const paymentId = `pay_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Mock provider implementation (for stage 6 - will integrate real providers later)
    let providerResult;
    if (provider === 'stripe') {
      // Mock Stripe PaymentIntent creation
      const mockPaymentIntentId = `pi_mock_${crypto.randomBytes(12).toString('hex')}`;

      console.log(`[STRIPE] Creating PaymentIntent: ${mockPaymentIntentId}, amount: ${amount}, currency: ${providerCurrency}`);

      providerResult = {
        id: mockPaymentIntentId,
        status: 'requires_payment_method',
        amount: amount,
        currency: providerCurrency,
        client_secret: `${mockPaymentIntentId}_secret_${crypto.randomBytes(16).toString('hex')}`
      };
    } else if (provider === 'paypal') {
      // Mock PayPal Order creation
      const mockOrderId = `paypal_order_${crypto.randomBytes(12).toString('hex')}`;

      console.log(`[PAYPAL] Creating Order: ${mockOrderId}, amount: ${amount}, currency: ${providerCurrency}`);

      providerResult = {
        id: mockOrderId,
        status: 'CREATED',
        amount: { value: (amount / 100).toString(), currency_code: currency },
        links: [
          { rel: 'approve', href: `https://paypal.mock/approve/${mockOrderId}` }
        ]
      };
    }

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        tenantId,
        customerId,
        provider,
        providerId: providerResult.id,
        amount: amount,
        currency: currency, // Store in uppercase
        status: 'PENDING',
        metadata: {
          description,
          providerResponse: providerResult,
          createdViaAPI: true
        }
      }
    });

    // Log payment creation event
    await prisma.paymentEvent.create({
      data: {
        tenantId,
        provider,
        eventType: 'payment.created',
        eventId: `payment_${provider}_${paymentId}_${Date.now()}`,
        paymentId,
        payload: {
          paymentId,
          providerId: providerResult.id,
          amount,
          currency,
          providerResult
        },
        processed: true
      }
    });

    // Prepare response
    const response = {
      id: payment.id,
      provider: payment.provider,
      providerId: payment.providerId,
      amount: payment.amount,
      currency: payment.currency, // Uppercase in response
      status: payment.status,
      customerId: payment.customerId,
      createdAt: payment.createdAt.toISOString(),
      providerData: {
        ...(provider === 'stripe' && {
          clientSecret: providerResult.client_secret
        }),
        ...(provider === 'paypal' && {
          approvalUrl: providerResult.links.find((l: any) => l.rel === 'approve')?.href
        })
      }
    };

    // Cache the response for idempotency (24h TTL)
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        tenantId,
        requestHash,
        response: response,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    console.log(`[PAYMENTS] Created payment ${paymentId}: ${amount} ${currency} via ${provider} (Provider: ${providerCurrency})`);

    res.status(201).json(response);

  } catch (error) {
    console.error('[PAYMENTS] Error creating payment intent:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'PAYMENT_CREATION_FAILED'
    });
  }
});

export default router;