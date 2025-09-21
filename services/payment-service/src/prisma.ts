import { PrismaClient } from '@prisma/client';

// 🔐 КРИТИЧНО: Tenant-isolated Prisma client
// Следуем архитектуре проекта - ВСЕГДА используем tenantPrisma(tenantId)

class TenantPrismaManager {
  private static instance: TenantPrismaManager;
  private prismaClients: Map<string, PrismaClient> = new Map();

  private constructor() {}

  static getInstance(): TenantPrismaManager {
    if (!TenantPrismaManager.instance) {
      TenantPrismaManager.instance = new TenantPrismaManager();
    }
    return TenantPrismaManager.instance;
  }

  getTenantPrisma(tenantId: string): PrismaClient {
    if (!this.prismaClients.has(tenantId)) {
      // Создаем изолированный клиент для конкретного tenant
      const client = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Middleware для автоматической фильтрации по tenantId
      client.$use(async (params, next) => {
        // Добавляем tenantId во все запросы где это возможно
        if (params.model && ['Subscription', 'Payment', 'Invoice'].includes(params.model)) {
          if (params.action === 'findMany' || params.action === 'findFirst') {
            params.args = params.args || {};
            params.args.where = params.args.where || {};
            params.args.where.tenantId = tenantId;
          }

          if (params.action === 'create') {
            params.args = params.args || {};
            params.args.data = params.args.data || {};
            params.args.data.tenantId = tenantId;
          }

          if (params.action === 'update' || params.action === 'updateMany') {
            params.args = params.args || {};
            params.args.where = params.args.where || {};
            params.args.where.tenantId = tenantId;
          }

          if (params.action === 'delete' || params.action === 'deleteMany') {
            params.args = params.args || {};
            params.args.where = params.args.where || {};
            params.args.where.tenantId = tenantId;
          }
        }

        return next(params);
      });

      this.prismaClients.set(tenantId, client);
    }

    return this.prismaClients.get(tenantId)!;
  }

  async disconnect(): Promise<void> {
    await Promise.all(
      Array.from(this.prismaClients.values()).map(client => client.$disconnect())
    );
    this.prismaClients.clear();
  }
}

export const tenantPrismaManager = TenantPrismaManager.getInstance();

// 🔐 ГЛАВНАЯ ФУНКЦИЯ: Всегда использовать для доступа к данным
export const tenantPrisma = (tenantId: string): PrismaClient => {
  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required for database access');
  }
  return tenantPrismaManager.getTenantPrisma(tenantId);
};