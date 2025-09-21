// Authentication & Authorization Middleware
// Beauty Platform Auth Service

import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AuthService } from '../services/AuthService'
import { UserRole } from '@prisma/client'
import { JWTPayload } from '../types/auth'

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      tenant?: {
        id: string
        slug: string
      }
    }
  }
}

const authService = new AuthService()

/**
 * Middleware to authenticate requests using JWT tokens
 * Supports both Authorization header and httpOnly cookies
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Try to get token from Authorization header first (for API clients)
    let token: string | undefined
    
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7) // Remove 'Bearer ' prefix
    }
    
    // If no Authorization header, try httpOnly cookie (for web clients)
    if (!token && req.cookies?.beauty_access_token) {
      token = req.cookies.beauty_access_token
    }
    
    // Also try client-specific cookie for client portal
    if (!token && req.cookies?.beauty_client_access_token) {
      token = req.cookies.beauty_client_access_token
    }
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token',
        code: 'MISSING_TOKEN'
      })
      return
    }
    
    try {
      const payload = verifyAccessToken(token)
      req.user = payload
      
      // Add tenant info if available
      if (payload.tenantId) {
        req.tenant = {
          id: payload.tenantId,
          slug: '' // Will be populated from database if needed
        }
      }
      
      next()
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      })
      return
    }
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Middleware to authorize requests based on user roles
 * @param allowedRoles - Array of roles that can access this endpoint
 */
export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles
        }
      })
      return
    }

    next()
  }
}

/**
 * Middleware to check specific permissions
 * @param resource - Resource name (e.g., 'appointments', 'clients')
 * @param action - Action name (e.g., 'create', 'read', 'update', 'delete')
 * @param scope - Scope of permission ('own', 'tenant', 'all')
 */
export function requirePermission(
  resource: string, 
  action: string, 
  scope: 'own' | 'tenant' | 'all' = 'tenant'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
      return
    }

    const hasPermission = authService.hasPermission(req.user.role, resource, action, scope)
    
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        details: {
          resource,
          action,
          scope,
          userRole: req.user.role
        }
      })
      return
    }

    next()
  }
}

/**
 * Middleware to ensure tenant isolation
 * Automatically filters requests by tenant ID
 */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
    return
  }

  // SUPER_ADMIN can access all tenants
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next()
    return
  }

  // All other roles must have a tenant
  if (!req.user.tenantId) {
    res.status(403).json({
      success: false,
      error: 'Tenant access required',
      code: 'TENANT_REQUIRED'
    })
    return
  }

  next()
}

/**
 * Middleware to validate tenant access
 * Checks if user belongs to the tenant specified in request
 */
export function validateTenantAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
    return
  }

  // SUPER_ADMIN can access all tenants
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next()
    return
  }

  // Get tenant ID from request (could be in params, body, or query)
  const requestTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId

  if (requestTenantId && req.user.tenantId !== requestTenantId) {
    res.status(403).json({
      success: false,
      error: 'Tenant access denied',
      code: 'TENANT_ACCESS_DENIED',
      details: {
        userTenant: req.user.tenantId,
        requestedTenant: requestTenantId
      }
    })
    return
  }

  next()
}

/**
 * Middleware for Super Admin only access
 */
export const requireSuperAdmin = authorize([UserRole.SUPER_ADMIN])

/**
 * Middleware for Salon Owner and above access
 */
export const requireOwnerOrAdmin = authorize([UserRole.SUPER_ADMIN, UserRole.SALON_OWNER])

/**
 * Middleware for Manager and above access
 */
export const requireManagerOrAbove = authorize([
  UserRole.SUPER_ADMIN, 
  UserRole.SALON_OWNER, 
  UserRole.MANAGER
])

/**
 * Middleware for Staff and above access (excluding clients)
 */
export const requireStaffOrAbove = authorize([
  UserRole.SUPER_ADMIN,
  UserRole.SALON_OWNER,
  UserRole.MANAGER,
  UserRole.STAFF_MEMBER,
  UserRole.RECEPTIONIST,
  UserRole.ACCOUNTANT
])

/**
 * Optional authentication - sets user if token is provided
 * Useful for endpoints that work for both authenticated and anonymous users
 * Supports both Authorization header and httpOnly cookies
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  // Try to get token from Authorization header first (for API clients)
  let token: string | undefined
  
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7) // Remove 'Bearer ' prefix
  }
  
  // If no Authorization header, try httpOnly cookie (for web clients)
  if (!token && req.cookies?.beauty_access_token) {
    token = req.cookies.beauty_access_token
  }
  
  // Also try client-specific cookie for client portal
  if (!token && req.cookies?.beauty_client_access_token) {
    token = req.cookies.beauty_client_access_token
  }
  
  if (!token) {
    next() // Continue without authentication
    return
  }
  
  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    
    if (payload.tenantId) {
      req.tenant = {
        id: payload.tenantId,
        slug: ''
      }
    }
  } catch (error) {
    // Ignore token errors for optional auth
    console.warn('Optional auth token error:', error)
  }
  
  next()
}