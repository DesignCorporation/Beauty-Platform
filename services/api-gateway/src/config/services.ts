export interface ServiceConfig {
  name: string;
  url: string;
  path: string;
  timeout?: number;
  retries?: number;
  healthCheck?: string;
}

// Услуги интегрированные с API Gateway на основе unified service registry
// Только активные сервисы с gatewayPath (context7 и backup удалены)
export const SERVICES: Record<string, ServiceConfig> = {
  'auth-service': {
    name: 'Auth Service',
    url: 'http://localhost:6021',
    path: '/auth',
    timeout: 30000,
    retries: 3,
    healthCheck: '/health'
  },
  'mcp-server': {
    name: 'MCP Server',
    url: 'http://localhost:6025',
    path: '/mcp',
    timeout: 15000,
    retries: 2,
    healthCheck: '/health'
  },
  'images-api': {
    name: 'Images API',
    url: 'http://localhost:6026',
    path: '/images',
    timeout: 60000,
    retries: 2,
    healthCheck: '/health'
  },
  'crm-api': {
    name: 'CRM API',
    url: 'http://localhost:6022',
    path: '/crm',
    timeout: 30000,
    retries: 3,
    healthCheck: '/health'
  },
  'notification-service': {
    name: 'Notification Service',
    url: 'http://localhost:6028',
    path: '/notifications',
    timeout: 20000,
    retries: 2,
    healthCheck: '/health'
  },
  'payment-service': {
    name: 'Payment Service',
    url: 'http://localhost:6029',
    path: '/payments',
    timeout: 45000,
    retries: 3,
    healthCheck: '/health'
  }
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