import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const router: Router = Router();

// 📧 Email API for Stage 5 - Temporary Implementation

// Zod schema for email request
const sendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    path: z.string()
  })).optional()
});

/**
 * POST /api/notify/email
 * Send email with optional PDF attachment
 *
 * For Stage 5: Temporary implementation without real SMTP
 * TODO: Add real email provider (nodemailer/SendGrid/AWS SES)
 */
router.post('/email', async (req: Request, res: Response) => {
  try {
    console.log('[EMAIL API] Request received:', {
      body: req.body,
      headers: req.headers['authorization'] ? 'Bearer token present' : 'No auth'
    });

    // Validate request body
    const validation = sendEmailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: validation.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    const { to, subject, html, text, attachments } = validation.data;

    // Check if PDF attachments exist
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          await fs.access(attachment.path);
          const stats = await fs.stat(attachment.path);
          console.log(`[EMAIL API] Attachment found: ${attachment.filename} (${Math.round(stats.size / 1024)} KB)`);
        } catch (error) {
          console.error(`[EMAIL API] Attachment not found: ${attachment.path}`);
          return res.status(400).json({
            error: 'Attachment Error',
            message: `Attachment not found: ${attachment.filename}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // TODO: STAGE 5 - Replace with real email provider
    // For now, simulate email sending
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[EMAIL API] 📧 SIMULATED EMAIL SENT:`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  HTML: ${html ? 'Present' : 'Not provided'}`);
    console.log(`  Text: ${text ? 'Present' : 'Not provided'}`);
    console.log(`  Attachments: ${attachments?.length || 0}`);

    if (attachments) {
      attachments.forEach(att => {
        console.log(`    - ${att.filename} (${att.path})`);
      });
    }

    // Simulate successful email delivery
    const response = {
      success: true,
      emailId,
      status: 'sent',
      to,
      subject,
      provider: 'mock_smtp',
      timestamp: new Date().toISOString(),
      message: 'Email sent successfully (simulated for Stage 5)'
    };

    // Return success response
    res.status(200).json(response);

  } catch (error) {
    console.error('[EMAIL API] Error sending email:', error);
    return res.status(500).json({
      error: 'Email Delivery Failed',
      message: 'Internal server error while sending email',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/notify/email/status
 * Get email service status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    service: 'email',
    status: 'mock_active',
    provider: 'mock_smtp',
    capabilities: ['html', 'text', 'attachments'],
    note: 'Stage 5 temporary implementation - no real SMTP configured',
    timestamp: new Date().toISOString()
  });
});

export default router;