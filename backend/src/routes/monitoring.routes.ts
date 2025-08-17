import { Router, Request, Response } from 'express';
import { Project } from '@/database/models/project';
import { Deployment } from '@/database/models/deployment';
import { StatusCollectorService } from '@/services/monitoring/status-collector.service';
import { logger } from '@/utils/logger';

const router = Router();
const statusCollector = StatusCollectorService.getInstance();

/**
 * 获取所有项目的实时状态
 * GET /api/monitoring/projects/status
 */
router.get('/projects/status', async (req: Request, res: Response) => {
  try {
    const projects = await Project.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });

    const realTimeStatuses = await statusCollector.collectAllProjectStatus();
    
    const projectsWithStatus = projects.map(project => {
      const realTimeStatus = realTimeStatuses.find(s => s.name === project.name);
      return {
        ...project.toJSON(),
        is_running: realTimeStatus?.isRunning || project.is_running,
        memory_usage: realTimeStatus?.memoryUsage || project.memory_usage,
        disk_usage: realTimeStatus?.diskUsage || project.disk_usage,
        cpu_usage: realTimeStatus?.cpuUsage || project.cpu_usage,
        uptime: realTimeStatus?.uptime || project.uptime,
        last_health_check: realTimeStatus?.lastHealthCheck || project.last_health_check
      };
    });

    res.json({
      success: true,
      message: '项目状态获取成功',
      data: projectsWithStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ 获取项目状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取部署统计信息
 * GET /api/monitoring/deployments/stats
 */
router.get('/deployments/stats', async (req: Request, res: Response) => {
  try {
    const deployments = await Deployment.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const totalStats = {
      total_deployments: deployments.length,
      successful_deployments: deployments.filter(d => d.status === 'success').length,
      failed_deployments: deployments.filter(d => d.status === 'failed').length,
      running_deployments: deployments.filter(d => d.status === 'running').length,
      average_duration: deployments.length > 0 
        ? Math.round(deployments.reduce((sum, d) => sum + (d.duration || 0), 0) / deployments.length)
        : 0
    };

    res.json({
      success: true,
      message: '部署统计获取成功',
      data: totalStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ 获取部署统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取部署统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 手动触发状态收集
 * POST /api/monitoring/collect-status
 */
router.post('/collect-status', async (req: Request, res: Response) => {
  try {
    const statuses = await statusCollector.collectAllProjectStatus();
    
    res.json({
      success: true,
      message: '状态收集成功',
      data: statuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ 手动触发状态收集失败:', error);
    res.status(500).json({
      success: false,
      message: '手动触发状态收集失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
