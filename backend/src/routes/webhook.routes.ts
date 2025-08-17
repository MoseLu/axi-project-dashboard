import { Router, Request, Response } from 'express';
import { WebhookReceiverService, WebhookPayload } from '@/services/monitoring/webhook-receiver.service';
import { logger } from '@/utils/logger';

const router: Router = Router();
const webhookService = WebhookReceiverService.getInstance();

/**
 * 接收来自 axi-deploy 的 Webhook 事件
 * POST /api/webhook/deployment
 */
router.post('/deployment', async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;
    
    // 验证必需字段
    if (!payload.project || !payload.repository || !payload.status) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段: project, repository, status'
      });
    }

    // 处理 Webhook 事件
    await webhookService.handleWebhookEvent(payload);

    return res.json({
      success: true,
      message: 'Webhook 事件处理成功'
    });
  } catch (error) {
    logger.error('❌ Webhook 处理失败:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook 处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 接收部署步骤更新
 * POST /api/webhook/step
 */
router.post('/step', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // 验证必需字段
    if (!payload.project || !payload.step_name || !payload.step_status) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段: project, step_name, step_status'
      });
    }

    // 扩展 WebhookPayload 接口以包含步骤信息
    const webhookPayload: WebhookPayload & {
      step_name: string;
      step_status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
      step_order?: number;
      logs?: string;
      error_message?: string;
      retry_count?: number;
    } = {
      ...payload,
      repository: payload.repository || '',
      branch: payload.branch || 'main',
      commit_hash: payload.commit_hash || '',
      trigger_type: payload.trigger_type || 'manual'
    };

    // 处理步骤更新
    await webhookService.handleWebhookEvent(webhookPayload);

    return res.json({
      success: true,
      message: '部署步骤更新处理成功'
    });
  } catch (error) {
    logger.error('❌ 部署步骤更新处理失败:', error);
    return res.status(500).json({
      success: false,
      message: '部署步骤更新处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 接收项目状态更新
 * POST /api/webhook/project-status
 */
router.post('/project-status', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // 验证必需字段
    if (!payload.project || !payload.status_type) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段: project, status_type'
      });
    }

    // 这里可以添加项目状态更新的处理逻辑
    logger.info(`📊 项目状态更新: ${payload.project} - ${payload.status_type}`);

    return res.json({
      success: true,
      message: '项目状态更新处理成功'
    });
  } catch (error) {
    logger.error('❌ 项目状态更新处理失败:', error);
    return res.status(500).json({
      success: false,
      message: '项目状态更新处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 健康检查
 * GET /api/webhook/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook 服务正常运行',
    timestamp: new Date().toISOString()
  });
});

export default router;
