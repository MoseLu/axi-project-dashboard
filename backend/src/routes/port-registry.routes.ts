import { Router } from 'express';
import { portRegistryService, PortAllocationRequest } from '@/services/port-registry.service';
import { logger } from '@/utils/logger';

const router: Router = Router();

/**
 * 分配端口给项目
 * POST /api/port-registry/allocate
 */
router.post('/allocate', async (req, res) => {
  try {
    const request: PortAllocationRequest = req.body;
    
    // 验证必需字段
    if (!request.projectId || !request.projectName) {
      return res.status(400).json({
        success: false,
        message: 'projectId and projectName are required'
      });
    }

    const registration = await portRegistryService.allocatePort(request);
    
    return res.json({
      success: true,
      data: registration,
      message: `Port ${registration.port} allocated successfully`
    });
  } catch (error) {
    logger.error('Port allocation failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Port allocation failed'
    });
  }
});

/**
 * 标记端口为使用中
 * PUT /api/port-registry/mark-in-use/:projectId
 */
router.put('/mark-in-use/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { deploymentId } = req.body;

    const registration = await portRegistryService.markPortInUse(projectId, deploymentId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or no port allocated'
      });
    }

    return res.json({
      success: true,
      data: registration,
      message: `Port ${registration.port} marked as in-use`
    });
  } catch (error) {
    logger.error('Mark port in-use failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to mark port as in-use'
    });
  }
});

/**
 * 释放端口
 * PUT /api/port-registry/release/:projectId
 */
router.put('/release/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const registration = await portRegistryService.releasePort(projectId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or no port allocated'
      });
    }

    return res.json({
      success: true,
      data: registration,
      message: `Port ${registration.port} released successfully`
    });
  } catch (error) {
    logger.error('Port release failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to release port'
    });
  }
});

/**
 * 获取项目的端口信息
 * GET /api/port-registry/project/:projectId
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const registration = await portRegistryService.getProjectPort(projectId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or no port allocated'
      });
    }

    return res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    logger.error('Get project port failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get project port'
    });
  }
});

/**
 * 获取端口的项目信息
 * GET /api/port-registry/port/:port
 */
router.get('/port/:port', async (req, res) => {
  try {
    const port = parseInt(req.params.port);
    
    if (isNaN(port)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid port number'
      });
    }

    const registration = await portRegistryService.getPortProject(port);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Port not found or not allocated'
      });
    }

    return res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    logger.error('Get port project failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get port project'
    });
  }
});

/**
 * 获取所有端口注册信息
 * GET /api/port-registry/all
 */
router.get('/all', async (req, res) => {
  try {
    const registrations = await portRegistryService.getAllPortRegistrations();
    
    return res.json({
      success: true,
      data: registrations,
      total: registrations.length
    });
  } catch (error) {
    logger.error('Get all port registrations failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get port registrations'
    });
  }
});

/**
 * 获取已分配的端口列表
 * GET /api/port-registry/allocated-ports
 */
router.get('/allocated-ports', async (req, res) => {
  try {
    const ports = await portRegistryService.getAllocatedPorts();
    
    return res.json({
      success: true,
      data: ports,
      total: ports.length
    });
  } catch (error) {
    logger.error('Get allocated ports failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get allocated ports'
    });
  }
});

/**
 * 检查端口是否可用
 * GET /api/port-registry/check/:port
 */
router.get('/check/:port', async (req, res) => {
  try {
    const port = parseInt(req.params.port);
    
    if (isNaN(port)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid port number'
      });
    }

    const isAvailable = await portRegistryService.isPortAvailable(port);
    
    return res.json({
      success: true,
      data: {
        port,
        available: isAvailable
      }
    });
  } catch (error) {
    logger.error('Check port availability failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check port availability'
    });
  }
});

/**
 * 清理过期的端口注册
 * POST /api/port-registry/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    await portRegistryService.cleanupExpiredRegistrations();
    
    return res.json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    logger.error('Port registry cleanup failed:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cleanup port registry'
    });
  }
});

export default router;
