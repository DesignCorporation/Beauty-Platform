import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Routes
import healthRoutes from './routes/health';
import notificationRoutes from './routes/notifications';
import settingsRoutes from './routes/settings';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6028;

// ========================================
// MIDDLEWARE SETUP
// ========================================

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:6001',
    'http://localhost:6002',
    'http://localhost:6003',
    'https://test-crm.beauty.designcorp.eu',
    'https://test-admin.beauty.designcorp.eu',
    'https://client.beauty.designcorp.eu'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing for JWT tokens
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// ========================================
// ROUTES
// ========================================

// Health routes (no auth required)
app.use('/', healthRoutes);

// API routes (with authentication)
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Future API routes
// app.use('/api/templates', tenantAuth, templateRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    service: 'notification',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', error);

  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong',
    service: 'notification',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ========================================
// SERVER STARTUP
// ========================================

const server = app.listen(PORT, () => {
  console.log(`🔔 Notification Service started successfully`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status check: http://localhost:${PORT}/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;