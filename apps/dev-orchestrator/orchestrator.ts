import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import kill from 'tree-kill';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

// Types
export interface ServiceConfig {
  name: string;
  path: string;
  command: string;
  args: string[];
  port: number;
  env?: { [key: string]: string };
}

export interface RunningService {
  config: ServiceConfig;
  process: ChildProcess;
  status: 'starting' | 'running' | 'stopped' | 'error';
  pid: number;
  log: string[];
}

const MAX_LOG_LINES = 100;
const PROJECT_ROOT = '/root/projects/beauty';

export class Orchestrator extends EventEmitter {
  private services: ServiceConfig[] = [];
  private runningServices: Map<string, RunningService> = new Map();

  constructor(private configPath: string) {
    super();
  }

  async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configData);
      this.services = config.services;
      console.log(`[Orchestrator] ✅ Successfully loaded ${this.services.length} services from config.`);
    } catch (error) {
      console.error(`[Orchestrator] ❌ Failed to load config from ${this.configPath}:`, error);
      throw new Error('Could not load or parse services.config.json');
    }
  }

  async startAll(): Promise<string[]> {
    const startedServices: string[] = [];
    for (const config of this.services) {
      if (!this.runningServices.has(config.name) || this.runningServices.get(config.name)?.status === 'stopped') {
        await this.startService(config.name);
        startedServices.push(config.name);
      }
    }
    return startedServices;
  }

  stopAll(): string[] {
    const stoppedServices: string[] = [];
    for (const name of this.runningServices.keys()) {
      this.stopService(name);
      stoppedServices.push(name);
    }
    return stoppedServices;
  }

  async startService(name: string): Promise<boolean> {
    const config = this.services.find(s => s.name === name);
    if (!config) {
      console.error(`[Orchestrator] ❌ Service config for '${name}' not found.`);
      return false;
    }

    if (this.runningServices.has(name) && this.runningServices.get(name)?.status !== 'stopped') {
      console.log(`[Orchestrator] ℹ️ Service '${name}' is already running.`);
      return true;
    }

    // 🔧 Очищаем порт перед запуском сервиса
    await this.killProcessesOnPort(config.port, name);

    const servicePath = path.join(PROJECT_ROOT, config.path);
    const childProcess = spawn(config.command, config.args, {
      cwd: servicePath,
      env: { ...process.env, ...config.env },
      detached: true, // Important for killing the whole process tree
    });

    const service: RunningService = {
      config,
      process: childProcess,
      status: 'starting',
      pid: childProcess.pid!,
      log: [],
    };
    this.runningServices.set(name, service);

    console.log(`[Orchestrator] 🚀 Starting service '${name}' (PID: ${childProcess.pid}) in '${servicePath}'`);

    const addToLog = (data: any) => {
        const message = data.toString();
        service.log.push(message);
        if (service.log.length > MAX_LOG_LINES) {
            service.log.shift();
        }
    }

    childProcess.stdout.on('data', addToLog);
    childProcess.stderr.on('data', addToLog);

    childProcess.on('exit', (code) => {
      console.log(`[Orchestrator] 🛑 Service '${name}' (PID: ${childProcess.pid}) exited with code ${code}.`);
      const oldStatus = service.status;
      service.status = 'stopped';

      // Emit event для Telegram алертов
      this.emit('statusChange', {
        service: name,
        previousStatus: oldStatus,
        currentStatus: 'stopped',
        port: service.config.port,
        timestamp: new Date(),
        critical: true
      });
    });

    childProcess.on('error', (err) => {
        console.error(`[Orchestrator] ❌ Failed to start service '${name}':`, err);
        const oldStatus = service.status;
        service.status = 'error';

        // Emit event для Telegram алертов
        this.emit('statusChange', {
          service: name,
          previousStatus: oldStatus,
          currentStatus: 'error',
          port: service.config.port,
          timestamp: new Date(),
          critical: true,
          error: err.message
        });
    });

    // Health check
    this.checkHealth(name);

    return true;
  }

  stopService(name: string): boolean {
    const service = this.runningServices.get(name);
    if (!service || service.status === 'stopped') {
      console.log(`[Orchestrator] ℹ️ Service '${name}' is not running.`);
      return true;
    }

    console.log(`[Orchestrator] 🛑 Stopping service '${name}' (PID: ${service.pid})...`);
    // Use tree-kill to ensure all child processes are killed
    kill(service.pid, 'SIGKILL', (err) => {
        if (err) {
            console.error(`[Orchestrator] ❌ Failed to kill process tree for '${name}' (PID: ${service.pid}):`, err);
        } else {
            console.log(`[Orchestrator] ✅ Successfully killed process tree for '${name}'.`);
        }
    });
    
    service.status = 'stopped';
    this.runningServices.delete(name);
    return true;
  }

  async checkHealth(name: string) {
    const service = this.runningServices.get(name);
    if (!service) return;

    try {
      const response = await fetch(`http://localhost:${service.config.port}/health`);
      if (response.ok) {
        if (service.status !== 'running') {
            const oldStatus = service.status;
            console.log(`[Orchestrator] ✅ Service '${name}' is now running.`);
            service.status = 'running';

            // Emit event для Telegram алертов
            this.emit('statusChange', {
              service: name,
              previousStatus: oldStatus,
              currentStatus: 'running',
              port: service.config.port,
              timestamp: new Date(),
              critical: false
            });
        }
      } else {
        throw new Error(`Status ${response.status}`);
      }
    } catch (error) {
      if (service.status === 'running') {
          console.warn(`[Orchestrator] ⚠️ Service '${name}' health check failed:`, error.message);
          const oldStatus = service.status;
          service.status = 'error';

          // Emit event для Telegram алертов
          this.emit('statusChange', {
            service: name,
            previousStatus: oldStatus,
            currentStatus: 'error',
            port: service.config.port,
            timestamp: new Date(),
            critical: true,
            error: error.message
          });
      }
      // Retry check after a delay if still starting
      if (service.status === 'starting') {
          setTimeout(() => this.checkHealth(name), 3000);
      }
    }
  }

  getStatus() {
    // Update health for all services before returning status
    this.runningServices.forEach(service => this.checkHealth(service.config.name));

    return Array.from(this.runningServices.values()).map(s => ({
      name: s.config.name,
      status: s.status,
      pid: s.pid,
      port: s.config.port,
      log: s.log.slice(-10), // Return last 10 log lines
    }));
  }

  /**
   * 🔧 Убивает все процессы на указанном порту перед запуском сервиса
   * Это решает проблемы с конфликтами портов раз и навсегда
   */
  private async killProcessesOnPort(port: number, serviceName: string): Promise<void> {
    try {
      console.log(`[Orchestrator] 🧹 Clearing port ${port} for service '${serviceName}'...`);

      // Находим все процессы на порту
      const { stdout } = await execAsync(`lsof -ti:${port} 2>/dev/null || echo ""`);
      const pids = stdout.trim().split('\n').filter(pid => pid && pid.trim());

      if (pids.length === 0) {
        console.log(`[Orchestrator] ✅ Port ${port} is already free for '${serviceName}'`);
        return;
      }

      console.log(`[Orchestrator] 🔪 Found ${pids.length} processes on port ${port}: ${pids.join(', ')}`);

      // Убиваем все процессы
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid.trim()}`);
          console.log(`[Orchestrator] ✅ Killed process ${pid} on port ${port}`);
        } catch (error) {
          // Процесс уже мог быть убит, это нормально
          console.log(`[Orchestrator] ℹ️ Process ${pid} already terminated`);
        }
      }

      // Небольшая пауза для освобождения порта
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`[Orchestrator] 🎯 Port ${port} cleared successfully for '${serviceName}'`);

    } catch (error) {
      console.error(`[Orchestrator] ⚠️ Error clearing port ${port}:`, error);
      // Не бросаем исключение - пусть попробует запуститься
    }
  }
}