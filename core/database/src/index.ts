// Beauty Platform Database Exports
// Domain-Driven Design Database Layer

export * from '@prisma/client'
export { default as prisma } from './prisma'
export { tenantPrisma } from './tenant-isolation'
export type { TenantPrisma } from './tenant-isolation'