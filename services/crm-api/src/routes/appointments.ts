import express from 'express';
import { z } from 'zod';
import { tenantPrisma } from '@beauty-platform/database';
import { TenantRequest } from '../middleware/tenant';

const router = express.Router();

// Validation schemas
const CreateAppointmentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  serviceId: z.string().min(1, 'Service is required'),
  staffId: z.string().min(1, 'Staff member is required'),
  startAt: z.string().min(1, 'Start time is required'),
  endAt: z.string().min(1, 'End time is required'),
  notes: z.string().optional()
});

const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

const UpdateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
});

// GET /api/appointments - Получить все записи салона
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      date,
      staffId,
      clientId,
      status = 'all',
      startDate,
      endDate
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      tenantId: req.tenantId
    };
    
    // Фильтр по дате (используем date поле)
    if (date && typeof date === 'string') {
      const dateStart = new Date(date + 'T00:00:00.000Z');
      const dateEnd = new Date(date + 'T23:59:59.999Z');
      where.date = {
        gte: dateStart,
        lte: dateEnd
      };
    }
    
    // Фильтр по диапазону дат
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    // Фильтр по сотруднику
    if (staffId && typeof staffId === 'string') {
      where.assignedToId = staffId;
    }
    
    // Фильтр по клиенту
    if (clientId && typeof clientId === 'string') {
      where.clientId = clientId;
    }
    
    // Фильтр по статусу
    if (status !== 'all') {
      where.status = status;
    }
    
    const [appointments, totalCount] = await Promise.all([
      tenantPrisma(req.tenantId).appointment.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              color: true
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ],
        take: Number(limit),
        skip: offset
      }),
      tenantPrisma(req.tenantId).appointment.count({ where })
    ]);
    
    // Transform appointments to calendar format
    const calendarAppointments = appointments.map((apt: any) => ({
      id: apt.id,
      appointmentNumber: apt.appointmentNumber, // Добавляем номер записи
      clientId: apt.clientId,
      clientName: apt.client?.name || 'Unknown Client',
      serviceIds: [apt.serviceId],
      serviceNames: [apt.service?.name || 'Unknown Service'],
      staffId: apt.assignedToId,
      staffName: apt.assignedTo ? `${apt.assignedTo.firstName} ${apt.assignedTo.lastName}` : 'Unassigned',
      startAt: apt.startTime.toISOString(),
      endAt: apt.endTime.toISOString(),
      status: apt.status,
      price: apt.service?.price || 0,
      currency: 'PLN',
      notes: apt.notes || '',
      staffColor: apt.assignedTo?.color || '#6366f1'
    }));

    res.json({
      success: true,
      appointments: calendarAppointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments'
    });
  }
});

// GET /api/appointments/calendar - Получить записи для календаря
router.get('/calendar', async (req: TenantRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }
    
    const appointments = await tenantPrisma(req.tenantId).appointment.findMany({
      where: {
        tenantId: req.tenantId,
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true }
        },
        service: {
          select: { id: true, name: true, duration: true, price: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, color: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    // Форматируем для календаря
    const calendarEvents = appointments.map((appointment: any) => ({
      id: appointment.id,
      title: `${appointment.appointmentNumber} - ${appointment.client?.name || 'Unknown Client'} - ${appointment.service?.name || 'Unknown Service'}`,
      start: appointment.startTime.toISOString(),
      end: appointment.endTime.toISOString(),
      backgroundColor: appointment.assignedTo?.color || '#6366f1',
      borderColor: appointment.assignedTo?.color || '#6366f1',
      extendedProps: {
        appointmentNumber: appointment.appointmentNumber,
        client: appointment.client,
        service: appointment.service,
        staff: appointment.assignedTo,
        status: appointment.status,
        notes: appointment.notes
      }
    }));
    
    res.json({
      success: true,
      data: calendarEvents
    });
    
  } catch (error) {
    console.error('Error fetching calendar appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar appointments'
    });
  }
});

// GET /api/appointments/:id - Получить запись по ID
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const appointment = await tenantPrisma(req.tenantId).appointment.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      },
      include: {
        client: true,
        service: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            color: true,
            email: true,
            phone: true
          }
        }
      }
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      data: appointment
    });
    
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment'
    });
  }
});

// POST /api/appointments - Создать новую запись
router.post('/', async (req: TenantRequest, res) => {
  try {
    const validatedData = CreateAppointmentSchema.parse(req.body);
    
    // Проверяем существование клиента, услуги и сотрудника в салоне
    const [client, service, staff] = await Promise.all([
      tenantPrisma(req.tenantId).client.findFirst({
        where: { id: validatedData.clientId, tenantId: req.tenantId }
      }),
      tenantPrisma(req.tenantId).service.findFirst({
        where: { id: validatedData.serviceId, tenantId: req.tenantId }
      }),
      tenantPrisma(req.tenantId).user.findFirst({
        where: { id: validatedData.staffId, tenantId: req.tenantId }
      })
    ]);
    
    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    if (!service) {
      return res.status(400).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    if (!staff) {
      return res.status(400).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    // Convert ISO strings to Date objects
    const startAt = new Date(validatedData.startAt);
    const endAt = new Date(validatedData.endAt);
    
    // Проверяем конфликты времени для сотрудника
    const conflictingAppointment = await tenantPrisma(req.tenantId).appointment.findFirst({
      where: {
        assignedToId: validatedData.staffId,
        OR: [
          {
            startTime: {
              lte: endAt
            },
            endTime: {
              gte: startAt
            }
          }
        ],
        status: { not: 'CANCELLED' },
        tenantId: req.tenantId
      }
    });
    
    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        error: 'Staff member is already booked at this time'
      });
    }
    
    // Генерируем номер записи
    const appointmentNumber = await generateAppointmentNumber(req.tenantId, startAt.toISOString().split('T')[0]);
    
    const appointment = await tenantPrisma(req.tenantId).appointment.create({
      data: {
        tenantId: req.tenantId,
        appointmentNumber,
        clientId: validatedData.clientId,
        serviceId: validatedData.serviceId,
        assignedToId: validatedData.staffId,
        date: startAt,
        startTime: startAt,
        endTime: endAt,
        status: 'PENDING',
        notes: validatedData.notes,
        createdById: req.user?.userId
      },
      include: {
        client: true,
        service: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            color: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create appointment'
    });
  }
});

// PUT /api/appointments/:id - Обновить запись
router.put('/:id', async (req: TenantRequest, res) => {
  try {
    const validatedData = UpdateAppointmentSchema.parse(req.body);
    
    const existingAppointment = await tenantPrisma(req.tenantId).appointment.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    // Если меняется время/дата/сотрудник, проверяем конфликты
    if (validatedData.staffId || validatedData.startAt || validatedData.endAt) {
      const staffId = validatedData.staffId || existingAppointment.assignedToId;
      const startAt = validatedData.startAt ? new Date(validatedData.startAt) : existingAppointment.startTime;
      const endAt = validatedData.endAt ? new Date(validatedData.endAt) : existingAppointment.endTime;
      
      const conflictingAppointment = await tenantPrisma(req.tenantId).appointment.findFirst({
        where: {
          assignedToId: staffId,
          OR: [
            {
              startTime: {
                lte: endAt
              },
              endTime: {
                gte: startAt
              }
            }
          ],
          status: { not: 'CANCELLED' },
          id: { not: req.params.id },
          tenantId: req.tenantId
        }
      });
      
      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          error: 'Staff member is already booked at this time'
        });
      }
    }
    
    const appointment = await tenantPrisma(req.tenantId).appointment.update({
      where: { id: req.params.id },
      data: {
        ...validatedData
        // updatedById field doesn't exist in schema
        // updatedAt will be automatically set by Prisma
      },
      include: {
        client: true,
        service: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            color: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment'
    });
  }
});

// PATCH /api/appointments/:id/status - Изменить статус записи
router.patch('/:id/status', async (req: TenantRequest, res) => {
  try {
    const { status } = UpdateStatusSchema.parse(req.body);
    
    const existingAppointment = await tenantPrisma(req.tenantId).appointment.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    const appointment = await tenantPrisma(req.tenantId).appointment.update({
      where: { id: req.params.id },
      data: {
        status,
        // updatedById field doesn't exist in schema
        // updatedAt will be automatically set by Prisma
      }
    });
    
    res.json({
      success: true,
      data: appointment,
      message: 'Appointment status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating appointment status:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment status'
    });
  }
});

// GET /api/v1/crm/appointments/generate-number - Генерировать номер записи
router.get('/generate-number', async (req: TenantRequest, res) => {
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }
    
    const appointmentNumber = await generateAppointmentNumber(req.tenantId, date);
    
    res.json({
      success: true,
      appointmentNumber,
      date
    });
    
  } catch (error) {
    console.error('Error generating appointment number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate appointment number'
    });
  }
});

// DELETE /api/appointments/:id - Отменить запись
router.delete('/:id', async (req: TenantRequest, res) => {
  try {
    const existingAppointment = await tenantPrisma(req.tenantId).appointment.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    // Soft delete - меняем статус на CANCELLED
    await tenantPrisma(req.tenantId).appointment.update({
      where: { id: req.params.id },
      data: { 
        status: 'CANCELLED',
        // updatedById field doesn't exist in schema
        // updatedAt will be automatically set by Prisma
      }
    });
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment'
    });
  }
});

// Функция генерации номера записи (как в старом проекте)
// Формат: 001.02.DD.MM.YYYY
async function generateAppointmentNumber(tenantId: string, appointmentDate: string): Promise<string> {
  try {
    // Используем СЕГОДНЯШНЮЮ дату для номерации (как в старом проекте)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Считаем записи СОЗДАННЫЕ СЕГОДНЯ (не дату записи)
    const countResult = await tenantPrisma(tenantId).appointment.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(todayStr + 'T00:00:00.000Z'),
          lte: new Date(todayStr + 'T23:59:59.999Z')
        }
      }
    });
    
    const dailyCreationCount = countResult || 0;
    const nextAppointmentNumber = (dailyCreationCount + 1).toString().padStart(3, '0');
    
    // Получаем порядковый номер салона на основе даты создания
    const allTenants = await tenantPrisma(tenantId).tenant.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    
    const currentTenantIndex = allTenants.findIndex(tenant => tenant.id === tenantId);
    const salonSequentialNumber = currentTenantIndex >= 0 ? currentTenantIndex + 1 : 1; // Начинаем с 1
    const formattedSalonNumber = salonSequentialNumber.toString().padStart(2, '0');
    
    // Форматируем СЕГОДНЯШНЮЮ дату (дату создания) в формате DD.MM.YYYY
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString();
    const creationDate = `${day}.${month}.${year}`;
    
    const appointmentNumber = `${nextAppointmentNumber}.${formattedSalonNumber}.${creationDate}`;
    
    console.log(`Generated appointment number: ${appointmentNumber} for tenant ${tenantId} on ${creationDate}`);
    
    return appointmentNumber;
    
  } catch (error) {
    console.error('Error generating appointment number:', error);
    // Fallback к timestamp при ошибке
    const timestamp = Date.now().toString();
    return `ERR.${timestamp.slice(-8)}`;
  }
}

export default router;