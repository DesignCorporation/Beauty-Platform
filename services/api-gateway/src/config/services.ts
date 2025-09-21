export interface ServiceConfig {
  name: string;
  url: string;
  path: string;
  timeout?: number;
  retries?: number;
  healthCheck?: string;
}

export const SERVICES: Record<string, ServiceConfig> = {
  auth: {
    name: 'Auth Service',
    url: 'http://localhost:6021',
    path: '/auth',
    timeout: 30000,
    retries: 3,
    healthCheck: '/health'
  },
  mcp: {
    name: 'MCP Server',
    url: 'http://localhost:6025',
    path: '/mcp',
    timeout: 15000,
    retries: 2,
    healthCheck: '/health'
  },
  backup: {
    name: 'Backup Service',
    url: 'http://localhost:6027',
    path: '/backup',
    timeout: 60000, // Backups can take longer
    retries: 2,
    healthCheck: '/health'
  },
  images: {
    name: 'Images API',
    url: 'http://localhost:6026',
    path: '/images',
    timeout: 60000, // Image processing can take time
    retries: 2,
    healthCheck: '/health'
  },
  crm: {
    name: 'CRM API',
    url: 'http://localhost:6022',
    path: '/crm',
    timeout: 30000,
    retries: 3,
    healthCheck: '/health'
  },
  context7: {
    name: 'Context7 MCP',
    url: 'http://localhost:6024',
    path: '/context',
    timeout: 15000,
    retries: 2,
    healthCheck: '/health'
  },
  notifications: {
    name: 'Notification Service',
    url: 'http://localhost:6028',
    path: '/notifications',
    timeout: 20000,
    retries: 2,
    healthCheck: '/health'
  },
  payments: {
    name: 'Payment Service',
    url: 'http://localhost:6029',
    path: '/payments',
    timeout: 45000,
    retries: 3,
    healthCheck: '/health'
  }
  // ВРЕМЕННО ОТКЛЮЧЕНЫ ДО РЕАЛИЗАЦИИ:
  // booking: {
  //   name: 'Booking Service',
  //   url: 'http://localhost:6022',
  //   path: '/booking',
  //   timeout: 30000,
  //   retries: 3,
  //   healthCheck: '/health'
  // }
};

export const API_GATEWAY_CONFIG = {
  port: process.env.API_GATEWAY_PORT || 6020,
  host: process.env.API_GATEWAY_HOST || '0.0.0.0',
  corsOrigins: [
    'https://test-admin.beauty.designcorp.eu',
    'https://test-crm.beauty.designcorp.eu', 
    'https://client.beauty.designcorp.eu',
    'http://localhost:6001',
    'http://localhost:6002',
    'http://localhost:6003'
  ],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  security: {
    enableHelmet: true,
    enableCompression: true,
    enableLogging: true
  }
};