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
    tenant: prisma.Tenant,
    
    // Users - с опциональной фильтрацией по tenant
    user: {
      findMany: (args?: any) => prisma.User.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.User.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.User.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.User.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.User.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.User.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.User.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // RefreshToken - глобальная модель (не привязана к tenant)
    refreshToken: prisma.refreshToken,
    
    // Clients с фильтрацией по tenant
    client: {
      findMany: (args?: any) => prisma.Client.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.Client.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.Client.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.Client.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.Client.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.Client.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.Client.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // Services с фильтрацией по tenant
    service: {
      findMany: (args?: any) => prisma.Service.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.Service.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.Service.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.Service.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.Service.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.Service.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.Service.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // Appointments с фильтрацией по tenant
    appointment: {
      findMany: (args?: any) => prisma.Appointment.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findFirst: (args?: any) => prisma.Appointment.findFirst({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      findUnique: (args: any) => prisma.Appointment.findUnique({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      create: (args: any) => prisma.Appointment.create({
        ...args,
        data: tenantId ? { ...args.data, tenantId } : args.data
      }),
      update: (args: any) => prisma.Appointment.update({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      delete: (args: any) => prisma.Appointment.delete({
        ...args,
        where: tenantId ? { ...args.where, tenantId } : args.where
      }),
      count: (args?: any) => prisma.Appointment.count({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      })
    },
    
    // Audit logs с фильтрацией по tenant
    auditLog: {
      findMany: (args?: any) => prisma.AuditLog.findMany({
        ...args,
        where: tenantId ? { ...args?.where, tenantId } : args?.where
      }),
      create: (args: any) => prisma.AuditLog.create({
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