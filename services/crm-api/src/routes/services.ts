import express from 'express';
import { z } from 'zod';
import { tenantPrisma } from '@beauty-platform/database';
import { TenantRequest } from '../middleware/tenant';

const router = express.Router();

// Validation schemas
const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(0, 'Price must be non-negative')
});

const UpdateServiceSchema = CreateServiceSchema.partial();

// GET /api/services - Получить все услуги салона
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { page = 1, limit = 50, search, status = 'ACTIVE' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      tenantId: req.tenantId,
      status: status
    };
    
    // Поиск по названию или описанию
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [services, totalCount] = await Promise.all([
      tenantPrisma(req.tenantId).service.findMany({
        where,
        orderBy: { name: 'asc' },
        take: Number(limit),
        skip: offset,
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      tenantPrisma(req.tenantId).service.count({ where })
    ]);
    
    res.json({
      success: true,
      data: services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
});

// GET /api/services/:id - Получить услугу по ID
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const service = await tenantPrisma(req.tenantId).service.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      },
      include: {
        appointments: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            id: true,
            date: true,
            startTime: true,
            status: true,
            client: {
              select: { name: true, phone: true }
            },
            assignedTo: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
    
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service'
    });
  }
});

// POST /api/services - Создать новую услугу
router.post('/', async (req: TenantRequest, res) => {
  try {
    const validatedData = CreateServiceSchema.parse(req.body);
    
    // Проверяем уникальность названия услуги в рамках салона
    const existingService = await tenantPrisma(req.tenantId).service.findFirst({
      where: {
        name: validatedData.name,
        tenantId: req.tenantId
      }
    });
    
    if (existingService) {
      return res.status(400).json({
        success: false,
        error: 'Service with this name already exists'
      });
    }
    
    const service = await tenantPrisma(req.tenantId).service.create({
      data: {
        ...validatedData,
        tenantId: req.tenantId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
    
  } catch (error) {
    console.error('Error creating service:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create service'
    });
  }
});

// PUT /api/services/:id - Обновить услугу
router.put('/:id', async (req: TenantRequest, res) => {
  try {
    const validatedData = UpdateServiceSchema.parse(req.body);
    
    // Проверяем существование услуги в салоне
    const existingService = await tenantPrisma(req.tenantId).service.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    // Проверяем уникальность названия если оно изменяется
    if (validatedData.name && validatedData.name !== existingService.name) {
      const nameExists = await tenantPrisma(req.tenantId).service.findFirst({
        where: {
          name: validatedData.name,
          tenantId: req.tenantId,
          id: { not: req.params.id }
        }
      });
      
      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: 'Service with this name already exists'
        });
      }
    }
    
    const service = await tenantPrisma(req.tenantId).service.update({
      where: { id: req.params.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating service:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update service'
    });
  }
});

// DELETE /api/services/:id - Удалить услугу (soft delete)
router.delete('/:id', async (req: TenantRequest, res) => {
  try {
    const existingService = await tenantPrisma(req.tenantId).service.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    // Проверяем есть ли активные записи на эту услугу
    const activeAppointments = await tenantPrisma(req.tenantId).appointment.count({
      where: {
        serviceId: req.params.id,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    });
    
    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete service with active appointments'
      });
    }
    
    // Soft delete - меняем статус на INACTIVE
    await tenantPrisma(req.tenantId).service.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' }
    });
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete service'
    });
  }
});

export default router;