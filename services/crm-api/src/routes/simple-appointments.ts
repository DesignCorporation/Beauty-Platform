import express, { Router } from 'express';
import { tenantPrisma } from '@beauty-platform/database';
import { TenantRequest } from '../middleware/tenant';

const router: Router = express.Router();

// GET /api/appointments - Получить записи
router.get('/', async (req: TenantRequest, res) => {
  try {
    // ВРЕМЕННО: возвращаем пустой массив пока не создадим appointments
    const appointments: any[] = [];
    
    res.json({
      success: true,
      data: appointments
    });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments'
    });
  }
});

// POST /api/appointments - Создать тестовую запись
router.post('/demo', async (req: TenantRequest, res) => {
  try {
    const { staffId, date, time, clientName, serviceName } = req.body;
    
    // Создаем тестовую запись (без использования реальной БД пока)
    const demoAppointment = {
      id: `demo-${Date.now()}`,
      appointmentNumber: `APP${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00',
      clientName: clientName || 'Тестовый клиент',
      serviceName: serviceName || 'Стрижка',
      staffId: staffId,
      status: 'PENDING',
      notes: 'Тестовая запись',
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: demoAppointment,
      message: 'Demo appointment created'
    });
    
  } catch (error) {
    console.error('Error creating demo appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create demo appointment'
    });
  }
});

export default router;