import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@beauty-platform/ui'
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Shield, 
  Image, 
  Brain,
  Calendar,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
  Terminal,
  RotateCcw,
  Rocket,
  Monitor,
  Settings,
  FileText,
  Save,
  Wrench,
  PhoneCall,
  Loader2,
  Octagon
} from 'lucide-react'

// Типы для сервисов
interface ServiceHealth {
  name: string
  port: number
  status: 'online' | 'offline' | 'error' | 'starting' | 'unknown'
  url?: string
  responseTime?: number
  lastCheck: string
  uptime?: number
  memory?: {
    used: number
    total: number
  }
  cpu?: number
  error?: string
  version?: string
  description: string
  icon: any
  color: string
  dependencies?: string[]
  endpoints?: string[]
  critical?: boolean
}

interface SystemMetrics {
  totalServices: number
  onlineServices: number
  offlineServices: number
  avgResponseTime: number
  systemLoad: number
  totalMemory: number
  usedMemory: number
}

interface ServiceLog {
  id: string
  service: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  details?: any
}

// Типы для Gemini Auto-Restore System
interface AutoRestoreSubsystem {
  running: boolean;
  pidFile?: boolean;
  recentLogs: string[];
}

interface AutoRestoreStatus {
  enabled: boolean;
  masterOrchestrator: AutoRestoreSubsystem;
  healthMonitor: AutoRestoreSubsystem;
  alerts: { recentLogs: string[] };
  geminiSystemDetected: boolean;
  lastCheck: string;
  error?: string;
}

// Новые типы для circuit breaker и alerts
interface CircuitBreakerStatus {
  service: string;
  isTripped: boolean;
  attempts: number;
  lastAttempt?: string;
  windowStart?: string;
}

interface Alert {
  service: string;
  type: string;
  message: string;
  timestamp: string;
  readableTime: string;
  filename: string;
}

interface AlertStatusSnapshot {
  enabled: boolean
  configured: boolean
  lastAlerts?: Array<{ service: string; lastAlert: string }>
  cooldownMinutes?: number
}

export default function ServicesMonitoringPage() {
  const { t } = useTranslation()
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [serviceCategories, setServiceCategories] = useState<any>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [logs, setLogs] = useState<ServiceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [restartInProgress, setRestartInProgress] = useState<Record<string, boolean>>({})
  const [stopInProgress, setStopInProgress] = useState<Record<string, boolean>>({})
  const [alertStatus, setAlertStatus] = useState<AlertStatusSnapshot | null>(null)
  const [testAlertInProgress, setTestAlertInProgress] = useState(false)

  // Состояние для Auto-Restore
  const [autoRestoreStatus, setAutoRestoreStatus] = useState<AutoRestoreStatus | null>(null)
  const [isAutoRestoreLoading, setIsAutoRestoreLoading] = useState(true)
  const [autoRestoreLogs, setAutoRestoreLogs] = useState<Record<string, string[]>>({})
  const [activeLogTab, setActiveLogTab] = useState('master')
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<any>(null)
  
  // Состояние для circuit breaker и alerts
  const [circuitBreakerStatuses, setCircuitBreakerStatuses] = useState<CircuitBreakerStatus[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isCircuitBreakerLoading, setIsCircuitBreakerLoading] = useState(false)
  const [isAlertsLoading, setIsAlertsLoading] = useState(false)

  const autoRestoreKeyMapping: Record<string, string> = {
    'API Gateway': 'api-gateway',
    'Auth Service': 'auth-service',
    'Admin Panel': 'admin-panel',
    'Salon CRM': 'salon-crm',
    'Client Portal': 'client-portal',
    'Images API': 'images-api',
    'MCP Server': 'mcp-server',
    'Backup Service': 'backup-service',
    'PostgreSQL': 'postgresql'
  }

  const unsupportedAutoRestoreServices = ['Landing Page', 'VS Code Server']

  const resolveAutoRestoreKey = (serviceName: string) =>
    autoRestoreKeyMapping[serviceName] || serviceName.toLowerCase().replace(/\s+/g, '-')

  const supportsAutoRestore = (serviceName: string) => !unsupportedAutoRestoreServices.includes(serviceName)

  // Конфигурация сервисов Beauty Platform
  const serviceConfigs: Omit<ServiceHealth, 'status' | 'lastCheck'>[] = [
    {
      name: 'API Gateway',
      port: 6020,
      url: 'http://localhost:6020',
      description: t('monitoring.serviceDescription.apiGateway'),
      icon: Globe,
      color: 'text-blue-600',
      endpoints: ['/health', '/info', '/metrics'],
      dependencies: ['Auth Service', 'Images API', 'MCP Server']
    },
    {
      name: 'Auth Service',
      port: 6021,
      url: 'http://localhost:6021',
      description: t('monitoring.serviceDescription.authService'),
      icon: Shield,
      color: 'text-green-600',
      endpoints: ['/auth/health', '/auth/me', '/auth/login', '/auth/mfa/status'],
      dependencies: ['PostgreSQL']
    },
    {
      name: 'Admin Panel',
      port: 6002,
      url: 'http://localhost:6002',
      description: t('monitoring.serviceDescription.adminPanel'),
      icon: Activity,
      color: 'text-purple-600',
      endpoints: ['/', '/dashboard', '/security', '/services-monitoring'],
      dependencies: ['Auth Service', 'API Gateway']
    },
    {
      name: 'Salon CRM',
      port: 6001,
      url: 'http://localhost:6001',
      description: t('monitoring.serviceDescription.salonCrm'),
      icon: Calendar,
      color: 'text-pink-600',
      endpoints: ['/', '/dashboard', '/appointments', '/clients'],
      dependencies: ['Auth Service']
    },
    {
      name: 'Client Portal',
      port: 6003,
      url: 'http://localhost:6003',
      description: t('monitoring.serviceDescription.clientPortal'),
      icon: Users,
      color: 'text-cyan-600',
      endpoints: ['/', '/profile', '/bookings', '/salons'],
      dependencies: ['Auth Service']
    },
    {
      name: 'Images API',
      port: 6026,
      url: 'http://localhost:6026',
      description: t('monitoring.serviceDescription.imagesApi'),
      icon: Image,
      color: 'text-orange-600',
      endpoints: ['/health', '/api/images', '/api/images/upload'],
      dependencies: []
    },
    {
      name: 'MCP Server',
      port: 6025,
      url: 'http://localhost:6025',
      description: t('monitoring.serviceDescription.mcpServer'),
      icon: Brain,
      color: 'text-indigo-600',
      endpoints: ['/health', '/mcp/project-state', '/mcp/critical-rules'],
      dependencies: ['Admin Panel']
    },
    {
      name: 'PostgreSQL',
      port: 5432,
      description: t('monitoring.serviceDescription.postgresql'),
      icon: Database,
      color: 'text-slate-600',
      endpoints: [],
      dependencies: []
    },
    {
      name: 'Backup Service',
      port: 6027,
      url: 'http://localhost:6027',
      description: t('monitoring.serviceDescription.backupService'),
      icon: Save,
      color: 'text-emerald-600',
      endpoints: ['/health', '/api/backups', '/api/backups/create'],
      dependencies: ['PostgreSQL']
    },
    {
      name: 'CRM API',
      port: 6022,
      url: 'http://localhost:6022',
      description: t('monitoring.serviceDescription.crmApi'),
      icon: Server,
      color: 'text-rose-600',
      endpoints: ['/health', '/api/appointments', '/api/clients', '/api/services'],
      dependencies: ['Auth Service', 'PostgreSQL']
    },
    {
      name: 'Context7',
      port: 6024,
      url: 'http://localhost:6024',
      description: t('monitoring.serviceDescription.context7'),
      icon: FileText,
      color: 'text-amber-600',
      endpoints: ['/health', '/api/context', '/api/documentation'],
      dependencies: []
    },
    {
      name: 'VS Code Server',
      port: 6080,
      url: 'http://localhost:6080',
      description: t('monitoring.serviceDescription.vscodeServer'),
      icon: Terminal,
      color: 'text-blue-500',
      endpoints: ['/'],
      dependencies: []
    },
    {
      name: 'Landing Page',
      port: 6000,
      url: 'http://localhost:6000',
      description: t('monitoring.serviceDescription.landingPage'),
      icon: Globe,
      color: 'text-green-500',
      endpoints: ['/'],
      dependencies: []
    }
  ]

  // Загрузка статуса сервисов через структурированное API
  const fetchServicesHealth = async () => {
    try {
      // Используем новый структурированный endpoint
      const response = await fetch('/api/monitoring/metrics-structured', { 
        signal: AbortSignal.timeout(10000) 
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch structured metrics')
      }

      const { categories, summary } = data.data

      // Преобразуем структурированные данные в плоский список сервисов
      const allServices: ServiceHealth[] = []
      
      Object.values(categories).forEach((category: any) => {
        category.services.forEach((service: any) => {
          const config = serviceConfigs.find(c => c.name === service.name)
          allServices.push({
            ...config,
            ...service.metrics,
            name: service.name,
            url: service.url,
            category: service.category,
            gatewayPath: service.gatewayPath,
            description: service.description,
            lastCheck: service.metrics.lastCheck,
            status: service.metrics.status as 'online' | 'offline' | 'error' | 'starting' | 'unknown'
          })
        })
      })

      // Сохраняем категории для отображения
      setServiceCategories(categories)
      const servicesHealth = allServices

      setServices(servicesHealth)

      // Обновляем системные метрики из API
      setSystemMetrics({
        totalServices: summary.totalServices || allServices.length,
        onlineServices: summary.servicesOnline || allServices.filter(s => s.status === 'online').length,
        offlineServices: (summary.totalServices || allServices.length) - (summary.servicesOnline || allServices.filter(s => s.status === 'online').length),
        avgResponseTime: summary.averageResponseTime || 0,
        systemLoad: Math.random() * 100, // TODO: Real system load from API
        totalMemory: 16384, // TODO: Real memory info from API
        usedMemory: 8192
      })

      // Добавляем логи о проверках
      const newLogs: ServiceLog[] = services.map((service: any) => ({
        id: `health-${service.name}-${Date.now()}`,
        service: service.name,
        level: service.status === 'online' ? 'info' : (service.status === 'degraded' ? 'warn' : 'error'),
        message: service.status === 'online' 
          ? `✅ Service healthy (${service.responseTime}ms)` 
          : service.status === 'degraded'
          ? `⚠️ Service degraded (${service.responseTime}ms)`
          : `❌ Service offline (${service.responseTime}ms)`,
        timestamp: service.lastCheck,
        details: {
          responseTime: service.responseTime,
          uptime: service.uptime,
          memory: service.memory,
          cpu: service.cpu,
          availability24h: service.availability24h,
          incidents24h: service.incidents24h
        }
      }))

      setLogs(prev => [...prev, ...newLogs].slice(-100)) // Последние 100 логов

      // Добавляем информацию о критических проблемах
      const criticalServices = allServices.filter(s => s.critical && s.status === 'offline').map(s => s.name)
      if (criticalServices.length > 0) {
        addLog('System', 'error', `🚨 Critical issues detected: ${criticalServices.join(', ')}`, {
          criticalServices: criticalServices,
          totalIncidents: criticalServices.length
        })
      }

    } catch (error) {
      console.error('Failed to fetch services health:', error)
      addLog('System', 'error', 'Failed to fetch services health from monitoring API', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Добавление лога
  const addLog = useCallback((service: string, level: ServiceLog['level'], message: string, details?: any) => {
    const newLog: ServiceLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      service,
      level,
      message,
      timestamp: new Date().toISOString(),
      details
    }
    setLogs(prev => [...prev, newLog].slice(-100))
  }, [])

  const fetchAlertStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/alerts/status', {
        signal: AbortSignal.timeout(8000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setAlertStatus(data.data)
      } else {
        setAlertStatus({ enabled: false, configured: false })
        addLog('Alerts', 'warn', '⚠️ Failed to load alert status', data.error)
      }
    } catch (error) {
      setAlertStatus(prev => prev ? { ...prev, enabled: false } : { enabled: false, configured: false })
      addLog('Alerts', 'error', '❌ Failed to fetch alert status', { error: (error as Error).message })
    }
  }, [addLog])

  const sendTestAlert = useCallback(async () => {
    if (testAlertInProgress) return
    setTestAlertInProgress(true)
    try {
      addLog('Alerts', 'info', '📲 Sending test alert...')
      const response = await fetch('/api/monitoring/test-alert', {
        method: 'POST',
        signal: AbortSignal.timeout(8000)
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.success) {
        addLog('Alerts', 'info', '✅ Test alert sent. Check Telegram chat!')
      } else {
        addLog('Alerts', 'error', `❌ Test alert failed: ${data.error || 'unknown error'}`)
      }
    } catch (error) {
      addLog('Alerts', 'error', '❌ Test alert request failed', { error: (error as Error).message })
    } finally {
      setTestAlertInProgress(false)
      fetchAlertStatus()
    }
  }, [addLog, fetchAlertStatus, testAlertInProgress])

  // Загрузка статуса Auto-Restore
  const fetchAutoRestoreStatus = async () => {
    setIsAutoRestoreLoading(true)
    try {
      const response = await fetch('/api/auto-restore/status', {
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) throw new Error('Failed to fetch auto-restore status')
      const result = await response.json()
      if (result.success) {
        setAutoRestoreStatus(result)
      } else {
        throw new Error(result.error || 'Unknown error from API')
      }
    } catch (error) {
      console.error('Error fetching auto-restore status:', error)
      addLog('Auto-Restore', 'error', 'Failed to load status', { error: (error as Error).message })
    } finally {
      setIsAutoRestoreLoading(false)
    }
  }

  // Загрузка логов Auto-Restore
  const fetchAutoRestoreLogs = async (logType: string) => {
    try {
      const response = await fetch(`/api/auto-restore/logs?lines=100`)
      if (!response.ok) throw new Error(`Failed to fetch ${logType} logs`)
      const result = await response.json()
      if (result.success) {
        setAutoRestoreLogs(prev => ({ ...prev, [logType]: result.logs || [] }))
      } else {
        throw new Error(result.error || 'Unknown API error')
      }
    } catch (error) {
      addLog('Auto-Restore', 'error', `Failed to load ${logType} logs`, { error: (error as Error).message })
    }
  }

  // Запуск Force Check
  const runForceCheck = async () => {
    setIsChecking(true)
    setCheckResult(null)
    addLog('Auto-Restore', 'info', '🚀 Initiating Gemini full system diagnostic...')
    try {
      const response = await fetch('/api/auto-restore/config', { method: 'GET' })
      const result = await response.json()
      setCheckResult(result)
      if (result.success) {
        addLog('Auto-Restore', 'info', `✅ System check completed. Exit code: ${result.exitCode}`)
      } else {
        addLog('Auto-Restore', 'error', `❌ System check failed: ${result.error}`)
      }
    } catch (error) {
      addLog('Auto-Restore', 'error', 'Failed to run force check', { error: (error as Error).message })
    } finally {
      setIsChecking(false)
    }
  }


  // Включение/выключение Auto-Restore
  const toggleAutoRestore = async (enabled: boolean) => {
    addLog('Auto-Restore', 'info', `Requesting to ${enabled ? 'enable' : 'disable'} the system...`)
    try {
      const response = await fetch('/api/auto-restore/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      const result = await response.json()
      if (result.success) {
        addLog('Auto-Restore', 'info', `System successfully ${enabled ? 'enabled' : 'disabled'}.`)
        // Обновляем статус, чтобы UI сразу отреагировал
        setAutoRestoreStatus((prev: any) => ({ ...prev, enabled }))
      } else {
        throw new Error(result.error || 'Toggle request failed')
      }
    } catch (error) {
      addLog('Auto-Restore', 'error', 'Failed to toggle system', { error: (error as Error).message })
    }
  }

  // Restart сервиса через новое API
  const restartService = async (serviceName: string, port: number) => {
    try {
      setRestartInProgress(prev => ({ ...prev, [serviceName]: true }))
      addLog(serviceName, 'info', `🔄 Attempting to restart ${serviceName} on port ${port}...`)
      
      const response = await fetch('/api/monitoring/restart-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName, port })
      })

      if (response.ok) {
        const data = await response.json()
        addLog(serviceName, 'info', `✅ ${data.message}`)
        if (data.logs) {
          addLog(serviceName, 'debug', '📝 Restore logs captured', { snippet: data.logs.slice(-500) })
        }
        
        // Перепроверяем статус через 5 секунд
        setTimeout(() => {
          addLog(serviceName, 'info', '🔍 Checking service status after restart...')
          fetchServicesHealth()
        }, 5000)
      } else {
        const errorData = await response.json()
        addLog(serviceName, 'error', `❌ Failed to restart service: ${errorData.error}`)
      }
    } catch (error) {
      addLog(serviceName, 'error', '❌ Restart request failed', error)
    } finally {
      setRestartInProgress(prev => ({ ...prev, [serviceName]: false }))
    }
  }

  const stopService = async (serviceName: string) => {
    setStopInProgress(prev => ({ ...prev, [serviceName]: true }))

    try {
      if (!supportsAutoRestore(serviceName)) {
        addLog(serviceName, 'warn', `⚠️ Stop command недоступен для ${serviceName}`)
        return
      }

      const serviceKey = resolveAutoRestoreKey(serviceName)
      addLog(serviceName, 'info', `🛑 Sending stop command for ${serviceName} (${serviceKey})...`)

      const response = await fetch('/api/monitoring/stop-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName })
      })

      if (response.ok) {
        const data = await response.json()
        addLog(serviceName, 'info', `🛑 ${data.message}`)
        if (data.logs) {
          addLog(serviceName, 'debug', '📝 Stop logs captured', { snippet: data.logs.slice(-500) })
        }
        setTimeout(() => {
          addLog(serviceName, 'info', '🔍 Checking service status after stop...')
          fetchServicesHealth()
        }, 5000)
      } else {
        const errorData = await response.json()
        addLog(serviceName, 'error', `❌ Failed to stop service: ${errorData.error}`)
      }
    } catch (error) {
      addLog(serviceName, 'error', '❌ Stop request failed', error)
    } finally {
      setStopInProgress(prev => ({ ...prev, [serviceName]: false }))
    }
  }

  // Auto-Restore сервиса через новый Smart Auto-Restore Manager
  const [autoRestoreInProgress, setAutoRestoreInProgress] = useState<Record<string, boolean>>({})
  const [isAutoRestoreAllInProgress, setIsAutoRestoreAllInProgress] = useState(false)
  
  const autoRestoreService = async (serviceName: string) => {
    setAutoRestoreInProgress(prev => ({ ...prev, [serviceName]: true }))
    
    try {
      if (!supportsAutoRestore(serviceName)) {
        addLog(serviceName, 'warn', `⚠️ Auto-Restore не поддерживается для ${serviceName} - пропускаем`)
        return
      }

      const serviceKey = resolveAutoRestoreKey(serviceName)

      addLog(serviceName, 'info', `🤖 Starting Smart Auto-Restore for ${serviceName} (${serviceKey})...`)
      
      const response = await fetch(`/api/auto-restore/restore/${serviceKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          addLog(serviceName, 'info', `✅ Smart Auto-Restore completed successfully for ${serviceName}`)
          addLog(serviceName, 'info', `📋 Execution logs: ${data.logs.substring(0, 300)}...`)
          
          // Перепроверяем статус через 8 секунд
          setTimeout(() => {
            addLog(serviceName, 'info', '🔍 Verifying service health after Auto-Restore...')
            fetchServicesHealth()
          }, 8000)
        } else {
          addLog(serviceName, 'error', `❌ Auto-Restore failed for ${serviceName}: ${data.error}`)
          if (data.logs) {
            addLog(serviceName, 'error', `📋 Error details: ${data.logs.substring(0, 300)}...`)
          }
        }
      } else {
        const errorData = await response.json()
        addLog(serviceName, 'error', `❌ Auto-Restore request failed: ${errorData.error}`)
      }
    } catch (error) {
      addLog(serviceName, 'error', '❌ Auto-Restore network error', error)
    } finally {
      setAutoRestoreInProgress(prev => ({ ...prev, [serviceName]: false }))
    }
  }

  // Массовое восстановление всех упавших сервисов
  const restoreAllDownServices = async () => {
    setIsAutoRestoreAllInProgress(true)
    addLog('System', 'info', '🚀 Starting mass Auto-Restore for all down services...')
    
    try {
      const downServices = services
        .filter(service => service.status === 'offline' || service.status === 'error')
        .map(service => service.name)
      
      if (downServices.length === 0) {
        addLog('System', 'info', '✅ No down services found - all services are healthy!')
        return
      }

      addLog('System', 'info', `🎯 Found ${downServices.length} down services: ${downServices.join(', ')}`)
      
      // Восстанавливаем каждый сервис последовательно
      for (const serviceName of downServices) {
        await autoRestoreService(serviceName)
        // Небольшая пауза между восстановлениями
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      addLog('System', 'info', '🎉 Mass Auto-Restore completed for all down services')
      
    } catch (error) {
      addLog('System', 'error', '❌ Mass Auto-Restore failed', error)
    } finally {
      setIsAutoRestoreAllInProgress(false)
    }
  }

  // Принудительная проверка всех сервисов
  const forceCheckAllServices = async () => {
    try {
      addLog('System', 'info', '🔍 Force checking all services...')
      
      const response = await fetch('/api/monitoring/check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        addLog('System', 'info', `✅ Force check completed. ${data.data.length} services checked.`)
        
        // Обновляем данные в UI
        setTimeout(() => fetchServicesHealth(), 1000)
      } else {
        const errorData = await response.json()
        addLog('System', 'error', `❌ Force check failed: ${errorData.error}`)
      }
    } catch (error) {
      addLog('System', 'error', '❌ Force check request failed', error)
    }
  }

  // Загрузка circuit breaker статусов
  const fetchCircuitBreakerStatuses = async () => {
    setIsCircuitBreakerLoading(true)
    try {
      const response = await fetch('/api/auto-restore/circuit-breaker-status', {
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) throw new Error('Failed to fetch circuit breaker status')
      const result = await response.json()
      if (result.success && result.data) {
        setCircuitBreakerStatuses(result.data)
      }
    } catch (error) {
      console.error('Error fetching circuit breaker status:', error)
      addLog('Circuit Breaker', 'error', 'Failed to load circuit breaker status', { error: (error as Error).message })
    } finally {
      setIsCircuitBreakerLoading(false)
    }
  }

  // Загрузка alerts
  const fetchAlerts = async () => {
    setIsAlertsLoading(true)
    try {
      const response = await fetch('/api/auto-restore/alerts', {
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const result = await response.json()
      if (result.success && result.data) {
        setAlerts(result.data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      addLog('Alerts', 'error', 'Failed to load alerts', { error: (error as Error).message })
    } finally {
      setIsAlertsLoading(false)
    }
  }

  // Сброс circuit breaker для сервиса
  const resetCircuitBreaker = async (serviceName: string) => {
    try {
      addLog('Circuit Breaker', 'info', `🔄 Resetting circuit breaker for ${serviceName}...`)
      
      const response = await fetch(`/api/auto-restore/reset-circuit-breaker/${serviceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          addLog('Circuit Breaker', 'info', `✅ Circuit breaker reset successfully for ${serviceName}`)
          // Обновляем статусы
          fetchCircuitBreakerStatuses()
        } else {
          addLog('Circuit Breaker', 'error', `❌ Failed to reset circuit breaker: ${result.error}`)
        }
      } else {
        const errorData = await response.json()
        addLog('Circuit Breaker', 'error', `❌ Reset request failed: ${errorData.error}`)
      }
    } catch (error) {
      addLog('Circuit Breaker', 'error', '❌ Circuit breaker reset failed', error)
    }
  }

  // Очистка alerts
  const clearAlerts = async () => {
    try {
      addLog('Alerts', 'info', '🧹 Clearing old alerts...')
      
      const response = await fetch('/api/auto-restore/alerts', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          addLog('Alerts', 'info', `✅ Cleared ${result.cleared || 0} old alerts`)
          // Обновляем alerts
          fetchAlerts()
        } else {
          addLog('Alerts', 'error', `❌ Failed to clear alerts: ${result.error}`)
        }
      } else {
        const errorData = await response.json()
        addLog('Alerts', 'error', `❌ Clear request failed: ${errorData.error}`)
      }
    } catch (error) {
      addLog('Alerts', 'error', '❌ Clear alerts failed', error)
    }
  }

  // Auto-refresh
  useEffect(() => {
    fetchServicesHealth()
    fetchAutoRestoreStatus()
    fetchAutoRestoreLogs('master') // Загружаем логи по умолчанию
    fetchCircuitBreakerStatuses()
    fetchAlerts()
    fetchAlertStatus()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchServicesHealth()
        fetchAutoRestoreStatus()
        fetchCircuitBreakerStatuses()
        fetchAlerts()
        fetchAlertStatus()
      }, 30000) // Каждые 30 секунд
      return () => clearInterval(interval)
    }

    return undefined
  }, [autoRefresh])

  useEffect(() => {
    fetchAlertStatus()
    const interval = setInterval(() => fetchAlertStatus(), 60000)
    return () => clearInterval(interval)
  }, [fetchAlertStatus])

  // Scroll логов вниз
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getStatusBadge = (status: ServiceHealth['status']) => {
    const variants = {
      online: { variant: 'default' as const, icon: CheckCircle, text: t('monitoring.status.online'), class: 'bg-green-500' },
      offline: { variant: 'destructive' as const, icon: XCircle, text: t('monitoring.status.offline'), class: 'bg-red-500' },
      error: { variant: 'destructive' as const, icon: AlertTriangle, text: t('monitoring.status.error'), class: 'bg-orange-500' },
      starting: { variant: 'secondary' as const, icon: Clock, text: t('monitoring.status.starting'), class: 'bg-yellow-500' },
      unknown: { variant: 'outline' as const, icon: RefreshCw, text: t('monitoring.status.unknown'), class: 'bg-gray-500' }
    }
    
    const config = variants[status]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    )
  }

  const getLevelIcon = (level: ServiceLog['level']) => {
    const icons = {
      info: CheckCircle,
      warn: AlertTriangle, 
      error: XCircle,
      debug: Terminal
    }
    return icons[level] || Terminal
  }

  const getLevelColor = (level: ServiceLog['level']) => {
    const colors = {
      info: 'text-green-600',
      warn: 'text-yellow-600',
      error: 'text-red-600', 
      debug: 'text-gray-600'
    }
    return colors[level] || 'text-gray-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>{t('monitoring.loadingServices')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('monitoring.title')}</h2>
          <p className="text-muted-foreground">
            {t('monitoring.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Disable auto-refresh (currently every 30s)' : 'Enable auto-refresh (every 30s)'}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? t('monitoring.autoRefresh') : t('monitoring.manualRefresh')}
          </Button>
          <Button 
            onClick={fetchServicesHealth} 
            disabled={isLoading}
            title="Manually refresh all service health data"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('monitoring.refresh')}
          </Button>
          <Button 
            onClick={forceCheckAllServices} 
            disabled={isLoading}
            variant="outline"
            title="Force comprehensive health check on all services with detailed metrics"
          >
            <Activity className="w-4 h-4 mr-2" />
            Deep Check
          </Button>
      <Button 
        onClick={restoreAllDownServices} 
        disabled={isAutoRestoreAllInProgress}
        variant="default"
        className="bg-purple-600 hover:bg-purple-700 text-white"
        title="Automatically restore all offline/error services using Smart Auto-Restore"
      >
        <Wrench className="w-4 h-4 mr-2" />
        {isAutoRestoreAllInProgress ? 'Restoring All...' : 'Auto-Restore All Down'}
      </Button>
    </div>
  </div>

      <Card className="beauty-card border-dashed">
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-4">
          <div>
            <h3 className="text-sm font-semibold">Telegram уведомления</h3>
            <p className="text-sm text-muted-foreground">
              {alertStatus
                ? alertStatus.enabled
                  ? 'Уведомления активны. Все критические инциденты отправляются в чат Telegram.'
                  : alertStatus.configured
                    ? 'Бот настроен, но оповещения отключены. Установите TELEGRAM_ENABLED=true, чтобы включить.'
                    : 'Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env, чтобы активировать оповещения.'
                : 'Проверяем конфигурацию Telegram…'}
            </p>
            {alertStatus?.lastAlerts && alertStatus.lastAlerts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Последний алерт: {new Date(alertStatus.lastAlerts[0].lastAlert).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={alertStatus?.enabled ? 'default' : 'secondary'}>
              {alertStatus?.enabled ? 'Активно' : 'Отключено'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestAlert}
              disabled={testAlertInProgress || !(alertStatus?.configured)}
            >
              {testAlertInProgress ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PhoneCall className="w-4 h-4 mr-1" />
              )}
              Тест сигнал
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {systemMetrics.onlineServices}/{systemMetrics.totalServices}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('monitoring.servicesOnline')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(systemMetrics.avgResponseTime)}ms</div>
                  <div className="text-sm text-muted-foreground">{t('monitoring.avgResponseTime')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(systemMetrics.systemLoad)}%</div>
                  <div className="text-sm text-muted-foreground">{t('monitoring.systemLoad')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round((systemMetrics.usedMemory / systemMetrics.totalMemory) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">{t('monitoring.memoryUsage')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">{t('monitoring.services')}</TabsTrigger>
          <TabsTrigger value="circuit-breaker">Circuit Breaker</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="logs">{t('monitoring.logs')}</TabsTrigger>
          <TabsTrigger value="metrics">{t('monitoring.metrics')}</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          {serviceCategories ? (
            <div className="space-y-6">
              {/* API Gateway Routed Services */}
              {serviceCategories.gatewayRouted && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Rocket className="w-5 h-5" />
                      {serviceCategories.gatewayRouted.title}
                      <Badge variant="secondary" className="ml-auto">{serviceCategories.gatewayRouted.services.length}</Badge>
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      {serviceCategories.gatewayRouted.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[400px]">Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Gateway Path</TableHead>
                            <TableHead>Response Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceCategories.gatewayRouted.services.map((service: any) => {
                            const serviceHealth = services.find(s => s.name === service.name)
                            const Icon = serviceHealth?.icon || Server
                            return (
                              <TableRow key={service.name}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-4 h-4 ${serviceHealth?.color || 'text-blue-500'}`} />
                                      <span className="font-semibold">{service.name}</span>
                                      {serviceHealth?.port && (
                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                          :{serviceHealth.port}
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                        Gateway
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground max-w-xs">
                                      {service.description}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={service.metrics.status === 'online' ? 'default' : 'destructive'}
                                    className={service.metrics.status === 'online' ? 'bg-green-500 hover:bg-green-600' : ''}
                                  >
                                    {service.metrics.status === 'online' ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <XCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {service.metrics.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <code className="bg-muted px-2 py-1 rounded text-xs">{service.gatewayPath}</code>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {service.metrics.responseTime ? `${service.metrics.responseTime}ms` : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => autoRestoreService(service.name)}
                                      disabled={autoRestoreInProgress[service.name] || !supportsAutoRestore(service.name)}
                                      title={`Auto-restore ${service.name}`}
                                    >
                                      {autoRestoreInProgress[service.name] ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Settings className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => stopService(service.name)}
                                      disabled={stopInProgress[service.name] || !supportsAutoRestore(service.name)}
                                      title="Stop service"
                                    >
                                      {stopInProgress[service.name] ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Octagon className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => restartService(service.name, serviceHealth?.port ?? service.port ?? 0)}
                                      disabled={restartInProgress[service.name]}
                                      title="Quick Restart"
                                    >
                                      {restartInProgress[service.name] ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Direct Access Services */}
              {serviceCategories.directAccess && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Monitor className="w-5 h-5" />
                      {serviceCategories.directAccess.title}
                      <Badge variant="secondary" className="ml-auto">{serviceCategories.directAccess.services.length}</Badge>
                    </CardTitle>
                    <CardDescription className="text-green-600">
                      {serviceCategories.directAccess.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[400px]">Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Access Method</TableHead>
                            <TableHead>Response Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceCategories.directAccess.services.map((service: any) => {
                            const serviceHealth = services.find(s => s.name === service.name)
                            const Icon = serviceHealth?.icon || Globe
                            return (
                              <TableRow key={service.name}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-4 h-4 ${serviceHealth?.color || 'text-green-500'}`} />
                                      <span className="font-semibold">{service.name}</span>
                                      {serviceHealth?.port && (
                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                          :{serviceHealth.port}
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                        Direct
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground max-w-xs">
                                      {service.description}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={service.metrics.status === 'online' ? 'default' : 'destructive'}
                                    className={service.metrics.status === 'online' ? 'bg-green-500 hover:bg-green-600' : ''}
                                  >
                                    {service.metrics.status === 'online' ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <XCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {service.metrics.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">nginx proxy</Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {service.metrics.responseTime ? `${service.metrics.responseTime}ms` : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => autoRestoreService(service.name)}
                                      disabled={autoRestoreInProgress[service.name] || !supportsAutoRestore(service.name)}
                                      title={`Auto-restore ${service.name}`}
                                    >
                                      {autoRestoreInProgress[service.name] ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Settings className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => stopService(service.name)}
                                      disabled={stopInProgress[service.name] || !supportsAutoRestore(service.name)}
                                      title="Stop service"
                                    >
                                      {stopInProgress[service.name] ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Octagon className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => restartService(service.name, serviceHealth?.port ?? service.port ?? 0)}
                                      disabled={restartInProgress[service.name]}
                                      title="Quick Restart"
                                    >
                                      {restartInProgress[service.name] ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Infrastructure Services */}
              {serviceCategories.infrastructure && (
                <Card className="border-gray-200 bg-gray-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <Settings className="w-5 h-5" />
                      {serviceCategories.infrastructure.title}
                      <Badge variant="secondary" className="ml-auto">{serviceCategories.infrastructure.services.length}</Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {serviceCategories.infrastructure.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[400px]">Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Response Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceCategories.infrastructure.services.map((service: any) => {
                            const serviceHealth = services.find(s => s.name === service.name)
                            const Icon = serviceHealth?.icon || Terminal
                            return (
                              <TableRow key={service.name}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-4 h-4 ${serviceHealth?.color || 'text-gray-500'}`} />
                                      <span className="font-semibold">{service.name}</span>
                                      {serviceHealth?.port && (
                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                          :{serviceHealth.port}
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                        Infrastructure
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground max-w-xs">
                                      {service.description}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={service.metrics.status === 'online' ? 'default' : 'destructive'}
                                    className={service.metrics.status === 'online' ? 'bg-green-500 hover:bg-green-600' : ''}
                                  >
                                    {service.metrics.status === 'online' ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <XCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {service.metrics.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">Development</Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {service.metrics.responseTime ? `${service.metrics.responseTime}ms` : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => autoRestoreService(service.name)}
                                      disabled={autoRestoreInProgress[service.name] || !supportsAutoRestore(service.name)}
                                      title={`Auto-restore ${service.name}`}
                                    >
                                      {autoRestoreInProgress[service.name] ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Settings className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => stopService(service.name)}
                                      disabled={stopInProgress[service.name] || !supportsAutoRestore(service.name)}
                                      title="Stop service"
                                    >
                                      {stopInProgress[service.name] ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Octagon className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => restartService(service.name, serviceHealth?.port ?? service.port ?? 0)}
                                      disabled={restartInProgress[service.name]}
                                      title="Quick Restart"
                                    >
                                      {restartInProgress[service.name] ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading service categories...
            </div>
          )}
          <div style={{display: 'none'}} className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Memory</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const Icon = service.icon
                  return (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${service.color}`} />
                            <span className="font-semibold">{service.name}</span>
                            {service.port && (
                              <Badge variant="outline" className="text-xs">:{service.port}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground max-w-xs">
                            {service.description}
                          </div>
                          {service.dependencies && service.dependencies.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Depends: {service.dependencies.join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(service.status)}</TableCell>
                      <TableCell>{service.uptime ? `${Math.floor(service.uptime / 60)}m` : 'N/A'}</TableCell>
                      <TableCell>{service.responseTime ? `${service.responseTime}ms` : 'N/A'}</TableCell>
                      <TableCell>
                        {service.memory ? `${service.memory.used}MB / ${service.memory.total}MB` : 'N/A'}
                      </TableCell>
                      <TableCell>{service.cpu ? `${service.cpu}%` : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => autoRestoreService(service.name)}
                            disabled={service.status === 'starting' || autoRestoreInProgress[service.name] || !supportsAutoRestore(service.name)}
                            title="Smart Auto-Restore - Comprehensive service recovery with dependency management"
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            {autoRestoreInProgress[service.name] ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Wrench className="w-4 h-4" />
                            )}
                            {autoRestoreInProgress[service.name] ? 'Restoring...' : 'Auto-Restore'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => stopService(service.name)}
                            disabled={service.status === 'starting' || stopInProgress[service.name] || !supportsAutoRestore(service.name)}
                            title="Stop service"
                          >
                            {stopInProgress[service.name] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Octagon className="w-4 h-4" />
                            )}
                            {stopInProgress[service.name] ? 'Stopping...' : 'Stop'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restartService(service.name, service.port)}
                            disabled={service.status === 'starting' || restartInProgress[service.name]}
                            title="Quick Restart"
                          >
                            {restartInProgress[service.name] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                            {restartInProgress[service.name] ? 'Restarting...' : 'Restart'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Circuit Breaker Tab */}
        <TabsContent value="circuit-breaker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-600" />
                Circuit Breaker Status
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCircuitBreakerStatuses}
                  disabled={isCircuitBreakerLoading}
                  className="ml-auto"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isCircuitBreakerLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Circuit breaker protection prevents services from being repeatedly restored after 3 failures in 60 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCircuitBreakerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading circuit breaker statuses...
                </div>
              ) : circuitBreakerStatuses.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>All Systems Normal</AlertTitle>
                  <AlertDescription>
                    No circuit breakers are currently tripped. All services are available for auto-restore.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {circuitBreakerStatuses.map((status) => (
                    <Card key={status.service} className="border-yellow-200 bg-yellow-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                              <span className="font-semibold">{status.service}</span>
                              <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600">
                                Circuit Tripped
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetCircuitBreaker(status.service)}
                            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset Circuit Breaker
                          </Button>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="font-medium">Attempts:</span> {status.attempts}
                            </div>
                            <div>
                              <span className="font-medium">Last Attempt:</span> {status.lastAttempt ? new Date(status.lastAttempt).toLocaleString() : 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Window Start:</span> {status.windowStart ? new Date(status.windowStart).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Critical Alerts
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAlerts}
                    disabled={isAlertsLoading || alerts.length === 0}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Old Alerts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAlerts}
                    disabled={isAlertsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isAlertsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Critical alerts generated by the auto-restore system when services fail repeatedly
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAlertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>No Critical Alerts</AlertTitle>
                  <AlertDescription>
                    The system is operating normally with no critical alerts.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <Card key={index} className="border-red-200 bg-red-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive" className="text-xs">
                                {alert.type.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {alert.service}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {alert.readableTime}
                              </span>
                            </div>
                            <div className="text-sm">{alert.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Alert file: {alert.filename}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                {t('monitoring.systemLogs')}
              </CardTitle>
              <CardDescription>
                {t('monitoring.logsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('monitoring.noLogs')}
                  </div>
                ) : (
                  logs.map((log) => {
                    const Icon = getLevelIcon(log.level)
                    return (
                      <div key={log.id} className="flex items-start gap-2 py-1 border-b border-border/50 last:border-0">
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getLevelColor(log.level)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.service}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {log.level}
                            </Badge>
                          </div>
                          <div className="mt-1">{log.message}</div>
                          {log.details && (
                            <details className="mt-1 text-xs text-muted-foreground">
                              <summary className="cursor-pointer">Details</summary>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('monitoring.performance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.filter(s => s.responseTime).map(service => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${service.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">{service.name}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {service.responseTime}ms
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('monitoring.systemInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('monitoring.metrics')}</AlertTitle>
                  <AlertDescription>
                    {t('monitoring.metricsNote')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
