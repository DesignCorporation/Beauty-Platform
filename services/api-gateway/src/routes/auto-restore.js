const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const SMART_MANAGER = '/root/beauty-platform/deployment/auto-restore/smart-restore-manager.sh';
const LOG_DIR = '/root/beauty-platform/logs/auto-restore';

// Middleware для логирования API вызовов
const logApiCall = (req, res, next) => {
    console.log(`[AUTO-RESTORE API] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
};

router.use(logApiCall);

// Получить статус всех сервисов
router.get('/status', async (req, res) => {
    try {
        const result = await execSmartManager(['status']);
        
        // Парсим вывод в удобный формат
        const services = {};
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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Восстановить конкретный сервис
router.post('/restore/:service', async (req, res) => {
    const { service } = req.params;
    
    // Валидация сервиса
    const validServices = ['admin-panel', 'api-gateway', 'auth-service', 'mcp-server', 'images-api', 'crm-api'];
    if (!validServices.includes(service)) {
        return res.status(400).json({
            success: false,
            error: `Invalid service: ${service}. Valid services: ${validServices.join(', ')}`
        });
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
        
    } catch (error) {
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
router.get('/logs/:service?', async (req, res) => {
    const { service } = req.params;
    const { lines = 50, format = 'json' } = req.query;
    
    try {
        let logFile;
        if (service) {
            logFile = path.join(LOG_DIR, `${service}.log`);
        } else {
            logFile = path.join(LOG_DIR, 'readable.log');
        }
        
        // Проверяем существование файла
        try {
            await fs.access(logFile);
        } catch {
            return res.status(404).json({
                success: false,
                error: `Log file not found for service: ${service || 'general'}`
            });
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
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получить конфигурацию Auto-Restore
router.get('/config', async (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                smartManager: SMART_MANAGER,
                logDirectory: LOG_DIR,
                supportedServices: ['admin-panel', 'api-gateway', 'auth-service', 'mcp-server', 'images-api', 'crm-api'],
                features: {
                    gracefulShutdown: true,
                    dependencyCheck: true,
                    healthCheck: true,
                    jsonLogging: true,
                    pnpmSupport: true
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Массовое восстановление
router.post('/restore-all', async (req, res) => {
    const { services } = req.body;
    
    if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Services array is required'
        });
    }
    
    const results = {};
    
    for (const service of services) {
        try {
            console.log(`[AUTO-RESTORE] Bulk restore: ${service}`);
            const result = await execSmartManager(['restore', service]);
            results[service] = {
                success: true,
                logs: result.stdout,
                errors: result.stderr
            };
        } catch (error) {
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

// Вспомогательная функция для выполнения Smart Manager
function execSmartManager(args) {
    return execCommand(SMART_MANAGER, args);
}

// Вспомогательная функция для выполнения команд
function execCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                const error = new Error(`Command failed with code ${code}`);
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

module.exports = router;