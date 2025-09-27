/**
 * Process Manager
 * Manages service processes with spawn/kill, health checks, and circuit breaker
 */

import { execa, ExecaChildProcess } from 'execa';
import { EventEmitter } from 'events';
import {
  ServiceRuntimeState,
  ServiceState,
  ProcessInfo,
  HealthInfo,
  CircuitBreakerState,
  OrchestratorConfig
} from '../types/orchestrator.types';
import {
  ServiceConfig,
  isExternallyManaged,
  getServiceWorkingDirectory,
  buildServiceEnvironment
} from '@beauty-platform/service-registry';
import * as path from 'path';

export class ProcessManager extends EventEmitter {
  private processes = new Map<string, ExecaChildProcess>();
  private healthTimers = new Map<string, NodeJS.Timeout>();
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;
  }

  /**
   * Start a service process
   */
  async startService(serviceConfig: ServiceConfig, runtimeState: ServiceRuntimeState): Promise<void> {
    const { id: serviceId, run } = serviceConfig;

    // Check if service is externally managed
    if (isExternallyManaged(serviceId)) {
      throw new Error(`Service ${serviceId} is externally managed and cannot be started by orchestrator`);
    }

    if (this.processes.has(serviceId)) {
      throw new Error(`Service ${serviceId} is already running`);
    }

    if (!run) {
      throw new Error(`Service ${serviceId} has no run configuration`);
    }

    try {
      // Update state to starting
      runtimeState.state = ServiceState.STARTING;
      runtimeState.lastStateChange = new Date();
      runtimeState.warmup.isInWarmup = true;
      runtimeState.warmup.startTime = new Date();
      runtimeState.warmup.successfulChecks = 0;
      runtimeState.warmup.requiredChecks = Math.ceil(serviceConfig.warmupTime / (this.config.healthCheck.interval / 1000));

      this.emit('stateChange', serviceId, runtimeState);

      // Get command and args from run config
      let { command, args } = run;

      // Replace 'pnpm' command with full path if needed
      if (command === 'pnpm') {
        const pnpmPath = this.findPnpmExecutable();
        if (pnpmPath) {
          command = pnpmPath;
          console.log(`[PNPM] Using full path: ${command}`);
        }
      }

      // Get working directory and environment
      const projectRoot = path.resolve(process.cwd(), '../..'); // Go up from services/orchestrator to project root
      const workingDirectory = getServiceWorkingDirectory(serviceConfig, projectRoot);
      const serviceEnvironment = buildServiceEnvironment(serviceConfig, process.env);

      // Debug logging
      console.log(`[DEBUG] Service: ${serviceId}`);
      console.log(`[DEBUG] Project Root: ${projectRoot}`);
      console.log(`[DEBUG] Working Directory: ${workingDirectory}`);
      console.log(`[DEBUG] Command: ${command} ${args.join(' ')}`);

      // Augment PATH for package managers like pnpm
      const augmentedPath = this.augmentPathForPackageManagers(process.env.PATH || '');

      // Start process with new run configuration
      const childProcess = execa(command, args, {
        cwd: workingDirectory,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...serviceEnvironment,
          PATH: augmentedPath,
          NODE_ENV: process.env.NODE_ENV || 'development'
        },
        cleanup: true,
        killSignal: 'SIGTERM'
      });

      this.processes.set(serviceId, childProcess);

      // Update process info
      runtimeState.process = {
        pid: childProcess.pid,
        startTime: new Date(),
        uptime: 0
      };

      // Handle process events
      this.setupProcessEvents(serviceId, childProcess, runtimeState);

      // Start health monitoring after warmup delay
      setTimeout(() => {
        this.startHealthMonitoring(serviceId, serviceConfig, runtimeState);
      }, serviceConfig.warmupTime * 1000);

      console.log(`Started service ${serviceId} with PID ${childProcess.pid}`);

    } catch (error) {
      runtimeState.state = ServiceState.ERROR;
      runtimeState.lastStateChange = new Date();
      this.emit('stateChange', serviceId, runtimeState);
      throw new Error(`Failed to start service ${serviceId}: ${error}`);
    }
  }

  /**
   * Stop a service process
   */
  async stopService(serviceId: string, runtimeState: ServiceRuntimeState): Promise<void> {
    // Check if service is externally managed
    if (isExternallyManaged(serviceId)) {
      throw new Error(`Service ${serviceId} is externally managed and cannot be stopped by orchestrator`);
    }

    const childProcess = this.processes.get(serviceId);

    if (!childProcess) {
      runtimeState.state = ServiceState.STOPPED;
      runtimeState.lastStateChange = new Date();
      runtimeState.process.pid = undefined;
      this.emit('stateChange', serviceId, runtimeState);
      return;
    }

    try {
      runtimeState.state = ServiceState.STOPPING;
      runtimeState.lastStateChange = new Date();
      this.emit('stateChange', serviceId, runtimeState);

      // Stop health monitoring
      this.stopHealthMonitoring(serviceId);

      // Graceful shutdown with timeout
      childProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      const timeout = setTimeout(() => {
        if (!childProcess.killed) {
          console.warn(`Force killing service ${serviceId} after timeout`);
          childProcess.kill('SIGKILL');
        }
      }, this.config.process.killTimeout);

      await childProcess.catch(() => {
        // Ignore exit errors during shutdown
      });

      clearTimeout(timeout);
      this.processes.delete(serviceId);

      // Update state
      runtimeState.state = ServiceState.STOPPED;
      runtimeState.process.pid = undefined;
      runtimeState.process.uptime = 0;
      runtimeState.lastStateChange = new Date();

      this.emit('stateChange', serviceId, runtimeState);
      console.log(`Stopped service ${serviceId}`);

    } catch (error) {
      console.error(`Error stopping service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Restart a service
   */
  async restartService(serviceConfig: ServiceConfig, runtimeState: ServiceRuntimeState): Promise<void> {
    // Check if service is externally managed
    if (isExternallyManaged(serviceConfig.id)) {
      throw new Error(`Service ${serviceConfig.id} is externally managed and cannot be restarted by orchestrator`);
    }

    if (this.processes.has(serviceConfig.id)) {
      await this.stopService(serviceConfig.id, runtimeState);
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await this.startService(serviceConfig, runtimeState);
  }

  /**
   * Get process information
   */
  getProcessInfo(serviceId: string): ProcessInfo | null {
    const childProcess = this.processes.get(serviceId);
    if (!childProcess || !childProcess.pid) return null;

    const startTime = this.getProcessStartTime(childProcess.pid);
    const uptime = startTime ? (Date.now() - startTime.getTime()) / 1000 : 0;

    return {
      pid: childProcess.pid,
      startTime,
      uptime,
      memory: this.getProcessMemory(childProcess.pid)
    };
  }

  /**
   * Check if service is running
   */
  isServiceRunning(serviceId: string): boolean {
    const childProcess = this.processes.get(serviceId);
    return childProcess !== undefined && childProcess.pid !== undefined && !childProcess.killed;
  }

  /**
   * Get service logs
   */
  getServiceLogs(serviceId: string, lines: number = 50): { stdout: string[], stderr: string[] } {
    // For now, return empty logs - in production this would read from log files
    // This is a simplified implementation
    return {
      stdout: [],
      stderr: []
    };
  }

  /**
   * Reset circuit breaker for service
   */
  resetCircuitBreaker(runtimeState: ServiceRuntimeState): void {
    runtimeState.circuitBreaker = {
      state: 'closed',
      failures: 0,
      lastFailure: undefined,
      nextRetry: undefined,
      backoffSeconds: 1
    };

    if (runtimeState.state === ServiceState.CIRCUIT_OPEN) {
      runtimeState.state = ServiceState.STOPPED;
      runtimeState.lastStateChange = new Date();
    }
  }

  /**
   * Cleanup all processes
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up all processes...');

    // Stop all health monitoring
    for (const timer of this.healthTimers.values()) {
      clearInterval(timer);
    }
    this.healthTimers.clear();

    // Kill all processes
    const promises = Array.from(this.processes.entries()).map(async ([serviceId, childProcess]) => {
      try {
        childProcess.kill('SIGTERM');
        await childProcess.catch(() => {}); // Ignore errors
      } catch (error) {
        console.error(`Error killing process ${serviceId}:`, error);
      }
    });

    await Promise.all(promises);
    this.processes.clear();
  }

  /**
   * Find pnpm executable path
   */
  private findPnpmExecutable(): string | null {
    // Try locations in order of preference
    const possiblePaths = [
      // 1. PNPM_HOME (recommended)
      process.env.PNPM_HOME ? path.join(process.env.PNPM_HOME, 'pnpm') : null,
      // 2. System locations
      '/usr/local/bin/pnpm',
      '/usr/bin/pnpm',
      // 3. Our symlink as fallback
      '/root/bin/pnpm'
    ].filter(Boolean);

    for (const pnpmPath of possiblePaths) {
      try {
        require('fs').accessSync(pnpmPath, require('fs').constants.X_OK);
        console.log(`[PNPM] Found executable: ${pnpmPath}`);
        return pnpmPath;
      } catch (error) {
        // File doesn't exist or not executable, try next
        continue;
      }
    }

    // Last resort: try to detect via which
    try {
      const result = execa.sync('which', ['pnpm'], { encoding: 'utf8' });
      if (result.stdout) {
        const detectedPath = result.stdout.trim();
        console.log(`[PNPM] Detected via which: ${detectedPath}`);
        return detectedPath;
      }
    } catch (error) {
      // which command failed
    }

    console.log(`[PNPM] No executable found, falling back to 'pnpm' command`);
    return null;
  }

  /**
   * Augment PATH environment variable for package managers
   * Adds common locations for pnpm, npm, yarn etc.
   */
  private augmentPathForPackageManagers(currentPath: string): string {
    // Detect pnpm directory
    let pnpmPath = process.env.PNPM_HOME;

    console.log(`[PATH DEBUG] PNPM_HOME from env: ${pnpmPath}`);

    if (!pnpmPath) {
      // Fallback: try to detect pnpm location
      try {
        const result = execa.sync('which', ['pnpm'], { encoding: 'utf8' });
        if (result.stdout) {
          pnpmPath = path.dirname(result.stdout.trim());
          console.log(`[PATH DEBUG] pnpm detected via which: ${pnpmPath}`);
        }
      } catch (error) {
        // Last fallback: common pnpm location
        pnpmPath = '/root/.local/share/pnpm';
        console.log(`[PATH DEBUG] using fallback path: ${pnpmPath}`);
      }
    }

    const additionalPaths = [
      pnpmPath,                             // pnpm directory (dynamic detection)
      '/usr/local/bin',                     // common binary location
      '/usr/bin',                           // system binaries
      '/bin',                               // core system binaries
      path.join(process.env.HOME || '/root', '.local/bin'), // user local binaries
      '/opt/node/bin'                       // Node.js install location
    ].filter(Boolean); // Remove any undefined paths

    const pathSegments = currentPath.split(':').filter(Boolean);

    // Add missing paths (prioritize pnpm path)
    for (const additionalPath of additionalPaths) {
      if (!pathSegments.includes(additionalPath)) {
        pathSegments.unshift(additionalPath);
      }
    }

    const finalPath = pathSegments.join(':');
    console.log(`[PATH DEBUG] Original PATH: ${currentPath}`);
    console.log(`[PATH DEBUG] Augmented PATH: ${finalPath}`);

    return finalPath;
  }

  /**
   * Setup process event handlers
   */
  private setupProcessEvents(serviceId: string, childProcess: ExecaChildProcess, runtimeState: ServiceRuntimeState): void {
    childProcess.on('exit', (exitCode, signal) => {
      console.log(`Service ${serviceId} exited with code ${exitCode}, signal ${signal}`);

      this.processes.delete(serviceId);
      this.stopHealthMonitoring(serviceId);

      if (runtimeState.state !== ServiceState.STOPPING) {
        // Unexpected exit
        runtimeState.state = ServiceState.ERROR;
        runtimeState.process.exitCode = exitCode || undefined;
      } else {
        runtimeState.state = ServiceState.STOPPED;
      }

      runtimeState.process.pid = undefined;
      runtimeState.process.uptime = 0;
      runtimeState.lastStateChange = new Date();

      this.emit('stateChange', serviceId, runtimeState);
      this.emit('processExit', serviceId, exitCode, signal);
    });

    childProcess.on('error', (error) => {
      console.error(`Process error for ${serviceId}:`, error);
      runtimeState.state = ServiceState.ERROR;
      runtimeState.lastStateChange = new Date();
      this.emit('stateChange', serviceId, runtimeState);
      this.emit('processError', serviceId, error);
    });

    // Capture stdout/stderr for logging
    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter((line: string) => line.trim());
        runtimeState.logs.stdout.push(...lines);

        // Keep only recent logs in memory
        if (runtimeState.logs.stdout.length > this.config.process.logLines) {
          runtimeState.logs.stdout = runtimeState.logs.stdout.slice(-this.config.process.logLines);
        }
      });
    }

    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter((line: string) => line.trim());
        runtimeState.logs.stderr.push(...lines);

        if (runtimeState.logs.stderr.length > this.config.process.logLines) {
          runtimeState.logs.stderr = runtimeState.logs.stderr.slice(-this.config.process.logLines);
        }
      });
    }
  }

  /**
   * Start health monitoring for service
   */
  private startHealthMonitoring(serviceId: string, serviceConfig: ServiceConfig, runtimeState: ServiceRuntimeState): void {
    const timer = setInterval(async () => {
      await this.performHealthCheck(serviceId, serviceConfig, runtimeState);
    }, this.config.healthCheck.interval);

    this.healthTimers.set(serviceId, timer);
  }

  /**
   * Stop health monitoring for service
   */
  private stopHealthMonitoring(serviceId: string): void {
    const timer = this.healthTimers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.healthTimers.delete(serviceId);
    }
  }

  /**
   * Perform health check on service
   */
  private async performHealthCheck(serviceId: string, serviceConfig: ServiceConfig, runtimeState: ServiceRuntimeState): Promise<void> {
    if (!this.isServiceRunning(serviceId)) {
      runtimeState.health.isHealthy = false;
      runtimeState.health.consecutiveFailures++;
      runtimeState.health.consecutiveSuccesses = 0;
      runtimeState.health.lastCheck = new Date();
      return;
    }

    try {
      const startTime = Date.now();

      // Simple HTTP health check
      const response = await fetch(`http://localhost:${serviceConfig.port}${serviceConfig.healthEndpoint}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.healthCheck.timeout)
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      // Update health info
      runtimeState.health = {
        isHealthy,
        lastCheck: new Date(),
        consecutiveFailures: isHealthy ? 0 : runtimeState.health.consecutiveFailures + 1,
        consecutiveSuccesses: isHealthy ? runtimeState.health.consecutiveSuccesses + 1 : 0,
        responseTime,
        error: isHealthy ? undefined : `HTTP ${response.status}`
      };

      // Update warmup progress
      if (runtimeState.warmup.isInWarmup && isHealthy) {
        runtimeState.warmup.successfulChecks++;

        if (runtimeState.warmup.successfulChecks >= runtimeState.warmup.requiredChecks) {
          runtimeState.warmup.isInWarmup = false;
          runtimeState.state = ServiceState.RUNNING;
          runtimeState.lastStateChange = new Date();
          console.log(`Service ${serviceId} completed warmup`);
        }
      } else if (!runtimeState.warmup.isInWarmup) {
        // Update service state based on health
        if (isHealthy && runtimeState.state === ServiceState.UNHEALTHY) {
          runtimeState.state = ServiceState.RUNNING;
          runtimeState.lastStateChange = new Date();
        } else if (!isHealthy && runtimeState.state === ServiceState.RUNNING) {
          runtimeState.state = ServiceState.UNHEALTHY;
          runtimeState.lastStateChange = new Date();
        }
      }

      // Handle circuit breaker logic
      this.updateCircuitBreaker(runtimeState, isHealthy);

      this.emit('stateChange', serviceId, runtimeState);

    } catch (error) {
      // Health check failed
      runtimeState.health = {
        isHealthy: false,
        lastCheck: new Date(),
        consecutiveFailures: runtimeState.health.consecutiveFailures + 1,
        consecutiveSuccesses: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.updateCircuitBreaker(runtimeState, false);
      this.emit('stateChange', serviceId, runtimeState);
    }
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(runtimeState: ServiceRuntimeState, isHealthy: boolean): void {
    const { circuitBreaker } = runtimeState;
    const { threshold, timeout, backoffMultiplier, maxBackoff } = this.config.circuitBreaker;

    if (circuitBreaker.state === 'closed') {
      if (!isHealthy) {
        circuitBreaker.failures++;
        if (circuitBreaker.failures >= threshold) {
          circuitBreaker.state = 'open';
          circuitBreaker.lastFailure = new Date();
          circuitBreaker.nextRetry = new Date(Date.now() + circuitBreaker.backoffSeconds * 1000);
          runtimeState.state = ServiceState.CIRCUIT_OPEN;
          runtimeState.lastStateChange = new Date();
          console.log(`Circuit breaker opened for service ${runtimeState.serviceId}`);
        }
      } else {
        circuitBreaker.failures = 0;
      }
    } else if (circuitBreaker.state === 'open') {
      if (Date.now() >= (circuitBreaker.nextRetry?.getTime() || 0)) {
        circuitBreaker.state = 'half_open';
        console.log(`Circuit breaker half-open for service ${runtimeState.serviceId}`);
      }
    } else if (circuitBreaker.state === 'half_open') {
      if (isHealthy) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failures = 0;
        circuitBreaker.backoffSeconds = 1;
        runtimeState.state = ServiceState.RUNNING;
        runtimeState.lastStateChange = new Date();
        console.log(`Circuit breaker closed for service ${runtimeState.serviceId}`);
      } else {
        circuitBreaker.state = 'open';
        circuitBreaker.failures++;
        circuitBreaker.lastFailure = new Date();
        circuitBreaker.backoffSeconds = Math.min(
          circuitBreaker.backoffSeconds * backoffMultiplier,
          maxBackoff / 1000
        );
        circuitBreaker.nextRetry = new Date(Date.now() + circuitBreaker.backoffSeconds * 1000);
        runtimeState.state = ServiceState.CIRCUIT_OPEN;
        runtimeState.lastStateChange = new Date();
      }
    }
  }

  /**
   * Get process start time (simplified implementation)
   */
  private getProcessStartTime(pid: number): Date | undefined {
    // In production, this would read from /proc/pid/stat or use ps
    // For now, return current time as approximation
    return new Date();
  }

  /**
   * Get process memory usage (simplified implementation)
   */
  private getProcessMemory(pid: number): ProcessInfo['memory'] {
    // In production, this would read actual process memory
    // For now, return dummy data
    return {
      rss: 50 * 1024 * 1024, // 50MB
      heapTotal: 30 * 1024 * 1024,
      heapUsed: 20 * 1024 * 1024
    };
  }
}