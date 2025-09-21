// Protected Admin Routes для демонстрации MFA
// Beauty Platform Auth Service

import express from 'express'
import { authenticate, authorize } from '../middleware/auth'
import { requireMFAVerified } from '../middleware/mfa'
import { UserRole } from '@prisma/client'
import pino from 'pino'
import { prisma } from '@beauty-platform/database'

const router = express.Router()
const logger = pino({ name: 'AdminProtectedRoutes' })

interface AuthenticatedRequest extends express.Request {
  user?: {
    userId: string
    email: string
    role: UserRole
    tenantId?: string
    mfaVerified?: boolean
    iat: number
    exp: number
    type: 'access' | 'refresh'
  }
}

/**
 * GET /auth/admin/dashboard
 * Тестовый защищенный endpoint для Super Admin
 * Требует MFA проверку в сессии
 */
router.get('/dashboard', authenticate, requireMFAVerified, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!

    logger.info({
      userId: user.userId,
      email: user.email,
      mfaVerified: user.mfaVerified
    }, 'Super Admin accessed protected dashboard')

    res.json({
      success: true,
      message: '🎉 Welcome to Super Admin Dashboard!',
      data: {
        user: {
          id: user.userId,
          email: user.email,
          role: user.role
        },
        securityStatus: {
          mfaEnabled: true,
          mfaVerified: user.mfaVerified,
          sessionSecure: true
        },
        adminStats: {
          totalSalons: 3,
          activeSessions: 5,
          systemHealth: 'excellent'
        },
        message: 'Этот endpoint защищен MFA! Вы можете его видеть только после ввода TOTP кода 🔐'
      }
    })

  } catch (error) {
    logger.error({ error, userId: req.user?.userId }, 'Protected dashboard access failed')
    res.status(500).json({
      success: false,
      error: 'Failed to access dashboard',
      code: 'DASHBOARD_ACCESS_FAILED'
    })
  }
})

/**
 * GET /auth/admin/sensitive-data
 * Еще один защищенный endpoint для тестирования
 */
router.get('/sensitive-data', authenticate, requireMFAVerified, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!

    res.json({
      success: true,
      message: '🔒 Sensitive Admin Data Access',
      data: {
        secretInfo: 'This is highly sensitive information that requires MFA',
        adminSecrets: [
          'Database backup keys',
          'API master tokens', 
          'System configuration'
        ],
        accessTime: new Date().toISOString(),
        accessedBy: user.email
      }
    })

  } catch (error) {
    logger.error({ error, userId: req.user?.userId }, 'Sensitive data access failed')
    res.status(500).json({
      success: false,
      error: 'Failed to access sensitive data',
      code: 'SENSITIVE_DATA_ACCESS_FAILED'
    })
  }
})

/**
 * GET /auth/admin/salons
 * Возвращает список всех салонов для супер-админки
 */
router.get(
  '/salons',
  authenticate,
  requireMFAVerified,
  authorize([UserRole.SUPER_ADMIN]),
  async (_req: AuthenticatedRequest, res) => {
    try {
      const salons = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              services: true
            }
          }
        }
      })

      const formatted = salons.map((salon) => ({
        id: salon.id,
        name: salon.name,
        slug: salon.slug,
        city: salon.city,
        address: salon.address,
        status: salon.status,
        isActive: salon.isActive,
        currency: salon.currency,
        language: salon.language,
        timezone: salon.timezone,
        createdAt: salon.createdAt,
        updatedAt: salon.updatedAt,
        staffCount: salon._count?.users ?? 0,
        clientsCount: salon._count?.clients ?? 0,
        servicesCount: salon._count?.services ?? 0
      }))

      const totals = {
        salons: formatted.length,
        active: formatted.filter((salon) => salon.isActive).length,
        inactive: formatted.filter((salon) => !salon.isActive).length
      }

      res.json({
        success: true,
        data: formatted,
        totals
      })
    } catch (error) {
      logger.error({ error }, 'Failed to fetch salons for admin dashboard')
      res.status(500).json({
        success: false,
        error: 'Failed to load salons',
        code: 'SALONS_FETCH_FAILED'
      })
    }
  }
)

export default router
