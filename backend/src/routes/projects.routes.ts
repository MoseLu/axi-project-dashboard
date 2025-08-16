import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { ProjectService } from '@/services/project.service';
import { DeploymentService } from '@/services/deployment.service';

const router = Router();

// 获取项目列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const deploy_type = req.query.deploy_type as string;

    const result = await projectService.getProjects({
      page,
      limit,
      status,
      deploy_type
    });

    return res.json({
      success: true,
      message: 'Projects retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取项目概览
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const overview = await projectService.getProjectsOverview();

    return res.json({
      success: true,
      message: 'Projects overview retrieved successfully',
      data: overview
    });
  } catch (error) {
    logger.error('Failed to get projects overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get projects overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 创建新项目
router.post('/', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const projectData = req.body;
    const project = await projectService.createProject(projectData);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    logger.error('Failed to create project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取项目详情
router.get('/:projectName', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const project = await projectService.getProject(projectName);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.json({
      success: true,
      message: 'Project retrieved successfully',
      data: project
    });
  } catch (error) {
    logger.error('Failed to get project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 更新项目
router.put('/:projectName', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const updateData = req.body;
    
    const project = await projectService.updateProject(projectName, updateData);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    logger.error('Failed to update project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 删除项目
router.delete('/:projectName', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const success = await projectService.deleteProject(projectName);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取项目统计信息
router.get('/:projectName/stats', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const stats = await projectService.getProjectStats(projectName);

    return res.json({
      success: true,
      message: 'Project stats retrieved successfully',
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get project stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get project stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取项目详细状态
router.get('/:projectName/status', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const status = await projectService.getProjectStatus(projectName);

    return res.json({
      success: true,
      message: 'Project status retrieved successfully',
      data: status
    });
  } catch (error) {
    logger.error('Failed to get project status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get project status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 更新项目状态
router.post('/:projectName/status/refresh', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    await projectService.updateProjectStatus(projectName);

    return res.json({
      success: true,
      message: 'Project status refreshed successfully'
    });
  } catch (error) {
    logger.error('Failed to refresh project status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh project status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 启动项目
router.post('/:projectName/start', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const success = await projectService.startProject(projectName);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to start project'
      });
    }

    return res.json({
      success: true,
      message: 'Project started successfully'
    });
  } catch (error) {
    logger.error('Failed to start project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 停止项目
router.post('/:projectName/stop', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const success = await projectService.stopProject(projectName);

    return res.json({
      success: true,
      message: success ? 'Project stopped successfully' : 'No running process found'
    });
  } catch (error) {
    logger.error('Failed to stop project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to stop project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 重启项目
router.post('/:projectName/restart', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    const { projectName } = req.params;
    const success = await projectService.restartProject(projectName);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to restart project'
      });
    }

    return res.json({
      success: true,
      message: 'Project restarted successfully'
    });
  } catch (error) {
    logger.error('Failed to restart project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to restart project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取项目部署历史
router.get('/:projectName/deployments', async (req: Request, res: Response) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    const { projectName } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const deployments = await deploymentService.getProjectDeployments(projectName, limit);

    return res.json({
      success: true,
      message: 'Project deployments retrieved successfully',
      data: deployments
    });
  } catch (error) {
    logger.error('Failed to get project deployments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get project deployments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 触发项目重新部署
router.post('/:projectName/redeploy', async (req: Request, res: Response) => {
  try {
    const deploymentService = (req as any).deploymentService;
    if (!deploymentService) {
      return res.status(503).json({
        success: false,
        message: 'Deployment service not available'
      });
    }

    const { projectName } = req.params;
    const { deploymentId } = req.body;

    if (!deploymentId) {
      return res.status(400).json({
        success: false,
        message: 'Deployment ID is required'
      });
    }

    const success = await deploymentService.redeployDeployment(deploymentId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    return res.json({
      success: true,
      message: 'Project redeployment triggered successfully'
    });
  } catch (error) {
    logger.error('Failed to trigger project redeployment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger project redeployment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 同步项目部署统计
router.post('/sync-stats', async (req: Request, res: Response) => {
  try {
    const projectService = (req as any).projectService;
    if (!projectService) {
      return res.status(503).json({
        success: false,
        message: 'Project service not available'
      });
    }

    await projectService.syncProjectDeploymentStats();

    return res.json({
      success: true,
      message: 'Project deployment stats synced successfully'
    });
  } catch (error) {
    logger.error('Failed to sync project deployment stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync project deployment stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
