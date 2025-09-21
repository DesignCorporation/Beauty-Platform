// MFA Enforcement Middleware для Super Admin
// Beauty Platform Auth Service

import { Request, Response, NextFunction } from 'express'
import { UserRole } from '@prisma/client'
import { tenantPrisma } from '@beauty-platform/database'
import pino from 'pino'

const logger = pino({ name: 'MFAMiddleware' })

interface AuthenticatedRequest extends Request {
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
 * Middleware для проверки MFA требований
 * Блокирует Super Admin если MFA не пройдена
 */
export async function requireMFA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    // Только SUPER_ADMIN требует MFA (пока)
    if (user.role !== UserRole.SUPER_ADMIN) {
      return next() // Для других ролей пропускаем
    }

    // Проверяем включена ли MFA у пользователя
    const dbUser = await tenantPrisma(null).user.findUnique({
      where: { id: user.userId },
      select: { mfaEnabled: true }
    })

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }

    // Если MFA не настроена, требуем настройку
    if (!dbUser.mfaEnabled) {
      return res.status(403).json({
        success: false,
        error: 'MFA setup required for Super Admin access',
        code: 'MFA_SETUP_REQUIRED',
        action: 'SETUP_MFA',
        setupEndpoint: '/auth/mfa/setup'
      })
    }

    // Проверяем MFA cookie для этой сессии
    const mfaVerified = req.cookies?.beauty_mfa_verified === 'true'
    if (mfaVerified || user.mfaVerified) {
      req.user!.mfaVerified = true // Отмечаем в request объекте
      return next()
    }

    // Требуем MFA проверку
    return res.status(403).json({
      success: false,
      error: 'MFA verification required',
      code: 'MFA_VERIFICATION_REQUIRED',
      action: 'VERIFY_MFA',
      verifyEndpoint: '/auth/mfa/verify'
    })

  } catch (error) {
    logger.error({ error, userId: req.user?.userId }, 'MFA middleware error')
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Middleware для отметки MFA как проверенной
 * Используется после успешной MFA проверки
 */
export function markMFAVerified(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (req.user) {
    req.user.mfaVerified = true
  }
  next()
}

/**
 * Middleware для проверки что пользователь уже прошел MFA
 * Используется на защищенных админских endpoints
 */
export function requireMFAVerified(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const user = req.user

  if (!user) {
    return _res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
  }

  // Только для SUPER_ADMIN
  if (user.role !== UserRole.SUPER_ADMIN) {
    return next()
  }

  // Проверяем что MFA пройдена в этой сессии (cookie или request)
  const mfaVerified = req.cookies?.beauty_mfa_verified === 'true' || user.mfaVerified
  if (!mfaVerified) {
    return _res.status(403).json({
      success: false,
      error: 'MFA verification required for this action',
      code: 'MFA_SESSION_REQUIRED',
      action: 'VERIFY_MFA',
      verifyEndpoint: '/auth/mfa/verify'
    })
  }
  
  // Отмечаем в request для следующих middleware
  req.user!.mfaVerified = true

  next()
}