/**
 * State Persistence Manager
 * Manages service state persistence to JSON files with recovery
 */

import fs from 'fs/promises';
import path from 'path';
import { PersistedServiceState, ServiceRuntimeState, ServiceState } from '../types/orchestrator.types';

export class StateManager {
  private stateFilePath: string;
  private backupFilePath: string;

  constructor(stateDir: string) {
    this.stateFilePath = path.join(stateDir, 'orchestrator-state.json');
    this.backupFilePath = path.join(stateDir, 'orchestrator-state.backup.json');
  }

  /**
   * Initialize state manager - ensure directories exist
   */
  async initialize(): Promise<void> {
    const stateDir = path.dirname(this.stateFilePath);

    try {
      await fs.mkdir(stateDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create state directory: ${error}`);
    }
  }

  /**
   * Load persisted state from JSON file
   */
  async loadState(): Promise<Map<string, PersistedServiceState>> {
    const stateMap = new Map<string, PersistedServiceState>();

    try {
      // Try main state file first
      const data = await this.loadFromFile(this.stateFilePath);
      if (data) {
        return this.parseStateData(data);
      }

      // Fallback to backup file
      const backupData = await this.loadFromFile(this.backupFilePath);
      if (backupData) {
        console.warn('Main state file corrupted, using backup');
        return this.parseStateData(backupData);
      }

      console.info('No existing state file found, starting fresh');
      return stateMap;

    } catch (error) {
      console.error('Failed to load state:', error);
      return stateMap;
    }
  }

  /**
   * Save current state to JSON file with atomic write
   */
  async saveState(services: Map<string, ServiceRuntimeState>): Promise<void> {
    const persistedStates = new Map<string, PersistedServiceState>();

    // Convert runtime state to persisted state
    for (const [serviceId, runtimeState] of services) {
      persistedStates.set(serviceId, this.runtimeToPersisted(runtimeState));
    }

    const stateData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: Object.fromEntries(persistedStates)
    };

    try {
      // Create backup of current state
      try {
        await fs.access(this.stateFilePath);
        await fs.copyFile(this.stateFilePath, this.backupFilePath);
      } catch {
        // Ignore if main file doesn't exist
      }

      // Atomic write: write to temp file, then move
      const tempFilePath = `${this.stateFilePath}.tmp`;
      await fs.writeFile(tempFilePath, JSON.stringify(stateData, null, 2), 'utf8');
      await fs.rename(tempFilePath, this.stateFilePath);

    } catch (error) {
      throw new Error(`Failed to save state: ${error}`);
    }
  }

  /**
   * Get state for specific service
   */
  async getServiceState(serviceId: string): Promise<PersistedServiceState | null> {
    const states = await this.loadState();
    return states.get(serviceId) || null;
  }

  /**
   * Update state for specific service
   */
  async updateServiceState(serviceId: string, runtimeState: ServiceRuntimeState): Promise<void> {
    const states = await this.loadState();
    states.set(serviceId, this.runtimeToPersisted(runtimeState));

    const stateData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: Object.fromEntries(states)
    };

    try {
      await fs.writeFile(this.stateFilePath, JSON.stringify(stateData, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to update service state: ${error}`);
    }
  }

  /**
   * Clear all persisted state
   */
  async clearState(): Promise<void> {
    try {
      await fs.unlink(this.stateFilePath);
      await fs.unlink(this.backupFilePath);
    } catch {
      // Ignore if files don't exist
    }
  }

  /**
   * Convert runtime state to persistable format
   */
  private runtimeToPersisted(runtime: ServiceRuntimeState): PersistedServiceState {
    // Get service config to extract managed and cwd fields
    const { findServiceById } = require('../../../../core/service-registry');
    const serviceConfig = findServiceById(runtime.serviceId);

    return {
      serviceId: runtime.serviceId,
      state: runtime.state,
      pid: runtime.process.pid,
      startTime: runtime.process.startTime?.toISOString(),
      managed: serviceConfig?.run?.managed || 'internal',
      cwd: serviceConfig?.run?.cwd || serviceConfig?.directory,
      circuitBreaker: {
        state: runtime.circuitBreaker.state,
        failures: runtime.circuitBreaker.failures,
        lastFailure: runtime.circuitBreaker.lastFailure?.toISOString(),
        nextRetry: runtime.circuitBreaker.nextRetry?.toISOString(),
        backoffSeconds: runtime.circuitBreaker.backoffSeconds
      },
      autoRestoreAttempts: runtime.autoRestoreAttempts,
      lastStateChange: runtime.lastStateChange.toISOString()
    };
  }

  /**
   * Convert persisted state back to runtime format
   */
  persistedToRuntime(persisted: PersistedServiceState, serviceId: string): Partial<ServiceRuntimeState> {
    return {
      serviceId,
      state: persisted.state,
      process: {
        pid: persisted.pid,
        startTime: persisted.startTime ? new Date(persisted.startTime) : undefined
      },
      circuitBreaker: {
        state: persisted.circuitBreaker.state as 'closed' | 'open' | 'half_open',
        failures: persisted.circuitBreaker.failures,
        lastFailure: persisted.circuitBreaker.lastFailure ? new Date(persisted.circuitBreaker.lastFailure) : undefined,
        nextRetry: persisted.circuitBreaker.nextRetry ? new Date(persisted.circuitBreaker.nextRetry) : undefined,
        backoffSeconds: persisted.circuitBreaker.backoffSeconds
      },
      autoRestoreAttempts: persisted.autoRestoreAttempts,
      lastStateChange: new Date(persisted.lastStateChange)
      // Note: managed and cwd are not part of runtime state, they come from service config
    };
  }

  /**
   * Load data from file with error handling
   */
  private async loadFromFile(filePath: string): Promise<any | null> {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error; // Other errors
    }
  }

  /**
   * Parse and validate state data
   */
  private parseStateData(data: any): Map<string, PersistedServiceState> {
    const stateMap = new Map<string, PersistedServiceState>();

    if (!data || !data.services) {
      return stateMap;
    }

    for (const [serviceId, serviceState] of Object.entries(data.services)) {
      if (this.isValidPersistedState(serviceState)) {
        stateMap.set(serviceId, serviceState as PersistedServiceState);
      } else {
        console.warn(`Invalid persisted state for service ${serviceId}, skipping`);
      }
    }

    return stateMap;
  }

  /**
   * Validate persisted state structure
   */
  private isValidPersistedState(state: any): boolean {
    if (!state || typeof state !== 'object') return false;
    if (!state.serviceId || !state.state) return false;
    if (!state.circuitBreaker || typeof state.circuitBreaker !== 'object') return false;
    if (typeof state.autoRestoreAttempts !== 'number') return false;
    if (!state.lastStateChange) return false;

    // Validate state enum
    if (!Object.values(ServiceState).includes(state.state)) return false;

    return true;
  }
}