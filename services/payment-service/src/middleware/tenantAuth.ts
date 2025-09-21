import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 🔐 JWT Token interface следуя стандартам проекта
interface JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// 🔐 Расширяем Request interface для tenantId
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: string;
    }
  }
}

// 🔐 КРИТИЧНО: Tenant Auth Middleware (следует архитектуре проекта)
export const tenantAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Получаем токен из httpOnly cookie (приоритет #1)
    let token = req.cookies?.beauty_access_token;

    // 2. Fallback: Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No valid token provided'
      });
    }

    // 3. Валидируем JWT токен
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('SECURITY ERROR: JWT_SECRET not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication system misconfigured'
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // 4. Проверяем обязательные поля
    if (!decoded.tenantId || !decoded.userId) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token missing required tenant information'
      });
    }

    // 5. Проверяем тип токена (должен быть access)
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Access token required'
      });
    }

    // 6. Добавляем данные в request
    req.user = decoded;
    req.tenantId = decoded.tenantId;

    // 7. Логирование для отладки (как в других сервисах)
    console.log(`🔐 Payment Service Auth: ${decoded.email} (tenant: ${decoded.tenantId}, role: ${decoded.role})`);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your session'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal authentication error'
    });
  }
};

// 🔐 Middleware для проверки роли (опционально)
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Role ${req.user.role} not authorized for this action`
      });
    }

    next();
  };
};