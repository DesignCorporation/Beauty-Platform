/**
 * Main Orchestrator Service
 * Coordinates service management, state persistence, and health monitoring
 */

import { EventEmitter } from 'events';
import {
  ServiceRuntimeState,
  ServiceState,
  ServiceAction,
  OrchestratorConfig,
  ServiceStatusResponse,
  OrchestratorStatusResponse
} from '../types/orchestrator.types';
import {
  ServiceConfig,
  ServiceCriticality,
  calculateStartupOrder,
  getAllServices,
  getCriticalServices,
  findServiceById,
  isExternallyManaged
} from '@beauty-platform/service-registry';
import { ProcessManager } from './process-manager';
import { StateManager } from './state-manager';

export class Orchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private processManager: ProcessManager;
  private stateManager: StateManager;
  private services = new Map<string, ServiceRuntimeState>();
  private startTime = new Date();

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;
    this.processManager = new ProcessManager(config);
    this.stateManager = new StateManager(config.stateFile);

    // Forward process manager events
    this.processManager.on('stateChange', this.handleStateChange.bind(this));
    this.processManager.on('processExit', this.handleProcessExit.bind(this));
    this.processManager.on('processError', this.handleProcessError.bind(this));
  }

  /**
   * Initialize orchestrator
   */
  async initialize(): Promise<void> {
    console.log('Initializing Beauty Platform Orchestrator...');

    // Initialize state manager
    await this.stateManager.initialize();

    // Load service registry
    await this.loadServices();

    // Restore previous state
    await this.restoreState();

    // Auto-start configured services (critical + explicit autoStart flag)
    await this.autoStartConfiguredServices();

    console.log('Orchestrator initialized successfully');
  }

  /**
   * Start a specific service
   */
  async startService(serviceId: string): Promise<void> {
    const serviceConfig = findServiceById(serviceId);
    if (!serviceConfig) {
      throw new Error(`Service ${serviceId} not found in registry`);
    }

    const runtimeState = this.services.get(serviceId);
    if (!runtimeState) {
      throw new Error(`Runtime state not found for service ${serviceId}`);
    }

    // Check if already starting/running
    if ([ServiceState.STARTING, ServiceState.RUNNING, ServiceState.WARMUP].includes(runtimeState.state)) {
      throw new Error(`Service ${serviceId} is already ${runtimeState.state}`);
    }

    // Check dependencies
    await this.checkDependencies(serviceId);

    // Start the service
    await this.processManager.startService(serviceConfig, runtimeState);

    // Persist state change
    await this.stateManager.updateServiceState(serviceId, runtimeState);

    this.emit('serviceStarted', serviceId);
  }

  /**
   * Stop a specific service
   */
  async stopService(serviceId: string): Promise<void> {
    const runtimeState = this.services.get(serviceId);
    if (!runtimeState) {
      throw new Error(`Runtime state not found for service ${serviceId}`);
    }

    await this.processManager.stopService(serviceId, runtimeState);
    await this.stateManager.updateServiceState(serviceId, runtimeState);

    this.emit('serviceStopped', serviceId);
  }

  /**
   * Restart a specific service
   */
  async restartService(serviceId: string): Promise<void> {
    const serviceConfig = findServiceById(serviceId);
    if (!serviceConfig) {
      throw new Error(`Service ${serviceId} not found in registry`);
    }

    const runtimeState = this.services.get(serviceId);
    if (!runtimeState) {
      throw new Error(`Runtime state not found for service ${serviceId}`);
    }

    await this.processManager.restartService(serviceConfig, runtimeState);
    await this.stateManager.updateServiceState(serviceId, runtimeState);

    this.emit('serviceRestarted', serviceId);
  }

  /**
   * Reset circuit breaker for service
   */
  async resetCircuitBreaker(serviceId: string): Promise<void> {
    const runtimeState = this.services.get(serviceId);
    if (!runtimeState) {
      throw new Error(`Runtime state not found for service ${serviceId}`);
    }

    this.processManager.resetCircuitBreaker(runtimeState);
    await this.stateManager.updateServiceState(serviceId, runtimeState);

    this.emit('circuitBreakerReset', serviceId);
  }

  /**
   * Execute service action
   */
  async executeServiceAction(serviceId: string, action: ServiceAction): Promise<void> {
    switch (action) {
      case ServiceAction.START:
        await this.startService(serviceId);
        break;
      case ServiceAction.STOP:
        await this.stopService(serviceId);
        break;
      case ServiceAction.RESTART:
        await this.restartService(serviceId);
        break;
      case ServiceAction.RESET_CIRCUIT:
        await this.resetCircuitBreaker(serviceId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Get status of all services
   */
  getStatusAll(): OrchestratorStatusResponse {
    const services: ServiceStatusResponse[] = [];
    let runningCount = 0;
    let healthyCount = 0;

    for (const [serviceId, runtimeState] of this.services) {
      const serviceConfig = findServiceById(serviceId);
      if (!serviceConfig) continue;

      const status = this.buildServiceStatus(serviceId, runtimeState, serviceConfig);
      services.push(status);

      if (status.state === ServiceState.RUNNING) {
        runningCount++;
        if (status.health.isHealthy) {
          healthyCount++;
        }
      }
    }

    return {
      orchestrator: {
        version: '1.0.0',
        uptime: (Date.now() - this.startTime.getTime()) / 1000,
        servicesTotal: this.services.size,
        servicesRunning: runningCount,
        servicesHealthy: healthyCount
      },
      services: services.sort((a, b) => a.serviceId.localeCompare(b.serviceId))
    };
  }

  /**
   * Get status of specific service
   */
  getServiceStatus(serviceId: string): ServiceStatusResponse | null {
    const runtimeState = this.services.get(serviceId);
    const serviceConfig = findServiceById(serviceId);

    if (!runtimeState || !serviceConfig) {
      return null;
    }

    return this.buildServiceStatus(serviceId, runtimeState, serviceConfig);
  }

  /**
   * Get service logs
   */
  getServiceLogs(serviceId: string, lines: number = 50): { stdout: string[], stderr: string[] } {
    const runtimeState = this.services.get(serviceId);
    if (!runtimeState) {
      return { stdout: [], stderr: [] };
    }

    return {
      stdout: runtimeState.logs.stdout.slice(-lines),
      stderr: runtimeState.logs.stderr.slice(-lines)
    };
  }

  /**
   * Get service registry data
   */
  getRegistry(): ServiceConfig[] {
    return getAllServices();
  }

  /**
   * Shutdown orchestrator gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down orchestrator...');

    // Save current state
    await this.stateManager.saveState(this.services);

    // Cleanup process manager
    await this.processManager.cleanup();

    console.log('Orchestrator shutdown complete');
  }

  /**
   * Load services from registry
   */
  private async loadServices(): Promise<void> {
    const allServices = getAllServices();

    for (const serviceConfig of allServices) {
      const isExternal = isExternallyManaged(serviceConfig.id);

      const runtimeState: ServiceRuntimeState = {
        serviceId: serviceConfig.id,
        state: isExternal ? ServiceState.EXTERNAL : ServiceState.STOPPED,
        process: {},
        health: {
          isHealthy: isExternal ? true : false, // External services assumed healthy
          lastCheck: new Date(),
          consecutiveFailures: 0,
          consecutiveSuccesses: isExternal ? 1 : 0 // External services start with success
        },
        circuitBreaker: {
          state: 'closed',
          failures: 0,
          backoffSeconds: isExternal ? 0 : 1 // No backoff for external services
        },
        warmup: {
          isInWarmup: false,
          successfulChecks: isExternal ? 1 : 0, // External services pre-warmed
          requiredChecks: isExternal ? 1 : Math.ceil(serviceConfig.warmupTime / (this.config.healthCheck.interval / 1000))
        },
        autoRestoreAttempts: 0,
        lastStateChange: new Date(),
        dependencies: serviceConfig.dependencies,
        logs: {
          stdout: [],
          stderr: []
        }
      };

      this.services.set(serviceConfig.id, runtimeState);
    }

    console.log(`Loaded ${allServices.length} services from registry`);
  }

  /**
   * Restore state from persistence
   */
  private async restoreState(): Promise<void> {
    const persistedStates = await this.stateManager.loadState();

    for (const [serviceId, persistedState] of persistedStates) {
      const runtimeState = this.services.get(serviceId);
      if (!runtimeState) continue;

      // Skip restoring state for external services - they should keep their initialized state
      const isExternal = isExternallyManaged(serviceId);
      if (isExternal) {
        console.log(`Skipping state restoration for external service: ${serviceId}`);
        continue;
      }

      // Apply persisted state
      const partialState = this.stateManager.persistedToRuntime(persistedState, serviceId);
      Object.assign(runtimeState, partialState);

      // If service was running, mark it as stopped for now
      // The orchestrator will decide whether to auto-restart
      if (runtimeState.state === ServiceState.RUNNING || runtimeState.state === ServiceState.STARTING) {
        runtimeState.state = ServiceState.STOPPED;
        runtimeState.process.pid = undefined;
      }
    }

    console.log(`Restored state for ${persistedStates.size} services`);
  }

  /**
   * Check service dependencies
   */
  private async checkDependencies(serviceId: string): Promise<void> {
    const runtimeState = this.services.get(serviceId);
    if (!runtimeState) return;

    for (const depId of runtimeState.dependencies) {
      const depState = this.services.get(depId);
      const isExternal = isExternallyManaged(depId);

      // For external services, only check if they're marked as EXTERNAL (assume healthy)
      // For internal services, check if they're RUNNING
      const isReady = isExternal
        ? (depState?.state === ServiceState.EXTERNAL)
        : (depState?.state === ServiceState.RUNNING);

      if (!depState || !isReady) {
        const expectedState = isExternal ? 'external and healthy' : 'running';
        throw new Error(`Dependency ${depId} is not ${expectedState} for service ${serviceId}`);
      }
    }
  }

  /**
   * Build service status response
   */
  private buildServiceStatus(serviceId: string, runtimeState: ServiceRuntimeState, serviceConfig: ServiceConfig): ServiceStatusResponse {
    const processInfo = this.processManager.getProcessInfo(serviceId);
    const isExternal = isExternallyManaged(serviceId);

    return {
      serviceId,
      name: serviceConfig.name,
      state: isExternal ? ServiceState.EXTERNAL : runtimeState.state,
      pid: isExternal ? undefined : processInfo?.pid,
      uptime: isExternal ? undefined : processInfo?.uptime,
      managed: serviceConfig.run?.managed || 'internal',
      cwd: serviceConfig.run?.cwd || serviceConfig.directory, // fallback to legacy directory
      health: {
        isHealthy: isExternal ? true : runtimeState.health.isHealthy, // External services assumed healthy
        lastCheck: runtimeState.health.lastCheck.toISOString(),
        consecutiveFailures: isExternal ? 0 : runtimeState.health.consecutiveFailures,
        responseTime: isExternal ? undefined : runtimeState.health.responseTime,
        error: isExternal ? undefined : runtimeState.health.error
      },
      warmup: {
        isInWarmup: isExternal ? false : runtimeState.warmup.isInWarmup,
        progress: isExternal ? 100 : (runtimeState.warmup.requiredChecks > 0
          ? Math.round((runtimeState.warmup.successfulChecks / runtimeState.warmup.requiredChecks) * 100)
          : 0),
        successfulChecks: isExternal ? 0 : runtimeState.warmup.successfulChecks,
        requiredChecks: isExternal ? 0 : runtimeState.warmup.requiredChecks
      },
      circuitBreaker: {
        state: isExternal ? 'closed' : runtimeState.circuitBreaker.state,
        failures: isExternal ? 0 : runtimeState.circuitBreaker.failures,
        nextRetry: isExternal ? undefined : runtimeState.circuitBreaker.nextRetry?.toISOString(),
        backoffSeconds: isExternal ? 0 : runtimeState.circuitBreaker.backoffSeconds
      },
      dependencies: runtimeState.dependencies,
      autoRestoreAttempts: isExternal ? 0 : runtimeState.autoRestoreAttempts,
      lastStateChange: runtimeState.lastStateChange.toISOString()
    };
  }

  /**
   * Auto-start services based on registry configuration
   */
  private async autoStartConfiguredServices(): Promise<void> {
    const startupOrder = calculateStartupOrder();

    for (const { serviceId } of startupOrder) {
      const serviceConfig = findServiceById(serviceId);
      if (!serviceConfig) continue;

      if (!this.shouldAutoStart(serviceConfig)) {
        continue;
      }

      const runtimeState = this.services.get(serviceId);
      if (!runtimeState) {
        continue;
      }

      if ([ServiceState.RUNNING, ServiceState.STARTING, ServiceState.WARMUP].includes(runtimeState.state)) {
        continue;
      }

      try {
        await this.startService(serviceId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[AutoStart] Failed to start ${serviceId}: ${message}`);
      }
    }
  }

  /**
   * Determine if a service should auto-start
   */
  private shouldAutoStart(serviceConfig: ServiceConfig): boolean {
    if (serviceConfig.run?.managed === 'external') {
      return false;
    }

    if (serviceConfig.run?.autoStart !== undefined) {
      return serviceConfig.run.autoStart;
    }

    return serviceConfig.criticality === ServiceCriticality.Critical;
  }

  /**
   * Handle state change events from process manager
   */
  private async handleStateChange(serviceId: string, runtimeState: ServiceRuntimeState): Promise<void> {
    this.emit('stateChange', serviceId, runtimeState.state);

    // Persist state changes
    try {
      await this.stateManager.updateServiceState(serviceId, runtimeState);
    } catch (error) {
      console.error(`Failed to persist state for service ${serviceId}:`, error);
    }
  }

  /**
   * Handle process exit events
   */
  private async handleProcessExit(serviceId: string, exitCode: number | null, signal: string | null): Promise<void> {
    console.log(`Process ${serviceId} exited with code ${exitCode}, signal ${signal}`);
    this.emit('processExit', serviceId, exitCode, signal);

    // TODO: Implement auto-restart logic for critical services
    const runtimeState = this.services.get(serviceId);
    if (runtimeState && runtimeState.state !== ServiceState.STOPPING) {
      const serviceConfig = findServiceById(serviceId);
      const isCritical = getCriticalServices().some(s => s.id === serviceId);

      if (isCritical && serviceConfig) {
        console.log(`Critical service ${serviceId} exited unexpectedly, scheduling restart...`);
        // Implement backoff logic here
        setTimeout(async () => {
          try {
            await this.startService(serviceId);
            runtimeState.autoRestoreAttempts++;
          } catch (error) {
            console.error(`Failed to auto-restart service ${serviceId}:`, error);
          }
        }, 5000);
      }
    }
  }

  /**
   * Handle process error events
   */
  private handleProcessError(serviceId: string, error: Error): void {
    console.error(`Process error for ${serviceId}:`, error);
    this.emit('processError', serviceId, error);
  }
}
