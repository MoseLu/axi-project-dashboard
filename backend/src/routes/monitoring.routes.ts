import { Router, Request, Response } from 'express';
import { StatusCollectorService } from '@/services/monitoring/status-collector.service';
import { DeploymentService } from '@/services/deployment.service';
import { logger } from '@/utils/logger';

const router: Router = Router();
const projectMonitorService = StatusCollectorService.getInstance();

const deploymentService = new DeploymentService();

/**
 * 获取项目状态
 * GET /api/monitoring/projects/status
 */
router.get('/projects/status', async (req: Request, res: Response) => {
  try {
    const projects = await projectMonitorService.getProjectsStatus();
    return res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    logger.error('❌ 获取项目状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取项目状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取最近部署记录
 * GET /api/monitoring/deployments/recent
 */
router.get('/deployments/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const deployments = await deploymentService.getRecentDeployments(limit);
    return res.json({
      success: true,
      data: deployments
    });
  } catch (error) {
    logger.error('❌ 获取最近部署记录失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取最近部署记录失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
