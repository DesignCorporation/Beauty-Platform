import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from 'dotenv';

// Load environment variables
config();

import { API_GATEWAY_CONFIG } from './config/services';
import { metricsMiddleware, metricsRoute } from './middleware/metrics';
import { healthChecker, healthRoute, readinessRoute, servicesHealthRoute } from './middleware/health';
import proxyRoutes from './routes/proxy';
import systemRoutes from './routes/system';
import autoRestoreRoutes from './routes/auto-restore';

const app: express.Application = express();

// Basic middleware setup
if (API_GATEWAY_CONFIG.security.enableHelmet) {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));
}

if (API_GATEWAY_CONFIG.security.enableCompression) {
  app.use(compression());
}

// CORS configuration
app.use(cors({
  origin: API_GATEWAY_CONFIG.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
}));

// Rate limiting
const limiter = rateLimit(API_GATEWAY_CONFIG.rateLimit);
app.use(limiter);

// Request parsing - НЕ для proxy API роутов (они обрабатываются proxy)
app.use((req, res, next) => {
  // Пропускаем парсинг body только для проксируемых роутов
  // НО включаем парсинг для локальных роутов: /api/monitoring/, /api/system/
  if (req.path.startsWith('/api/') && 
      !req.path.startsWith('/api/monitoring/') && 
      !req.path.startsWith('/api/system/') &&
      !req.path.startsWith('/api/orchestrator/')) {
    return next(); // Пропускаем парсинг для proxy роутов
  }
  // Для всех остальных (включая /api/monitoring/ и /api/system/) используем стандартный парсинг
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
  // Аналогично для urlencoded
  if (req.path.startsWith('/api/') && 
      !req.path.startsWith('/api/monitoring/') && 
      !req.path.startsWith('/api/system/') &&
      !req.path.startsWith('/api/orchestrator/')) {
    return next(); 
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// Logging
if (API_GATEWAY_CONFIG.security.enableLogging) {
  app.use(morgan('combined', {
    stream: {
      write: (message) => console.log(message.trim())
    }
  }));
}

// Metrics collection
app.use(metricsMiddleware);

// Health and status routes
app.get('/health', healthRoute);
app.get('/ready', readinessRoute);
app.get('/metrics', metricsRoute);

// Отдельные health метрики для сервисов (разделение gateway/services)
app.get('/services/health', servicesHealthRoute); // Все сервисы
app.get('/services/health/:service', servicesHealthRoute); // Конкретный сервис

// Gateway info route
app.get('/info', (req, res) => {
  res.json({
    name: 'Beauty Platform API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: Object.keys(require('./config/services').SERVICES),
    endpoints: {
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
      info: '/info'
    }
  });
});

// System management routes (before proxy)
app.use('/api/system', systemRoutes);

// Monitoring routes (enhanced)
import monitoringRoutes, { startMonitoring } from './routes/monitoring';
app.use('/api/monitoring', monitoringRoutes);

// Auto-Restore management routes
app.use('/api/auto-restore', autoRestoreRoutes);

// New Orchestrator API with circuit breaker and advanced state management
import orchestratorRoutes from './routes/orchestrator';
app.use('/api/orchestrator', orchestratorRoutes);

// Main API routes (proxy to microservices)
app.use('/api', proxyRoutes);

// Fallback for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `The requested route ${req.method} ${req.originalUrl} was not found`,
    availableRoutes: [
      '/health',
      '/ready', 
      '/metrics',
      '/info',
      '/api/auth/*',
      '/api/backup/*',
      '/api/system/*',
      '/api/monitoring/*',
      '/api/auto-restore/*',
      '/orchestrator/*',
      '/api/images/*',
      '/api/mcp/*',
      '/api/crm/*',
      '/api/context/*',
      '/api/booking/*',
      '/api/notifications/*',
      '/api/payments/*'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: 'Internal Gateway Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  healthChecker.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  healthChecker.stop();
  process.exit(0);
});

// Start server
const PORT = parseInt(API_GATEWAY_CONFIG.port.toString());
const HOST = API_GATEWAY_CONFIG.host;

app.listen(PORT, HOST, () => {
  console.log('🚀 Beauty Platform API Gateway started!');
  console.log(`📡 Server running on http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔗 Available routes:');
  console.log('  - /health (Health check)');
  console.log('  - /ready (Readiness check)');
  console.log('  - /metrics (Gateway metrics)');
  console.log('  - /info (Gateway information)');
  console.log('  - /api/auth/* (Auth Service proxy)');
  console.log('  - /api/system/* (System monitoring endpoints)');
  console.log('  - /api/images/* (Images API proxy)');
  console.log('  - /api/mcp/* (MCP Server proxy)');
  console.log('  - /api/orchestrator/* (Orchestrator control API)');
  console.log('  - /api/crm/* (CRM API proxy)');
  console.log('  - /api/backup/* (Backup Service proxy)');
  console.log('  - /api/booking/* (Booking Service proxy - planned)');
  console.log('  - /api/notifications/* (Notification Service proxy - planned)');
  console.log('  - /api/payments/* (Payment Service proxy - planned)');
  
  // Start health checker
  healthChecker.start();
  console.log('🏥 Health checker started');
  
  // Start enhanced monitoring
  startMonitoring();
  console.log('🔍 Enhanced monitoring started');
  
  // Initialize Telegram alerts
  try {
    require('./alerts/TelegramAlert');
    console.log('📱 Telegram alerts initialized');
  } catch (error) {
    console.log('📱 Telegram alerts not available (missing configuration)');
  }
  
  console.log('✅ API Gateway ready to serve requests!');
});

export default app;
