import { Router } from 'express';
import { metrics } from '../middleware/prometheus.middleware';
import { sequelize } from '../database/sequelize';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await sequelize.authenticate();
    
    // 获取系统指标概览
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        prometheus: 'ok',
        websocket: 'ok'
      },
      metrics: {
        activeConnections: metrics.activeConnections.get(),
        totalRequests: metrics.httpRequestsTotal.get(),
        deploymentStatus: metrics.deploymentStatus.get()
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'error',
        prometheus: 'ok',
        websocket: 'ok'
      }
    });
  }
});

router.get('/ready', async (req, res) => {
  try {
    // 检查数据库连接
    await sequelize.authenticate();
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export { router as healthRouter };
