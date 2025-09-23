import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { NotificationType } from '@prisma/client'; // FIX: Import enum
import { tenantAuth } from '../middleware/tenantAuth';

const router = Router();

// Zod схемы для валидации
const markAsReadSchema = z.object({
  read: z.boolean().optional()
});

/**
 * GET /notifications/me
 * Получить все уведомления для текущего пользователя
 */
router.get('/me', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.context!;

    // TODO: Когда будет подключена основная БД, заменить на:
    // const notifications = await tenantPrisma(tenantId).notification.findMany({
    //   where: {
    //     tenantId,
    //     userId
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   take: 50 // Лимит для производительности
    // });

    // Временная заглушка для демонстрации
    const mockNotifications = [
      {
        id: 'mock-1',
        tenantId,
        userId,
        type: 'EMAIL',
        title: 'Напоминание о записи',
        message: 'У вас запись через 1 час',
        status: 'SENT',
        sentAt: new Date().toISOString(),
        readAt: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-2',
        tenantId,
        userId,
        type: 'IN_APP',
        title: 'Новое сообщение',
        message: 'Клиент оставил отзыв',
        status: 'DELIVERED',
        sentAt: new Date().toISOString(),
        readAt: null,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        notifications: mockNotifications,
        total: mockNotifications.length,
        unreadCount: mockNotifications.filter(n => !n.readAt).length
      },
      meta: {
        tenantId,
        userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] Error fetching notifications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch notifications',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /notifications/:id/read
 * Отметить уведомление как прочитанное (с проверкой ownership)
 */
router.put('/:id/read', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.context!;
    const { id } = req.params;

    // Валидация body
    const validationResult = markAsReadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: validationResult.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    // TODO: Когда будет подключена основная БД, заменить на:
    // // Проверяем ownership уведомления
    // const notification = await tenantPrisma(tenantId).notification.findFirst({
    //   where: {
    //     id,
    //     tenantId,
    //     userId
    //   }
    // });

    // if (!notification) {
    //   return res.status(404).json({
    //     error: 'Not Found',
    //     message: 'Notification not found or access denied',
    //     timestamp: new Date().toISOString()
    //   });
    // }

    // // Обновляем статус
    // const updatedNotification = await tenantPrisma(tenantId).notification.update({
    //   where: { id },
    //   data: {
    //     readAt: new Date()
    //   }
    // });

    // Временная заглушка
    const mockUpdatedNotification = {
      id,
      tenantId,
      userId,
      type: 'EMAIL',
      title: 'Напоминание о записи',
      message: 'У вас запись через 1 час',
      status: 'READ',
      readAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: mockUpdatedNotification,
      message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] Error updating notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notification',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /notifications/count
 * Получить количество непрочитанных уведомлений
 */
router.get('/count', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.context!;

    // TODO: Когда будет подключена основная БД:
    // const unreadCount = await tenantPrisma(tenantId).notification.count({
    //   where: {
    //     tenantId,
    //     userId,
    //     readAt: null
    //   }
    // });

    // Временная заглушка
    const mockUnreadCount = 2;

    res.status(200).json({
      success: true,
      data: {
        unreadCount: mockUnreadCount,
        tenantId,
        userId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] Error counting notifications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to count notifications',
      timestamp: new Date().toISOString()
    });
  }
});


/**
 * POST /notifications/send
 * Создать новое уведомление (для тестов и внутренних нужд)
 */
const sendNotificationSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.nativeEnum(NotificationType).default('IN_APP'),
});

router.post('/send', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.context!;

    const validationResult = sendNotificationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validationResult.error.errors,
      });
    }

    const { userId, title, message, type } = validationResult.data;

    // TODO: Когда будет подключена основная БД, заменить на:
    // const newNotification = await tenantPrisma(tenantId).notification.create({
    //   data: {
    //     tenantId,
    //     userId,
    //     title,
    //     message,
    //     type,
    //     status: 'DELIVERED',
    //   },
    // });

    // Временная заглушка для демонстрации
    const newNotification = {
      id: `mock-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      ...validationResult.data,
      status: 'DELIVERED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readAt: null,
    };
    
    console.log(`[NOTIFICATIONS] Mock created notification for user ${userId} in tenant ${tenantId}`);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: newNotification,
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send notification',
    });
  }
});

/**
 * POST /notifications/send-internal-test
 * Создать тестовое уведомление без аутентификации.
 * ВНИМАНИЕ: Только для временного тестирования!
 */
router.post('/send-internal-test', async (req: Request, res: Response) => {
  try {
    // Хардкодим ID пользователя и tenant'а для теста
    const testTenantId = 'cmem0a46l00009f1i8v2nz6qz'; // From CLAUDE.md
    const testUserId = 'user_2a8Fm2gH5R9j3kLpWqE7tYxZc1v'; // Placeholder

    const newNotification = {
      id: `mock-test-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: testTenantId,
      userId: testUserId,
      title: 'Тестовое уведомление!',
      message: 'Это уведомление было создано для проверки работы сервиса.',
      type: 'IN_APP',
      status: 'DELIVERED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readAt: null,
    };

    console.log(`[NOTIFICATIONS] Created INTERNAL TEST notification for user ${testUserId}`);

    // Здесь в будущем будет реальный вызов Prisma
    // await tenantPrisma(testTenantId).notification.create({ data: ... });

    res.status(201).json({
      success: true,
      message: 'Test notification created successfully',
      data: newNotification,
    });

  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending internal test notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
