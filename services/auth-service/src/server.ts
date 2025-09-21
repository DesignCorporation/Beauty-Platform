// Beauty Platform Auth Service Server
// Express server with JWT authentication and authorization

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import pino from 'pino'
import pinoHttp from 'pino-http'
import dotenv from 'dotenv'
// Unused imports commented out
// import https from 'https'
// import fs from 'fs'
// import path from 'path'
// import authRoutes from './routes/auth'
import authSecureRoutes from './routes/auth-secure'
import clientAuthRoutes from './routes/client-auth'
import salonRegistrationRoutes from './routes/salon-registration'
import mfaRoutes from './routes/mfa'
import adminProtectedRoutes from './routes/admin-protected'

// Load environment variables
dotenv.config()

const app: express.Application = express()
const PORT = parseInt(process.env.PORT || '6021', 10)

// Trust proxy for nginx
app.set('trust proxy', 1)

// Logger configuration
const loggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  })
}
const logger = pino(loggerOptions)

// HTTP request logger
app.use(pinoHttp({ logger }))

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from Beauty Platform domains
    const allowedOrigins = [
      'http://localhost:6001',           // Salon CRM (dev)
      'http://localhost:6002',           // Admin Panel (dev)
      'http://localhost:6003',           // Client Booking (dev)
      'http://localhost:6004',           // Public Websites (dev)
      'https://test-crm.beauty.designcorp.eu',     // Production CRM
      'https://test-admin.beauty.designcorp.eu',   // Production Test Admin
      'https://admin.beauty.designcorp.eu',        // Production Admin
      'https://client.beauty.designcorp.eu',       // Production Client Portal
      'https://book.beauty.designcorp.eu',         // Production Booking
      'https://beauty.designcorp.eu',              // Production Landing
      `http://135.181.156.117:6001`,              // Direct IP access
      `http://135.181.156.117:6002`,
      `http://135.181.156.117:6003`,
      `http://135.181.156.117:6004`
    ]

    // Allow requests with no origin (e.g. mobile apps, Postman)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      // Return the actual origin that made the request, not first from array
      callback(null, origin)
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
}))

// Global rate limiting - временно отключен в development
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REQUESTS || '1000'), // Увеличенный лимит для development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    code: 'GLOBAL_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Rate limiting DISABLED in development mode for:', req.path)
      return true
    }
    return req.path === '/health' || req.path === '/auth/health'
  }
})

app.use(globalRateLimit)

// Cookie parsing middleware (КРИТИЧНО для httpOnly cookies!)
app.use(cookieParser())

// CSRF Protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS только в продакшене
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 час
  },
  // Исключения для endpoints, которые не требуют CSRF (GET запросы и публичные API)
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  // Настройка для работы с SPA - токен может быть в заголовке или теле
  value: function (req) {
    return req.headers['x-csrf-token'] || 
           (req.body && req.body._csrf) || 
           (req.query && req.query._csrf)
  }
})

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (_req, _res, buf) => {
    // Разрешаем пустое тело запроса (для refresh/logout endpoints)
    if (buf.length === 0) return
    
    try {
      JSON.parse(buf.toString())
    } catch (e) {
      logger.error('Invalid JSON in request body')
      throw new Error('Invalid JSON')
    }
  }
}))

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}))

// Health check endpoint (без CSRF)
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'auth-service',
    version: '1.0.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
    }
  })
})

// CSRF token endpoint (без защиты, т.к. выдает токен)
app.get('/auth/csrf-token', csrfProtection, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken(),
    message: 'CSRF token generated successfully'
  })
})

// Middleware для условного применения CSRF защиты
const conditionalCSRF = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 🚨 КРИТИЧНО: НЕ УДАЛЯТЬ НИКАКИХ ИСКЛЮЧЕНИЙ БЕЗ ПОЛНОГО ПОНИМАНИЯ ПОСЛЕДСТВИЙ!
  // ВАЖНО: req.path НЕ включает базовый /auth prefix! Используйте ТОЛЬКО относительные пути!
  const csrfExceptions = [
    'GET /health',          // req.path для /auth/health
    'GET /me',              // req.path для /auth/me  
    'GET /permissions',     // req.path для /auth/permissions
    'GET /csrf-token',      // req.path для /auth/csrf-token
    'GET /force-logout',    // req.path для /auth/force-logout
    'POST /login',          // 🚨 КРИТИЧНО: БЕЗ ЭТОГО НИКТО НЕ МОЖЕТ ВОЙТИ В СИСТЕМУ!
    'POST /refresh',        // Критично для SPA - refresh должен работать без CSRF
    'POST /logout',         // ВРЕМЕННО: для исправления logout проблемы
    'GET /mfa/status',      // ВРЕМЕННО: для тестирования MFA
    'POST /mfa/setup/initiate', // ВРЕМЕННО: для тестирования MFA
    'POST /mfa/verify',     // ВРЕМЕННО: для тестирования MFA
    'POST /mfa/disable',    // ВРЕМЕННО: для тестирования MFA
    'POST /mfa/complete-login', // ВРЕМЕННО: для тестирования MFA
    'POST /mfa/test-db-update', // ДИАГНОСТИКА: тестирование БД обновления
    'POST /mfa/fix-admin-mfa',  // ДИАГНОСТИКА: исправление MFA для админа
    // Client auth endpoints (нужны для SPA клиентского портала)
    'POST /register-client',  // Регистрация клиентов
    'POST /login-client',     // Вход клиентов
    'POST /logout-client',    // Выход клиентов
    'GET /client/profile',    // Профиль клиента
    // 🚨 ВНИМАНИЕ: Express req.path = относительный путь БЕЗ /auth префикса!
  ]
  
  const routeKey = `${req.method} ${req.path}`
  
  console.log(`🔐 CSRF Check: ${routeKey} - Exception: ${csrfExceptions.includes(routeKey)}`)
  
  if (csrfExceptions.includes(routeKey)) {
    // Пропускаем CSRF для этих endpoints
    console.log(`✅ CSRF Skipped for: ${routeKey}`)
    next()
  } else {
    // Применяем CSRF защиту для остальных
    csrfProtection(req, res, next)
  }
}

// Debug middleware for all requests
app.use((req, res, next) => {
  console.log(`🔍 Auth Service Request: ${req.method} ${req.path} - Headers:`, {
    host: req.headers.host,
    'x-forwarded-by': req.headers['x-forwarded-by'],
    'x-target-service': req.headers['x-target-service'],
    'authorization': req.headers.authorization ? 'present' : 'missing'
  });
  next();
});

// MFA routes (without CSRF protection for now - TEMPORARY) - MUST BE FIRST!
app.use('/auth/mfa', mfaRoutes)

// API routes - используем условную CSRF защиту для критичных SPA endpoints
app.use('/auth', conditionalCSRF, authSecureRoutes)

// TEMPORARY: Add API routes for debugging proxy issues
app.use('/api/auth', conditionalCSRF, authSecureRoutes)

// Client authentication routes (специальные endpoints для клиентского портала)
app.use('/auth', conditionalCSRF, clientAuthRoutes)

// Protected admin routes (requires MFA verification)
app.use('/auth/admin', conditionalCSRF, adminProtectedRoutes)
app.use('/api/auth/admin', conditionalCSRF, adminProtectedRoutes)

// Salon registration routes (without CSRF for easier integration)
app.use('/salon-registration', salonRegistrationRoutes)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Beauty Platform Auth Service',
    version: '1.0.0',
    docs: '/auth/health',
    endpoints: {
      auth: {
        csrfToken: 'GET /auth/csrf-token',
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me',
        permissions: 'GET /auth/permissions',
        changePassword: 'POST /auth/change-password'
      },
      client: {
        register: 'POST /auth/register-client',
        login: 'POST /auth/login-client',
        logout: 'POST /auth/logout-client',
        profile: 'GET /auth/client/profile',
        updateProfile: 'PUT /auth/client/profile'
      },
      mfa: {
        setup: 'POST /auth/mfa/setup',
        verify: 'POST /auth/mfa/verify',
        disable: 'POST /auth/mfa/disable',
        status: 'GET /auth/mfa/status'
      }
    }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  })
})

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }, 'Unhandled error')

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(error.status || 500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: error.stack })
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start server (HTTP for simplicity in development)
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info({
    port: PORT,
    protocol: 'HTTP',
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    security: 'helmet + rate limiting',
    logging: 'pino'
  }, `🔐 Beauty Platform Auth Service started`)
  
  logger.info(`📡 Health check: http://135.181.156.117:${PORT}/health`)
  logger.info(`🔑 Auth endpoints: http://135.181.156.117:${PORT}/auth/*`)
})

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`)
    process.exit(1)
  } else {
    logger.error(error, 'Server error')
  }
})

export default app
