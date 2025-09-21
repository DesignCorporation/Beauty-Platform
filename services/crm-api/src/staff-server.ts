import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth';
import { validateTenant } from './middleware/tenant';
import staffRoutes from './routes/staff';
import appointmentsRoutes from './routes/simple-appointments';

const app = express();
const PORT = process.env.PORT || 6022;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:6001',
    'https://test-crm.beauty.designcorp.eu'
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'crm-staff-api',
    timestamp: new Date().toISOString()
  });
});

// Protected routes
app.use('/api/staff', authMiddleware, validateTenant, staffRoutes);
app.use('/api/appointments', authMiddleware, validateTenant, appointmentsRoutes);

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [STAFF API] Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Staff API: http://localhost:${PORT}/api/staff`);
});