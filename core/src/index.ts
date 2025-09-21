/**
 * @fileoverview Beauty Platform Core - Main entry point
 * @description Центральная точка экспорта для всего ядра системы
 */

// Domain Entities
export * from './domain/entities';

// Domain Services
export * from './domain/services';

// Domain Events
export * from './domain/events';

// Use Cases
export * from './domain/use-cases';

// Repositories (interfaces)
export * from './domain/repositories';

// Shared types and utilities
export * from '../shared/src';

// Database utilities
export * from '../database/src';

// Configuration
export * from '../config/src';