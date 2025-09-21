#!/usr/bin/env node

/**
 * 🔗 Beauty Platform Webhook Server
 * Принимает сигналы от GitHub Actions и запускает автоматический деплой
 */

const express = require('express');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3333;

// Конфигурация
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'beauty-platform-webhook-secret-2025';
const PROJECT_DIR = '/root/projects/beauty';
const LOG_DIR = path.join(PROJECT_DIR, 'logs');

// Создаем директорию для логов
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/json' }));

// Логирование
const log = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    console.log(logMessage.trim());

    // Записываем в файл
    const logFile = path.join(LOG_DIR, 'webhook.log');
    fs.appendFileSync(logFile, logMessage);
};

// Проверка подписи GitHub (если нужно)
const verifyGitHubSignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);

    if (!signature) {
        // Проверяем Bearer token из GitHub Actions
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token === WEBHOOK_SECRET) {
                return next();
            }
        }

        log('❌ Отсутствует подпись безопасности', 'error');
        return res.status(401).json({ error: 'Unauthorized: отсутствует подпись' });
    }

    const expectedSignature = `sha256=${crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex')}`;

    if (signature !== expectedSignature) {
        log('❌ Неверная подпись безопасности', 'error');
        return res.status(401).json({ error: 'Unauthorized: неверная подпись' });
    }

    next();
};

// Функция выполнения деплоя
const runDeployment = (commitInfo) => {
    return new Promise((resolve, reject) => {
        log('🚀 Запускаем автоматический deployment...');

        const deployScript = path.join(PROJECT_DIR, 'beauty-dev.sh');
        const deployProcess = spawn('bash', [deployScript, 'deploy'], {
            cwd: PROJECT_DIR,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, PATH: process.env.PATH }
        });

        let stdout = '';
        let stderr = '';

        deployProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            log(`📦 ${output.trim()}`, 'deploy');
        });

        deployProcess.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            log(`⚠️ ${output.trim()}`, 'deploy-error');
        });

        deployProcess.on('close', (code) => {
            if (code === 0) {
                log('✅ Deployment успешно завершен!', 'success');
                resolve({
                    success: true,
                    stdout,
                    stderr,
                    code
                });
            } else {
                log(`❌ Deployment завершился с ошибкой (код: ${code})`, 'error');
                reject({
                    success: false,
                    stdout,
                    stderr,
                    code
                });
            }
        });

        deployProcess.on('error', (error) => {
            log(`❌ Ошибка запуска deployment: ${error.message}`, 'error');
            reject({
                success: false,
                error: error.message
            });
        });
    });
};

// 🏥 Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'beauty-platform-webhook',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 📊 Status endpoint
app.get('/status', (req, res) => {
    try {
        const logFile = path.join(LOG_DIR, 'webhook.log');
        const logExists = fs.existsSync(logFile);
        const lastLogs = logExists
            ? fs.readFileSync(logFile, 'utf8').split('\n').slice(-10).filter(Boolean)
            : [];

        res.json({
            status: 'running',
            service: 'beauty-platform-webhook',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            logs: lastLogs
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// 🔗 Webhook endpoint для GitHub
app.post('/webhook/deploy', verifyGitHubSignature, async (req, res) => {
    try {
        const payload = req.body;
        const eventType = req.headers['x-github-event'] || 'unknown';

        log(`📥 Получен webhook: ${eventType} от ${payload.pusher?.name || 'unknown'}`);

        // Проверяем что это push в main ветку
        if (eventType !== 'push' || payload.ref !== 'refs/heads/main') {
            log(`ℹ️ Пропускаем event: ${eventType}, ref: ${payload.ref}`);
            return res.json({
                message: 'Event пропущен (не push в main)',
                event: eventType,
                ref: payload.ref
            });
        }

        const commitInfo = {
            sha: payload.head_commit?.id || 'unknown',
            message: payload.head_commit?.message || 'No message',
            author: payload.head_commit?.author?.name || 'unknown',
            pusher: payload.pusher?.name || 'unknown'
        };

        log(`📝 Commit: ${commitInfo.sha.substring(0, 7)} by ${commitInfo.author}: "${commitInfo.message}"`);

        // Отправляем быстрый ответ GitHub'у
        res.json({
            message: 'Deployment запущен',
            commit: commitInfo,
            timestamp: new Date().toISOString()
        });

        // Запускаем deployment асинхронно
        try {
            await runDeployment(commitInfo);
            log(`🎉 Автоматический deployment для ${commitInfo.sha.substring(0, 7)} завершен успешно!`, 'success');
        } catch (deployError) {
            log(`💥 Deployment для ${commitInfo.sha.substring(0, 7)} провалился!`, 'error');
            log(`📋 Детали ошибки: ${JSON.stringify(deployError)}`, 'error');
        }

    } catch (error) {
        log(`❌ Ошибка обработки webhook: ${error.message}`, 'error');
        res.status(500).json({
            error: 'Внутренняя ошибка webhook сервера',
            message: error.message
        });
    }
});

// 🚀 Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    log(`🔗 Webhook сервер запущен на порту ${PORT}`);
    log(`📡 Готов принимать сигналы от GitHub Actions`);
    log(`🔒 Webhook secret настроен`);
    log(`📁 Логи сохраняются в: ${LOG_DIR}/webhook.log`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    log('📥 Получен SIGINT, останавливаем webhook сервер...', 'info');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('📥 Получен SIGTERM, останавливаем webhook сервер...', 'info');
    process.exit(0);
});