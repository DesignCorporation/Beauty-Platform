import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { tenantAuth } from '../middleware/tenantAuth';

const router = Router();

// Zod схема для валидации настроек
const updateSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  promotionalEmails: z.boolean().optional(),
  systemNotifications: z.boolean().optional()
});

/**
 * GET /settings/me
 * Получить настройки уведомлений для текущего пользователя
 */
router.get('/me', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.context!;

    // TODO: Когда будет подключена основная БД, заменить на:
    // let settings = await tenantPrisma(tenantId).notificationSettings.findFirst({
    //   where: {
    //     tenantId,
    //     userId
    //   }
    // });

    // // Если настройки не найдены, создаем дефолтные
    // if (!settings) {
    //   settings = await tenantPrisma(tenantId).notificationSettings.create({
    //     data: {
    //       tenantId,
    //       userId,
    //       emailEnabled: true,
    //       smsEnabled: true,
    //       pushEnabled: true,
    //       appointmentReminders: true,
    //       promotionalEmails: false,
    //       systemNotifications: true
    //     }
    //   });
    // }

    // Временная заглушка с дефолтными настройками
    const mockSettings = {
      id: `settings-${userId}`,
      tenantId,
      userId,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      promotionalEmails: false,
      systemNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: mockSettings,
      meta: {
        tenantId,
        userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[SETTINGS] Error fetching settings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch notification settings',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /settings/me
 * Обновить настройки уведомлений для текущего пользователя
 */
router.put('/me', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.context!;

    // Валидация входных данных
    const validationResult = updateSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: validationResult.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    const updateData = validationResult.data;

    // TODO: Когда будет подключена основная БД, заменить на:
    // // Попытка обновить существующие настройки
    // const updatedSettings = await tenantPrisma(tenantId).notificationSettings.upsert({
    //   where: {
    //     tenantId_userId: {
    //       tenantId,
    //       userId
    //     }
    //   },
    //   update: updateData,
    //   create: {
    //     tenantId,
    //     userId,
    //     emailEnabled: updateData.emailEnabled ?? true,
    //     smsEnabled: updateData.smsEnabled ?? true,
    //     pushEnabled: updateData.pushEnabled ?? true,
    //     appointmentReminders: updateData.appointmentReminders ?? true,
    //     promotionalEmails: updateData.promotionalEmails ?? false,
    //     systemNotifications: updateData.systemNotifications ?? true
    //   }
    // });

    // Временная заглушка
    const mockUpdatedSettings = {
      id: `settings-${userId}`,
      tenantId,
      userId,
      emailEnabled: updateData.emailEnabled ?? true,
      smsEnabled: updateData.smsEnabled ?? true,
      pushEnabled: updateData.pushEnabled ?? true,
      appointmentReminders: updateData.appointmentReminders ?? true,
      promotionalEmails: updateData.promotionalEmails ?? false,
      systemNotifications: updateData.systemNotifications ?? true,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: mockUpdatedSettings,
      message: 'Notification settings updated successfully',
      changes: updateData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SETTINGS] Error updating settings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notification settings',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /settings/reset
 * Сбросить настройки к дефолтным значениям
 */
router.post('/reset', tenantAuth, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.context!;

    // TODO: Когда будет подключена основная БД:
    // const defaultSettings = await tenantPrisma(tenantId).notificationSettings.upsert({
    //   where: {
    //     tenantId_userId: {
    //       tenantId,
    //       userId
    //     }
    //   },
    //   update: {
    //     emailEnabled: true,
    //     smsEnabled: true,
    //     pushEnabled: true,
    //     appointmentReminders: true,
    //     promotionalEmails: false,
    //     systemNotifications: true
    //   },
    //   create: {
    //     tenantId,
    //     userId,
    //     emailEnabled: true,
    //     smsEnabled: true,
    //     pushEnabled: true,
    //     appointmentReminders: true,
    //     promotionalEmails: false,
    //     systemNotifications: true
    //   }
    // });

    // Временная заглушка
    const mockDefaultSettings = {
      id: `settings-${userId}`,
      tenantId,
      userId,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      promotionalEmails: false,
      systemNotifications: true,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: mockDefaultSettings,
      message: 'Notification settings reset to default values',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SETTINGS] Error resetting settings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset notification settings',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;