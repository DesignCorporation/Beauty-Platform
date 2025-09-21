// Client Authentication Routes для Beauty Platform
// Специализированные endpoints для портала клиентов

import express from 'express'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import { UserRole } from '@prisma/client'
import { tenantPrisma } from '@beauty-platform/database'
import { generateTokenPair } from '../utils/jwt'
import { authenticate } from '../middleware/auth'
import pino from 'pino'

const router: express.Router = express.Router()
const logger = pino({ name: 'ClientAuth' })

// Rate limiting для client auth (мягче чем для админов)
const clientAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // 10 попыток для клиентов
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Настройки cookies для клиентов
const CLIENT_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Более мягкий для клиентов (удобство UX)
  domain: process.env.NODE_ENV === 'production' ? '.beauty.designcorp.eu' : undefined,
  path: '/'
}

// Типы для валидации
interface ClientRegistrationData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  salonId?: string // Опционально - к какому салону привязывается
}

interface ClientLoginData {
  email: string
  password: string
}

/**
 * POST /auth/register-client
 * Регистрация нового клиента
 */
router.post('/register-client', clientAuthRateLimit, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, salonId }: ClientRegistrationData = req.body

    // Валидация входных данных
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email and password are required',
        code: 'VALIDATION_ERROR'
      })
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      })
    }

    // Валидация пароля
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
        code: 'WEAK_PASSWORD'
      })
    }

    // Проверка существования пользователя
    const existingUser = await tenantPrisma(null).user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      })
    }

    // Хеширование пароля
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Создание пользователя-клиента
    const newUser = await tenantPrisma(null).user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        role: UserRole.CLIENT, // Всегда CLIENT
        tenantId: salonId || null, // Привязка к салону (опционально)
        isActive: true,
        status: 'ACTIVE', // Клиенты активны сразу
        emailVerified: false // Требует подтверждения email
      }
    })

    logger.info({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      tenantId: newUser.tenantId,
      action: 'client_registered'
    }, 'New client registered successfully')

    // Генерация токенов для автоматического входа
    const tokens = generateTokenPair({
      userId: newUser.id,
      tenantId: newUser.tenantId,
      role: newUser.role,
      email: newUser.email
    })

    // Сохранение refresh токена
    await tenantPrisma(null).refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
      }
    })

    // Установка httpOnly cookies
    res.cookie('beauty_client_access_token', tokens.accessToken, {
      ...CLIENT_COOKIE_CONFIG,
      maxAge: 15 * 60 * 1000 // 15 минут
    })

    res.cookie('beauty_client_refresh_token', tokens.refreshToken, {
      ...CLIENT_COOKIE_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
    })

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Beauty Platform!',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tenantId: newUser.tenantId,
        emailVerified: newUser.emailVerified
      }
    })

  } catch (error) {
    logger.error({ error }, 'Client registration failed')
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * POST /auth/login-client
 * Вход клиента в систему
 */
router.post('/login-client', clientAuthRateLimit, async (req, res) => {
  try {
    const { email, password }: ClientLoginData = req.body

    // Валидация входных данных
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'VALIDATION_ERROR'
      })
    }

    // Поиск пользователя-клиента
    const user = await tenantPrisma(null).user.findUnique({
      where: { 
        email: email.toLowerCase().trim()
      }
    })

    if (!user || user.role !== UserRole.CLIENT) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      })
    }

    // Проверка статуса аккаунта
    if (!user.isActive || user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account is not active. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      })
    }

    // Проверка пароля
    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      })
    }

    // Генерация токенов
    const tokens = generateTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    })

    // Удаление старых refresh токенов пользователя
    await tenantPrisma(null).refreshToken.deleteMany({
      where: { userId: user.id }
    })

    // Сохранение нового refresh токена
    await tenantPrisma(null).refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    // Установка httpOnly cookies
    res.cookie('beauty_client_access_token', tokens.accessToken, {
      ...CLIENT_COOKIE_CONFIG,
      maxAge: 15 * 60 * 1000
    })

    res.cookie('beauty_client_refresh_token', tokens.refreshToken, {
      ...CLIENT_COOKIE_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    logger.info({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      action: 'client_login'
    }, 'Client logged in successfully')

    return res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        emailVerified: user.emailVerified
      }
    })

  } catch (error) {
    logger.error({ error }, 'Client login failed')
    return res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * POST /auth/logout-client
 * Выход клиента из системы
 */
router.post('/logout-client', async (req, res) => {
  try {
    // Извлечение refresh токена из cookies
    const refreshToken = req.cookies?.beauty_client_refresh_token

    if (refreshToken) {
      // Удаление refresh токена из БД
      await tenantPrisma(null).refreshToken.deleteMany({
        where: { token: refreshToken }
      })
    }

    // Очистка cookies
    res.clearCookie('beauty_client_access_token', CLIENT_COOKIE_CONFIG)
    res.clearCookie('beauty_client_refresh_token', CLIENT_COOKIE_CONFIG)

    logger.info({ action: 'client_logout' }, 'Client logged out')

    return res.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    logger.error({ error }, 'Client logout failed')
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /auth/client/profile
 * Получение профиля клиента (требует аутентификации)
 */
router.get('/client/profile', authenticate, async (req, res) => {
  try {
    const user = (req as any).user

    // Проверка что это клиент
    if (!user || user.role !== UserRole.CLIENT) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Client access required.',
        code: 'ACCESS_DENIED'
      })
    }

    // Получение актуальных данных клиента
    const clientData = await tenantPrisma(null).user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        tenantId: true,
        isActive: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!clientData) {
      return res.status(404).json({
        success: false,
        error: 'Client profile not found',
        code: 'NOT_FOUND'
      })
    }

    return res.json({
      success: true,
      data: clientData
    })

  } catch (error) {
    logger.error({ error }, 'Failed to get client profile')
    return res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * PUT /auth/client/profile
 * Обновление профиля клиента
 */
router.put('/client/profile', authenticate, async (req, res) => {
  try {
    const user = (req as any).user
    const { firstName, lastName, phone } = req.body

    // Проверка что это клиент
    if (!user || user.role !== UserRole.CLIENT) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Client access required.',
        code: 'ACCESS_DENIED'
      })
    }

    // Валидация данных
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required',
        code: 'VALIDATION_ERROR'
      })
    }

    // Обновление профиля
    const updatedClient = await tenantPrisma(null).user.update({
      where: { id: user.userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        tenantId: true,
        emailVerified: true,
        updatedAt: true
      }
    })

    logger.info({
      userId: user.userId,
      action: 'client_profile_updated'
    }, 'Client profile updated')

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedClient
    })

  } catch (error) {
    logger.error({ error }, 'Failed to update client profile')
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'INTERNAL_ERROR'
    })
  }
})

export default router