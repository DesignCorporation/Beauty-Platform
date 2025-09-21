import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, RequestContext } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Базовый middleware для JWT аутентификации и tenant isolation
 * TODO: В будущем заменить на shared-middleware пакет
 */
export const tenantAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Попытка получить токен из различных источников
    let token: string | undefined;

    // 1. httpOnly cookies (приоритет)
    token = req.cookies?.beauty_access_token ||
            req.cookies?.beauty_client_access_token ||
            req.cookies?.beauty_token;

    // 2. Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No valid token provided'
      });
      return;
    }

    // Верификация токена
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded.userId || !decoded.tenantId) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token missing required fields'
      });
      return;
    }

    // Установка контекста запроса с полной изоляцией
    req.context = {
      user: decoded,
      tenantId: decoded.tenantId,
      userId: decoded.userId
    };

    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional auth - устанавливает контекст если токен есть, но не требует его
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    token = req.cookies?.beauty_access_token ||
            req.cookies?.beauty_client_access_token ||
            req.cookies?.beauty_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      if (decoded.userId && decoded.tenantId) {
        req.context = {
          user: decoded,
          tenantId: decoded.tenantId
        };
      }
    }

    next();
  } catch (error) {
    // Игнорируем ошибки в optional auth
    next();
  }
};