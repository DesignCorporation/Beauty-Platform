import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea
} from '@beauty-platform/ui'
import { Activity, AlertTriangle, CheckCircle, Clock, Play, RotateCcw, Square, Zap } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                   */
/* -------------------------------------------------------------------------- */

type OrchestratorServiceState = 'running' | 'starting' | 'warmup' | 'stopped' | 'error' | 'circuit_open' | 'external'

type OrchestratorServiceStatus = {
  serviceId: string
  name: string
  state: OrchestratorServiceState
  pid?: number
  uptime?: number
  managed: 'internal' | 'external'
  cwd: string
  health: {
    isHealthy: boolean
    lastCheck: string
    consecutiveFailures: number
    responseTime?: number
    error?: string
  }
  warmup: {
    isInWarmup: boolean
    progress: number
    successfulChecks: number
    requiredChecks: number
  }
  circuitBreaker: {
    state: 'open' | 'closed' | 'cooldown'
    failures: number
    nextRetry?: string
    backoffSeconds: number
  }
  dependencies: string[]
  autoRestoreAttempts: number
  lastStateChange: string
}

type OrchestratorStatusPayload = {
  orchestrator: {
    version: string
    uptime: number
    servicesTotal: number
    servicesRunning: number
    servicesHealthy: number
  }
  services: OrchestratorServiceStatus[]
}

type ServiceRegistryEntry = {
  id: string
  name: string
  description: string
  port: number
  type: string
  criticality: 'critical' | 'important' | 'optional'
  status: string
  run: {
    managed?: 'internal' | 'external'
    autoStart?: boolean
  }
  dependencies: string[]
  gatewayPath?: string
  tags?: string[]
}

type ServiceRegistryResponse = {
  success: boolean
  data: {
    services: ServiceRegistryEntry[]
    count: number
  }
}

type ServiceLogsResponse = {
  success: boolean
  data: {
    serviceId: string
    logs: {
      stdout: string[]
      stderr: string[]
    }
    timestamp: string
  }
}

type OrchestratorStatusResponse = {
  success: boolean
  data: OrchestratorStatusPayload
  timestamp: string
}

type ServiceAction = 'start' | 'stop' | 'restart' | 'resetCircuit'

type ActionState = {
  running: boolean
  error?: string
}

/* -------------------------------------------------------------------------- */
/*                                 UTILITIES                                  */
/* -------------------------------------------------------------------------- */

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const formatRelativeTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diff = Date.now() - date.getTime()
  if (diff < 0) return 'in the future'
  const minutes = Math.floor(diff / (60 * 1000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return `${days} d ago`
}

const formatMilliseconds = (value?: number) => {
  if (value === undefined) return '—'
  return `${value} ms`
}

const formatUptime = (seconds?: number) => {
  if (!seconds && seconds !== 0) return '—'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return [
    hrs ? `${hrs}h` : null,
    mins ? `${mins}m` : null,
    `${secs}s`
  ]
    .filter(Boolean)
    .join(' ')
}

const statusBadgeVariant = (state: OrchestratorServiceState, healthy: boolean) => {
  if (state === 'external') return 'outline'
  if (state === 'running') return healthy ? 'default' : 'destructive'
  if (state === 'starting' || state === 'warmup') return 'secondary'
  if (state === 'circuit_open' || state === 'error') return 'destructive'
  return 'outline'
}

/* -------------------------------------------------------------------------- */
/*                              REACT COMPONENT                               */
/* -------------------------------------------------------------------------- */

const REFRESH_INTERVAL = 15000

export default function ServicesMonitoringPage() {
  const { t } = useTranslation()

  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatusPayload | null>(null)
  const [registry, setRegistry] = useState<Record<string, ServiceRegistryEntry>>({})
  const [selectedServiceId, setSelectedServiceId] = useState<string>('api-gateway')
  const [logs, setLogs] = useState<{ stdout: string[]; stderr: string[] }>({ stdout: [], stderr: [] })
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [actionState, setActionState] = useState<Record<string, ActionState>>({})
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logTab, setLogTab] = useState<'stdout' | 'stderr'>('stdout')

  const services = orchestratorStatus?.services ?? []
  const orchestratorInfo = orchestratorStatus?.orchestrator

  /* -------------------------------- FETCHERS ------------------------------- */

  const fetchStatus = async () => {
    setLoadingStatus(true)
    setErrorMessage(null)
    try {
      const [statusRes, registryRes] = await Promise.all([
        fetch('/api/orchestrator/status-all', { signal: AbortSignal.timeout(10000) }),
        fetch('/api/orchestrator/registry', { signal: AbortSignal.timeout(10000) })
      ])

      if (!statusRes.ok) throw new Error(`status-all ${statusRes.status}`)
      if (!registryRes.ok) throw new Error(`registry ${registryRes.status}`)

      const statusJson = (await statusRes.json()) as OrchestratorStatusResponse
      const registryJson = (await registryRes.json()) as ServiceRegistryResponse

      if (!statusJson.success) throw new Error('status-all response not successful')
      if (!registryJson.success) throw new Error('registry response not successful')

      setOrchestratorStatus(statusJson.data)

      const registryMap = registryJson.data.services.reduce<Record<string, ServiceRegistryEntry>>((acc, entry) => {
        acc[entry.id] = entry
        return acc
      }, {})
      setRegistry(registryMap)
    } catch (error) {
      console.error('[ServicesMonitoring] status fetch failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load orchestrator status')
    } finally {
      setLoadingStatus(false)
    }
  }

  const fetchLogs = async (serviceId: string) => {
    setLoadingLogs(true)
    try {
      const response = await fetch(`/api/orchestrator/services/${encodeURIComponent(serviceId)}/logs?lines=200`, {
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) throw new Error(`logs ${response.status}`)
      const json = (await response.json()) as ServiceLogsResponse
      if (!json.success) throw new Error('logs response not successful')
      setLogs(json.data.logs)
    } catch (error) {
      console.error('[ServicesMonitoring] log fetch failed:', error)
      setLogs({ stdout: [], stderr: [] })
    } finally {
      setLoadingLogs(false)
    }
  }

  const executeAction = async (serviceId: string, action: ServiceAction) => {
    const key = `${serviceId}:${action}`
    setActionState(prev => ({ ...prev, [key]: { running: true } }))
    try {
      const response = await fetch(`/api/orchestrator/services/${encodeURIComponent(serviceId)}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        let errorMessage = errorBody?.error || `Action ${action} failed (${response.status})`

        // Handle specific error codes with user-friendly messages
        if (response.status === 501) {
          errorMessage = `${action} is not supported for external services`
        } else if (response.status === 409) {
          errorMessage = errorBody?.error || `Service is already in the requested state`
        }

        throw new Error(errorMessage)
      }
      await fetchStatus()
      if (serviceId === selectedServiceId) await fetchLogs(serviceId)
    } catch (error) {
      console.error('[ServicesMonitoring] action failed:', error)
      setActionState(prev => ({ ...prev, [key]: { running: false, error: error instanceof Error ? error.message : String(error) } }))
      return
    }
    setActionState(prev => ({ ...prev, [key]: { running: false } }))
  }

  /* -------------------------------- EFFECTS -------------------------------- */

  useEffect(() => {
    void fetchStatus()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      void fetchStatus()
      if (selectedServiceId) void fetchLogs(selectedServiceId)
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [autoRefresh, selectedServiceId])

  useEffect(() => {
    if (selectedServiceId) void fetchLogs(selectedServiceId)
  }, [selectedServiceId])

  /* ----------------------------- DERIVED VALUES ---------------------------- */

  const rows = useMemo(() => {
    return services.map(service => {
      const registryEntry = registry[service.serviceId]
      return {
        status: service,
        registry: registryEntry,
        displayName: registryEntry?.name ?? service.name ?? service.serviceId
      }
    })
  }, [services, registry])

  const selectedStatus = services.find(service => service.serviceId === selectedServiceId)
  const selectedRegistry = selectedStatus ? registry[selectedStatus.serviceId] : undefined

  const isActionDisabled = (service?: OrchestratorServiceStatus, action?: ServiceAction) => {
    if (!service) return true
    if (service.managed === 'external') return true
    if (action === 'start') {
      return service.state === 'running' || service.state === 'starting' || service.state === 'warmup'
    }
    if (action === 'stop') {
      return service.state !== 'running' && service.state !== 'starting' && service.state !== 'warmup'
    }
    if (action === 'resetCircuit') {
      return service.circuitBreaker.state !== 'open'
    }
    return false
  }

  /* --------------------------------- RENDER -------------------------------- */

  return (
    <div className="space-y-6">

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('monitoring.loadErrorTitle', 'Failed to load status')}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {orchestratorInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('monitoring.orchestratorOverview', 'Services Monitoring')}</CardTitle>
                <CardDescription>
                  {t('monitoring.orchestratorDescription', 'Status and performance of all Beauty Platform components')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={autoRefresh ? 'default' : 'outline'} onClick={() => setAutoRefresh(!autoRefresh)}>
                  {autoRefresh ? t('monitoring.autoRefreshOn', 'Auto refresh ON') : t('monitoring.autoRefreshOff', 'Auto refresh OFF')}
                </Button>
                <Button variant="outline" onClick={() => void fetchStatus()} disabled={loadingStatus}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('monitoring.refresh', 'Refresh')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('monitoring.version', 'Version')}</p>
              <p className="text-lg font-semibold">{orchestratorInfo.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('monitoring.uptime', 'Uptime')}</p>
              <p className="text-lg font-semibold">{formatUptime(orchestratorInfo.uptime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('monitoring.servicesRunning', 'Services running')}</p>
              <p className="text-lg font-semibold">{orchestratorInfo.servicesRunning} / {orchestratorInfo.servicesTotal}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('monitoring.servicesHealthy', 'Services healthy')}</p>
              <p className="text-lg font-semibold">{orchestratorInfo.servicesHealthy}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('monitoring.services', 'Services')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('monitoring.table.service', 'Service')}</TableHead>
                <TableHead>{t('monitoring.table.state', 'State')}</TableHead>
                <TableHead>{t('monitoring.table.health', 'Health')}</TableHead>
                <TableHead>{t('monitoring.table.port', 'Port')}</TableHead>
                <TableHead>{t('monitoring.table.dependencies', 'Dependencies')}</TableHead>
                <TableHead className="text-right">{t('monitoring.table.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ status, registry: entry, displayName }) => {
                const keyPrefix = `${status.serviceId}`
                const actionKey = (action: ServiceAction) => `${status.serviceId}:${action}`
                const actionRunning = (action: ServiceAction) => actionState[actionKey(action)]?.running
                const actionError = (action: ServiceAction) => actionState[actionKey(action)]?.error
                const isSelected = selectedServiceId === status.serviceId

                return (
                  <TableRow
                    key={status.serviceId}
                    className={isSelected ? 'bg-muted/40' : undefined}
                    onClick={() => setSelectedServiceId(status.serviceId)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{displayName}</span>
                        <span className="text-xs text-muted-foreground">{entry?.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(status.state, status.health.isHealthy)}>
                        {status.state}
                      </Badge>
                      {status.state === 'circuit_open' && status.circuitBreaker.nextRetry && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('monitoring.nextRetry', 'Next retry')}: {formatRelativeTime(status.circuitBreaker.nextRetry)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {status.health.isHealthy ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" /> {t('monitoring.healthOk', 'Healthy')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" /> {status.health.error ?? t('monitoring.healthFail', 'Unhealthy')}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t('monitoring.lastCheck', 'Last check')}: {formatRelativeTime(status.health.lastCheck)}
                      </p>
                    </TableCell>
                    <TableCell>{entry?.port ?? '—'}</TableCell>
                    <TableCell>
                      {status.dependencies.length === 0
                        ? t('monitoring.noDependencies', '—')
                        : status.dependencies.join(', ')}
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActionDisabled(status, 'start') || actionRunning('start')}
                        title={status.managed === 'external' ? 'External service (managed outside orchestrator)' : undefined}
                        onClick={e => {
                          e.stopPropagation()
                          void executeAction(status.serviceId, 'start')
                        }}
                      >
                        {actionRunning('start') ? <Activity className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />}
                        {t('monitoring.start', 'Start')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActionDisabled(status, 'stop') || actionRunning('stop')}
                        title={status.managed === 'external' ? 'External service (managed outside orchestrator)' : undefined}
                        onClick={e => {
                          e.stopPropagation()
                          void executeAction(status.serviceId, 'stop')
                        }}
                      >
                        {actionRunning('stop') ? <Activity className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Square className="mr-2 h-3.5 w-3.5" />}
                        {t('monitoring.stop', 'Stop')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionRunning('restart')}
                        title={status.managed === 'external' ? 'External service (managed outside orchestrator)' : undefined}
                        onClick={e => {
                          e.stopPropagation()
                          void executeAction(status.serviceId, 'restart')
                        }}
                      >
                        {actionRunning('restart') ? <Activity className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-2 h-3.5 w-3.5" />}
                        {t('monitoring.restart', 'Restart')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActionDisabled(status, 'resetCircuit') || actionRunning('resetCircuit')}
                        title={status.managed === 'external' ? 'External service (managed outside orchestrator)' : undefined}
                        onClick={e => {
                          e.stopPropagation()
                          void executeAction(status.serviceId, 'resetCircuit')
                        }}
                      >
                        {actionRunning('resetCircuit') ? <Activity className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
                        {t('monitoring.resetCircuit', 'Reset circuit')}
                      </Button>
                      {(['start', 'stop', 'restart', 'resetCircuit'] as ServiceAction[]).map(action => {
                        const err = actionError(action)
                        if (!err) return null
                        return (
                          <p key={`${keyPrefix}-${action}-error`} className="text-xs text-destructive">
                            {action} · {err}
                          </p>
                        )
                      })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('monitoring.serviceDetails', 'Service details')}</CardTitle>
            <CardDescription>
              {selectedStatus ? selectedStatus.serviceId : t('monitoring.selectService', 'Select a service to inspect details')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedStatus ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('monitoring.healthStatus', 'Health')}</h4>
                  <p className="text-sm">{selectedStatus.health.isHealthy ? t('monitoring.healthOk', 'Healthy') : selectedStatus.health.error || t('monitoring.healthFail', 'Unhealthy')}</p>
                  <p className="text-xs text-muted-foreground">{t('monitoring.lastCheck', 'Last check')}: {formatDateTime(selectedStatus.health.lastCheck)}</p>
                  <p className="text-xs text-muted-foreground">{t('monitoring.latency', 'Latency')}: {formatMilliseconds(selectedStatus.health.responseTime)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('monitoring.runtime', 'Runtime')}</h4>
                  <p className="text-sm">PID: {selectedStatus.pid ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{t('monitoring.uptime', 'Uptime')}: {formatUptime(selectedStatus.uptime)}</p>
                  <p className="text-xs text-muted-foreground">{t('monitoring.cwd', 'Directory')}: {selectedStatus.cwd}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('monitoring.circuitBreaker', 'Circuit breaker')}</h4>
                  <p className="text-sm">{selectedStatus.circuitBreaker.state}</p>
                  <p className="text-xs text-muted-foreground">{t('monitoring.failures', 'Failures')}: {selectedStatus.circuitBreaker.failures}</p>
                  {selectedStatus.circuitBreaker.nextRetry && (
                    <p className="text-xs text-muted-foreground">{t('monitoring.nextRetry', 'Next retry')}: {formatDateTime(selectedStatus.circuitBreaker.nextRetry)}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('monitoring.dependencies', 'Dependencies')}</h4>
                  <p className="text-sm">
                    {selectedStatus.dependencies.length > 0 ? selectedStatus.dependencies.join(', ') : t('monitoring.noDependencies', 'No dependencies')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('monitoring.managed', 'Managed by orchestrator')}: {selectedStatus.managed}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('monitoring.selectServicePrompt', 'Select a service from the table above to see details')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('monitoring.logs', 'Logs')}</CardTitle>
            <CardDescription>
              {selectedServiceId ? `${selectedServiceId}` : t('monitoring.logsDescription', 'Select a service to view logs')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs value={logTab} onValueChange={value => setLogTab(value as 'stdout' | 'stderr')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stdout">STDOUT</TabsTrigger>
                <TabsTrigger value="stderr">STDERR</TabsTrigger>
              </TabsList>
              <TabsContent value="stdout">
                <Textarea
                  readOnly
                  value={loadingLogs ? t('monitoring.loadingLogs', 'Loading logs…') : (logs.stdout.length ? logs.stdout.join('\n') : t('monitoring.noLogs', 'No logs'))}
                  className="h-48 font-mono text-xs"
                />
              </TabsContent>
              <TabsContent value="stderr">
                <Textarea
                  readOnly
                  value={loadingLogs ? t('monitoring.loadingLogs', 'Loading logs…') : (logs.stderr.length ? logs.stderr.join('\n') : t('monitoring.noLogs', 'No logs'))}
                  className="h-48 font-mono text-xs"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
