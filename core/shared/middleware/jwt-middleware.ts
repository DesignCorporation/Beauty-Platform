import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Расширяем Request для TypeScript
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    tenantId: string
    role: string
    permissions: string[]
  }
}

// JWT токен содержит всю информацию о пользователе
interface JwtPayload {
  userId: string
  tenantId: string
  role: string
  permissions: string[]
  iat: number
  exp: number
}

// Middleware для проверки JWT токена в ЛЮБОМ сервисе
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Получаем токен из Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid token provided' })
    }

    const token = authHeader.substring(7) // убираем "Bearer "
    
    // Валидируем токен ЛОКАЛЬНО (без запросов к Auth Service!)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    
    // Добавляем информацию о пользователе в request
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
      permissions: decoded.permissions
    }
    
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    return res.status(500).json({ error: 'Token validation failed' })
  }
}

// Middleware для проверки разрешений
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }
    
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userPermissions: req.user.permissions
      })
    }
    
    next()
  }
}

// Middleware для проверки tenant изоляции
export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' })
  }
  next()
}