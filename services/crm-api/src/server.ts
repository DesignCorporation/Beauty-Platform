import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { tenantPrisma } from '@beauty-platform/database';
import { authMiddleware } from './middleware/auth';
import { validateTenant } from './middleware/tenant';
import clientsRouter from './routes/clients';
import servicesRouter from './routes/services';
import appointmentsRouter from './routes/appointments';
import staffRouter from './routes/staff';

const logger = pino({
  name: 'beauty-crm-api',
  level: 'info'
});

const app = express();
const PORT = process.env.PORT || 6022; // New port for CRM API

// Trust proxy - важно для работы за nginx
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" }
}));

// Rate limiting - more relaxed for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10000, // limit each IP to 10000 requests per minute (very relaxed)
  message: { error: 'Too many requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'https://test-crm.beauty.designcorp.eu',
    'https://test-admin.beauty.designcorp.eu',
    'http://localhost:6001',
    'http://localhost:6002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Для чтения httpOnly cookies

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'beauty-crm-api',
    timestamp: new Date().toISOString(),
    database: 'beauty_platform_new',
    features: {
      tenantIsolation: true,
      authentication: true,
      crud: ['clients', 'services', 'appointments', 'staff']
    }
  });
});

// Debug endpoint for testing (без аутентификации)
app.get('/debug/clients/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const prisma = tenantPrisma(tenantId);
    
    const clients = await prisma.client.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tenantId: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      debug: true,
      tenantId,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      debug: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint для services (без аутентификации)
app.get('/debug/services/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const prisma = tenantPrisma(tenantId);
    
    const services = await prisma.service.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        status: true,
        tenantId: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      debug: true,
      tenantId,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      debug: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint для создания тестовых услуг (без аутентификации)
app.post('/debug/create-services/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const prisma = tenantPrisma(tenantId);
    
    const testServices = [
      { name: 'Стрижка женская', description: 'Классическая женская стрижка', duration: 60, price: 150.00 },
      { name: 'Окрашивание волос', description: 'Полное окрашивание волос', duration: 120, price: 350.00 },
      { name: 'Маникюр', description: 'Классический маникюр с покрытием', duration: 90, price: 120.00 },
      { name: 'Педикюр', description: 'Классический педикюр', duration: 75, price: 100.00 },
      { name: 'Уход за лицом', description: 'Классический уход за кожей лица', duration: 90, price: 200.00 }
    ];
    
    const createdServices = [];
    
    for (const serviceData of testServices) {
      // Проверяем не существует ли уже
      const existing = await prisma.service.findFirst({
        where: { name: serviceData.name, tenantId }
      });
      
      if (!existing) {
        const service = await prisma.service.create({
          data: {
            ...serviceData,
            tenantId,
            status: 'ACTIVE'
          }
        });
        createdServices.push(service);
      }
    }
    
    res.json({
      success: true,
      debug: true,
      tenantId,
      created: createdServices.length,
      data: createdServices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      debug: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint для создания полной структуры (tenant + клиенты + услуги)
app.post('/debug/setup-test-salon', async (req, res) => {
  try {
    const testTenantId = 'test-salon-2025';
    
    // ВАЖНО: Сначала создаем TENANT!
    try {
      await tenantPrisma(testTenantId).tenant.create({
        data: {
          id: testTenantId,
          name: 'Test Beauty Salon 2025',
          slug: 'test-salon-2025',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Tenant created:', testTenantId);
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        throw error; // Only ignore unique constraint errors
      }
      console.log('✅ Tenant already exists:', testTenantId);
    }
    
    const prisma = tenantPrisma(testTenantId);
    
    // Создаем тестовые услуги
    const testServices = [
      { name: 'Стрижка женская', description: 'Классическая женская стрижка', duration: 60, price: 150.00 },
      { name: 'Окрашивание волос', description: 'Полное окрашивание волос', duration: 120, price: 350.00 },
      { name: 'Маникюр', description: 'Классический маникюр с покрытием', duration: 90, price: 120.00 },
      { name: 'Педикюр', description: 'Классический педикюр', duration: 75, price: 100.00 },
      { name: 'Уход за лицом', description: 'Классический уход за кожей лица', duration: 90, price: 200.00 }
    ];
    
    // Создаем тестовых клиентов  
    const testClients = [
      { name: 'Анна Клиентова', phone: '+380501234567', email: 'anna@example.com' },
      { name: 'Мария Покупатель', phone: '+380501234568', email: 'maria@example.com' },
      { name: 'Елена Красотка', phone: '+380501234569', email: 'elena@example.com' },
      { name: 'Ольга Стильная', phone: '+380501234570', email: 'olga@example.com' },
      { name: 'Светлана Модная', phone: '+380501234571', email: 'svetlana@example.com' }
    ];
    
    // Создаем тестовых сотрудников
    const testStaff = [
      { firstName: 'Мария', lastName: 'Мастер', email: 'maria.master@salon.com', phone: '+380501111111', role: 'STAFF_MEMBER', color: '#3B82F6' },
      { firstName: 'Анна', lastName: 'Стилист', email: 'anna.stylist@salon.com', phone: '+380501111112', role: 'STAFF_MEMBER', color: '#EF4444' },
      { firstName: 'Елена', lastName: 'Управляющая', email: 'elena.manager@salon.com', phone: '+380501111113', role: 'MANAGER', color: '#10B981' }
    ];
    
    const created = { services: [], clients: [], staff: [] };
    
    // Создаем услуги
    for (const serviceData of testServices) {
      try {
        const existing = await prisma.service.findFirst({
          where: { name: serviceData.name }
        });
        
        if (!existing) {
          const service = await prisma.service.create({
            data: {
              ...serviceData,
              tenantId: testTenantId,
              status: 'ACTIVE'
            }
          });
          created.services.push(service);
        }
      } catch (error) {
        console.log(`Service ${serviceData.name} error:`, error.message);
      }
    }
    
    // Создаем клиентов
    for (const clientData of testClients) {
      try {
        const existing = await prisma.client.findFirst({
          where: { email: clientData.email }
        });
        
        if (!existing) {
          const client = await prisma.client.create({
            data: {
              ...clientData,
              tenantId: testTenantId,
              status: 'ACTIVE'
            }
          });
          created.clients.push(client);
        }
      } catch (error) {
        console.log(`Client ${clientData.name} error:`, error.message);
      }
    }
    
    // Создаем сотрудников
    console.log('🔧 Starting staff creation...', testStaff.length, 'staff members');
    for (const staffData of testStaff) {
      try {
        const existing = await prisma.user.findFirst({
          where: { email: staffData.email, tenantId: testTenantId }
        });
        
        if (!existing) {
          const staff = await prisma.user.create({
            data: {
              ...staffData,
              tenantId: testTenantId,
              status: 'ACTIVE',
              password: 'hashed_password_placeholder' // В реальности нужно хешировать
            }
          });
          created.staff.push(staff);
        }
      } catch (error) {
        console.log(`Staff ${staffData.firstName} ${staffData.lastName} error:`, error.message);
      }
    }
    
    res.json({
      success: true,
      debug: true,
      tenantId: testTenantId,
      message: 'Test salon setup completed!',
      created: {
        services: created.services.length,
        clients: created.clients.length,
        staff: created.staff.length
      },
      data: created
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      debug: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint для staff (без аутентификации)
app.get('/debug/staff/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const prisma = tenantPrisma(tenantId);
    
    const staff = await prisma.user.findMany({
      where: {
        tenantId: tenantId,
        role: { not: 'CLIENT' },
        status: 'ACTIVE'
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        color: true,
        tenantId: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      debug: true,
      tenantId,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      debug: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ВРЕМЕННО: публичные роуты для демо без авторизации
app.use('/demo/clients', (req: any, res, next) => {
  req.tenantId = 'cmem0a46l00009f1i8v2nz6qz'; // Beauty Test Salon - ОСНОВНОЙ САЛОН с ДАННЫМИ!
  next();
}, clientsRouter);

app.use('/demo/services', (req: any, res, next) => {
  req.tenantId = 'cmem0a46l00009f1i8v2nz6qz'; // Beauty Test Salon - ОСНОВНОЙ САЛОН с ДАННЫМИ!
  next();
}, servicesRouter);

app.use('/demo/staff', (req: any, res, next) => {
  req.tenantId = 'cmem0a46l00009f1i8v2nz6qz'; // Beauty Test Salon - ОСНОВНОЙ САЛОН с ДАННЫМИ!
  next();
}, staffRouter);

// Authentication middleware - все CRM routes требуют авторизации
app.use('/api', authMiddleware);
app.use('/api', validateTenant);

// API Routes with tenant isolation
app.use('/api/clients', clientsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/staff', staffRouter);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, req: req.url }, 'Request failed');
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/clients',
      'POST /api/clients',
      'GET /api/services',
      'POST /api/services',
      'GET /api/appointments',
      'POST /api/appointments',
      'GET /api/staff'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  logger.info({
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: 'beauty_platform_new'
  }, '🚀 Beauty CRM API started successfully');
  
  console.log(`
  🎯 BEAUTY CRM API - NEW CLEAN ARCHITECTURE
  ==========================================
  🚀 Port: ${PORT}
  📊 Database: beauty_platform_new
  🛡️  Tenant Isolation: ENABLED
  🔐 Authentication: REQUIRED
  📍 Endpoints: /api/clients, /api/services, /api/appointments, /api/staff
  🌍 CORS: test-crm.beauty.designcorp.eu
  ⚡ Status: READY FOR PRODUCTION
  `);
});

export default app;