import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';
import { DeploymentService } from '@/services/deployment.service';
import authRoutes from './auth.routes';
import projectRoutes from './projects.routes';
import webhookRoutes from './webhook.routes';
import monitoringRoutes from './monitoring.routes';
import portRegistryRoutes from './port-registry.routes';
import websocketTestRoutes from './websocket-test.routes';

const router = Router();

// 认证路由
router.use('/auth', authRoutes);

// 项目路由
router.use('/projects', projectRoutes);

// Webhook 路由
router.use('/webhook', webhookRoutes);

// 监控路由
router.use('/monitoring', monitoringRoutes);

// 端口注册路由
router.use('/port-registry', portRegistryRoutes);

// WebSocket测试路由
router.use('/websocket-test', websocketTestRoutes);

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

    // 获取查询参数
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'timestamp';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    const project = req.query.project as string;
    const status = req.query.status as string;

    const deployments = await deploymentService.getDeploymentsWithPagination({
      page,
      limit,
      sortBy,
      sortOrder,
      project,
      status
    });

    return res.json({
      success: true,
      message: 'Deployments data retrieved successfully',
      data: deployments.data,
      pagination: deployments.pagination
    });
  } catch (error) {
    logger.error('Failed to get deployments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get deployments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取部署历史数据
router.get('/deployments/history', async (req, res) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    // 获取查询参数
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const project = req.query.project as string;
    const status = req.query.status as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const history = await deploymentService.getDeploymentHistory({
      page,
      limit,
      project,
      status,
      startDate,
      endDate
    });

    return res.json({
      success: true,
      message: 'Deployment history retrieved successfully',
      data: history.data,
      pagination: history.pagination
    });
  } catch (error) {
    logger.error('Failed to get deployment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get deployment history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取部署详细步骤
router.get('/deployments/:deploymentId/steps', async (req, res) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    const { deploymentId } = req.params;
    const steps = await deploymentService.getDeploymentSteps(deploymentId);

    return res.json({
      success: true,
      message: 'Deployment steps retrieved successfully',
      data: steps
    });
  } catch (error) {
    logger.error('Failed to get deployment steps:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get deployment steps',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 更新部署步骤状态
router.put('/deployments/steps/:stepId', async (req, res) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    const { stepId } = req.params;
    const { status, progress, logs, errorMessage, resultData } = req.body;

    const step = await deploymentService.updateDeploymentStepStatus(
      stepId,
      status,
      progress,
      logs,
      errorMessage,
      resultData
    );

    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Deployment step not found'
      });
    }

    return res.json({
      success: true,
      message: 'Deployment step updated successfully',
      data: step
    });
  } catch (error) {
    logger.error('Failed to update deployment step:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update deployment step',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 重新部署
router.post('/deployments/:id/redeploy', async (req, res) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    const deploymentId = parseInt(req.params.id);
    if (isNaN(deploymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deployment ID'
      });
    }

    const success = await deploymentService.redeployDeployment(deploymentId);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Redeployment triggered successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }
  } catch (error) {
    logger.error('Failed to redeploy deployment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to redeploy deployment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取项目列表（兼容旧接口）
router.get('/projects', (req, res) => {
  res.json({
    success: true,
    message: 'Projects endpoint - Use /api/projects for full functionality',
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
    return res.json({
      success: true,
      message: 'Metrics data retrieved successfully',
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    return res.status(500).json({
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
    
    return res.json({
      success: true,
      message: 'Deployment webhook processed successfully'
    });
  } catch (error) {
    logger.error('Failed to process deployment webhook:', error);
    return res.status(500).json({
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
      'GET /api/deployments/history',
      'GET /api/deployments/:id/steps',
      'PUT /api/deployments/steps/:stepId',
      'POST /api/deployments/:id/redeploy',
      'GET /api/projects',
      'GET /api/projects/overview',
      'POST /api/projects',
      'GET /api/projects/:projectName',
      'PUT /api/projects/:projectName',
      'DELETE /api/projects/:projectName',
      'GET /api/projects/:projectName/stats',
      'GET /api/projects/:projectName/status',
      'POST /api/projects/:projectName/status/refresh',
      'POST /api/projects/:projectName/start',
      'POST /api/projects/:projectName/stop',
      'POST /api/projects/:projectName/restart',
      'GET /api/projects/:projectName/deployments',
      'POST /api/projects/:projectName/redeploy',
      'POST /api/projects/sync-stats',
      'GET /api/metrics',
      'POST /api/webhooks/github',
      'POST /api/webhooks/deployment'
    ]
  });
});

export const routes: Router = router;
