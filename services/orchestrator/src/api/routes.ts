/**
 * REST API Routes
 * Express routes for orchestrator API endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Orchestrator } from '../managers/orchestrator';
import { ServiceActionSchema, ServiceAction } from '../types/orchestrator.types';
import { isExternallyManaged } from '../../../../core/service-registry';

const router: Router = Router();

/**
 * Validation middleware
 */
const validateServiceAction = (req: Request, res: Response, next: any) => {
  try {
    req.body = ServiceActionSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid request body',
      details: error instanceof z.ZodError ? error.issues : error
    });
  }
};

/**
 * Initialize routes with orchestrator instance
 */
export function createRoutes(orchestrator: Orchestrator): Router {
  /**
   * GET /orchestrator/status-all
   * Get status of all services
   */
  router.get('/status-all', async (req: Request, res: Response) => {
    try {
      const status = orchestrator.getStatusAll();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting status-all:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get orchestrator status',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /orchestrator/services/:id/status
   * Get status of specific service
   */
  router.get('/services/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const status = orchestrator.getServiceStatus(id);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: `Service ${id} not found`,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error getting service status for ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service status',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /orchestrator/services/:id/actions
   * Execute action on specific service
   */
  router.post('/services/:id/actions', validateServiceAction, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action } = req.body as { action: ServiceAction };

      // Check if service is externally managed
      if (isExternallyManaged(id)) {
        return res.status(501).json({
          success: false,
          error: `Service ${id} is externally managed and cannot be controlled by orchestrator`,
          serviceId: id,
          managed: 'external',
          timestamp: new Date().toISOString()
        });
      }

      await orchestrator.executeServiceAction(id, action);

      res.json({
        success: true,
        message: `Action ${action} executed successfully on service ${id}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error executing action ${req.body.action} on service ${req.params.id}:`, error);

      // Check for external service error
      if (error instanceof Error && error.message.includes('externally managed')) {
        return res.status(501).json({
          success: false,
          error: error.message,
          serviceId: req.params.id,
          managed: 'external',
          timestamp: new Date().toISOString()
        });
      }

      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute action',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /orchestrator/services/:id/logs
   * Get logs for specific service
   */
  router.get('/services/:id/logs', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const lines = parseInt(req.query.lines as string) || 50;

      if (lines < 1 || lines > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Lines parameter must be between 1 and 1000',
          timestamp: new Date().toISOString()
        });
      }

      const logs = orchestrator.getServiceLogs(id, lines);

      res.json({
        success: true,
        data: {
          serviceId: id,
          logs,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error getting logs for service ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service logs',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /orchestrator/registry
   * Get service registry data
   */
  router.get('/registry', async (req: Request, res: Response) => {
    try {
      const registry = orchestrator.getRegistry();
      res.json({
        success: true,
        data: {
          services: registry,
          count: registry.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting registry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service registry',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /orchestrator/health
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'orchestrator',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  /**
   * Batch operations endpoints
   */

  /**
   * POST /orchestrator/services/batch/start
   * Start multiple services
   */
  router.post('/services/batch/start', async (req: Request, res: Response) => {
    try {
      const { serviceIds } = req.body;

      if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'serviceIds must be a non-empty array',
          timestamp: new Date().toISOString()
        });
      }

      const results = [];
      for (const serviceId of serviceIds) {
        try {
          // Check if service is externally managed
          if (isExternallyManaged(serviceId)) {
            results.push({
              serviceId,
              success: false,
              error: `Service ${serviceId} is externally managed`,
              statusCode: 501,
              managed: 'external'
            });
            continue;
          }

          await orchestrator.executeServiceAction(serviceId, ServiceAction.START);
          results.push({ serviceId, success: true });
        } catch (error) {
          const isExternalError = error instanceof Error && error.message.includes('externally managed');
          results.push({
            serviceId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            statusCode: isExternalError ? 501 : 500,
            managed: isExternalError ? 'external' : undefined
          });
        }
      }

      res.json({
        success: true,
        data: { results },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in batch start:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute batch start',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /orchestrator/services/batch/stop
   * Stop multiple services
   */
  router.post('/services/batch/stop', async (req: Request, res: Response) => {
    try {
      const { serviceIds } = req.body;

      if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'serviceIds must be a non-empty array',
          timestamp: new Date().toISOString()
        });
      }

      const results = [];
      for (const serviceId of serviceIds) {
        try {
          // Check if service is externally managed
          if (isExternallyManaged(serviceId)) {
            results.push({
              serviceId,
              success: false,
              error: `Service ${serviceId} is externally managed`,
              statusCode: 501,
              managed: 'external'
            });
            continue;
          }

          await orchestrator.executeServiceAction(serviceId, ServiceAction.STOP);
          results.push({ serviceId, success: true });
        } catch (error) {
          const isExternalError = error instanceof Error && error.message.includes('externally managed');
          results.push({
            serviceId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            statusCode: isExternalError ? 501 : 500,
            managed: isExternalError ? 'external' : undefined
          });
        }
      }

      res.json({
        success: true,
        data: { results },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in batch stop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute batch stop',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Error handling middleware
   */
  router.use((error: any, req: Request, res: Response, next: any) => {
    console.error('Unhandled route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

export default router;
