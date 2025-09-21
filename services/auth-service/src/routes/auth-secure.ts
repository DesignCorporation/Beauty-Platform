// Secure Authentication Routes with httpOnly Cookies
// Beauty Platform Auth Service - Enterprise Security 2024

import express from 'express'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import { tenantPrisma } from '@beauty-platform/database'
import { 
  generateTokenPair, 
  verifyAccessToken, 
  verifyRefreshToken,
  extractTokenFromRequest,
  extractRefreshTokenFromRequest
} from '../utils/jwt'

const router: express.Router = express.Router()

// Rate limiting для auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток на окно
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
})

const refreshRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 20, // 20 попыток для refresh
  message: {
    success: false,
    error: 'Too many token refresh attempts',
    code: 'RATE_LIMIT_EXCEEDED'
  }
})

/**
 * Настройки безопасных cookies
 */
const COOKIE_CONFIG = {
  httpOnly: true, // Защита от XSS
  secure: process.env.NODE_ENV === 'production', // HTTPS только в продакшене
  sameSite: 'strict' as const, // CSRF protection
  domain: process.env.NODE_ENV === 'production' ? '.beauty.designcorp.eu' : undefined,
  path: '/'
}

/**
 * POST /auth/login
 * Аутентификация с выдачей httpOnly cookies
 */
router.post('/login', authRateLimit, async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Email and password required'
      })
      return
    }

    // Находим пользователя
    const user = await tenantPrisma(null).user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      })
      return
    }

    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.password || '')
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      })
      return
    }

    // Проверяем активность аккаунта
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'Account is disabled'
      })
      return
    }

    // 🛡️ MFA CHECK: Проверяем требуется ли MFA для SUPER_ADMIN
    console.log('🔐 MFA Check (auth-secure):', {
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      shouldRequireMFA: user.role === 'SUPER_ADMIN' && user.mfaEnabled
    })
    
    if (user.role === 'SUPER_ADMIN' && user.mfaEnabled) {
      console.log('🛡️ MFA REQUIRED: Returning MFA challenge for', user.email)
      res.status(200).json({
        success: false,
        error: 'MFA verification required',
        code: 'MFA_REQUIRED',
        mfaRequired: true,
        userId: user.id,
        email: user.email,
        role: user.role
      })
      return
    }

    // Генерируем токены
    const tokenPair = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined
    })

    // Сохраняем refresh token в БД
    await tenantPrisma(null).refreshToken.create({
      data: {
        token: tokenPair.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
      }
    })

    // Устанавливаем httpOnly cookies
    res.cookie('beauty_access_token', tokenPair.accessToken, {
      ...COOKIE_CONFIG,
      maxAge: 12 * 60 * 60 * 1000 // 12 часов
    })

    res.cookie('beauty_refresh_token', tokenPair.refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
    })

    // Возвращаем информацию о пользователе (БЕЗ токенов!)
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId || undefined,
        tenant: user.tenant
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Login failed'
    })
  }
})

/**
 * POST /auth/refresh
 * Обновление access токена через refresh токен из cookie
 */
router.post('/refresh', refreshRateLimit, async (req, res): Promise<void> => {
  try {
    const refreshToken = extractRefreshTokenFromRequest(req)

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'NO_REFRESH_TOKEN',
        message: 'Refresh token required'
      })
      return
    }

    // Валидируем refresh токен
    try {
      verifyRefreshToken(refreshToken)
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      })
      return
    }

    // Проверяем что токен существует в БД и не отозван
    const storedToken = await tenantPrisma(null).refreshToken.findUnique({
      where: { token: refreshToken },
      include: { 
        user: { 
          include: { 
            tenant: { select: { id: true, name: true, slug: true } }
          } 
        } 
      }
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token expired or revoked'
      })
      return
    }

    const user = storedToken.user

    // Генерируем новый access токен
    const tokenPair = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined
    })

    // Обновляем access token cookie
    res.cookie('beauty_access_token', tokenPair.accessToken, {
      ...COOKIE_CONFIG,
      maxAge: 12 * 60 * 60 * 1000 // 12 часов
    })

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId || undefined,
        tenant: user.tenant
      }
    })

  } catch (error) {
    console.error('Refresh error:', error)
    res.status(401).json({
      success: false,
      error: 'REFRESH_FAILED',
      message: 'Token refresh failed'
    })
  }
})

/**
 * GET /auth/force-logout
 * Принудительная очистка всех cookies (для экстренных случаев)
 */
router.get('/force-logout', async (_req, res) => {
  try {
    // Очищаем все cookies связанные с аутентификацией
    res.clearCookie('beauty_access_token', {
      ...COOKIE_CONFIG,
      maxAge: 0
    })
    
    res.clearCookie('beauty_refresh_token', {
      ...COOKIE_CONFIG,
      maxAge: 0
    })
    
    res.clearCookie('beauty_mfa_verified', {
      ...COOKIE_CONFIG,
      maxAge: 0
    })
    
    res.clearCookie('_csrf', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    })
    
    res.json({
      success: true,
      message: 'All authentication cookies cleared'
    })
  } catch (error) {
    console.error('Force logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to clear cookies'
    })
  }
})

/**
 * POST /auth/logout
 * Выход с отзывом refresh токена
 */
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = extractRefreshTokenFromRequest(req)
    
    // Удаляем refresh токен из БД если он есть
    if (refreshToken) {
      await tenantPrisma(null).refreshToken.deleteMany({
        where: { token: refreshToken }
      })
    }

    // Очищаем cookies
    res.clearCookie('beauty_access_token', {
      ...COOKIE_CONFIG,
      maxAge: 0
    })
    
    res.clearCookie('beauty_refresh_token', {
      ...COOKIE_CONFIG,
      maxAge: 0
    })

    res.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'LOGOUT_FAILED',
      message: 'Logout failed'
    })
  }
})

/**
 * GET /auth/me
 * Получение информации о текущем пользователе
 */
router.get('/me', async (req, res): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req)
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Authentication token required'
      })
      return
    }

    // Валидируем access токен
    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      })
      return
    }

    // Получаем актуальную информацию о пользователе
    const user = await tenantPrisma(null).user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found or disabled'
      })
      return
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId || undefined,
        tenant: user.tenant
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get user info'
    })
  }
})

/**
 * GET /auth/health
 * Health check для auth service
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'auth-service',
    version: '1.0.0',
    features: {
      httpOnlyCookies: true,
      jwtValidation: true,
      refreshTokens: true,
      rateLimiting: true,
      securityHeaders: true,
      csrfProtection: true
    },
    timestamp: new Date().toISOString()
  })
})

export default router
