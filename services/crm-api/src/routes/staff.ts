import express, { Router } from 'express';
import { tenantPrisma } from '@beauty-platform/database';
import { TenantRequest } from '../middleware/tenant';

const router: Router = express.Router();

// GET /api/staff - Получить всех сотрудников салона
router.get('/', async (req: TenantRequest, res) => {
  try {
    console.log('🏥 Staff API: Запрос получен, tenantId:', req.tenantId);

    const { role } = req.query;

    const where: any = {
      tenantId: req.tenantId,
      status: 'ACTIVE',
      role: { not: 'CLIENT' }
    };

    console.log('🔍 Staff API: Фильтр WHERE:', where);

    // Фильтр по роли
    if (role && typeof role === 'string') {
      where.role = role;
    }

    console.log('📋 Staff API: Выполняем запрос с фильтром:', where);
    const staff = await tenantPrisma(req.tenantId).user.findMany({
      where,
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        color: true,
        status: true,
        createdAt: true
      }
    });

    console.log('✅ Staff API: Найдено мастеров:', staff.length);
    console.log('👥 Staff API: Данные:', staff.map(s => `${s.firstName} ${s.lastName} (${s.role})`));

    res.json({
      success: true,
      data: staff
    });
    
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff'
    });
  }
});

// GET /api/staff/working-hours - Получить рабочие часы салона
router.get('/working-hours', async (req: TenantRequest, res) => {
  try {
    // ВРЕМЕННО: заглушка для рабочих часов
    const workingHours = [
      { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 6, isWorkingDay: true, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 0, isWorkingDay: false, startTime: null, endTime: null }
    ];
    
    res.json({
      success: true,
      data: workingHours
    });
    
  } catch (error) {
    console.error('Error fetching working hours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch working hours'
    });
  }
});

// POST /api/staff - Создать нового мастера
router.post('/', async (req: TenantRequest, res) => {
  try {
    const { firstName, lastName, email, phone, color } = req.body;
    
    // Валидация обязательных полей
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'firstName, lastName, and email are required'
      });
    }
    
    // Создаем мастера в таблице users
    const newStaff = await tenantPrisma(req.tenantId).user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        color: color || '#6366f1', // Дефолтный цвет
        role: 'STAFF_MEMBER',
        status: 'ACTIVE',
        tenantId: req.tenantId,
        password: 'temporary-password-123', // ВРЕМЕННО: будет заменено на систему приглашений
        isActive: true,
        emailVerified: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        color: true,
        status: true,
        createdAt: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: newStaff,
      message: 'Staff member created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating staff:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        message: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create staff member'
    });
  }
});

// PUT /api/staff/:id - Обновить мастера
router.put('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, color, isActive } = req.body;
    
    // Обновляем мастера
    const updatedStaff = await tenantPrisma(req.tenantId).user.update({
      where: {
        id,
        tenantId: req.tenantId,
        role: 'STAFF_MEMBER'
      },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(color && { color }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        color: true,
        status: true,
        isActive: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      data: updatedStaff,
      message: 'Staff member updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating staff:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update staff member'
    });
  }
});

// DELETE /api/staff/:id - Удалить мастера (soft delete)
router.delete('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    
    // Мягкое удаление - помечаем как неактивного
    const deletedStaff = await tenantPrisma(req.tenantId).user.update({
      where: {
        id,
        tenantId: req.tenantId,
        role: 'STAFF_MEMBER'
      },
      data: {
        isActive: false,
        status: 'INACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    res.json({
      success: true,
      data: deletedStaff,
      message: 'Staff member deactivated successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member'
    });
  }
});

export default router;