import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export interface TenantRequest extends AuthenticatedRequest {
  tenantId: string;
}

export const validateTenant = (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Tenant access denied',
        message: 'No tenant ID found in token'
      });
    }
    
    // Добавляем tenantId в request для удобства
    req.tenantId = req.user.tenantId;
    
    // Логируем tenant access для аудита
    console.log(`[TENANT ACCESS] User ${req.user.email} accessing tenant ${req.user.tenantId} - ${req.method} ${req.path}`);
    
    next();
  } catch (error) {
    console.error('Tenant validation error:', error);
    
    return res.status(403).json({
      success: false,
      error: 'Tenant validation failed'
    });
  }
};