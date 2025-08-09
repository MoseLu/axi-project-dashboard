import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

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

// Dashboard routes placeholder
router.get('/deployments', (req, res) => {
  res.json({
    success: true,
    message: 'Deployments endpoint - Coming soon!',
    data: []
  });
});

router.get('/projects', (req, res) => {
  res.json({
    success: true,
    message: 'Projects endpoint - Coming soon!',
    data: []
  });
});

router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    message: 'Metrics endpoint - Coming soon!',
    data: {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      averageDeploymentTime: 0
    }
  });
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
