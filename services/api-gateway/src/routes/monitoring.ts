import express from 'express';
import axios from 'axios';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const router: express.Router = express.Router();

// Event emitter для real-time уведомлений
export const monitoringEvents = new EventEmitter();

// Импортируем структурированную конфигурацию сервисов
import { SERVICES_CONFIG, GATEWAY_ROUTED_SERVICES, DIRECT_ACCESS_SERVICES, INFRASTRUCTURE_SERVICES } from '../config/monitoring-services';

// Хранилище для метрик
interface ServiceMetrics {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  uptime: number;
  lastCheck: Date;
  availability24h: number;
  incidents24h: number;
  errorRate: number;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu?: number;
}

let servicesMetrics: Map<string, ServiceMetrics> = new Map();
let healthCheckInterval: NodeJS.Timeout | null = null;

const SMART_RESTORE_SCRIPT = process.env.SMART_RESTORE_SCRIPT || '/root/beauty-platform/deployment/auto-restore/smart-restore-manager.sh';
const SMART_RESTORE_WORKDIR = process.env.SMART_RESTORE_WORKDIR || '/root/beauty-platform/deployment/auto-restore';
const AUTO_RESTORE_SERVICES = new Set(['admin-panel', 'salon-crm', 'client-portal', 'api-gateway', 'auth-service', 'mcp-server', 'images-api', 'crm-api', 'backup-service', 'postgresql']);
const MONITORING_SERVICE_URL = process.env.MONITORING_SERVICE_URL || 'http://health-monitor:6030';

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

function runSmartRestore(args: string[]): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [SMART_RESTORE_SCRIPT, ...args], {
      cwd: SMART_RESTORE_WORKDIR,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(Object.assign(error, { stdout, stderr, code: -1 }));
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

function resolveAutoRestoreKey(serviceName: string): string | null {
  const config = SERVICES_CONFIG.find((service) => service.name === serviceName);
  if (config?.autoRestoreKey && AUTO_RESTORE_SERVICES.has(config.autoRestoreKey)) {
    return config.autoRestoreKey;
  }

  const normalized = serviceName.toLowerCase().replace(/\s+/g, '-');
  if (AUTO_RESTORE_SERVICES.has(normalized)) {
    return normalized;
  }

  return null;
}

// Инициализация метрик
SERVICES_CONFIG.forEach(service => {
  servicesMetrics.set(service.name, {
    name: service.name,
    status: 'offline',
    responseTime: 0,
    uptime: 0,
    lastCheck: new Date(),
    availability24h: 100,
    incidents24h: 0,
    errorRate: 0
  });
});

// Функция проверки здоровья сервиса
async function checkServiceHealth(service: typeof SERVICES_CONFIG[0]): Promise<ServiceMetrics> {
  const startTime = Date.now();
  const metrics = servicesMetrics.get(service.name) || {
    name: service.name,
    status: 'offline' as const,
    responseTime: 0,
    uptime: 0,
    lastCheck: new Date(),
    availability24h: 100,
    incidents24h: 0,
    errorRate: 0
  };

  try {
    const response = await axios.get(service.url + service.healthEndpoint, {
      timeout: service.timeout,
      headers: {
        'User-Agent': 'Beauty-Platform-Monitor/2.0'
      }
    });

    const responseTime = Date.now() - startTime;
    const isHealthy = response.status === service.expectedStatus;

    // Определяем статус
    let status: 'online' | 'offline' | 'degraded';
    if (isHealthy && responseTime < 3000) {
      status = 'online';
    } else if (isHealthy && responseTime < 10000) {
      status = 'degraded';
    } else {
      status = 'offline';
    }

    // Извлекаем дополнительные метрики из ответа
    let memory, cpu, uptime;
    if (response.data && typeof response.data === 'object') {
      uptime = response.data.uptime || 0;
      
      if (response.data.memory) {
        const mem = response.data.memory;
        memory = {
          used: Math.round((mem.heapUsed || mem.used || 0) / 1024 / 1024), // MB
          total: Math.round((mem.heapTotal || mem.total || 0) / 1024 / 1024), // MB
          percentage: mem.heapUsed && mem.heapTotal 
            ? Math.round((mem.heapUsed / mem.heapTotal) * 100)
            : 0
        };
      }

      cpu = response.data.cpu || 0;
    }

    const updatedMetrics: ServiceMetrics = {
      ...metrics,
      status,
      responseTime,
      uptime: uptime || metrics.uptime,
      lastCheck: new Date(),
      memory,
      cpu
    };

    // Если статус изменился, отправляем событие
    if (metrics.status !== status) {
      monitoringEvents.emit('statusChange', {
        service: service.name,
        previousStatus: metrics.status,
        currentStatus: status,
        responseTime,
        critical: service.critical,
        timestamp: new Date()
      });

      // Увеличиваем счетчик инцидентов при переходе в offline
      if (status === 'offline') {
        updatedMetrics.incidents24h = metrics.incidents24h + 1;
      }
    }

    servicesMetrics.set(service.name, updatedMetrics);
    return updatedMetrics;

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorStatus = 'offline';

    // Обработка разных типов ошибок
    let errorDetails = 'Connection failed';
    if (error.code === 'ECONNREFUSED') {
      errorDetails = 'Connection refused - service may be down';
    } else if (error.code === 'ETIMEDOUT') {
      errorDetails = 'Request timeout - service overloaded';
    } else if (error.code === 'ENOTFOUND') {
      errorDetails = 'Host not found - DNS or service issue';
    }

    const updatedMetrics: ServiceMetrics = {
      ...metrics,
      status: errorStatus,
      responseTime,
      lastCheck: new Date(),
      errorRate: metrics.errorRate + 1
    };

    // Отправляем событие об ошибке
    if (metrics.status !== errorStatus) {
      monitoringEvents.emit('statusChange', {
        service: service.name,
        previousStatus: metrics.status,
        currentStatus: errorStatus,
        responseTime,
        critical: service.critical,
        error: errorDetails,
        timestamp: new Date()
      });

      updatedMetrics.incidents24h = metrics.incidents24h + 1;
    }

    servicesMetrics.set(service.name, updatedMetrics);
    return updatedMetrics;
  }
}

// API для получения структурированных метрик по категориям
router.get('/metrics-structured', async (req, res) => {
  try {
    const gatewayServices = GATEWAY_ROUTED_SERVICES.map(service => {
      const metrics = servicesMetrics.get(service.name);
      return {
        ...service,
        metrics: metrics || {
          name: service.name,
          status: 'unknown',
          responseTime: 0,
          uptime: 0,
          lastCheck: new Date(),
          availability24h: 100,
          incidents24h: 0,
          errorRate: 0
        }
      };
    });

    const directServices = DIRECT_ACCESS_SERVICES.map(service => {
      const metrics = servicesMetrics.get(service.name);
      return {
        ...service,
        metrics: metrics || {
          name: service.name,
          status: 'unknown',
          responseTime: 0,
          uptime: 0,
          lastCheck: new Date(),
          availability24h: 100,
          incidents24h: 0,
          errorRate: 0
        }
      };
    });

    const infrastructureServices = INFRASTRUCTURE_SERVICES.map(service => {
      const metrics = servicesMetrics.get(service.name);
      return {
        ...service,
        metrics: metrics || {
          name: service.name,
          status: 'unknown',
          responseTime: 0,
          uptime: 0,
          lastCheck: new Date(),
          availability24h: 100,
          incidents24h: 0,
          errorRate: 0
        }
      };
    });

    const totalServices = gatewayServices.length + directServices.length + infrastructureServices.length;
    const onlineServices = [...gatewayServices, ...directServices, ...infrastructureServices]
      .filter(s => s.metrics.status === 'online').length;

    res.json({
      success: true,
      data: {
        categories: {
          gatewayRouted: {
            title: 'API Gateway Routed Services',
            description: 'Services accessed through API Gateway (port 6020)',
            icon: '🚀',
            services: gatewayServices
          },
          directAccess: {
            title: 'Direct Access Services',
            description: 'Frontend applications with direct nginx proxy',
            icon: '🌐',
            services: directServices
          },
          infrastructure: {
            title: 'Infrastructure Services',
            description: 'Development and infrastructure services',
            icon: '🛠️',
            services: infrastructureServices
          }
        },
        summary: {
          totalServices,
          onlineServices,
          gatewayRoutedCount: gatewayServices.length,
          directAccessCount: directServices.length,
          infrastructureCount: infrastructureServices.length
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching structured metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch structured metrics'
    });
  }
});

// API для получения всех метрик (обратная совместимость)
router.get('/metrics', async (req, res) => {
  try {
    const metricsArray = Array.from(servicesMetrics.values());
    
    // Вычисляем общие метрики системы
    const totalServices = metricsArray.length;
    const onlineServices = metricsArray.filter(m => m.status === 'online').length;
    const criticalServices = SERVICES_CONFIG.filter(s => s.critical);
    const criticalIssues = criticalServices.filter(cs => {
      const metrics = servicesMetrics.get(cs.name);
      return metrics && metrics.status !== 'online';
    });

    const systemHealth = {
      overall: criticalIssues.length === 0 ? 'healthy' : 'critical',
      servicesOnline: onlineServices,
      totalServices,
      averageResponseTime: metricsArray.reduce((acc, m) => acc + m.responseTime, 0) / totalServices,
      totalIncidents24h: metricsArray.reduce((acc, m) => acc + m.incidents24h, 0),
      criticalIssues: criticalIssues.map(ci => ci.name)
    };

    res.json({
      success: true,
      data: {
        services: metricsArray,
        systemHealth,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

// API для принудительной проверки всех сервисов
router.post('/check-all', async (req, res) => {
  try {
    const results = await Promise.allSettled(
      SERVICES_CONFIG.map(service => checkServiceHealth(service))
    );

    const metrics = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: SERVICES_CONFIG[index].name,
          status: 'offline' as const,
          responseTime: 0,
          uptime: 0,
          lastCheck: new Date(),
          availability24h: 0,
          incidents24h: 1,
          errorRate: 1,
          error: 'Health check failed'
        };
      }
    });

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check services'
    });
  }
});

// API для перезапуска сервиса (через Smart Auto-Restore + Health Monitor)
router.post('/restart-service', async (req, res) => {
  const { serviceName, port } = req.body ?? {};

  if (!serviceName) {
    return res.status(400).json({
      success: false,
      error: 'Service name is required'
    });
  }

  const autoRestoreKey = resolveAutoRestoreKey(serviceName);

  if (!autoRestoreKey) {
    return res.status(400).json({
      success: false,
      error: `Service ${serviceName} does not support auto-restore`
    });
  }

  try {
    console.log(`[Monitoring] Restart request received for ${serviceName} (${autoRestoreKey})`);

    const result = await runSmartRestore(['restore', autoRestoreKey]);
    const restartSucceeded = result.code === 0;

    monitoringEvents.emit('serviceRestart', {
      service: serviceName,
      port,
      timestamp: new Date(),
      status: restartSucceeded ? 'completed' : 'failed',
      details: {
        autoRestoreKey,
        stdout: result.stdout.slice(-512),
        stderr: result.stderr.slice(-512)
      }
    });

    if (!restartSucceeded) {
      console.error(`[Monitoring] Smart restore failed for ${serviceName}:`, result.stderr);
      return res.status(500).json({
        success: false,
        error: `Restore failed for ${serviceName}`,
        autoRestoreKey,
        logs: result.stdout,
        errors: result.stderr
      });
    }

    // Пытаемся уведомить health-monitor (docker окружение) — игнорируем ошибки
    try {
      await axios.post(`${MONITORING_SERVICE_URL}/restart/${encodeURIComponent(serviceName)}`, {}, { timeout: 5000 });
    } catch (monitorError) {
      console.warn('[Monitoring] Unable to notify health-monitor service about restart:', (monitorError as Error).message);
    }

    return res.json({
      success: true,
      message: `Restore completed for ${serviceName}`,
      autoRestoreKey,
      timestamp: new Date().toISOString(),
      logs: result.stdout
    });
  } catch (error: any) {
    console.error('Error restarting service:', error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to restart service',
      details: error.stderr || error.message || 'Unknown error'
    });
  }
});

router.post('/stop-service', async (req, res) => {
  const { serviceName } = req.body ?? {};

  if (!serviceName) {
    return res.status(400).json({
      success: false,
      error: 'Service name is required'
    });
  }

  const autoRestoreKey = resolveAutoRestoreKey(serviceName);

  if (!autoRestoreKey) {
    return res.status(400).json({
      success: false,
      error: `Service ${serviceName} does not support manual stop`
    });
  }

  try {
    console.log(`[Monitoring] Stop request received for ${serviceName} (${autoRestoreKey})`);

    const result = await runSmartRestore(['stop', autoRestoreKey]);
    const stopSucceeded = result.code === 0;

    monitoringEvents.emit('serviceStop', {
      service: serviceName,
      timestamp: new Date(),
      status: stopSucceeded ? 'completed' : 'failed',
      details: {
        autoRestoreKey,
        stdout: result.stdout.slice(-512),
        stderr: result.stderr.slice(-512)
      }
    });

    if (!stopSucceeded) {
      console.error(`[Monitoring] Manual stop failed for ${serviceName}:`, result.stderr);
      return res.status(500).json({
        success: false,
        error: `Stop failed for ${serviceName}`,
        autoRestoreKey,
        logs: result.stdout,
        errors: result.stderr
      });
    }

    return res.json({
      success: true,
      message: `Service ${serviceName} stopped successfully`,
      autoRestoreKey,
      timestamp: new Date().toISOString(),
      logs: result.stdout
    });
  } catch (error: any) {
    console.error('Error stopping service:', error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop service',
      details: error.stderr || error.message || 'Unknown error'
    });
  }
});

// API для конфигурации алертов
router.get('/alerts/config', (req, res) => {
  // TODO: Загрузка из базы данных
  res.json({
    success: true,
    data: {
      telegram: {
        enabled: process.env.TELEGRAM_ENABLED === 'true',
        configured: !!process.env.TELEGRAM_BOT_TOKEN
      },
      discord: {
        enabled: process.env.DISCORD_ENABLED === 'true',
        configured: !!process.env.DISCORD_WEBHOOK_URL
      },
      slack: {
        enabled: process.env.SLACK_ENABLED === 'true',
        configured: !!process.env.SLACK_TOKEN
      },
      thresholds: {
        responseTime: parseInt(process.env.THRESHOLD_RESPONSE_TIME || '5000'),
        errorRate: parseFloat(process.env.THRESHOLD_ERROR_RATE || '5'),
        availabilityMin: parseFloat(process.env.THRESHOLD_AVAILABILITY || '99')
      }
    }
  });
});

// Запуск автоматического мониторинга
export function startMonitoring() {
  if (healthCheckInterval) {
    console.log('Monitoring already running');
    return;
  }

  console.log('🔍 Starting automated health monitoring...');
  
  // Выполняем первоначальную проверку
  Promise.allSettled(
    SERVICES_CONFIG.map(service => checkServiceHealth(service))
  ).then(() => {
    console.log('✅ Initial health check completed');
  });

  // Настраиваем регулярные проверки каждые 30 секунд
  healthCheckInterval = setInterval(async () => {
    try {
      await Promise.allSettled(
        SERVICES_CONFIG.map(service => checkServiceHealth(service))
      );
    } catch (error) {
      console.error('Error in scheduled health check:', error);
    }
  }, 30000);

  console.log('📊 Health monitoring started with 30s interval');
}

// Остановка мониторинга
export function stopMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🛑 Health monitoring stopped');
  }
}

// API для тестирования Telegram алертов
router.post('/test-alert', async (req, res) => {
  try {
    // Импортируем Telegram alert
    const { telegramAlert } = await import('../alerts/TelegramAlert');
    
    const success = await telegramAlert.sendTestAlert();
    
    if (success) {
      res.json({
        success: true,
        message: 'Test alert sent successfully to Telegram',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test alert',
        hint: 'Check Telegram configuration (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)'
      });
    }
  } catch (error: any) {
    console.error('Error sending test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test alert',
      details: error.message
    });
  }
});

// API для получения конфигурации алертов
router.get('/alerts/status', async (req, res) => {
  try {
    const { telegramAlert } = await import('../alerts/TelegramAlert');
    const stats = telegramAlert.getAlertStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting alert status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert status',
      details: error.message
    });
  }
});

// AUTO-RESTORE SYSTEM API ENDPOINTS

// Получить статус auto-restore системы (интеграция с Gemini системой)
router.get('/auto-restore/status', async (req, res) => {
  try {
    // Проверяем процессы Gemini системы
    const checkMasterProcess = spawn('pgrep', ['-f', 'master-orchestrator.sh']);
    const checkHealthProcess = spawn('pgrep', ['-f', 'health-monitor.sh']);
    
    let masterRunning = false;
    let healthRunning = false;
    
    checkMasterProcess.on('close', async (masterCode) => {
      masterRunning = masterCode === 0;
      
      checkHealthProcess.on('close', async (healthCode) => {
        healthRunning = healthCode === 0;
        
        try {
          // Читаем логи Gemini системы
          const masterLogs = await fs.readFile('/root/beauty-platform/logs/master-orchestrator.log', 'utf8')
            .catch(() => 'No master logs available');
          const healthLogs = await fs.readFile('/root/beauty-platform/logs/health-monitor.log', 'utf8')
            .catch(() => 'No health logs available');
          const alertLogs = await fs.readFile('/root/beauty-platform/logs/alerts.log', 'utf8')
            .catch(() => 'No alert logs available');
          
          const recentMasterLogs = masterLogs.split('\n').slice(-5).filter(line => line.trim());
          const recentHealthLogs = healthLogs.split('\n').slice(-5).filter(line => line.trim());
          const recentAlertLogs = alertLogs.split('\n').slice(-3).filter(line => line.trim());
          
          // Читаем статус служб через PID файлы
          const masterPidExists = await fs.access('/var/run/beauty-auto-restore.pid').then(() => true).catch(() => false);
          const healthPidExists = await fs.access('/var/run/beauty-health-monitor.pid').then(() => true).catch(() => false);
          
          res.json({
            success: true,
            data: {
              enabled: masterRunning && healthRunning,
              masterOrchestrator: {
                running: masterRunning,
                pidFile: masterPidExists,
                recentLogs: recentMasterLogs
              },
              healthMonitor: {
                running: healthRunning,
                pidFile: healthPidExists,
                recentLogs: recentHealthLogs
              },
              alerts: {
                recentLogs: recentAlertLogs
              },
              geminiSystemDetected: true,
              lastCheck: new Date().toISOString()
            }
          });
        } catch (error: any) {
          res.json({
            success: true,
            data: {
              enabled: masterRunning && healthRunning,
              masterOrchestrator: { running: masterRunning },
              healthMonitor: { running: healthRunning },
              geminiSystemDetected: true,
              error: 'Failed to read logs: ' + error.message,
              lastCheck: new Date().toISOString()
            }
          });
        }
      });
    });
  } catch (error: any) {
    console.error('Error getting auto-restore status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto-restore status',
      details: error.message
    });
  }
});

// Включить/выключить auto-restore (интеграция с Gemini Master Orchestrator)
router.post('/auto-restore/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (enabled) {
      // Запускаем Gemini Master Orchestrator
      const masterScript = spawn('bash', ['/root/beauty-platform/deployment/auto-restore/master-orchestrator.sh'], {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore']
      });
      masterScript.unref();
      
      // Даем время для инициализации
      setTimeout(async () => {
        // Проверяем что система запустилась
        const checkProcess = spawn('pgrep', ['-f', 'master-orchestrator.sh']);
        checkProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Gemini Master Orchestrator started successfully');
          } else {
            console.log('⚠️ Master Orchestrator may not have started properly');
          }
        });
      }, 3000);
      
      res.json({
        success: true,
        message: 'Gemini Auto-restore system (Master Orchestrator) started',
        enabled: true,
        system: 'gemini-master-orchestrator',
        timestamp: new Date().toISOString()
      });
    } else {
      // Останавливаем все компоненты Gemini системы
      spawn('pkill', ['-f', 'master-orchestrator.sh']);
      spawn('pkill', ['-f', 'health-monitor.sh']);
      
      // Удаляем PID файлы
      setTimeout(() => {
        fs.unlink('/var/run/beauty-auto-restore.pid').catch(() => {});
        fs.unlink('/var/run/beauty-health-monitor.pid').catch(() => {});
      }, 1000);
      
      res.json({
        success: true,
        message: 'Gemini Auto-restore system stopped (Master + Health Monitor)',
        enabled: false,
        system: 'gemini-full-shutdown',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Error toggling Gemini auto-restore:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle Gemini auto-restore system',
      details: error.message
    });
  }
});

// Получить логи auto-restore системы (интеграция с Gemini логами)
router.get('/auto-restore/logs', async (req, res) => {
  try {
    const { lines = 50, type = 'all' } = req.query;
    const maxLines = Math.min(parseInt(lines as string), 200); // Лимит для производительности
    
    const logSources = {
      master: '/root/beauty-platform/logs/master-orchestrator.log',
      health: '/root/beauty-platform/logs/health-monitor.log',
      alerts: '/root/beauty-platform/logs/alerts.log',
      backup: '/root/beauty-platform/logs/backup-system.log',
      maintenance: '/root/beauty-platform/logs/maintenance.log'
    };
    
    const logData: any = {};
    
    if (type === 'all' || type === 'master') {
      const masterLogs = await fs.readFile(logSources.master, 'utf8').catch(() => '');
      logData.master = masterLogs.split('\n').filter(line => line.trim()).slice(-maxLines);
    }
    
    if (type === 'all' || type === 'health') {
      const healthLogs = await fs.readFile(logSources.health, 'utf8').catch(() => '');
      logData.health = healthLogs.split('\n').filter(line => line.trim()).slice(-maxLines);
    }
    
    if (type === 'all' || type === 'alerts') {
      const alertLogs = await fs.readFile(logSources.alerts, 'utf8').catch(() => '');
      logData.alerts = alertLogs.split('\n').filter(line => line.trim()).slice(-maxLines);
    }
    
    if (type === 'all' || type === 'backup') {
      const backupLogs = await fs.readFile(logSources.backup, 'utf8').catch(() => '');
      logData.backup = backupLogs.split('\n').filter(line => line.trim()).slice(-maxLines);
    }
    
    if (type === 'all' || type === 'maintenance') {
      const maintenanceLogs = await fs.readFile(logSources.maintenance, 'utf8').catch(() => '');
      logData.maintenance = maintenanceLogs.split('\n').filter(line => line.trim()).slice(-maxLines);
    }
    
    // Если запрошен один тип логов, возвращаем их плоским массивом для совместимости
    if (type !== 'all') {
      const singleTypeLog = logData[type as string] || [];
      return res.json({
        success: true,
        data: {
          logs: singleTypeLog,
          totalLines: singleTypeLog.length,
          logType: type,
          geminiSystem: true,
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    // Для 'all' возвращаем структурированные логи
    return res.json({
      success: true,
      data: {
        logs: logData,
        geminiSystem: true,
        availableTypes: Object.keys(logSources),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting Gemini auto-restore logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get Gemini auto-restore logs',
      details: error.message
    });
  }
});

// Обновить конфигурацию auto-restore
router.post('/auto-restore/config', async (req, res) => {
  try {
    const newConfig = req.body;
    
    // Валидация базовых полей
    if (!newConfig.check_interval || !newConfig.health_check_timeout) {
      res.status(400).json({
        success: false,
        error: 'Invalid configuration - missing required fields'
      });
      return;
    }
    
    // Сохраняем конфигурацию
    await fs.writeFile(
      '/root/beauty-platform/deployment/auto-restore/config.json',
      JSON.stringify(newConfig, null, 2),
      'utf8'
    );
    
    res.json({
      success: true,
      message: 'Auto-restore configuration updated',
      config: newConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error updating auto-restore config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update auto-restore config',
      details: error.message
    });
  }
});

// Принудительная проверка здоровья всех сервисов через Gemini систему
router.post('/auto-restore/force-check', async (req, res) => {
  try {
    // Запускаем Gemini test-system.sh для полной диагностики
    const testScript = spawn('bash', ['/root/beauty-platform/deployment/auto-restore/test-system.sh'], {
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    testScript.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    testScript.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testScript.on('close', (code) => {
      const outputLines = output.split('\n').filter(line => line.trim());
      const errorLines = errorOutput.split('\n').filter(line => line.trim());
      
      res.json({
        success: code === 0,
        message: code === 0 ? 'Gemini full system test completed successfully' : 'Gemini system test completed with issues',
        exitCode: code,
        output: outputLines.slice(-15), // Последние 15 строк
        errors: errorLines.slice(-5), // Последние 5 ошибок
        geminiSystem: true,
        testType: 'full-system-diagnostic',
        timestamp: new Date().toISOString()
      });
    });
    
    // Timeout через 45 секунд (Gemini система более комплексная)
    setTimeout(() => {
      testScript.kill();
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Gemini system test timeout (45s)',
          partialOutput: output.split('\n').slice(-5),
          geminiSystem: true
        });
      }
    }, 45000);
    
  } catch (error: any) {
    console.error('Error running Gemini force check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run Gemini system test',
      details: error.message,
      geminiSystem: true
    });
  }
});

// Дополнительный endpoint для быстрой проверки статуса через Gemini dashboard
router.get('/auto-restore/quick-status', async (req, res) => {
  try {
    // Запускаем упрощенную проверку через dashboard в режиме статуса
    const dashboardScript = spawn('bash', ['/root/beauty-platform/deployment/auto-restore/dashboard.sh'], {
      stdio: 'pipe',
      env: { ...process.env, DASHBOARD_MODE: 'status-only' }
    });
    
    let output = '';
    dashboardScript.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    // Отправляем CTRL+C через 5 секунд чтобы выйти из интерактивного режима
    setTimeout(() => {
      dashboardScript.kill('SIGINT');
    }, 5000);
    
    dashboardScript.on('close', (code) => {
      // Парсим вывод dashboard для извлечения статуса
      const lines = output.split('\n');
      const statusLines = lines.filter(line => 
        line.includes('✅') || line.includes('❌') || line.includes('⚪')
      );
      
      res.json({
        success: true,
        message: 'Gemini dashboard status retrieved',
        statusLines: statusLines.slice(0, 10),
        rawOutput: lines.slice(0, 20),
        geminiDashboard: true,
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error: any) {
    console.error('Error getting Gemini quick status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Gemini quick status',
      details: error.message
    });
  }
});

export default router;
