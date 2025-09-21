import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes
import healthRoutes from './routes/health';
import subscriptionRoutes from './routes/subscriptions';
import webhookRoutes from './routes/webhooks';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6029;

// 🔐 КРИТИЧНО: Raw body для Stripe webhooks ПЕРЕД другими middleware
// Stripe webhook signatures требуют raw body
app.use('/webhooks', express.raw({ type: 'application/json' }));

// 🛡️ Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// 🌐 CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://test-admin.beauty.designcorp.eu',
  'https://test-crm.beauty.designcorp.eu',
  'http://localhost:6001',
  'http://localhost:6002',
  'http://localhost:6003'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Important for httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
}));

// 🍪 Cookie parser
app.use(cookieParser());

// 📄 JSON parsing для всех routes кроме webhooks
app.use('/api', express.json({ limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// 🚦 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// 📊 Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 🎯 Routes
app.use('/', healthRoutes);                    // Health check (public)
app.use('/webhooks', webhookRoutes);           // Stripe webhooks (raw body)
app.use('/api/subscriptions', subscriptionRoutes); // Subscription management (protected)

// 🏠 Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Beauty Platform Payment Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      subscriptions: '/api/subscriptions',
      webhooks: '/webhooks/stripe'
    }
  });
});

// 🚫 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    service: 'payment',
    timestamp: new Date().toISOString()
  });
});

// ❌ Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Global error handler:', err);

  // Stripe webhook errors
  if (req.path.includes('/webhooks/stripe')) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Regular API errors
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    service: 'payment',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 🚀 Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Payment Service running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 API: http://localhost:${PORT}/api/subscriptions`);
  console.log(`🎣 Webhooks: http://localhost:${PORT}/webhooks/stripe`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 🔄 Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Payment Service stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Payment Service stopped');
    process.exit(0);
  });
});

export default app;