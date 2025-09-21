# 🔑 JWT IMPLEMENTATION GUIDE - Beauty Platform

> **ДЛЯ РАЗРАБОТЧИКОВ**: Практическое руководство по правильной реализации JWT  
> **Уровень**: Пошаговые инструкции "для дебилов" :)  
> **Безопасность**: Enterprise Standards 2024

---

## 🎯 **ЧТО МЫ СОЗДАЕМ**

### **Система централизованной аутентификации:**

```
Auth Service (6021) → выдает JWT → Admin Panel (6002) проверяет локально
                  ↘                ↗
                    API Gateway (6020) 
                  ↗                ↘  
CRM App (6001) ← проверяет JWT ← Other Services
```

---

## 🔧 **1. НАСТРОЙКА AUTH SERVICE**

### **📦 Установка зависимостей:**

```bash
cd /root/beauty-platform/services/auth-service
pnpm add jsonwebtoken speakeasy qrcode csurf express-rate-limit
pnpm add -D @types/jsonwebtoken @types/speakeasy @types/qrcode
```

### **🔐 JWT утилиты:**

```typescript
// services/auth-service/src/utils/jwt.ts
import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  email: string
  role: 'SUPER_ADMIN' | 'SALON_OWNER' | 'STAFF_MEMBER' | 'CLIENT'
  tenantId: string | null
  permissions: string[]
  iat: number
  exp: number
  iss: string
  aud: string
}

export class JWTService {
  private static readonly SECRET = process.env.JWT_SECRET!
  private static readonly ISSUER = 'beauty-platform'
  
  // Проверяем секрет при запуске
  static validateSecret(): void {
    if (!this.SECRET || this.SECRET.length < 64) {
      throw new Error('JWT_SECRET must be at least 64 characters')
    }
  }

  // Создание access токена (15 минут)
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    return jwt.sign(
      {
        ...payload,
        iss: this.ISSUER,
        aud: this.getAudience(payload.role)
      },
      this.SECRET,
      {
        expiresIn: '15m',
        algorithm: 'HS256'
      }
    )
  }

  // Создание refresh токена (7 дней)
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      {
        userId,
        type: 'refresh',
        iss: this.ISSUER,
        aud: 'beauty-platform'
      },
      this.SECRET,
      {
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    )
  }

  // Валидация токена
  static validateToken(token: string, expectedAudience?: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.SECRET, {
        issuer: this.ISSUER,
        audience: expectedAudience,
        algorithms: ['HS256'],
        clockTolerance: 10 // 10 секунд на рассинхрон
      }) as JWTPayload

      // Дополнительные проверки
      if (!decoded.userId || !decoded.role) {
        throw new Error('Invalid token payload')
      }

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired')
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token signature')
      }
      throw new Error('Token validation failed')
    }
  }

  // Определение аудитории по роли
  private static getAudience(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'beauty-admin-panel'
      case 'SALON_OWNER':
      case 'STAFF_MEMBER':
        return 'beauty-salon-crm'
      case 'CLIENT':
        return 'beauty-client-portal'
      default:
        return 'beauty-platform'
    }
  }

  // Извлечение токена из cookie
  static extractTokenFromRequest(req: any): string | null {
    // Из httpOnly cookie (приоритет)
    if (req.cookies?.beauty_access_token) {
      return req.cookies.beauty_access_token
    }
    
    // Из Authorization header (fallback)
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    
    return null
  }
}
```

### **🛡️ Middleware для аутентификации:**

```typescript
// services/auth-service/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { JWTService, JWTPayload } from '../utils/jwt'

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
  sessionId?: string
}

// Middleware для проверки JWT
export const authenticateJWT = (requiredRole?: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = JWTService.extractTokenFromRequest(req)
      
      if (!token) {
        return res.status(401).json({
          error: 'NO_TOKEN',
          message: 'Authentication token required'
        })
      }

      // Валидируем токен
      const payload = JWTService.validateToken(token)
      
      // Проверяем роль если требуется
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({
          error: 'INSUFFICIENT_ROLE',
          message: `Required role: ${requiredRole}, got: ${payload.role}`
        })
      }

      // Сохраняем пользователя в request
      req.user = payload
      req.sessionId = `${payload.userId}-${Date.now()}`
      
      next()
    } catch (error: any) {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: error.message
      })
    }
  }
}

// Middleware для Super Admin
export const requireSuperAdmin = authenticateJWT('SUPER_ADMIN')

// Middleware для проверки tenant (мультитенантность)
export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.tenantId) {
    return res.status(400).json({
      error: 'NO_TENANT',
      message: 'Tenant ID required'
    })
  }
  next()
}
```

### **🔒 Аутентификация эндпоинты:**

```typescript
// services/auth-service/src/routes/auth.ts
import express from 'express'
import bcrypt from 'bcrypt'
import { JWTService } from '../utils/jwt'
import { auditLogger } from '../middleware/audit'

const router = express.Router()

// Логин с выдачей JWT
router.post('/login', auditLogger('AUTH_LOGIN'), async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'MISSING_CREDENTIALS',
        message: 'Email and password required'
      })
    }

    // Находим пользователя в БД
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        salon: true,
        permissions: true
      }
    })

    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      })
    }

    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS', 
        message: 'Invalid email or password'
      })
    }

    // Проверяем активность аккаунта
    if (!user.isActive) {
      return res.status(403).json({
        error: 'ACCOUNT_DISABLED',
        message: 'Account is disabled'
      })
    }

    // Собираем payload для JWT
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.salonId,
      permissions: user.permissions.map(p => p.name)
    }

    // Генерируем токены
    const accessToken = JWTService.generateAccessToken(tokenPayload)
    const refreshToken = JWTService.generateRefreshToken(user.id)

    // Сохраняем refresh token в БД
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
      }
    })

    // Устанавливаем httpOnly cookies
    res.cookie('beauty_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 минут
    })

    res.cookie('beauty_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
    })

    // Возвращаем информацию о пользователе (БЕЗ токенов!)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.salonId,
        permissions: tokenPayload.permissions
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Login failed'
    })
  }
})

// Обновление access токена через refresh токен
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.beauty_refresh_token

    if (!refreshToken) {
      return res.status(401).json({
        error: 'NO_REFRESH_TOKEN',
        message: 'Refresh token required'
      })
    }

    // Валидируем refresh токен
    const decoded = JWTService.validateToken(refreshToken)
    
    // Проверяем что токен существует в БД и не отозван
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { permissions: true } } }
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token expired or invalid'
      })
    }

    const user = storedToken.user

    // Генерируем новый access токен
    const newAccessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.salonId,
      permissions: user.permissions.map(p => p.name)
    })

    // Устанавливаем новый cookie
    res.cookie('beauty_access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    })

    res.json({ success: true })

  } catch (error) {
    res.status(401).json({
      error: 'REFRESH_FAILED',
      message: 'Token refresh failed'
    })
  }
})

// Логаут с отзывом токенов
router.post('/logout', authenticateJWT(), auditLogger('AUTH_LOGOUT'), async (req, res) => {
  try {
    const refreshToken = req.cookies.beauty_refresh_token
    
    // Удаляем refresh токен из БД
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      })
    }

    // Очищаем cookies
    res.clearCookie('beauty_access_token')
    res.clearCookie('beauty_refresh_token')

    res.json({ success: true })

  } catch (error) {
    res.status(500).json({
      error: 'LOGOUT_FAILED',
      message: 'Logout failed'
    })
  }
})

// Получение информации о текущем пользователе
router.get('/me', authenticateJWT(), (req, res) => {
  res.json({
    user: {
      id: req.user!.userId,
      email: req.user!.email,
      role: req.user!.role,
      tenantId: req.user!.tenantId,
      permissions: req.user!.permissions
    }
  })
})

export default router
```

---

## 🌐 **2. НАСТРОЙКА КЛИЕНТА (Admin Panel)**

### **🔄 Обновленный AuthContext:**

```typescript
// apps/admin-panel/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  tenantId: string | null
  permissions: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  const AUTH_API_URL = 'https://auth.beauty.designcorp.eu/auth'

  // Проверка аутентификации
  const checkAuth = async (): Promise<void> => {
    try {
      const response = await fetch(`${AUTH_API_URL}/me`, {
        credentials: 'include' // КРИТИЧНО! Отправляет httpOnly cookies
      })

      if (response.ok) {
        const { user } = await response.json()
        
        // Проверяем права доступа к админке
        if (user.role !== 'SUPER_ADMIN') {
          throw new Error('Insufficient privileges for admin panel')
        }

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        throw new Error('Not authenticated')
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  // Логин
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: 'POST',
        credentials: 'include', // КРИТИЧНО!
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const { user } = await response.json()

      // Проверяем права доступа
      if (user.role !== 'SUPER_ADMIN') {
        throw new Error('Insufficient privileges for admin panel')
      }

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }))
      throw error
    }
  }

  // Логаут
  const logout = async (): Promise<void> => {
    try {
      await fetch(`${AUTH_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include' // КРИТИЧНО!
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  // Автоматическое обновление токена
  useEffect(() => {
    // Проверяем аутентификацию при загрузке
    checkAuth()

    // Настраиваем автоматическое обновление токена
    const refreshInterval = setInterval(async () => {
      try {
        await fetch(`${AUTH_API_URL}/refresh`, {
          method: 'POST',
          credentials: 'include'
        })
      } catch (error) {
        console.error('Token refresh failed:', error)
        // При ошибке обновления перенаправляем на логин
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    }, 12 * 60 * 1000) // Обновляем каждые 12 минут

    return () => clearInterval(refreshInterval)
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
```

### **🔒 Secured API Client:**

```typescript
// apps/admin-panel/src/utils/api.ts
export class SecureApiClient {
  private baseURL = 'https://auth.beauty.designcorp.eu'

  // Безопасный запрос с автоматической обработкой токенов
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // КРИТИЧНО! Отправляет httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (response.status === 401) {
      // Токен истек, пробуем обновить
      const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      if (refreshResponse.ok) {
        // Повторяем оригинальный запрос
        return this.request(endpoint, options)
      } else {
        // Обновление не удалось, перенаправляем на логин
        window.location.href = '/login'
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Request failed')
    }

    return response.json()
  }

  // Методы для удобства
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new SecureApiClient()
```

---

## 🔐 **3. НАСТРОЙКА ДРУГИХ СЕРВИСОВ**

### **🛡️ JWT Middleware для всех сервисов:**

```typescript
// core/shared/middleware/jwt-auth.ts
import { Request, Response, NextFunction } from 'express'
import { JWTService } from '../utils/jwt'

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
    tenantId: string | null
    permissions: string[]
  }
}

// Универсальный middleware для любого сервиса
export const authenticateJWT = (requiredAudience?: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = JWTService.extractTokenFromRequest(req)
      
      if (!token) {
        return res.status(401).json({
          error: 'NO_TOKEN',
          message: 'Authentication required'
        })
      }

      // Валидируем токен с проверкой аудитории
      const payload = JWTService.validateToken(token, requiredAudience)
      
      // Добавляем пользователя в request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        permissions: payload.permissions
      }
      
      next()
    } catch (error: any) {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: error.message
      })
    }
  }
}

// Middleware для проверки разрешений
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'NOT_AUTHENTICATED',
        message: 'Authentication required'
      })
    }
    
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Permission required: ${permission}`
      })
    }
    
    next()
  }
}

// Middleware для tenant изоляции
export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.tenantId) {
    return res.status(400).json({
      error: 'NO_TENANT',
      message: 'Tenant context required'
    })
  }
  next()
}
```

### **🎯 Использование в CRM сервисе:**

```typescript
// services/crm-service/src/routes/appointments.ts
import express from 'express'
import { authenticateJWT, requirePermission, requireTenant } from '../middleware/auth'

const router = express.Router()

// Все эндпоинты требуют аутентификации для CRM
router.use(authenticateJWT('beauty-salon-crm'))
router.use(requireTenant)

// Просмотр записей
router.get('/', 
  requirePermission('appointments.read'), 
  async (req, res) => {
    const { tenantId } = req.user!
    
    // Используем tenantPrisma для изоляции
    const tprisma = tenantPrisma(tenantId!)
    const appointments = await tprisma.appointment.findMany()
    
    res.json(appointments)
  }
)

// Создание записи
router.post('/', 
  requirePermission('appointments.write'),
  async (req, res) => {
    const { tenantId } = req.user!
    
    const tprisma = tenantPrisma(tenantId!)
    const appointment = await tprisma.appointment.create({
      data: req.body
    })
    
    res.json(appointment)
  }
)

export default router
```

---

## 🔧 **4. ENVIRONMENT CONFIGURATION**

### **🌍 Environment переменные:**

```bash
# /root/beauty-platform/.env

# JWT Security (КРИТИЧНО!)
JWT_SECRET=beauty_platform_jwt_secret_key_2024_enterprise_grade_minimum_64_characters_required
JWT_ALGORITHM=HS256
JWT_ISSUER=beauty-platform

# JWT Audiences (для разных приложений)
JWT_AUDIENCE_ADMIN=beauty-admin-panel
JWT_AUDIENCE_CRM=beauty-salon-crm
JWT_AUDIENCE_CLIENT=beauty-client-portal

# Token Expiration
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_URL=postgresql://beauty_user:secure_password@localhost:5432/beauty_platform_new

# CORS Origins
CORS_ORIGINS=https://test-admin.beauty.designcorp.eu,https://test-crm.beauty.designcorp.eu

# Security
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

### **🚀 Запуск с валидацией:**

```typescript
// services/auth-service/src/server.ts
import { JWTService } from './utils/jwt'

// Проверяем конфигурацию при запуске
JWTService.validateSecret()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

console.log('✅ JWT configuration validated')
console.log('✅ Auth Service starting on port 6021')
```

---

## 🧪 **5. TESTING JWT IMPLEMENTATION**

### **🔍 Тестирование в браузере:**

```javascript
// Тест в консоли браузера (для разработки)

// 1. Логин
fetch('https://auth.beauty.designcorp.eu/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@beauty-platform.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log)

// 2. Проверка токена
fetch('https://auth.beauty.designcorp.eu/auth/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)

// 3. Логаут
fetch('https://auth.beauty.designcorp.eu/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

### **🧪 Unit тесты:**

```typescript
// services/auth-service/tests/jwt.test.ts
import { JWTService } from '../src/utils/jwt'

describe('JWT Service', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key_minimum_64_characters_for_testing_purposes_only'
  })

  test('should generate valid access token', () => {
    const payload = {
      userId: 'test-user',
      email: 'test@example.com',
      role: 'SUPER_ADMIN' as const,
      tenantId: null,
      permissions: ['admin.all']
    }

    const token = JWTService.generateAccessToken(payload)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
  })

  test('should validate token correctly', () => {
    const payload = {
      userId: 'test-user',
      email: 'test@example.com', 
      role: 'SUPER_ADMIN' as const,
      tenantId: null,
      permissions: ['admin.all']
    }

    const token = JWTService.generateAccessToken(payload)
    const decoded = JWTService.validateToken(token, 'beauty-admin-panel')

    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.role).toBe(payload.role)
    expect(decoded.aud).toBe('beauty-admin-panel')
  })

  test('should reject invalid tokens', () => {
    expect(() => {
      JWTService.validateToken('invalid-token')
    }).toThrow('Token validation failed')
  })
})
```

---

## 📋 **6. DEPLOYMENT CHECKLIST**

### **✅ Перед деплоем проверь:**

- [ ] **JWT_SECRET** минимум 64 символа
- [ ] **CORS** настроен правильно с `credentials: true`
- [ ] **nginx** проксирует cookies корректно
- [ ] **HTTPS** работает на всех доменах
- [ ] **Database** подключения безопасны
- [ ] **Error handling** не раскрывает секреты
- [ ] **Refresh tokens** удаляются при логауте
- [ ] **Rate limiting** настроен для /auth/login

### **🔍 Проверка в production:**

```bash
# Проверка HTTPS
curl -I https://auth.beauty.designcorp.eu/health

# Проверка CORS
curl -X OPTIONS https://auth.beauty.designcorp.eu/auth/login \
  -H "Origin: https://test-admin.beauty.designcorp.eu" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Проверка security headers
curl -I https://test-admin.beauty.designcorp.eu/
```

---

## 🚨 **7. TROUBLESHOOTING**

### **❌ Частые ошибки:**

#### **1. "Cookies не сохраняются"**
```typescript
// ✅ Решение:
// 1. Проверь CORS с credentials
app.use(cors({
  origin: ['https://test-admin.beauty.designcorp.eu'],
  credentials: true  // КРИТИЧНО!
}))

// 2. Проверь домены в cookies
res.cookie('token', value, {
  domain: '.beauty.designcorp.eu', // С точкой для субдоменов
  secure: true,
  sameSite: 'strict'
})

// 3. Проверь fetch запросы
fetch('/api/data', {
  credentials: 'include'  // КРИТИЧНО!
})
```

#### **2. "JWT signature verification failed"**
```typescript
// ✅ Решение:
// 1. Проверь что SECRET одинаковый во всех сервисах
// 2. Проверь алгоритм подписи
const decoded = jwt.verify(token, SECRET, {
  algorithms: ['HS256']  // Точно указываем алгоритм
})
```

#### **3. "Audience mismatch"**
```typescript
// ✅ Решение: правильная аудитория для каждого приложения
const audience = {
  'admin-panel': 'beauty-admin-panel',
  'salon-crm': 'beauty-salon-crm', 
  'client-portal': 'beauty-client-portal'
}
```

---

## 🎯 **ИТОГОВАЯ СХЕМА**

```mermaid
sequenceDiagram
    participant Client as Admin Panel
    participant Auth as Auth Service
    participant API as Other Services
    participant DB as Database
    
    Client->>Auth: POST /auth/login
    Auth->>DB: Validate credentials
    DB-->>Auth: User data
    Auth->>Auth: Generate JWT (aud: admin-panel)
    Auth-->>Client: Set httpOnly cookie
    
    Client->>API: Request with cookie
    API->>API: Validate JWT locally
    API->>API: Check audience & permissions
    API->>DB: tenantPrisma query
    DB-->>API: Tenant data
    API-->>Client: Response
    
    Client->>Auth: Auto refresh (every 12m)
    Auth->>Auth: Generate new access token
    Auth-->>Client: Update cookie
```

---

**🔑 ТЕПЕРЬ У НАС ENTERPRISE-GRADE JWT СИСТЕМА!** 🛡️

*Ready to implement! 🚀*