import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import fs from 'fs';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-beauty-platform-2025';
const AUTH_LOG_PATH = process.env.CRM_AUTH_LOG_PATH || '/root/beauty-platform/logs/crm-api-auth.log';

const writeAuthLog = (data: Record<string, unknown>) => {
  try {
    const logLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    });

    fs.appendFileSync(AUTH_LOG_PATH, `${logLine}\n`);
  } catch (logError) {
    console.error('Failed to write auth log:', logError instanceof Error ? logError.message : logError);
  }
};

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Проверяем httpOnly cookies (приоритет) - ИСПРАВЛЕНИЕ: правильное имя cookie
    const cookieToken = req.cookies?.beauty_token || req.cookies?.beauty_access_token;

    // Fallback на Authorization header
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No access token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
    if (typeof decoded === 'string') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token payload'
      });
    }

    const { userId, tenantId, role, email } = decoded as JwtPayload & {
      userId?: string;
      tenantId?: string;
      role?: string;
      email?: string;
    };

    if (!tenantId || !userId || !role || !email) {
      return res.status(403).json({
        success: false,
        error: 'Tenant access denied',
        message: 'Token missing required fields'
      });
    }

    const authLogPayload = {
      userId,
      tenantId,
      role,
      email,
      path: req.path,
      method: req.method,
      source: cookieToken ? 'cookie' : 'header'
    };

    console.log('🔐 [AUTH] Verified JWT:', authLogPayload);
    writeAuthLog(authLogPayload);

    req.user = {
      userId,
      tenantId,
      role,
      email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    writeAuthLog({
      error: error instanceof Error ? error.message : 'Unknown auth middleware error',
      path: req.path,
      method: req.method
    });
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please refresh your session'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};
