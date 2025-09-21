// Salon Registration Routes
// Beauty Platform Auth Service - Salon Creation

import express from 'express'
import Joi from 'joi'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import { UserRole, Currency, Language } from '@prisma/client'
import { tenantPrisma } from '@beauty-platform/database'

const router: express.Router = express.Router()

// Rate limiting for salon registration
const salonRegistrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 salon registrations per window
  message: {
    success: false,
    error: 'Too many salon registration attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Validation schema for salon registration
const salonRegistrationSchema = Joi.object({
  // Owner data
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  language: Joi.string().valid('en', 'pl', 'ua', 'ru').required(),
  
  // Salon data
  salonName: Joi.string().min(2).max(100).required(),
  website: Joi.string().uri().optional().allow(''),
  businessType: Joi.string().valid('salon', 'mobile', 'home', 'online').required(),
  
  // Location and currency
  country: Joi.string().min(2).max(50).required(),
  currency: Joi.string().valid('PLN', 'EUR', 'USD', 'UAH').required(),
  address: Joi.object({
    street: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    postalCode: Joi.string().allow('').optional(),
    coordinates: Joi.object({
      lat: Joi.number().optional(),
      lng: Joi.number().optional()
    }).optional()
  }).optional(),
  
  // Services and team
  serviceCategories: Joi.array().items(Joi.string()).default([]),
  teamSize: Joi.string().valid('solo', 'small', 'medium', 'large').required(),
  
  // Pricing
  planType: Joi.string().valid('starter', 'team', 'business', 'enterprise').required(),
  trialPeriod: Joi.boolean().default(true),
  
  // Activation
  acceptTerms: Joi.boolean().valid(true).required(),
  subscribeNewsletter: Joi.boolean().default(true)
})

/**
 * POST /salon-registration/create
 * Create new salon and owner account
 */
router.post('/create', salonRegistrationRateLimit, async (req, res): Promise<void> => {
  const transaction = await tenantPrisma(null).$transaction(async (tx) => {
    try {
      // Validate request body
      const { error, value } = salonRegistrationSchema.validate(req.body)
      if (error) {
        throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`)
      }

      // Check if email already exists
      const existingUser = await tx.user.findUnique({
        where: { email: value.email }
      })

      if (existingUser) {
        throw new Error('EMAIL_ALREADY_EXISTS')
      }

      // Generate salon slug from name
      const baseSlug = value.salonName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Ensure unique slug
      let salonSlug = baseSlug
      let slugCounter = 1
      while (await tx.tenant.findUnique({ where: { slug: salonSlug } })) {
        salonSlug = `${baseSlug}-${slugCounter}`
        slugCounter++
      }

      // Map language to enum
      const languageMap: Record<string, Language> = {
        'en': 'EN',
        'pl': 'PL',
        'ua': 'UA',
        'ru': 'RU'
      }

      // Map currency to enum
      const currencyMap: Record<string, Currency> = {
        'PLN': 'PLN',
        'EUR': 'EUR',
        'USD': 'USD',
        'UAH': 'UAH'
      }

      // Create salon (tenant)
      const salon = await tx.tenant.create({
        data: {
          slug: salonSlug,
          name: value.salonName,
          description: `Beauty salon - ${value.businessType}`,
          email: value.email,
          phone: value.phone,
          website: value.website || null,
          country: value.country,
          city: value.address?.city || null,
          address: value.address?.street || null,
          postalCode: value.address?.postalCode || null,
          currency: currencyMap[value.currency] || 'PLN',
          language: languageMap[value.language] || 'EN',
          timezone: 'Europe/Warsaw', // Default timezone
          status: 'ACTIVE',
          isActive: true
        }
      })

      // Generate default password for owner
      const defaultPassword = 'owner123' // In production, this should be generated and sent via email
      const hashedPassword = await bcrypt.hash(defaultPassword, 12)

      // Create salon owner
      const owner = await tx.user.create({
        data: {
          email: value.email,
          password: hashedPassword,
          firstName: value.firstName,
          lastName: value.lastName,
          phone: value.phone,
          role: 'SALON_OWNER',
          color: '#6366f1', // Default color
          status: 'ACTIVE',
          emailVerified: true, // For demo purposes
          tenantId: salon.id
        }
      })

      // Create default services based on categories
      const defaultServices = [
        { name: 'Стрижка женская', duration: 60, price: 150 },
        { name: 'Стрижка мужская', duration: 30, price: 80 },
        { name: 'Окрашивание', duration: 120, price: 300 },
        { name: 'Укладка', duration: 45, price: 100 },
        { name: 'Маникюр', duration: 90, price: 120 }
      ]

      for (const service of defaultServices) {
        await tx.service.create({
          data: {
            name: service.name,
            description: `Базовая услуга - ${service.name}`,
            duration: service.duration,
            price: service.price,
            status: 'ACTIVE',
            tenantId: salon.id
          }
        })
      }

      // Create default staff members based on team size
      const staffMembers = [
        { firstName: 'Мария', lastName: 'Иванова', email: 'master1@' + salonSlug + '.ru', role: 'STAFF_MEMBER', color: '#ef4444' },
        { firstName: 'Елена', lastName: 'Петрова', email: 'master2@' + salonSlug + '.ru', role: 'STAFF_MEMBER', color: '#10b981' }
      ]

      if (value.teamSize !== 'solo') {
        for (const staff of staffMembers) {
          await tx.user.create({
            data: {
              email: staff.email,
              password: hashedPassword, // Same default password
              firstName: staff.firstName,
              lastName: staff.lastName,
              phone: '+48 500 000 001',
              role: staff.role as UserRole,
              color: staff.color,
              status: 'ACTIVE',
              emailVerified: true,
              tenantId: salon.id
            }
          })
        }
      }

      // Add manager if team is medium or large
      if (['medium', 'large'].includes(value.teamSize)) {
        await tx.user.create({
          data: {
            email: 'manager@' + salonSlug + '.ru',
            password: hashedPassword,
            firstName: 'Ольга',
            lastName: 'Менеджер',
            phone: '+48 500 000 002',
            role: 'MANAGER',
            color: '#8b5cf6',
            status: 'ACTIVE',
            emailVerified: true,
            tenantId: salon.id
          }
        })
      }

      // Add receptionist if team is large
      if (value.teamSize === 'large') {
        await tx.user.create({
          data: {
            email: 'reception@' + salonSlug + '.ru',
            password: hashedPassword,
            firstName: 'Светлана',
            lastName: 'Администратор',
            phone: '+48 500 000 003',
            role: 'RECEPTIONIST',
            color: '#f59e0b',
            status: 'ACTIVE',
            emailVerified: true,
            tenantId: salon.id
          }
        })
      }

      return {
        salon,
        owner,
        defaultPassword,
        message: 'Salon created successfully'
      }

    } catch (error) {
      throw error
    }
  })

  try {
    const result = await transaction

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        salon: {
          id: result.salon.id,
          slug: result.salon.slug,
          name: result.salon.name,
          email: result.salon.email
        },
        owner: {
          id: result.owner.id,
          email: result.owner.email,
          firstName: result.owner.firstName,
          lastName: result.owner.lastName
        },
        loginCredentials: {
          email: result.owner.email,
          password: result.defaultPassword,
          loginUrl: `${req.protocol}://${req.get('host')}/login?salon=${result.salon.slug}`
        }
      }
    })

  } catch (error) {
    console.error('Salon registration error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          success: false,
          error: 'Email already registered',
          code: 'EMAIL_EXISTS'
        })
        return
      }
      
      if (error.message.startsWith('Validation error:')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create salon',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /salon-registration/check-email/:email
 * Check if email is already registered
 */
router.get('/check-email/:email', async (req, res): Promise<void> => {
  try {
    const { email } = req.params

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      })
      return
    }

    const existingUser = await tenantPrisma(null).user.findUnique({
      where: { email: email.toLowerCase() }
    })

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email already registered' : 'Email available'
    })

  } catch (error) {
    console.error('Check email error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check email availability',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /salon-registration/check-slug/:slug
 * Check if salon slug is available
 */
router.get('/check-slug/:slug', async (req, res): Promise<void> => {
  try {
    const { slug } = req.params

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      res.status(400).json({
        success: false,
        error: 'Invalid slug format',
        code: 'INVALID_SLUG'
      })
      return
    }

    const existingTenant = await tenantPrisma(null).tenant.findUnique({
      where: { slug }
    })

    res.json({
      success: true,
      available: !existingTenant,
      message: existingTenant ? 'Slug already taken' : 'Slug available'
    })

  } catch (error) {
    console.error('Check slug error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check slug availability',
      code: 'INTERNAL_ERROR'
    })
  }
})

export default router