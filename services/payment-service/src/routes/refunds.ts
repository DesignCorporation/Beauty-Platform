import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { tenantPrisma } from '../prisma';
import crypto from 'crypto';

const router = Router();

// 🔄 Refunds API - Stage 5

// Zod schema for refund creation
const createRefundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().int().positive().optional(), // Optional for partial refunds
  reason: z.string().optional()
});

/**
 * POST /refunds
 * Create a refund with mandatory Idempotency-Key
 */
router.post('/', async (req: Request, res: Response) => {
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
    const validation = createRefundSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: validation.error.errors
      });
    }

    const { paymentId, amount, reason } = validation.data;

    // Get tenant-isolated Prisma client
    const prisma = tenantPrisma(tenantId);

    // Generate request hash for idempotency
    const requestData = {
      method: 'POST',
      path: '/refunds',
      body: req.body
    };
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(requestData))
      .digest('hex');

    // Check for existing idempotency key
    const existingIdempotency = await prisma.idempotencyKey.findFirst({
      where: {
        key: idempotencyKey,
        tenantId
      }
    });

    if (existingIdempotency) {
      // Check if request hash matches (prevent different requests with same key)
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

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId
      }
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    // Validate payment status (only succeeded payments can be refunded)
    if (payment.status !== 'SUCCEEDED') {
      return res.status(400).json({
        error: 'Payment cannot be refunded',
        code: 'INVALID_PAYMENT_STATUS',
        message: `Payment status is ${payment.status}, expected SUCCEEDED`
      });
    }

    // Calculate refund amount (default to full payment amount)
    const refundAmount = amount || Number(payment.amount * 100); // Convert to cents

    // Validate refund amount doesn't exceed payment amount
    if (refundAmount > Number(payment.amount * 100)) {
      return res.status(400).json({
        error: 'Refund amount exceeds payment amount',
        code: 'INVALID_REFUND_AMOUNT',
        message: `Refund amount ${refundAmount} exceeds payment amount ${Number(payment.amount * 100)}`
      });
    }

    // Check existing refunds to prevent over-refunding
    const existingRefunds = await prisma.refund.findMany({
      where: {
        paymentId,
        tenantId,
        status: { in: ['pending', 'succeeded'] }
      }
    });

    const totalRefunded = existingRefunds.reduce((sum, refund) => sum + refund.amount, 0);
    if (totalRefunded + refundAmount > Number(payment.amount * 100)) {
      return res.status(400).json({
        error: 'Total refund amount would exceed payment amount',
        code: 'EXCESSIVE_REFUND_AMOUNT',
        message: `Total refunds ${totalRefunded + refundAmount} would exceed payment amount ${Number(payment.amount * 100)}`
      });
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        tenantId,
        paymentId,
        provider: payment.metadata?.provider || 'stripe', // Default to stripe
        amount: refundAmount,
        currency: payment.currency,
        status: 'pending',
        reason: reason || 'Customer request',
        metadata: {
          createdViaAPI: true,
          originalPaymentAmount: Number(payment.amount * 100)
        }
      }
    });

    // Prepare response
    const response = {
      id: refund.id,
      paymentId: refund.paymentId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      createdAt: refund.createdAt.toISOString()
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

    console.log(`[REFUNDS] Created refund ${refund.id} for payment ${paymentId}: ${refundAmount/100} ${payment.currency}`);

    res.status(201).json(response);

  } catch (error) {
    console.error('[REFUNDS] Error creating refund:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'REFUND_CREATION_FAILED'
    });
  }
});

/**
 * GET /refunds/:id
 * Get refund details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Missing x-tenant-id header',
        code: 'MISSING_TENANT_ID'
      });
    }

    const prisma = tenantPrisma(tenantId);

    const refund = await prisma.refund.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true
          }
        }
      }
    });

    if (!refund) {
      return res.status(404).json({
        error: 'Refund not found',
        code: 'REFUND_NOT_FOUND'
      });
    }

    res.json({
      id: refund.id,
      paymentId: refund.paymentId,
      provider: refund.provider,
      providerRefundId: refund.providerRefundId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      createdAt: refund.createdAt.toISOString(),
      updatedAt: refund.updatedAt.toISOString(),
      payment: refund.payment
    });

  } catch (error) {
    console.error('[REFUNDS] Error fetching refund:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'REFUND_FETCH_FAILED'
    });
  }
});

export default router;