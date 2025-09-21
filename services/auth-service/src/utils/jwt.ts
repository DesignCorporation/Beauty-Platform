// JWT Utilities - Token generation and validation
// Beauty Platform Auth Service

import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import { JWTPayload } from '../types/auth'

// JWT Configuration from environment
export const JWT_CONFIG = {
  accessSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-beauty-platform-2025',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production-beauty-platform-2025',
  accessExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
}

// Validate JWT configuration (in development we allow default secrets)
if (!JWT_CONFIG.accessSecret || !JWT_CONFIG.refreshSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables for production')
  }
  // В развработке используем fallback значения
  console.warn('Using default JWT secrets in development mode')
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: {
  userId: string
  tenantId?: string
  role: UserRole
  email: string
}): string {
  const tokenPayload = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    email: payload.email,
    type: 'access' as const
  }
  
  return (jwt.sign as any)(
    tokenPayload, 
    JWT_CONFIG.accessSecret, 
    {
      expiresIn: JWT_CONFIG.accessExpiresIn,
      issuer: 'beauty-platform-auth',
      audience: 'beauty-platform'
    }
  )
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: {
  userId: string
  tenantId?: string
  role: UserRole
  email: string
}): string {
  const tokenPayload = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    email: payload.email,
    type: 'refresh' as const
  }
  
  return (jwt.sign as any)(
    tokenPayload, 
    JWT_CONFIG.refreshSecret, 
    {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
      issuer: 'beauty-platform-auth',
      audience: 'beauty-platform'
    }
  )
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_CONFIG.accessSecret, {
      issuer: 'beauty-platform-auth',
      audience: 'beauty-platform'
    }) as JWTPayload
    
    if (payload.type !== 'access') {
      throw new Error('Invalid token type')
    }
    
    return payload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token')
    }
    throw error
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_CONFIG.refreshSecret, {
      issuer: 'beauty-platform-auth',
      audience: 'beauty-platform'
    }) as JWTPayload
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type')
    }
    
    return payload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token')
    }
    throw error
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return null
  
  return new Date(decoded.exp * 1000)
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true
  
  return expiration < new Date()
}

/**
 * Extract token from request (cookies or Authorization header)
 */
export function extractTokenFromRequest(req: any): string | null {
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

/**
 * Extract refresh token from request cookies
 */
export function extractRefreshTokenFromRequest(req: any): string | null {
  return req.cookies?.beauty_refresh_token || null
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(payload: {
  userId: string
  tenantId?: string
  role: UserRole
  email: string
}) {
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  
  return {
    accessToken,
    refreshToken,
    expiresIn: getExpiresInSeconds(JWT_CONFIG.accessExpiresIn || '15m')
  }
}

/**
 * Convert time string to seconds
 */
function getExpiresInSeconds(timeString: string): number {
  const match = timeString.match(/^(\d+)([smhd])$/)
  if (!match || !match[1] || !match[2]) return 900 // Default 15 minutes
  
  const amountStr = match[1]
  const unit = match[2]
  const amount = parseInt(amountStr, 10)
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 }
  
  return amount * (multipliers[unit as keyof typeof multipliers] || 60)
}
