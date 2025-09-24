import crypto from 'crypto';

/**
 * Детерминированная сериализация объекта для хэширования
 * @param {Object} obj - Объект для сериализации
 * @returns {string} - Отсортированная JSON строка
 */
export function stableStringify(obj) {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return JSON.stringify(obj);
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};

  for (const key of sortedKeys) {
    // Исключаем нестабильные поля
    if (['id', 'timestamp', 'createdAt', 'updatedAt'].includes(key)) {
      continue;
    }
    sortedObj[key] = stableStringify(obj[key]);
  }

  return JSON.stringify(sortedObj);
}

/**
 * Генерирует хэш запроса для идемпотентности
 * @param {string} method - HTTP метод
 * @param {string} path - API путь
 * @param {Object} body - Тело запроса
 * @returns {string} - SHA256 хэш
 */
export function generateRequestHash(method, path, body) {
  const requestData = `${method.toUpperCase()}:${path}:${stableStringify(body)}`;
  return crypto.createHash('sha256').update(requestData, 'utf8').digest('hex');
}

/**
 * Проверяет идемпотентность запроса
 * @param {Object} db - tenantPrisma instance
 * @param {string} key - Idempotency key
 * @param {string} requestHash - Хэш запроса
 * @returns {Promise<Object|null>} - Кэшированный ответ или null
 */
export async function checkIdempotency(db, key, requestHash) {
  const existing = await db.idempotencyKey.findFirst({
    where: {
      key,
      expiresAt: { gt: new Date() }
    }
  });

  if (existing) {
    // Проверяем, что хэш запроса совпадает
    if (existing.requestHash !== requestHash) {
      throw new Error('Idempotency key conflict: different request data');
    }
    return existing.response;
  }

  return null;
}

/**
 * Сохраняет ответ для идемпотентности
 * @param {Object} db - tenantPrisma instance
 * @param {string} key - Idempotency key
 * @param {string} requestHash - Хэш запроса
 * @param {Object} response - Ответ для кэширования
 */
export async function saveIdempotentResponse(db, key, requestHash, response) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

  await db.idempotencyKey.create({
    data: {
      key,
      requestHash,
      response,
      expiresAt
    }
  });
}