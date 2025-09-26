import express from 'express';

const router: express.Router = express.Router();

// ⚠️ TEMPORARY: Legacy auto-restore system disabled during orchestrator migration
// This file contains temporary 503 responses while migrating to new orchestrator (#21, #23, #24)
// TODO: Remove this file completely once #25 (new orchestrator UI) is implemented

interface LegacyDisabledResponse {
    success: false;
    error: string;
    message: string;
    migration_status: string;
    timestamp: string;
    github_issues: string[];
}

const createLegacyDisabledResponse = (specificMessage?: string): LegacyDisabledResponse => ({
    success: false,
    error: "Legacy auto-restore system disabled",
    message: specificMessage || "This functionality has been moved to the new orchestrator system",
    migration_status: "stage_1_complete",
    timestamp: new Date().toISOString(),
    github_issues: ["#21", "#23", "#24", "#25", "#27"]
});

// Middleware для логирования попыток обращения к legacy API
const logLegacyApiCall = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.warn(`[LEGACY API] ${new Date().toISOString()} - Attempted call to disabled endpoint: ${req.method} ${req.path}`);
    next();
};

router.use(logLegacyApiCall);

// GET /api/auto-restore/status - Legacy service status endpoint
router.get('/status', async (req, res): Promise<void> => {
    res.status(503).json(createLegacyDisabledResponse(
        "Service status monitoring has been moved to the new orchestrator. Legacy bash auto-restore system is disabled during migration."
    ));
});

// POST /api/auto-restore/restore/:service - Legacy service restoration
router.post('/restore/:service', async (req, res): Promise<void> => {
    const { service } = req.params;
    res.status(503).json({
        success: false,
        error: "Service restoration temporarily disabled during orchestrator migration",
        service: service,
        alternative: "Use new orchestrator endpoints (available after #24 completion)",
        migration_status: "stage_1_complete",
        timestamp: new Date().toISOString(),
        github_issues: ["#21", "#23", "#24"]
    });
});

// GET /api/auto-restore/config - Legacy configuration endpoint
router.get('/config', async (req, res): Promise<void> => {
    res.status(503).json(createLegacyDisabledResponse(
        "Configuration management has been moved to the new orchestrator system"
    ));
});

// POST /api/auto-restore/config - Legacy configuration toggle
router.post('/config', async (req, res): Promise<void> => {
    res.status(503).json(createLegacyDisabledResponse(
        "Configuration toggle has been moved to the new orchestrator system"
    ));
});

// GET /api/auto-restore/logs - Legacy logs endpoint
router.get('/logs', async (req, res): Promise<void> => {
    res.status(503).json(createLegacyDisabledResponse(
        "Log access has been moved to the new orchestrator system"
    ));
});

// GET /api/auto-restore/circuit-breaker-status - Legacy circuit breaker status
router.get('/circuit-breaker-status', async (req, res): Promise<void> => {
    res.status(503).json(createLegacyDisabledResponse(
        "Circuit breaker monitoring has been moved to the new orchestrator system"
    ));
});

// POST /api/auto-restore/reset-circuit-breaker/:service - Legacy circuit breaker reset
router.post('/reset-circuit-breaker/:service', async (req, res): Promise<void> => {
    const { service } = req.params;
    res.status(503).json({
        success: false,
        error: "Circuit breaker reset temporarily disabled during orchestrator migration",
        service: service,
        alternative: "Use new orchestrator endpoints (available after #24 completion)",
        migration_status: "stage_1_complete",
        timestamp: new Date().toISOString(),
        github_issues: ["#21", "#23", "#24"]
    });
});

// GET /api/auto-restore/alerts - Legacy alerts endpoint
router.get('/alerts', async (req, res): Promise<void> => {
    res.status(503).json(createLegacyDisabledResponse(
        "Alert management has been moved to the new orchestrator system"
    ));
});

// DELETE /api/auto-restore/alerts - Legacy alerts cleanup
router.delete('/alerts', async (req, res): Promise<void> => {
    res.status(503).json(createLegacyDisabledResponse(
        "Alert cleanup has been moved to the new orchestrator system"
    ));
});

// Catch-all route for any other legacy auto-restore endpoints
router.use('*', (req, res): void => {
    res.status(503).json(createLegacyDisabledResponse(
        `Legacy endpoint ${req.originalUrl} is disabled during orchestrator migration`
    ));
});

export default router;