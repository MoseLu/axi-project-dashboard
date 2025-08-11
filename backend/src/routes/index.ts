import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';
import { DeploymentService } from '@/services/deployment.service';

const router = Router();

// Health check route
router.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  };
  res.json(response);
});

// API info route
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'axi-project-dashboard',
      description: 'Deployment progress visualization dashboard',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    }
  });
});

// Dashboard routes with real data
router.get('/deployments', async (req, res) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    const deployments = await deploymentService.getRecentDeployments(20);
    res.json({
      success: true,
      message: 'Deployments data retrieved successfully',
      data: deployments
    });
  } catch (error) {
    logger.error('Failed to get deployments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/projects', (req, res) => {
  res.json({
    success: true,
    message: 'Projects endpoint - Coming soon!',
    data: []
  });
});

router.get('/metrics', async (req, res) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    const metrics = await deploymentService.getDeploymentMetrics();
    res.json({
      success: true,
      message: 'Metrics data retrieved successfully',
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Webhooks
router.post('/webhooks/github', (req, res) => {
  logger.info('GitHub webhook received:', {
    headers: req.headers,
    body: req.body
  });
  
  res.json({
    success: true,
    message: 'Webhook received successfully'
  });
});

// Deployment notification webhook
router.post('/webhooks/deployment', async (req, res) => {
  try {
    logger.info('Deployment webhook received:', {
      headers: req.headers,
      body: req.body
    });

    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    await deploymentService.handleDeploymentWebhook(req.body);
    
    res.json({
      success: true,
      message: 'Deployment webhook processed successfully'
    });
  } catch (error) {
    logger.error('Failed to process deployment webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process deployment webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler for unknown API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/info',
      'GET /api/deployments',
      'GET /api/projects',
      'GET /api/metrics',
      'POST /api/webhooks/github'
    ]
  });
});

export const routes: Router = router;
