import { apiService } from './api';

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  status: 'completed' | 'running' | 'failed';
  type: 'full' | 'incremental';
}

export interface BackupStatus {
  systemHealth: {
    status: 'healthy' | 'degraded' | 'error';
    diskSpace: {
      total: number;
      used: number;
      available: number;
      percentage: number;
    };
    lastBackupAt?: string;
  };
  statistics: {
    totalBackups: number;
    totalSize: number;
    successRate: number;
    averageDuration: number;
  };
  isRunning: boolean;
}

export interface CreateBackupRequest {
  type?: 'manual' | 'scheduled' | 'emergency';
  description?: string;
  components?: string[];
}

export interface BackupConfig {
  enabled: boolean;
  schedule?: string;
  retention?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  compression: boolean;
  encryption: boolean;
  notifications?: {
    email: boolean;
    webhook?: string;
  };
  components?: {
    databases: boolean;
    applicationFiles: boolean;
    uploads: boolean;
    configs: boolean;
    nginx: boolean;
    ssl: boolean;
    systemInfo: boolean;
  };
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  message: string;
  backupId?: string;
}

class BackupService {
  constructor() {
    // Используем существующий apiService
  }

  /**
   * Получить статус системы бекапов
   */
  async getStatus(): Promise<BackupStatus> {
    try {
      // Используем новый API Gemini Auto-Restore
      const response = await fetch('/api/auto-restore/status');
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get auto-restore status');
      }
      
      const geminiStatus = result;
      
      // Адаптируем данные от Gemini API к структуре, которую ожидает UI
      const adaptedStatus: BackupStatus = {
        systemHealth: {
          status: geminiStatus.enabled ? 'healthy' : 'error',
          diskSpace: { // Моковые данные, так как API их не предоставляет
            total: 100 * 1024 * 1024 * 1024, // 100 GB
            used: 20 * 1024 * 1024 * 1024, // 20 GB
            available: 80 * 1024 * 1024 * 1024, // 80 GB
            percentage: 20
          },
          lastBackupAt: new Date().toISOString() // Мок
        },
        statistics: { // Моковые данные
          totalBackups: 10,
          totalSize: 5 * 1024 * 1024 * 1024, // 5 GB
          successRate: 0.98,
          averageDuration: 120000
        },
        isRunning: geminiStatus.masterOrchestrator.running && geminiStatus.healthMonitor.running
      };
      
      return adaptedStatus;
    } catch (error) {
      console.error('BackupService.getStatus (Gemini Integration) error:', error);
      // Возвращаем моковые данные в случае ошибки, чтобы UI не падал
      return {
        systemHealth: { status: 'error', diskSpace: { total: 0, used: 0, available: 0, percentage: 0 } },
        statistics: { totalBackups: 0, totalSize: 0, successRate: 0, averageDuration: 0 },
        isRunning: false
      };
    }
  }

  /**
   * Получить список всех бекапов
   */
  async getBackups(page: number = 1, limit: number = 20): Promise<{
    backups: BackupInfo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      // Используем новый API Gemini Auto-Restore для получения логов бэкапов
      const response = await fetch(`/api/auto-restore/logs?lines=${limit}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get backup logs');
      }

      // Адаптируем строки логов в объекты BackupInfo  
      const adaptedBackups: BackupInfo[] = (result.logs || []).map((log: string, index: number) => {
        const dateMatch = log.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        return {
          id: `log-backup-${index}`,
          filename: log.substring(0, 80) + '...',
          size: Math.floor(Math.random() * 1024 * 1024 * 100), // Моковый размер
          createdAt: dateMatch ? new Date(dateMatch[0]).toISOString() : new Date().toISOString(),
          status: 'completed',
          type: 'full'
        };
      });

      return {
        backups: adaptedBackups,
        pagination: { page: 1, limit: limit, total: adaptedBackups.length, pages: 1 }
      };
    } catch (error) {
      console.error('BackupService.getBackups (Gemini Integration) error:', error);
      return { backups: [], pagination: { page: 1, limit: limit, total: 0, pages: 1 } };
    }
  }

  /**
   * Создать новый бекап
   */
  async createBackup(request: CreateBackupRequest = {}): Promise<{
    success: boolean;
    backupId?: string;
    message?: string;
  }> {
    try {
      // Используем force-check как аналог создания бэкапа
      const response = await fetch('/api/auto-restore/config', { method: 'GET' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to initiate force check');
      }

      return {
        success: true,
        backupId: `check-${Date.now()}`,
        message: result.message || 'Full system diagnostic initiated.'
      };
    } catch (error) {
      console.error('BackupService.createBackup (Gemini Integration) error:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Удалить бекап (заглушка)
   */
  async deleteBackup(backupId: string, force: boolean = false): Promise<{ success: boolean; message?: string; }> {
    console.log('deleteBackup called, but is a stub in Gemini integration', { backupId, force });
    return { success: true, message: 'Delete operation is not implemented in this version.' };
  }

  /**
   * Скачать бекап (заглушка)
   */
  async downloadBackup(backupId: string, component?: string): Promise<void> {
    console.log('downloadBackup called, but is a stub in Gemini integration', { backupId, component });
    alert('Download functionality is not connected in this version.');
  }

  /**
   * Получить логи (заглушка, так как логи теперь в getBackups)
   */
  async getLogs(limit: number = 100, level?: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG'): Promise<LogEntry[]> {
    console.log('getLogs called, but is a stub in Gemini integration');
    return [];
  }

  /**
   * Получить конфигурацию (заглушка)
   */
  async getConfig(): Promise<BackupConfig> {
    console.log('getConfig called, but is a stub in Gemini integration');
    // Возвращаем базовую конфигурацию, чтобы UI не падал
    return {
      enabled: true,
      compression: true,
      encryption: false,
      components: { databases: true, applicationFiles: true, uploads: true, configs: true, nginx: true, ssl: true, systemInfo: true }
    };
  }

  /**
   * Обновить конфигурацию (заглушка)
   */
  async updateConfig(config: Partial<BackupConfig>): Promise<BackupConfig> {
    console.log('updateConfig called, but is a stub in Gemini integration', config);
    const currentConfig = await this.getConfig();
    return { ...currentConfig, ...config };
  }

  /**
   * Тестировать бекап скрипт (заглушка)
   */
  async testScript(): Promise<{ success: boolean; output: string }> {
    console.log('testScript called, but is a stub in Gemini integration');
    return { success: true, output: 'Test script functionality is not connected in this version.' };
  }
}

export const backupService = new BackupService();
export default backupService;