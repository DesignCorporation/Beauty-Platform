// Конфигурация сервисов для мониторинга
// Разделена на категории для лучшего отображения в админке

export interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  critical: boolean;
  timeout: number;
  expectedStatus: number;
  category: 'gateway-routed' | 'direct-access' | 'infrastructure';
  gatewayPath?: string; // Путь через API Gateway
  description: string;
  autoRestoreKey?: string; // Ключ для smart-restore-manager.sh
}

// 🚀 Сервисы, маршрутизируемые через API Gateway
export const GATEWAY_ROUTED_SERVICES: ServiceConfig[] = [
  {
    name: 'Auth Service',
    url: 'http://localhost:6021',
    healthEndpoint: '/health',
    critical: true,
    timeout: 5000,
    expectedStatus: 200,
    category: 'gateway-routed',
    gatewayPath: '/api/auth/*',
    description: 'JWT authentication and authorization service',
    autoRestoreKey: 'auth-service'
  },
  {
    name: 'CRM API',
    url: 'http://localhost:6022',
    healthEndpoint: '/health',
    critical: true,
    timeout: 5000,
    expectedStatus: 200,
    category: 'gateway-routed',
    gatewayPath: '/api/crm/*',
    description: 'Core CRM API for appointments and clients',
    autoRestoreKey: 'crm-api'
  },
  {
    name: 'MCP Server',
    url: 'http://localhost:6025',
    healthEndpoint: '/health',
    critical: false,
    timeout: 5000,
    expectedStatus: 200,
    category: 'gateway-routed',
    gatewayPath: '/api/mcp/*',
    description: 'AI context and documentation auto-sync',
    autoRestoreKey: 'mcp-server'
  },
  {
    name: 'Images API',
    url: 'http://localhost:6026',
    healthEndpoint: '/health',
    critical: false,
    timeout: 15000,
    expectedStatus: 200,
    category: 'gateway-routed',
    gatewayPath: '/api/images/*',
    description: 'Image processing and storage service',
    autoRestoreKey: 'images-api'
  },
  {
    name: 'Backup Service',
    url: 'http://localhost:6027',
    healthEndpoint: '/health',
    critical: false,
    timeout: 10000,
    expectedStatus: 200,
    category: 'gateway-routed',
    gatewayPath: '/api/backup/*',
    description: 'Automated backup and restore system',
    autoRestoreKey: 'backup-service'
  }
];

// 🌐 Сервисы с прямым доступом через nginx
export const DIRECT_ACCESS_SERVICES: ServiceConfig[] = [
  {
    name: 'Admin Panel',
    url: 'http://localhost:6002',
    healthEndpoint: '/',
    critical: false,
    timeout: 10000,
    expectedStatus: 200,
    category: 'direct-access',
    description: 'React admin panel for platform management',
    autoRestoreKey: 'admin-panel'
  },
  {
    name: 'Salon CRM',
    url: 'http://localhost:6001',
    healthEndpoint: '/',
    critical: false,
    timeout: 10000,
    expectedStatus: 200,
    category: 'direct-access',
    description: 'CRM system for beauty salons',
    autoRestoreKey: 'salon-crm'
  },
  {
    name: 'Client Portal',
    url: 'http://localhost:6003',
    healthEndpoint: '/',
    critical: false,
    timeout: 10000,
    expectedStatus: 200,
    category: 'direct-access',
    description: 'Portal for salon clients',
    autoRestoreKey: 'client-portal'
  },
  {
    name: 'Landing Page',
    url: 'http://localhost:6000',
    healthEndpoint: '/',
    critical: false,
    timeout: 10000,
    expectedStatus: 200,
    category: 'direct-access',
    description: 'Public landing page and marketing site',
    autoRestoreKey: 'landing-page'
  }
];

// 🛠️ Инфраструктурные сервисы
export const INFRASTRUCTURE_SERVICES: ServiceConfig[] = [
  {
    name: 'VS Code Server',
    url: 'http://localhost:6080',
    healthEndpoint: '/',
    critical: false,
    timeout: 15000,
    expectedStatus: 200,
    category: 'infrastructure',
    description: 'Cloud-based VS Code development environment'
  }
];

// Объединенная конфигурация для обратной совместимости
export const SERVICES_CONFIG: ServiceConfig[] = [
  ...GATEWAY_ROUTED_SERVICES,
  ...DIRECT_ACCESS_SERVICES,
  ...INFRASTRUCTURE_SERVICES
];
