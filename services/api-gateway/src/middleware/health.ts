import { Request, Response } from 'express';
import { SERVICES } from '../config/services';
import { ServiceHealthStatus } from '../types/gateway';
import { metricsCollector } from './metrics';

class HealthChecker {
  private healthCache: Record<string, ServiceHealthStatus> = {};
  private checkInterval = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;

  start() {
    // Initial health check
    this.checkAllServices();
    
    // Start periodic health checks
    this.intervalId = setInterval(() => {
      this.checkAllServices();
    }, this.checkInterval);
    
    console.log(`Health checker started with ${this.checkInterval}ms interval`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  async checkAllServices() {
    const promises = Object.entries(SERVICES).map(([key, service]) => 
      this.checkService(key, service)
    );
    
    await Promise.allSettled(promises);
  }

  async checkService(serviceKey: string, service: any): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      const healthUrl = `${service.url}${service.healthCheck || '/health'}`;
      const timeoutMs = service.timeout || 5000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Beauty-Platform-API-Gateway/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      const healthStatus: ServiceHealthStatus = {
        service: service.name,
        status: response.ok ? 'healthy' : 'unhealthy',
        latency,
        lastCheck: new Date()
      };
      
      if (!response.ok) {
        healthStatus.error = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      this.healthCache[serviceKey] = healthStatus;
      metricsCollector.updateServiceHealth(serviceKey, healthStatus);
      
      return healthStatus;
      
    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      const healthStatus: ServiceHealthStatus = {
        service: service.name,
        status: 'unhealthy',
        latency,
        error: error.message || 'Connection failed',
        lastCheck: new Date()
      };
      
      this.healthCache[serviceKey] = healthStatus;
      metricsCollector.updateServiceHealth(serviceKey, healthStatus);
      
      return healthStatus;
    }
  }

  getServiceHealth(serviceKey: string): ServiceHealthStatus | undefined {
    return this.healthCache[serviceKey];
  }

  getAllHealth(): Record<string, ServiceHealthStatus> {
    return { ...this.healthCache };
  }

  isServiceHealthy(serviceKey: string): boolean {
    const health = this.healthCache[serviceKey];
    return health?.status === 'healthy';
  }
}

export const healthChecker = new HealthChecker();

export const healthRoute = async (req: Request, res: Response) => {
  const allHealth = healthChecker.getAllHealth();
  const overallHealthy = Object.values(allHealth).every(h => h.status === 'healthy');
  
  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: allHealth,
    gateway: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    }
  });
};

export const readinessRoute = async (req: Request, res: Response) => {
  // Check if critical services are healthy
  const criticalServices = ['auth']; // Auth is critical for most operations
  const criticalHealthy = criticalServices.every(service => 
    healthChecker.isServiceHealthy(service)
  );
  
  res.status(criticalHealthy ? 200 : 503).json({
    ready: criticalHealthy,
    timestamp: new Date().toISOString(),
    criticalServices: criticalServices.map(service => ({
      service,
      healthy: healthChecker.isServiceHealthy(service)
    }))
  });
};