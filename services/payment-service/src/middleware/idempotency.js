import { tenantPrisma } from '@beauty-platform/database';
import { generateRequestHash, checkIdempotency, saveIdempotentResponse } from '../utils/idempotency.js';

/**
 * Middleware для обеспечения идемпотентности API запросов
 * @param {Object} options - Опции middleware
 * @param {boolean} options.required - Обязательно ли наличие Idempotency-Key
 */
export function idempotencyMiddleware(options = { required: true }) {
  return async (req, res, next) => {
    // Применяем только к POST запросам
    if (req.method !== 'POST') {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];

    if (options.required && !idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required',
        code: 'MISSING_IDEMPOTENCY_KEY'
      });
    }

    if (!idempotencyKey) {
      return next();
    }

    try {
      const tenantId = req.tenantId; // Из shared-middleware
      const db = tenantPrisma(tenantId);

      // Генерируем хэш запроса
      const requestHash = generateRequestHash(req.method, req.path, req.body);

      // Проверяем кэш
      const cachedResponse = await checkIdempotency(db, idempotencyKey, requestHash);

      if (cachedResponse) {
        console.log(`[Idempotency] Cache hit for key: ${idempotencyKey}`);
        return res.status(cachedResponse.status || 200).json(cachedResponse.data);
      }

      // Перехватываем res.json для сохранения ответа
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // Сохраняем ответ асинхронно
        saveIdempotentResponse(db, idempotencyKey, requestHash, {
          status: res.statusCode,
          data
        }).catch(err => {
          console.error('[Idempotency] Failed to save response:', err);
        });

        return originalJson(data);
      };

      next();

    } catch (error) {
      console.error('[Idempotency] Middleware error:', error);

      if (error.message.includes('key conflict')) {
        return res.status(409).json({
          error: error.message,
          code: 'IDEMPOTENCY_KEY_CONFLICT'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        code: 'IDEMPOTENCY_ERROR'
      });
    }
  };
}