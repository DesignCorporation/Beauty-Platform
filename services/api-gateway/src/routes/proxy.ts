import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { SERVICES } from '../config/services';
import { ProxyRequest, ProxyResponse } from '../types/gateway';
import { healthChecker } from '../middleware/health';

const router: Router = Router();

// Custom error handler for proxy
const handleProxyError = (serviceName: string) => (err: any, req: ProxyRequest, res: ProxyResponse) => {
  console.error(`Proxy error for ${serviceName}:`, err.message);
  
  if (!res.headersSent) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: `${serviceName} is currently unavailable`,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
};

// Custom request handler to add headers and check service health
const handleProxyRequest = (serviceName: string) => (proxyReq: any, req: ProxyRequest, res: ProxyResponse) => {
  // ✅ ИСПРАВЛЕНИЕ: Сначала сохраняем ВСЕ важные заголовки
  const criticalHeaders = [
    'cookie',           // httpOnly cookies - КРИТИЧНО!
    'x-csrf-token',     // CSRF защита - КРИТИЧНО!
    'authorization',    // Bearer tokens
    'content-type',     // Тип контента
    'user-agent',       // Браузер info
    'referer',          // Откуда пришел запрос
    'accept',           // Что ожидает клиент
    'accept-language',  // Язык
    'accept-encoding'   // Сжатие
  ];
  
  // Копируем все критичные заголовки из оригинального запроса
  criticalHeaders.forEach(headerName => {
    if (req.headers[headerName]) {
      proxyReq.setHeader(headerName, req.headers[headerName]);
    }
  });
  
  // Добавляем Gateway заголовки ПОСЛЕ критичных
  const requestId = req.headers['x-request-id'] || `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  proxyReq.setHeader('X-Request-ID', requestId);
  proxyReq.setHeader('X-Forwarded-By', 'Beauty-Platform-API-Gateway');
  proxyReq.setHeader('X-Target-Service', serviceName);
  
  // Debug: Log the exact path being proxied
  console.log(`🔄 Proxying to ${serviceName}:`);
  console.log(`  - req.path: ${req.path}`);
  console.log(`  - req.originalUrl: ${req.originalUrl}`);
  console.log(`  - req.url: ${req.url}`);
  console.log(`  - req.baseUrl: ${req.baseUrl}`);
  console.log(`  - proxyReq.path: ${proxyReq.path}`);
  console.log(`  - cookies: ${req.headers.cookie ? 'present' : 'missing'}`);
  console.log(`  - csrf-token: ${req.headers['x-csrf-token'] ? 'present' : 'missing'}`);
  
  // Store service name for metrics
  req.targetService = serviceName;
};

// Custom response handler for logging and metrics
const handleProxyResponse = (serviceName: string) => (proxyRes: any, req: ProxyRequest, res: ProxyResponse) => {
  // Add response headers  
  proxyRes.headers['x-served-by'] = 'Beauty-Platform-API-Gateway';
  proxyRes.headers['x-target-service'] = serviceName;
  
  // ✅ ИСПРАВЛЕНИЕ: Улучшенное логирование для отладки POST timeout
  console.log(`✅ Proxied ${req.method} ${req.originalUrl} to ${serviceName}`);
  console.log(`   Status: ${proxyRes.statusCode}`);
  console.log(`   Headers: ${Object.keys(proxyRes.headers || {}).length} headers`);
  console.log(`   Content-Type: ${proxyRes.headers['content-type'] || 'not set'}`);
  
  // Логирование завершения ответа
  proxyRes.on('end', () => {
    console.log(`🎉 Response completed for ${req.method} ${req.originalUrl}`);
  });
  
  proxyRes.on('error', (err: any) => {
    console.error(`❌ Response error for ${req.method} ${req.originalUrl}:`, err.message);
  });
};

// Service availability middleware
const checkServiceAvailability = (serviceName: string) => (req: ProxyRequest, res: ProxyResponse, next: any) => {
  if (!healthChecker.isServiceHealthy(serviceName)) {
    const health = healthChecker.getServiceHealth(serviceName);
    return res.status(503).json({
      error: 'Service Unavailable',
      message: `${serviceName} is currently unhealthy`,
      details: health?.error || 'Service health check failed',
      timestamp: new Date().toISOString()
    });
  }
  return next();
};

// Debug middleware to see what routes are being registered
const debugMiddleware = (req: any, res: any, next: any) => {
  console.log(`🔍 Gateway request: ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  return next();
};

router.use(debugMiddleware);

// Create proxy for each service
Object.entries(SERVICES).forEach(([serviceKey, serviceConfig]) => {
  console.log(`🔧 Creating proxy for service: ${serviceKey} (${serviceConfig.name})`);
  console.log(`   Path: ${serviceConfig.path} -> ${serviceConfig.url}`);

  // Special handling for different services
  let pathRewrite = {};
  
  // Images API expects /api/images
  if (serviceKey === 'images') {
    pathRewrite = {
      '^/images': '/api/images'
    };
  }
  
  // Auth Service expects /auth paths
  // РЕАЛЬНОСТЬ: pathRewrite получает ПОЛНЫЙ путь /api/auth/me
  // Нужно: /api/auth/me -> /auth/me
  if (serviceKey === 'auth') {
    pathRewrite = {
      '^/api/auth(.*)$': '/auth$1'  // /api/auth/me -> /auth/me
    };
  }
  
  // MCP Server expects direct paths
  if (serviceKey === 'mcp') {
    pathRewrite = {
      '^/mcp': ''
    };
  }
  
  // Backup Service expects direct paths (remove /backup prefix)
  if (serviceKey === 'backup') {
    pathRewrite = {
      '^/backup(.*)$': '$1'  // /backup/health -> /health
    };
  }
  
  // CRM API expects /api/* paths
  if (serviceKey === 'crm') {
    pathRewrite = {
      '^/crm(.*)$': '/api$1'  // /crm/appointments -> /api/appointments
    };
  }
  
  // Context7 MCP expects direct paths
  if (serviceKey === 'context7') {
    pathRewrite = {
      '^/context(.*)$': '$1'  // /context/resolve -> /resolve
    };
  }

  // Notification Service expects /api/* paths
  if (serviceKey === 'notifications') {
    pathRewrite = {
      '^/notifications(.*)$': '/api/notifications$1'  // /notifications/me -> /api/notifications/me
    };
  }

  // Payment Service expects /api/* paths
  if (serviceKey === 'payments') {
    pathRewrite = {
      '^/payments(.*)$': '/api$1'  // /payments/subscriptions/me -> /api/subscriptions/me
    };
  }

  const proxyOptions = {
    target: serviceConfig.url,
    changeOrigin: true,
    timeout: serviceConfig.timeout || 30000,
    
    // ✅ ИСПРАВЛЕНИЕ: Правильная обработка cookies и заголовков
    cookieDomainRewrite: false as const,     // Сохраняем оригинальные домены cookies
    cookiePathRewrite: false as const,       // Сохраняем оригинальные пути cookies
    xfwd: true,                     // Добавляем X-Forwarded-* заголовки
    
    // ✅ ИСПРАВЛЕНИЕ POST timeout: Правильная обработка body
    selfHandleResponse: false,      // Позволяем middleware обрабатывать ответ
    // Убрали buffer: true - конфликтует с pipe
    
    pathRewrite,
    onError: handleProxyError(serviceConfig.name),
    onProxyReq: handleProxyRequest(serviceConfig.name), 
    onProxyRes: handleProxyResponse(serviceConfig.name),
    logLevel: (process.env.NODE_ENV === 'development' ? 'debug' : 'warn') as 'debug' | 'warn'
  };

  console.log(`🔧 Creating proxy middleware for ${serviceKey} with options:`, {
    target: serviceConfig.url,
    pathRewrite: pathRewrite
  });

  // Create proxy middleware for the specific path
  const proxyMiddleware = createProxyMiddleware(proxyOptions);

  console.log(`🔧 Mounting routes for ${serviceKey}:`);
  console.log(`   ${serviceConfig.path}`);
  console.log(`   ${serviceConfig.path}/*`);

  // Mount proxy for both exact path and subpaths
  router.use(serviceConfig.path, checkServiceAvailability(serviceKey), proxyMiddleware);
  router.use(`${serviceConfig.path}/*`, checkServiceAvailability(serviceKey), proxyMiddleware);

  console.log(`✅ Proxy route created: ${serviceConfig.path} -> ${serviceConfig.url} (rewrite: ${JSON.stringify(pathRewrite)})`);
});

// Health check route for direct service access
router.get('/services/:service/health', async (req, res) => {
  const serviceName = req.params.service;
  const service = SERVICES[serviceName];
  
  if (!service) {
    return res.status(404).json({
      error: 'Service not found',
      availableServices: Object.keys(SERVICES)
    });
  }
  
  const health = healthChecker.getServiceHealth(serviceName);
  return res.json({
    service: serviceName,
    health: health || { status: 'unknown', lastCheck: new Date() }
  });
});

export default router;