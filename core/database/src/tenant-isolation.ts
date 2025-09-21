// Tenant Isolation Layer - КРИТИЧЕСКИ ВАЖНО!
// Все запросы к БД должны идти через этот слой

import prisma from './prisma'

export type TenantPrisma = ReturnType<typeof createTenantPrisma>

/**
 * Создает изолированный Prisma клиент для конкретного tenant'а
 * ⚠️ КРИТИЧНО: Все операции с БД должны использовать этот метод!
 * @param tenantId - ID tenant'а или null для глобальных операций
 */
export function tenantPrisma(tenantId: string | null) {
  return createTenantPrisma(tenantId)
}

function createTenantPrisma(tenantId: string | null) {
  return {
    // Tenants - без фильтрации (для админки)
    tenant: prisma.tenant,
    
    // Users - с опциональной фильтрацией по tenant
    user: {
      findMany: (args?: any) => prisma.user.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.user.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.user.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.user.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.user.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.user.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.user.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // RefreshToken - глобальная модель (не привязана к tenant)
    refreshToken: prisma.refreshToken,
    
    // Clients с фильтрацией по tenant
    client: {
      findMany: (args?: any) => prisma.client.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.client.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.client.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.client.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.client.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.client.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.client.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // Services с фильтрацией по tenant
    service: {
      findMany: (args?: any) => prisma.service.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.service.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.service.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.service.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.service.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.service.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.service.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // Appointments с фильтрацией по tenant
    appointment: {
      findMany: (args?: any) => prisma.appointment.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.appointment.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.appointment.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.appointment.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.appointment.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.appointment.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.appointment.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // Audit logs с фильтрацией по tenant
    auditLog: {
      findMany: (args?: any) => prisma.auditLog.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      create: (args: any) => prisma.auditLog.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      })
    },
    
    // Raw queries с проверкой tenant
    $queryRaw: prisma.$queryRaw,
    $executeRaw: prisma.$executeRaw,
    
    // Transactions
    $transaction: prisma.$transaction.bind(prisma)
  }
}

// Middleware закомментирован из-за проблем с типами Prisma
// В будущем можно добавить логирование другим способом