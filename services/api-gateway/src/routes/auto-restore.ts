import express from 'express';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const router: express.Router = express.Router();
const SMART_MANAGER = '/root/projects/beauty/deployment/auto-restore/smart-restore-manager.sh';
const LOG_DIR = '/root/projects/beauty/deployment/auto-restore';
const ALERTS_DIR = '/root/projects/beauty/deployment/auto-restore/alerts';

interface ExecResult {
    stdout: string;
    stderr: string;
    code: number;
}

interface ServiceStatus {
    status: 'healthy' | 'down';
    message: string;
}

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

// Middleware для логирования API вызовов
const logApiCall = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`[AUTO-RESTORE API] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
};

router.use(logApiCall);

// Получить статус всех сервисов
router.get('/status', async (req, res): Promise<void> => {
    try {
        const result = await execSmartManager(['status']);
        
        // Парсим вывод в удобный формат
        const services: Record<string, ServiceStatus> = {};
        result.stdout.split('\n').forEach(line => {
            const match = line.match(/^([^:]+):\s*(✅|❌)\s*(.+)$/);
            if (match) {
                services[match[1]] = {
                    status: match[2] === '✅' ? 'healthy' : 'down',
                    message: match[3]
                };
            }
        });
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            services
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Восстановить конкретный сервис
router.post('/restore/:service', async (req, res): Promise<void> => {
    const { service } = req.params;
    
    // Валидация сервиса
    const validServices = ['admin-panel', 'salon-crm', 'client-portal', 'api-gateway', 'auth-service', 'mcp-server', 'images-api', 'crm-api', 'backup-service', 'postgresql'];
    if (!validServices.includes(service)) {
        res.status(400).json({
            success: false,
            error: `Invalid service: ${service}. Valid services: ${validServices.join(', ')}`
        });
        return;
    }
    
    try {
        console.log(`[AUTO-RESTORE] Starting restore for service: ${service}`);
        
        const result = await execSmartManager(['restore', service]);
        
        res.json({
            success: true,
            service,
            timestamp: new Date().toISOString(),
            message: 'Restore completed successfully',
            logs: result.stdout,
            errors: result.stderr
        });
        
        console.log(`[AUTO-RESTORE] Restore completed for service: ${service}`);
        
    } catch (error: any) {
        console.error(`[AUTO-RESTORE] Restore failed for service: ${service}`, error.message);
        
        res.status(500).json({
            success: false,
            service,
            error: error.message,
            logs: error.stdout || '',
            errors: error.stderr || ''
        });
    }
});

// Получить логи сервиса
router.get('/logs/:service?', async (req, res): Promise<void> => {
    const { service } = req.params;
    const { lines = '50', format = 'json' } = req.query;
    
    try {
        let logFile: string;
        if (service) {
            logFile = path.join(LOG_DIR, `${service}.log`);
        } else {
            logFile = path.join(LOG_DIR, 'readable.log');
        }
        
        // Проверяем существование файла
        try {
            await fs.access(logFile);
        } catch {
            res.status(404).json({
                success: false,
                error: `Log file not found for service: ${service || 'general'}`
            });
            return;
        }
        
        // Читаем последние N строк
        const result = await execCommand('tail', ['-n', lines.toString(), logFile]);
        
        if (format === 'json' && service) {
            // Парсим JSON логи
            const logs = result.stdout
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return { raw: line };
                    }
                });
                
            res.json({
                success: true,
                service: service || 'general',
                logs,
                count: logs.length
            });
        } else {
            // Обычные текстовые логи
            res.json({
                success: true,
                service: service || 'general',
                logs: result.stdout.split('\n').filter(line => line.trim()),
                raw: result.stdout
            });
        }
        
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получить конфигурацию Auto-Restore
router.get('/config', async (req, res): Promise<void> => {
    try {
        res.json({
            success: true,
            config: {
                smartManager: SMART_MANAGER,
                logDirectory: LOG_DIR,
                supportedServices: ['admin-panel', 'api-gateway', 'auth-service', 'mcp-server', 'images-api', 'crm-api', 'backup-service', 'postgresql'],
                features: {
                    gracefulShutdown: true,
                    dependencyCheck: true,
                    healthCheck: true,
                    jsonLogging: true,
                    pnpmSupport: true
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получить статус предохранителей
router.get('/circuit-breaker-status/:service?', async (req, res): Promise<void> => {
    const { service } = req.params;
    
    try {
        if (service) {
            // Статус конкретного сервиса
            const result = await execSmartManager(['circuit-breaker-status', service]);
            const status = parseCircuitBreakerOutput(result.stdout, service);
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                service,
                circuitBreaker: status
            });
        } else {
            // Статус всех сервисов
            const result = await execSmartManager(['circuit-breaker-status']);
            const statuses = parseAllCircuitBreakerOutput(result.stdout);
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                circuitBreakers: statuses
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Сброс предохранителя
router.post('/reset-circuit-breaker/:service', async (req, res): Promise<void> => {
    const { service } = req.params;
    
    // Валидация сервиса
    const validServices = ['admin-panel', 'salon-crm', 'client-portal', 'api-gateway', 'auth-service', 'mcp-server', 'images-api', 'crm-api', 'backup-service', 'postgresql'];
    if (!validServices.includes(service)) {
        res.status(400).json({
            success: false,
            error: `Invalid service: ${service}. Valid services: ${validServices.join(', ')}`
        });
        return;
    }
    
    try {
        console.log(`[AUTO-RESTORE] Resetting circuit breaker for service: ${service}`);
        
        const result = await execSmartManager(['reset-circuit-breaker', service]);
        
        res.json({
            success: true,
            service,
            timestamp: new Date().toISOString(),
            message: 'Circuit breaker reset successfully',
            logs: result.stdout
        });
        
        console.log(`[AUTO-RESTORE] Circuit breaker reset completed for service: ${service}`);
        
    } catch (error: any) {
        console.error(`[AUTO-RESTORE] Circuit breaker reset failed for service: ${service}`, error.message);
        
        res.status(500).json({
            success: false,
            service,
            error: error.message,
            logs: error.stdout || ''
        });
    }
});

// Получить критические алерты
router.get('/alerts', async (req, res): Promise<void> => {
    const { service, limit = '50', type } = req.query;
    
    try {
        const alerts: Alert[] = [];
        
        // Читаем файлы алертов из директории
        const alertFiles = await fs.readdir(ALERTS_DIR);
        
        // Фильтруем и сортируем файлы
        let filteredFiles = alertFiles.filter(file => file.endsWith('.alert'));
        
        if (service) {
            filteredFiles = filteredFiles.filter(file => file.startsWith(service as string));
        }
        
        if (type) {
            filteredFiles = filteredFiles.filter(file => file.includes(type as string));
        }
        
        // Сортируем по времени (новые сначала)
        filteredFiles.sort((a, b) => {
            const timestampA = a.split('_').pop()?.replace('.alert', '') || '0';
            const timestampB = b.split('_').pop()?.replace('.alert', '') || '0';
            return parseInt(timestampB) - parseInt(timestampA);
        });
        
        // Ограничиваем количество и читаем файлы
        const limitNum = Math.min(parseInt(limit as string), 100);
        for (const file of filteredFiles.slice(0, limitNum)) {
            try {
                const filePath = path.join(ALERTS_DIR, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const alertData = JSON.parse(content);
                
                alerts.push({
                    ...alertData,
                    filename: file
                });
            } catch (parseError) {
                console.warn(`Failed to parse alert file: ${file}`, parseError);
            }
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            alerts,
            total: alerts.length,
            filters: { service, type, limit }
        });
        
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Очистить старые алерты
router.delete('/alerts', async (req, res): Promise<void> => {
    const { olderThan = '7d', service } = req.query;
    
    try {
        const alertFiles = await fs.readdir(ALERTS_DIR);
        let deletedCount = 0;
        
        // Вычисляем временную границу
        const days = parseInt((olderThan as string).replace('d', ''));
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        for (const file of alertFiles) {
            if (!file.endsWith('.alert')) continue;
            
            // Фильтр по сервису
            if (service && !file.startsWith(service as string)) continue;
            
            // Проверяем возраст файла
            const timestamp = file.split('_').pop()?.replace('.alert', '');
            if (timestamp && parseInt(timestamp) * 1000 < cutoffTime) {
                await fs.unlink(path.join(ALERTS_DIR, file));
                deletedCount++;
            }
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            deleted: deletedCount,
            message: `Deleted ${deletedCount} alert files older than ${olderThan}`
        });
        
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Массовое восстановление
router.post('/restore-all', async (req, res): Promise<void> => {
    const { services } = req.body;
    
    if (!Array.isArray(services) || services.length === 0) {
        res.status(400).json({
            success: false,
            error: 'Services array is required'
        });
        return;
    }
    
    const results: Record<string, any> = {};
    
    for (const service of services) {
        try {
            console.log(`[AUTO-RESTORE] Bulk restore: ${service}`);
            const result = await execSmartManager(['restore', service]);
            results[service] = {
                success: true,
                logs: result.stdout,
                errors: result.stderr
            };
        } catch (error: any) {
            results[service] = {
                success: false,
                error: error.message,
                logs: error.stdout || '',
                errors: error.stderr || ''
            };
        }
    }
    
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        results
    });
});

// Парсинг вывода circuit breaker статуса для одного сервиса
function parseCircuitBreakerOutput(output: string, service: string): CircuitBreakerStatus {
    const lines = output.split('\n');
    
    // Ищем информацию о сервисе в выводе
    const serviceSection = lines.find(line => line.includes(`Service: ${service}`));
    
    if (!serviceSection) {
        return {
            service,
            isTripped: false,
            attempts: 0
        };
    }
    
    // Парсим статус из вывода
    const isTripped = output.includes('Circuit breaker TRIPPED') || output.includes('❌ TRIPPED');
    const attemptMatch = output.match(/(\d+) attempts in the last/);
    const attempts = attemptMatch ? parseInt(attemptMatch[1]) : 0;
    
    // Ищем время последней попытки
    const lastAttemptMatch = output.match(/Last attempt: ([^\n]+)/);
    const lastAttempt = lastAttemptMatch ? lastAttemptMatch[1] : undefined;
    
    return {
        service,
        isTripped,
        attempts,
        lastAttempt
    };
}

// Парсинг вывода circuit breaker статуса для всех сервисов
function parseAllCircuitBreakerOutput(output: string): Record<string, CircuitBreakerStatus> {
    const statuses: Record<string, CircuitBreakerStatus> = {};
    const lines = output.split('\n');
    
    let currentService = '';
    for (const line of lines) {
        // Ищем заголовки сервисов
        const serviceMatch = line.match(/^Service: (.+)$/);
        if (serviceMatch) {
            currentService = serviceMatch[1];
            continue;
        }
        
        // Парсим информацию для текущего сервиса
        if (currentService) {
            const isTripped = line.includes('❌ TRIPPED') || line.includes('Circuit breaker TRIPPED');
            const attemptMatch = line.match(/(\d+) attempts/);
            const attempts = attemptMatch ? parseInt(attemptMatch[1]) : 0;
            
            if (line.includes('attempts') || line.includes('TRIPPED') || line.includes('✅ OK')) {
                statuses[currentService] = {
                    service: currentService,
                    isTripped,
                    attempts
                };
            }
        }
    }
    
    return statuses;
}

// Вспомогательная функция для выполнения Smart Manager
function execSmartManager(args: string[]): Promise<ExecResult> {
    return execCommand(SMART_MANAGER, args);
}

// Вспомогательная функция для выполнения команд
function execCommand(command: string, args: string[] = []): Promise<ExecResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code: code || 0 });
            } else {
                const error: any = new Error(`Command failed with code ${code}`);
                error.stdout = stdout;
                error.stderr = stderr;
                error.code = code;
                reject(error);
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
        
        // Timeout через 2 минуты
        setTimeout(() => {
            child.kill();
            reject(new Error('Command timeout after 2 minutes'));
        }, 120000);
    });
}

export default router;