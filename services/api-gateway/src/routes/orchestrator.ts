import { Router, Request, Response } from 'express'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const router: Router = Router()

interface ServiceState {
  name: string
  port?: number
  pid?: number
  state: 'up' | 'down' | 'restarting' | 'cooldown' | 'circuit_open'
  health: 'ok' | 'degraded' | 'fail'
  backoffSec?: number
  lastError?: string
  warmup?: {
    required: number
    passed: number
  }
  lastCheck: string
  responseTime?: number
}

interface CircuitBreakerState {
  [serviceName: string]: {
    failures: number
    lastFailure: Date
    isOpen: boolean
    backoffUntil?: Date
  }
}

// Файл состояния circuit breaker
const CIRCUIT_BREAKER_FILE = '/root/projects/beauty/deployment/auto-restore/circuit-breaker-state.json'
const ALERTS_DIR = '/root/projects/beauty/deployment/auto-restore/alerts'

// Чтение circuit breaker состояния
function readCircuitBreakerState(): CircuitBreakerState {
  try {
    if (fs.existsSync(CIRCUIT_BREAKER_FILE)) {
      const data = fs.readFileSync(CIRCUIT_BREAKER_FILE, 'utf8')
      const state = JSON.parse(data)
      // Конвертируем строки в Date объекты
      Object.keys(state).forEach(service => {
        if (state[service].lastFailure) {
          state[service].lastFailure = new Date(state[service].lastFailure)
        }
        if (state[service].backoffUntil) {
          state[service].backoffUntil = new Date(state[service].backoffUntil)
        }
      });
      return state
    }
  } catch (error) {
    console.error('Error reading circuit breaker state:', error)
  }
  return {}
}

// Проверка health endpoint сервиса
async function checkServiceHealth(serviceName: string, port?: number): Promise<{ status: 'up' | 'down', responseTime?: number, error?: string }> {
  if (!port) {
    // Для сервисов без порта (например PostgreSQL) используем специальную проверку
    if (serviceName === 'postgresql') {
      try {
        execSync('pg_isready -h localhost -p 5432 -d beauty_platform_new', { timeout: 5000 })
        return { status: 'up', responseTime: 0 }
      } catch (error) {
        return { status: 'down', error: 'PostgreSQL connection failed' }
      }
    }
    return { status: 'down', error: 'No port specified' }
  }

  const startTime = Date.now()
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(5000)
    })
    const responseTime = Date.now() - startTime

    if (response.ok) {
      return { status: 'up', responseTime }
    } else {
      return { status: 'down', responseTime, error: `HTTP ${response.status}` }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { status: 'down', responseTime, error: (error as Error).message }
  }
}

// Получение PID процесса на порту
function getServicePid(port: number): number | undefined {
  try {
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8', timeout: 2000 }).trim()
    return result ? parseInt(result, 10) : undefined
  } catch (error) {
    return undefined
  }
}

// Определение состояния сервиса
function determineServiceState(
  serviceName: string,
  healthStatus: 'up' | 'down',
  circuitBreaker: CircuitBreakerState,
  pid?: number
): { state: ServiceState['state'], health: ServiceState['health'], backoffSec?: number } {
  const cbState = circuitBreaker[serviceName]
  const now = new Date()

  // Проверяем circuit breaker
  if (cbState?.isOpen) {
    if (cbState.backoffUntil && now < cbState.backoffUntil) {
      return {
        state: 'circuit_open',
        health: 'fail',
        backoffSec: Math.ceil((cbState.backoffUntil.getTime() - now.getTime()) / 1000)
      }
    } else if (cbState.backoffUntil && now >= cbState.backoffUntil) {
      return {
        state: 'cooldown',
        health: 'degraded',
        backoffSec: 0
      }
    }
  }

  // Если есть PID но health check неудачен - сервис запускается
  if (pid && healthStatus === 'down') {
    return { state: 'restarting', health: 'degraded' }
  }

  // Обычное состояние
  if (healthStatus === 'up') {
    return { state: 'up', health: 'ok' }
  } else {
    return { state: 'down', health: 'fail' }
  }
}

// Получение warmup статуса (симуляция)
function getWarmupStatus(serviceName: string, state: ServiceState['state']): ServiceState['warmup'] | undefined {
  if (state === 'restarting') {
    // Симулируем warmup процесс
    const elapsed = Math.floor(Math.random() * 3) // 0-2 completed checks
    return {
      required: 2,
      passed: elapsed
    }
  }
  return undefined
}

// Конфигурация сервисов
const SERVICE_CONFIGS = [
  { name: 'api-gateway', port: 6020 },
  { name: 'auth-service', port: 6021 },
  { name: 'admin-panel', port: 6002 },
  { name: 'salon-crm', port: 6001 },
  { name: 'client-portal', port: 6003 },
  { name: 'images-api', port: 6026 },
  { name: 'mcp-server', port: 6025 },
  { name: 'backup-service', port: 6027 },
  { name: 'crm-api', port: 6022 },
  { name: 'notification-service', port: 6028 },
  { name: 'payment-service', port: 6029 },
  { name: 'landing-page', port: 6004 },
  { name: 'postgresql' }, // Нет порта - специальная проверка
]

// GET /orchestrator/status-all
router.get('/status-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const circuitBreakerState = readCircuitBreakerState()
    const services: ServiceState[] = []

    for (const config of SERVICE_CONFIGS) {
      const healthCheck = await checkServiceHealth(config.name, config.port)
      const pid = config.port ? getServicePid(config.port) : undefined
      const stateInfo = determineServiceState(config.name, healthCheck.status, circuitBreakerState, pid)
      const warmup = getWarmupStatus(config.name, stateInfo.state)

      services.push({
        name: config.name,
        port: config.port,
        pid,
        state: stateInfo.state,
        health: stateInfo.health,
        backoffSec: stateInfo.backoffSec,
        lastError: healthCheck.error,
        warmup,
        lastCheck: new Date().toISOString(),
        responseTime: healthCheck.responseTime
      });
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services
    })
  } catch (error) {
    console.error('Error in /orchestrator/status-all:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orchestrator status',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /orchestrator/services/:name/status
router.get('/services/:name/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const serviceName = req.params.name
    const config = SERVICE_CONFIGS.find(s => s.name === serviceName)

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Service '${serviceName}' not found`
      });
    }

    const circuitBreakerState = readCircuitBreakerState()
    const healthCheck = await checkServiceHealth(config.name, config.port)
    const pid = config.port ? getServicePid(config.port) : undefined
    const stateInfo = determineServiceState(config.name, healthCheck.status, circuitBreakerState, pid)
    const warmup = getWarmupStatus(config.name, stateInfo.state)

    const service: ServiceState = {
      name: config.name,
      port: config.port,
      pid,
      state: stateInfo.state,
      health: stateInfo.health,
      backoffSec: stateInfo.backoffSec,
      lastError: healthCheck.error,
      warmup,
      lastCheck: new Date().toISOString(),
      responseTime: healthCheck.responseTime
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      service
    })
  } catch (error) {
    console.error(`Error in /orchestrator/services/${req.params.name}/status:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service status',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /orchestrator/services/:name/logs
router.get('/services/:name/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const serviceName = req.params.name
    const lines = parseInt(req.query.lines as string) || 50

    // Пытаемся получить логи из PM2
    try {
      const pm2Logs = execSync(`pm2 logs ${serviceName} --lines ${lines} --nostream`, {
        encoding: 'utf8',
        timeout: 5000
      });

      res.json({
        success: true,
        service: serviceName,
        lines: pm2Logs.split('\n').filter(line => line.trim()).slice(-lines),
        source: 'pm2',
        timestamp: new Date().toISOString()
      });
    } catch (pm2Error) {
      // Fallback к системным логам
      try {
        const systemLogs = execSync(`journalctl -u ${serviceName} --lines ${lines} --no-pager`, {
          encoding: 'utf8',
          timeout: 5000
        });

        res.json({
          success: true,
          service: serviceName,
          lines: systemLogs.split('\n').filter(line => line.trim()).slice(-lines),
          source: 'systemd',
          timestamp: new Date().toISOString()
        });
      } catch (systemError) {
        res.json({
          success: false,
          error: `No logs available for service '${serviceName}'`,
          details: {
            pm2Error: (pm2Error as Error).message,
            systemError: (systemError as Error).message
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error fetching logs for ${req.params.name}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service logs',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /orchestrator/services/:name/actions
router.post('/services/:name/actions', async (req: Request, res: Response): Promise<void> => {
  try {
    const serviceName = req.params.name
    const { action } = req.body

    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action '${action}'. Must be one of: start, stop, restart`
      });
    }

    const config = SERVICE_CONFIGS.find(s => s.name === serviceName)
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Service '${serviceName}' not found`
      });
    }

    // Выполняем действие через auto-restore скрипты
    let command: string
    switch (action) {
      case 'start':
      case 'restart':
        command = `/root/projects/beauty/deployment/auto-restore/restore-${serviceName}.sh`
        break
      case 'stop':
        command = `pm2 stop ${serviceName}`
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        timeout: 30000,
        cwd: '/root/projects/beauty'
      });

      res.json({
        success: true,
        action,
        service: serviceName,
        message: `Service ${action} completed successfully`,
        output: result.slice(-500), // Последние 500 символов вывода
        timestamp: new Date().toISOString()
      });
    } catch (execError) {
      res.status(500).json({
        success: false,
        action,
        service: serviceName,
        error: `Service ${action} failed`,
        output: (execError as any).stdout || (execError as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error(`Error in service action for ${req.params.name}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to execute service action',
      timestamp: new Date().toISOString()
    })
  }
})

export default router