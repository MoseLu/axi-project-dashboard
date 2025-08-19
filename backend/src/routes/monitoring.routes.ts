import { Router, Request, Response } from 'express';
import { RealTimeMonitorService } from '@/services/monitoring/real-time-monitor.service';
import { EventPublisherService } from '@/services/monitoring/event-publisher.service';
import { StatusCollectorService } from '@/services/monitoring/status-collector.service';
import { DeploymentService } from '@/services/deployment.service';
import { logger } from '@/utils/logger';

const router: Router = Router();
const realTimeMonitor = RealTimeMonitorService.getInstance();
const eventPublisher = EventPublisherService.getInstance();
const projectMonitorService = StatusCollectorService.getInstance();
const deploymentService = new DeploymentService();

/**
 * 获取实时监控状态
 * GET /api/monitoring/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await realTimeMonitor.getMonitoringStatus();
    
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('❌ 获取监控状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取监控状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 手动触发项目状态监控
 * POST /api/monitoring/trigger
 */
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    await realTimeMonitor.triggerManualMonitoring();
    
    return res.json({
      success: true,
      message: '手动监控触发成功'
    });
  } catch (error) {
    logger.error('❌ 手动触发监控失败:', error);
    return res.status(500).json({
      success: false,
      message: '手动触发监控失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 发布部署事件（用于测试）
 * POST /api/monitoring/publish-deployment
 */
router.post('/publish-deployment', async (req: Request, res: Response) => {
  try {
    const { project, repository, branch, commit_hash, status, job_name, step_name, step_status } = req.body;
    
    if (!project || !status) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段: project, status'
      });
    }

    const event = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'deployment.updated' as const,
      project,
      repository: repository || '',
      branch: branch || 'main',
      commit_hash: commit_hash || '',
      status,
      trigger_type: 'manual' as const,
      timestamp: new Date(),
      metadata: {
        job_name,
        step_name,
        step_status
      }
    };

    await eventPublisher.publishDeploymentEvent(event);
    
    return res.json({
      success: true,
      message: '部署事件发布成功',
      data: event
    });
  } catch (error) {
    logger.error('❌ 发布部署事件失败:', error);
    return res.status(500).json({
      success: false,
      message: '发布部署事件失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 发布项目状态事件（用于测试）
 * POST /api/monitoring/publish-project-status
 */
router.post('/publish-project-status', async (req: Request, res: Response) => {
  try {
    const { project, isRunning, port, memoryUsage, diskUsage, cpuUsage, uptime, url } = req.body;
    
    if (!project || typeof isRunning !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段: project, isRunning'
      });
    }

    const statusData: any = {
      isRunning,
      lastHealthCheck: new Date()
    };

    if (port !== undefined) statusData.port = port;
    if (memoryUsage !== undefined) statusData.memoryUsage = memoryUsage;
    if (diskUsage !== undefined) statusData.diskUsage = diskUsage;
    if (cpuUsage !== undefined) statusData.cpuUsage = cpuUsage;
    if (uptime !== undefined) statusData.uptime = uptime;
    if (url !== undefined) statusData.url = url;

    const event = {
      id: `test-status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'project.status.updated' as const,
      project,
      status: statusData,
      timestamp: new Date()
    };

    await eventPublisher.publishProjectStatusEvent(event);
    
    return res.json({
      success: true,
      message: '项目状态事件发布成功',
      data: event
    });
  } catch (error) {
    logger.error('❌ 发布项目状态事件失败:', error);
    return res.status(500).json({
      success: false,
      message: '发布项目状态事件失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 发布系统事件（用于测试）
 * POST /api/monitoring/publish-system
 */
router.post('/publish-system', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段: type'
      });
    }

    await eventPublisher.publishSystemEvent(type, data || {});
    
    return res.json({
      success: true,
      message: '系统事件发布成功',
      data: { type, data }
    });
  } catch (error) {
    logger.error('❌ 发布系统事件失败:', error);
    return res.status(500).json({
      success: false,
      message: '发布系统事件失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

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
