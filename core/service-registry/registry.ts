/**
 * Unified Service Registry - Service Data
 * Complete registry of all Beauty Platform services
 *
 * @version 1.0.0
 * @created 26.09.2025
 */

import {
  ServiceConfig,
  ServiceType,
  ServiceCriticality,
  ServiceStatus,
  UnifiedServiceRegistry
} from './types';

/**
 * Complete service configurations for Beauty Platform
 */
const services: Record<string, ServiceConfig> = {
  // FRONTEND APPLICATIONS
  'landing-page': {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'SEO-optimized marketing landing page for beauty salons',
    port: 6004,
    directory: 'apps/landing-page', // deprecated - use run.cwd
    startCommand: 'PORT=6004 pnpm dev', // deprecated - use run
    healthEndpoint: '/',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'apps/landing-page',
      env: { PORT: '6004' },
      managed: 'internal'
    },
    type: ServiceType.Frontend,
    criticality: ServiceCriticality.Optional,
    status: ServiceStatus.Disabled, // Оставляем отключённым до отдельной задачи
    tags: ['ui', 'marketing', 'seo'],
    dependencies: ['api-gateway'],
    timeout: 30000,
    retries: 2,
    warmupTime: 10,
    requiredEnvVars: ['PORT'],
    optionalEnvVars: [
      { name: 'NODE_ENV', defaultValue: 'development', description: 'Application environment' },
      { name: 'NEXT_PUBLIC_API_URL', defaultValue: 'http://localhost:6020', description: 'API Gateway URL for client-side requests' }
    ],
    version: '1.0.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/frontend/landing-page'
  },

  'salon-crm': {
    id: 'salon-crm',
    name: 'Salon CRM',
    description: 'Main CRM application for beauty salon management',
    port: 6001,
    directory: 'apps/salon-crm', // deprecated - use run.cwd
    startCommand: 'VITE_API_URL=http://localhost:6022/api pnpm dev', // deprecated - use run
    healthEndpoint: '/',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'apps/salon-crm',
      env: { VITE_API_URL: 'http://localhost:6022/api' },
      managed: 'internal'
    },
    type: ServiceType.Frontend,
    criticality: ServiceCriticality.Critical,
    status: ServiceStatus.Active,
    tags: ['ui', 'crm', 'tenant-aware', 'business-critical'],
    dependencies: ['crm-api', 'auth-service'],
    timeout: 30000,
    retries: 3,
    warmupTime: 15,
    requiredEnvVars: ['VITE_API_URL'],
    optionalEnvVars: [
      { name: 'VITE_APP_NAME', defaultValue: 'Beauty Platform CRM', description: 'Application display name' },
      { name: 'VITE_DEBUG', defaultValue: 'false', description: 'Enable debug mode' }
    ],
    version: '2.1.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/frontend/salon-crm'
  },

  'admin-panel': {
    id: 'admin-panel',
    name: 'Admin Panel',
    description: 'Administrative dashboard with system monitoring and documentation',
    port: 6002,
    directory: 'apps/admin-panel', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'apps/admin-panel',
      managed: 'internal'
    },
    type: ServiceType.Frontend,
    criticality: ServiceCriticality.Critical,
    status: ServiceStatus.Active,
    tags: ['ui', 'admin', 'monitoring', 'documentation'],
    dependencies: ['api-gateway', 'auth-service'],
    timeout: 30000,
    retries: 3,
    warmupTime: 15,
    requiredEnvVars: [],
    optionalEnvVars: [
      { name: 'VITE_API_URL', defaultValue: 'http://localhost:6020', description: 'API Gateway URL' },
      { name: 'VITE_MONITORING_ENABLED', defaultValue: 'true', description: 'Enable system monitoring features' }
    ],
    version: '1.5.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/frontend/admin-panel'
  },

  'client-booking': {
    id: 'client-booking',
    name: 'Client Portal',
    description: 'Public booking portal for salon clients',
    port: 6003,
    directory: 'apps/client-booking', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'apps/client-booking',
      managed: 'internal'
    },
    type: ServiceType.Frontend,
    criticality: ServiceCriticality.Optional,
    status: ServiceStatus.Active,
    tags: ['ui', 'client-facing', 'booking', 'tenant-aware'],
    dependencies: ['api-gateway', 'auth-service'],
    timeout: 30000,
    retries: 2,
    warmupTime: 10,
    requiredEnvVars: [],
    optionalEnvVars: [
      { name: 'VITE_API_URL', defaultValue: 'http://localhost:6020', description: 'API Gateway URL' },
      { name: 'VITE_BOOKING_ENABLED', defaultValue: 'true', description: 'Enable booking functionality' }
    ],
    version: '1.2.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/frontend/client-portal'
  },

  // BACKEND SERVICES
  'api-gateway': {
    id: 'api-gateway',
    name: 'API Gateway',
    description: 'Central API gateway handling routing, authentication, and rate limiting',
    port: 6020,
    directory: 'services/api-gateway', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/api-gateway',
      managed: 'internal'
    },
    type: ServiceType.Gateway,
    criticality: ServiceCriticality.Critical,
    status: ServiceStatus.Active,
    tags: ['gateway', 'routing', 'auth', 'rate-limiting'],
    dependencies: [], // Gateway is the orchestrator
    timeout: 15000,
    retries: 3,
    warmupTime: 5,
    // Gateway itself
    publicEndpoints: ['/health', '/api/*', '/auth/*', '/mcp/*'],
    requiredEnvVars: [],
    optionalEnvVars: [
      { name: 'API_GATEWAY_PORT', defaultValue: '6020', description: 'Gateway server port' },
      { name: 'API_GATEWAY_HOST', defaultValue: '0.0.0.0', description: 'Gateway bind host' },
      { name: 'CORS_ORIGINS', defaultValue: 'http://localhost:6001,http://localhost:6002', description: 'Allowed CORS origins' }
    ],
    version: '1.3.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/services/api-gateway'
  },

  'auth-service': {
    id: 'auth-service',
    name: 'Auth Service',
    description: 'Authentication and authorization service with MFA support',
    port: 6021,
    directory: 'services/auth-service', // deprecated - use run.cwd
    startCommand: 'MFA_MASTER_KEY=49dd29bc186073af4bdb05f6fd074317a6045409f1ef540696ed05ad09b38c1b pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/auth-service',
      env: { MFA_MASTER_KEY: '49dd29bc186073af4bdb05f6fd074317a6045409f1ef540696ed05ad09b38c1b' },
      managed: 'internal'
    },
    type: ServiceType.Core,
    criticality: ServiceCriticality.Critical,
    status: ServiceStatus.Active,
    tags: ['auth', 'mfa', 'jwt', 'tenant-aware'],
    dependencies: ['postgresql'],
    timeout: 30000,
    retries: 3,
    warmupTime: 8,
    gatewayPath: '/auth',
    publicEndpoints: ['/health', '/login', '/register', '/mfa/*'],
    requiredEnvVars: ['MFA_MASTER_KEY', 'DATABASE_URL', 'JWT_SECRET'],
    optionalEnvVars: [
      { name: 'ACCESS_TOKEN_TTL', defaultValue: '43200', description: 'Access token TTL in seconds (12h)' },
      { name: 'REFRESH_TOKEN_TTL', defaultValue: '604800', description: 'Refresh token TTL in seconds (7d)' },
      { name: 'MFA_TOKEN_TTL', defaultValue: '300', description: 'MFA token TTL in seconds (5min)' }
    ],
    version: '2.0.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/services/auth-service'
  },

  'crm-api': {
    id: 'crm-api',
    name: 'CRM API',
    description: 'Core CRM business logic API for appointments, clients, and services',
    port: 6022,
    directory: 'services/crm-api', // deprecated - use run.cwd
    startCommand: 'DATABASE_URL=postgresql://beauty_platform_user:secure_password@localhost:6100/beauty_platform_new pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/crm-api',
      env: { DATABASE_URL: 'postgresql://beauty_platform_user:secure_password@localhost:6100/beauty_platform_new' },
      managed: 'internal'
    },
    type: ServiceType.Core,
    criticality: ServiceCriticality.Critical,
    status: ServiceStatus.Active,
    tags: ['crm', 'business-logic', 'tenant-aware', 'appointments'],
    dependencies: ['postgresql', 'auth-service'],
    timeout: 30000,
    retries: 3,
    warmupTime: 10,
    gatewayPath: '/crm',
    publicEndpoints: ['/health', '/api/appointments', '/api/clients', '/api/services', '/api/staff'],
    requiredEnvVars: ['DATABASE_URL'],
    optionalEnvVars: [
      { name: 'JWT_SECRET', defaultValue: 'shared-secret', description: 'JWT verification secret' },
      { name: 'LOG_LEVEL', defaultValue: 'info', description: 'Application log level' }
    ],
    version: '2.5.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/services/crm-api'
  },

  'mcp-server': {
    id: 'mcp-server',
    name: 'MCP Server',
    description: 'Model Context Protocol server for AI integrations and documentation',
    port: 6025,
    directory: 'services/mcp-server', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/mcp-server',
      managed: 'internal',
      autoStart: true
    },
    type: ServiceType.AI,
    criticality: ServiceCriticality.Optional,
    status: ServiceStatus.Active,
    tags: ['ai', 'mcp', 'documentation', 'context'],
    dependencies: [],
    timeout: 15000,
    retries: 2,
    warmupTime: 5,
    gatewayPath: '/mcp',
    publicEndpoints: ['/health', '/mcp/*', '/docs/*'],
    requiredEnvVars: [],
    optionalEnvVars: [
      { name: 'MCP_PORT', defaultValue: '6025', description: 'MCP server port' },
      { name: 'DOCS_PATH', defaultValue: './docs', description: 'Path to documentation files' }
    ],
    version: '1.1.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/services/mcp-server'
  },

  'images-api': {
    id: 'images-api',
    name: 'Images API',
    description: 'Image upload, processing, and serving service',
    port: 6026,
    directory: 'services/images-api', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/images-api',
      managed: 'internal'
    },
    type: ServiceType.Media,
    criticality: ServiceCriticality.Optional,
    status: ServiceStatus.Active,
    tags: ['media', 'images', 'upload', 'processing'],
    dependencies: [],
    timeout: 60000, // Image processing can take time
    retries: 2,
    warmupTime: 8,
    gatewayPath: '/images',
    publicEndpoints: ['/health', '/upload', '/serve/*'],
    requiredEnvVars: [],
    optionalEnvVars: [
      { name: 'UPLOAD_MAX_SIZE', defaultValue: '10485760', description: 'Max file size in bytes (10MB)' },
      { name: 'UPLOAD_PATH', defaultValue: './uploads', description: 'File upload directory' },
      { name: 'IMAGE_QUALITY', defaultValue: '85', description: 'Default image compression quality' }
    ],
    version: '1.0.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/services/images-api'
  },

  'notification-service': {
    id: 'notification-service',
    name: 'Notification Service',
    description: 'Email, SMS, and push notification delivery service',
    port: 6028,
    directory: 'services/notification-service', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/notification-service',
      managed: 'internal'
    },
    type: ServiceType.Core,
    criticality: ServiceCriticality.Optional,
    status: ServiceStatus.Active,
    tags: ['notifications', 'email', 'sms', 'tenant-aware'],
    dependencies: ['postgresql'],
    timeout: 20000,
    retries: 2,
    warmupTime: 6,
    gatewayPath: '/notifications',
    publicEndpoints: ['/health', '/api/send', '/api/status'],
    requiredEnvVars: ['DATABASE_URL'],
    optionalEnvVars: [
      { name: 'SMTP_HOST', defaultValue: 'localhost', description: 'SMTP server host' },
      { name: 'SMTP_PORT', defaultValue: '587', description: 'SMTP server port' },
      { name: 'FROM_EMAIL', defaultValue: 'noreply@beauty-platform.com', description: 'Default sender email' }
    ],
    version: '1.2.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/services/notification-service'
  },

  'payment-service': {
    id: 'payment-service',
    name: 'Payment Service',
    description: 'Payment processing with Stripe/PayPal integration and invoice generation',
    port: 6029,
    directory: 'services/payment-service', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/payment-service',
      managed: 'internal'
    },
    type: ServiceType.Business,
    criticality: ServiceCriticality.Optional,
    status: ServiceStatus.Active,
    tags: ['payments', 'stripe', 'paypal', 'invoices', 'tenant-aware'],
    dependencies: ['postgresql', 'notification-service'],
    timeout: 45000,
    retries: 3,
    warmupTime: 12,
    gatewayPath: '/payments',
    publicEndpoints: ['/health', '/api/payments', '/webhooks/*', '/api/invoices'],
    requiredEnvVars: ['DATABASE_URL'],
    optionalEnvVars: [
      { name: 'STRIPE_SECRET_KEY', defaultValue: '', description: 'Stripe secret key for live payments' },
      { name: 'PAYPAL_CLIENT_ID', defaultValue: '', description: 'PayPal client ID' },
      { name: 'SUPPORTED_CURRENCIES', defaultValue: 'EUR,USD,PLN,GBP', description: 'Comma-separated list of supported currencies' },
      { name: 'DEFAULT_CURRENCY', defaultValue: 'EUR', description: 'Default platform currency' }
    ],
    version: '1.6.0',
    maintainer: 'Design Corporation',
    documentation: '/docs/services/payment-service'
  },

  // INFRASTRUCTURE & DISABLED SERVICES
  'postgresql': {
    id: 'postgresql',
    name: 'PostgreSQL Database',
    description: 'Primary database with multi-tenant support',
    port: 6100,
    directory: 'external', // deprecated - use run.cwd
    startCommand: 'systemctl start postgresql', // deprecated - use run
    healthEndpoint: '/custom-health',
    run: {
      command: '',
      args: [],
      cwd: '.',
      managed: 'external'
    },
    type: ServiceType.Infrastructure,
    criticality: ServiceCriticality.Critical,
    status: ServiceStatus.Active,
    tags: ['database', 'postgresql', 'tenant-isolation'],
    dependencies: [],
    timeout: 10000,
    retries: 5,
    warmupTime: 30,
    requiredEnvVars: [],
    optionalEnvVars: [
      { name: 'POSTGRES_DB', defaultValue: 'beauty_platform_new', description: 'Database name' },
      { name: 'POSTGRES_USER', defaultValue: 'beauty_platform_user', description: 'Database user' },
      { name: 'POSTGRES_PASSWORD', defaultValue: 'secure_password', description: 'Database password' }
    ],
    version: '16.0',
    maintainer: 'System Admin',
    documentation: '/docs/infrastructure/postgresql'
  },

  'backup-service': {
    id: 'backup-service',
    name: 'Backup Service',
    description: 'Automated database and file backup service',
    port: 6027,
    directory: 'services/backup-service', // deprecated - use run.cwd
    startCommand: 'pnpm dev', // deprecated - use run
    healthEndpoint: '/health',
    run: {
      command: 'pnpm',
      args: ['dev'],
      cwd: 'services/backup-service',
      managed: 'internal'
    },
    type: ServiceType.Utility,
    criticality: ServiceCriticality.Optional,
    status: ServiceStatus.Active,
    tags: ['backup', 'automation', 'database'],
    dependencies: ['postgresql'],
    timeout: 60000, // Backup operations can take time
    retries: 2,
    warmupTime: 15,
    gatewayPath: '/backup',
    publicEndpoints: ['/health', '/api/backup', '/api/restore'],
    requiredEnvVars: ['DATABASE_URL'],
    optionalEnvVars: [
      { name: 'BACKUP_SCHEDULE', defaultValue: '0 3 * * *', description: 'Cron schedule for automatic backups' },
      { name: 'BACKUP_RETENTION', defaultValue: '30', description: 'Days to retain backups' }
    ],
    version: '1.0.0',
    maintainer: 'System Admin',
    documentation: '/docs/services/backup-service'
  }
};

/**
 * Unified Service Registry instance
 */
export const UNIFIED_REGISTRY: UnifiedServiceRegistry = {
  services,
  metadata: {
    version: '1.0.0',
    lastUpdated: '2025-09-26T11:00:00Z',
    totalServices: Object.keys(services).length,
    activeServices: Object.values(services).filter(s => s.status === ServiceStatus.Active).length,
    schemaVersion: '1.0'
  }
};

export default UNIFIED_REGISTRY;
