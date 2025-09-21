import express from 'express';
import { z } from 'zod';
import { tenantPrisma } from '@beauty-platform/database';
import { TenantRequest } from '../middleware/tenant';

const router = express.Router();

// Validation schemas
const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(1, 'Phone is required'),
  notes: z.string().optional(),
  birthday: z.string().optional()
});

const UpdateClientSchema = CreateClientSchema.partial();

// GET /api/clients - Получить всех клиентов салона
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      status: 'ACTIVE'
    };
    
    // Поиск по имени, email или телефону
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }
    
    const [clients, totalCount] = await Promise.all([
      tenantPrisma(req.tenantId).client.findMany({
        where,
        orderBy: { name: 'asc' },
        take: Number(limit),
        skip: offset,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          notes: true,
          birthday: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      tenantPrisma(req.tenantId).client.count({ where })
    ]);
    
    res.json({
      success: true,
      data: clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
});

// GET /api/clients/:id - Получить клиента по ID
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const client = await tenantPrisma(req.tenantId).client.findFirst({
      where: {
        id: req.params.id,
        salonId: req.tenantId
      },
      include: {
        appointments: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { appointmentDate: 'desc' },
          take: 10,
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            status: true,
            notes: true,
            service: {
              select: { name: true, price: true }
            },
            staff: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: client
    });
    
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client'
    });
  }
});

// POST /api/clients - Создать нового клиента
router.post('/', async (req: TenantRequest, res) => {
  try {
    const validatedData = CreateClientSchema.parse(req.body);
    
    // Проверяем уникальность email в рамках салона
    if (validatedData.email) {
      const existingClient = await tenantPrisma(req.tenantId).client.findFirst({
        where: {
          email: validatedData.email,
          salonId: req.tenantId
        }
      });
      
      if (existingClient) {
        return res.status(400).json({
          success: false,
          error: 'Client with this email already exists'
        });
      }
    }
    
    const client = await tenantPrisma(req.tenantId).client.create({
      data: {
        ...validatedData,
        salonId: req.tenantId,
        status: 'ACTIVE'
      }
    });
    
    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
    
  } catch (error) {
    console.error('Error creating client:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create client'
    });
  }
});

// PUT /api/clients/:id - Обновить клиента
router.put('/:id', async (req: TenantRequest, res) => {
  try {
    const validatedData = UpdateClientSchema.parse(req.body);
    
    // Проверяем существование клиента в салоне
    const existingClient = await tenantPrisma(req.tenantId).client.findFirst({
      where: {
        id: req.params.id,
        salonId: req.tenantId
      }
    });
    
    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    // Проверяем уникальность email если он изменяется
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const emailExists = await tenantPrisma(req.tenantId).client.findFirst({
        where: {
          email: validatedData.email,
          salonId: req.tenantId,
          id: { not: req.params.id }
        }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Client with this email already exists'
        });
      }
    }
    
    const client = await tenantPrisma(req.tenantId).client.update({
      where: { id: req.params.id },
      data: validatedData
    });
    
    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating client:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update client'
    });
  }
});

// DELETE /api/clients/:id - Удалить клиента (soft delete)
router.delete('/:id', async (req: TenantRequest, res) => {
  try {
    const existingClient = await tenantPrisma(req.tenantId).client.findFirst({
      where: {
        id: req.params.id,
        salonId: req.tenantId
      }
    });
    
    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    // Soft delete - меняем статус на INACTIVE
    await tenantPrisma(req.tenantId).client.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' }
    });
    
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete client'
    });
  }
});

export default router;