// Auth Service - Core authentication logic
// Beauty Platform Authentication & Authorization

import bcrypt from 'bcrypt'
import { UserRole, EntityStatus } from '@prisma/client'
import { tenantPrisma } from '@beauty-platform/database'
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt'
import { RolePermissions, Permission } from '../types/auth'
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  AuthError,
  AuthResponseWithMFA,
  RefreshTokenRequest 
} from '../types/auth'

export class AuthService {
  private readonly bcryptRounds: number

  constructor() {
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
  }

  /**
   * Authenticate user with email and password
   */
  async login(request: LoginRequest): Promise<AuthResponse | AuthResponseWithMFA | AuthError> {
    try {
      const { email, password, tenantSlug } = request

      // Find user by email with MFA fields (using global prisma for auth)
      let user = await tenantPrisma(null).user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          password: true,
          role: true,
          tenantId: true,
          status: true,
          isActive: true,
          mfaEnabled: true,      // ✅ Добавляем MFA поле!
          mfaSecret: true,       // ✅ Нужно для проверки
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
              isActive: true
            }
          }
        }
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      }

      // Verify password
      console.log('🔑 Password Check:', {
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password?.length
      })
      const isPasswordValid = await bcrypt.compare(password, user.password)
      console.log('🔑 Password Valid:', isPasswordValid)
      
      if (!isPasswordValid) {
        // Log failed attempt
        await this.logLoginAttempt(email, false)
        
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      }

      // Check user status
      if (user.status !== EntityStatus.ACTIVE || !user.isActive) {
        return {
          success: false,
          error: 'User account is not active',
          code: 'ACCOUNT_INACTIVE'
        }
      }

      // Check tenant status (if user belongs to tenant)
      if (user.tenant && (!user.tenant.isActive || user.tenant.status !== EntityStatus.ACTIVE)) {
        return {
          success: false,
          error: 'Salon account is not active',
          code: 'TENANT_INACTIVE'
        }
      }

      // Verify tenant slug matches (if provided)
      if (tenantSlug && user.tenant?.slug !== tenantSlug) {
        return {
          success: false,
          error: 'Invalid salon access',
          code: 'TENANT_MISMATCH'
        }
      }

      // 🛡️ MFA CHECK: Проверяем требуется ли MFA для SUPER_ADMIN
      console.log('🔐 MFA Check:', {
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        shouldRequireMFA: user.role === UserRole.SUPER_ADMIN && user.mfaEnabled
      })
      
      if (user.role === UserRole.SUPER_ADMIN && user.mfaEnabled) {
        // Для SUPER_ADMIN с включенной MFA возвращаем специальный статус
        // Frontend должен запросить MFA токен перед получением полных токенов
        console.log('🛡️ MFA REQUIRED: Returning MFA challenge for', user.email)
        
        // Log partial login (пароль правильный, но нужна MFA)
        await this.logLoginAttempt(email, true, user.id, 'MFA_REQUIRED')
        
        return {
          success: false, // false, но это НЕ ошибка - это требование MFA
          error: 'MFA verification required',
          code: 'MFA_REQUIRED',
          mfaRequired: true,
          userId: user.id, // Нужен для следующего шага MFA
          email: user.email,
          role: user.role
        }
      }

      // Если SUPER_ADMIN БЕЗ MFA - требуем настройку MFA
      if (user.role === UserRole.SUPER_ADMIN && !user.mfaEnabled) {
        // Выдаем ограниченный токен для настройки MFA
        const limitedTokens = generateTokenPair({
          userId: user.id,
          tenantId: user.tenantId as string | undefined,
          role: user.role,
          email: user.email
        })

        // Store refresh token
        await tenantPrisma(null).refreshToken.create({
          data: {
            token: limitedTokens.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })

        // Log partial login
        await this.logLoginAttempt(email, true, user.id, 'MFA_SETUP_REQUIRED')

        return {
          success: true,
          accessToken: limitedTokens.accessToken,
          refreshToken: limitedTokens.refreshToken,
          expiresIn: limitedTokens.expiresIn,
          mfaSetupRequired: true, // Указываем что нужно настроить MFA
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
            tenantSlug: undefined,
            tenantName: undefined
          }
        }
      }

      // Обычный login для всех остальных ролей или SUPER_ADMIN после MFA
      const tokens = generateTokenPair({
        userId: user.id,
        tenantId: user.tenantId as string | undefined,
        role: user.role,
        email: user.email
      })

      // Store refresh token in database
      await tenantPrisma(null).refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      })

      // Log successful attempt
      await this.logLoginAttempt(email, true, user.id)

      // Log audit event
      await this.logAuditEvent('LOGIN', user.id, user.tenantId, user.role)

      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId as string | undefined,
          tenantSlug: undefined,
          tenantName: undefined
        }
      }

    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse | AuthError> {
    try {
      const { refreshToken } = request

      // Verify refresh token
      try {
        verifyRefreshToken(refreshToken)
      } catch (error) {
        return {
          success: false,
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      }

      // Check if refresh token exists in database
      const storedToken = await tenantPrisma(null).refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            include: {
              tenant: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  status: true,
                  isActive: true
                }
              }
            }
          }
        }
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return {
          success: false,
          error: 'Refresh token expired or not found',
          code: 'REFRESH_TOKEN_EXPIRED'
        }
      }

      const user = storedToken.user

      // Check user and tenant status
      if (user.status !== EntityStatus.ACTIVE || !user.isActive) {
        return {
          success: false,
          error: 'User account is not active',
          code: 'ACCOUNT_INACTIVE'
        }
      }

      if (user.tenant && (!user.tenant.isActive || user.tenant.status !== EntityStatus.ACTIVE)) {
        return {
          success: false,
          error: 'Salon account is not active',
          code: 'TENANT_INACTIVE'
        }
      }

      // Generate new tokens
      const tokens = generateTokenPair({
        userId: user.id,
        tenantId: user.tenantId as string | undefined,
        role: user.role,
        email: user.email
      })

      // Update refresh token in database
      await tenantPrisma(null).refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })

      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId as string | undefined,
          tenantSlug: undefined,
          tenantName: undefined
        }
      }

    } catch (error) {
      console.error('Refresh token error:', error)
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }
  }

  /**
   * Logout user - revoke refresh token
   */
  async logout(refreshToken: string, userId: string): Promise<{ success: boolean }> {
    try {
      // Remove refresh token from database
      await tenantPrisma(null).refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: userId
        }
      })

      // Log audit event
      const user = await tenantPrisma(null).user.findUnique({
        where: { id: userId }
      })
      
      if (user) {
        await this.logAuditEvent('LOGOUT', userId, user.tenantId, user.role)
      }

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false }
    }
  }

  /**
   * Register new user (staff invitation or client registration)
   */
  async register(request: RegisterRequest): Promise<AuthResponse | AuthError> {
    try {
      const { email, password, firstName, lastName, phone, role, tenantId } = request

      // Check if user already exists
      const existingUser = await tenantPrisma(null).user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        }
      }

      // Validate tenant for non-SUPER_ADMIN users
      if (role !== UserRole.SUPER_ADMIN && !tenantId) {
        return {
          success: false,
          error: 'Tenant ID is required for non-admin users',
          code: 'TENANT_REQUIRED'
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.bcryptRounds)

      // Create user
      const user = await tenantPrisma(null).user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role,
          tenantId: tenantId || null,
          status: role === UserRole.CLIENT ? EntityStatus.ACTIVE : EntityStatus.PENDING,
          emailVerified: false,
          isActive: true
        },
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
              isActive: true
            }
          }
        }
      })

      // Log audit event
      await this.logAuditEvent('CREATE', user.id, tenantId, role, {
        entityType: 'User',
        entityId: user.id,
        newValues: { email, firstName, lastName, role }
      })

      // For CLIENT role, generate tokens immediately
      if (role === UserRole.CLIENT) {
        const tokens = generateTokenPair({
          userId: user.id,
          tenantId: user.tenantId as string | undefined,
          role: user.role,
          email: user.email
        })

        // Store refresh token
        await tenantPrisma(null).refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })

        return {
          success: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId as string | undefined,
            tenantSlug: user.tenant?.slug,
            tenantName: user.tenant?.name
          }
        }
      }

      // For staff roles, return success without tokens (awaiting approval)
      return {
        success: true,
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId as string | undefined,
          tenantSlug: undefined,
          tenantName: undefined
        }
      }

    } catch (error) {
      console.error('Register error:', error)
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userRole: UserRole, resource: string, action: string, scope: 'own' | 'tenant' | 'all' = 'tenant'): boolean {
    const permissions = RolePermissions[userRole]
    
    return permissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource
      const actionMatch = permission.action === '*' || permission.action === action
      const scopeMatch = permission.scope === 'all' || permission.scope === scope
      
      return resourceMatch && actionMatch && scopeMatch
    })
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userRole: UserRole): Permission[] {
    return RolePermissions[userRole] || []
  }

  /**
   * Log login attempt
   */
  private async logLoginAttempt(email: string, success: boolean, _userId?: string, _note?: string): Promise<void> {
    try {
      // In a real implementation, you might want to store login attempts
      // in a separate table for security monitoring
      const note = _note ? ` (${_note})` : ''
      console.log(`Login attempt: ${email} - ${success ? 'SUCCESS' : 'FAILED'}${note}`)
    } catch (error) {
      console.error('Failed to log login attempt:', error)
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    action: string, 
    userId: string, 
    tenantId?: string | null, 
    userRole?: UserRole,
    additionalData?: any
  ): Promise<void> {
    try {
      await tenantPrisma(null).auditLog.create({
        data: {
          tenantId: tenantId || null,
          action: action as any,
          entityType: additionalData?.entityType || 'Auth',
          entityId: additionalData?.entityId || userId,
          userId,
          userRole: userRole || null,
          oldValues: additionalData?.oldValues || null,
          newValues: additionalData?.newValues || null,
          ipAddress: '127.0.0.1', // Should come from request
          userAgent: 'Auth Service'
        }
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }
}