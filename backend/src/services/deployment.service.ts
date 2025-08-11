import { Deployment, DeploymentCreationAttributes } from '@/database/models/deployment';
import { SocketService } from './socket.service';
import { logger } from '@/utils/logger';
import { Op } from 'sequelize';

export interface DeploymentData {
  project: string;
  status: 'success' | 'failed' | 'running';
  duration: number;
  timestamp: string;
  sourceRepo?: string;
  runId?: string;
  deployType?: 'backend' | 'static';
  serverHost?: string;
  logs?: string;
  errorMessage?: string;
}

export interface DeploymentMetrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
}

export class DeploymentService {
  private socketService: SocketService;

  constructor(socketService: SocketService) {
    this.socketService = socketService;
  }

  /**
   * 创建新的部署记录
   */
  public async createDeployment(data: DeploymentData): Promise<Deployment> {
    try {
      const deployment = await Deployment.create({
        project: data.project,
        status: data.status,
        duration: data.duration,
        timestamp: data.timestamp,
        sourceRepo: data.sourceRepo,
        runId: data.runId,
        deployType: data.deployType,
        serverHost: data.serverHost,
        logs: data.logs,
        errorMessage: data.errorMessage,
      });

      logger.info(`Created deployment record: ${deployment.id} for project: ${data.project}`);

      // 通过 WebSocket 广播部署事件
      this.socketService.emitDeploymentStarted({
        id: deployment.id.toString(),
        projectId: data.project,
        status: data.status,
        ...data,
      });

      return deployment;
    } catch (error) {
      logger.error('Failed to create deployment record:', error);
      throw error;
    }
  }

  /**
   * 更新部署状态
   */
  public async updateDeploymentStatus(
    id: number,
    status: 'success' | 'failed' | 'running',
    duration?: number,
    errorMessage?: string
  ): Promise<Deployment | null> {
    try {
      const deployment = await Deployment.findByPk(id);
      if (!deployment) {
        logger.warn(`Deployment not found: ${id}`);
        return null;
      }

      const updateData: any = { status };
      if (duration !== undefined) {
        updateData.duration = duration;
      }
      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      await deployment.update(updateData);

      logger.info(`Updated deployment ${id} status to: ${status}`);

      // 通过 WebSocket 广播部署更新事件
      if (status === 'success') {
        this.socketService.emitDeploymentCompleted({
          id: deployment.id.toString(),
          projectId: deployment.project,
          status: deployment.status,
          duration: deployment.duration,
          timestamp: deployment.timestamp,
        });
      } else if (status === 'failed') {
        this.socketService.emitDeploymentFailed({
          id: deployment.id.toString(),
          projectId: deployment.project,
          status: deployment.status,
          duration: deployment.duration,
          timestamp: deployment.timestamp,
          errorMessage: deployment.errorMessage,
        });
      } else {
        this.socketService.emitDeploymentUpdated({
          id: deployment.id.toString(),
          projectId: deployment.project,
          status: deployment.status,
          duration: deployment.duration,
          timestamp: deployment.timestamp,
        });
      }

      return deployment;
    } catch (error) {
      logger.error(`Failed to update deployment ${id}:`, error);
      throw error;
    }
  }

  /**
   * 获取最近的部署记录
   */
  public async getRecentDeployments(limit: number = 10): Promise<Deployment[]> {
    try {
      const deployments = await Deployment.findAll({
        order: [['timestamp', 'DESC']],
        limit,
      });

      return deployments;
    } catch (error) {
      logger.error('Failed to get recent deployments:', error);
      throw error;
    }
  }

  /**
   * 获取部署指标
   */
  public async getDeploymentMetrics(): Promise<DeploymentMetrics> {
    try {
      const [
        totalDeployments,
        successfulDeployments,
        failedDeployments,
        averageTimeResult,
      ] = await Promise.all([
        Deployment.count(),
        Deployment.count({ where: { status: 'success' } }),
        Deployment.count({ where: { status: 'failed' } }),
        Deployment.findOne({
          attributes: [[Deployment.sequelize!.fn('AVG', Deployment.sequelize!.col('duration')), 'averageTime']],
          where: { status: { [Op.in]: ['success', 'failed'] } },
        }),
      ]);

      const averageDeploymentTime = averageTimeResult
        ? Math.round(parseFloat(averageTimeResult.get('averageTime') as string) || 0)
        : 0;

      const metrics: DeploymentMetrics = {
        totalDeployments,
        successfulDeployments,
        failedDeployments,
        averageDeploymentTime,
      };

      return metrics;
    } catch (error) {
      logger.error('Failed to get deployment metrics:', error);
      throw error;
    }
  }

  /**
   * 获取项目部署历史
   */
  public async getProjectDeployments(project: string, limit: number = 20): Promise<Deployment[]> {
    try {
      const deployments = await Deployment.findAll({
        where: { project },
        order: [['timestamp', 'DESC']],
        limit,
      });

      return deployments;
    } catch (error) {
      logger.error(`Failed to get deployments for project ${project}:`, error);
      throw error;
    }
  }

  /**
   * 删除旧的部署记录（保留最近30天）
   */
  public async cleanupOldDeployments(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Deployment.destroy({
        where: {
          createdAt: {
            [Op.lt]: thirtyDaysAgo,
          },
        },
      });

      logger.info(`Cleaned up ${result} old deployment records`);
      return result;
    } catch (error) {
      logger.error('Failed to cleanup old deployments:', error);
      throw error;
    }
  }

  /**
   * 通过 Webhook 接收部署通知
   */
  public async handleDeploymentWebhook(data: any): Promise<void> {
    try {
      const {
        project,
        status,
        duration,
        timestamp,
        sourceRepo,
        runId,
        deployType,
        serverHost,
        logs,
        errorMessage,
      } = data;

      if (!project || !status || !timestamp) {
        logger.warn('Invalid deployment webhook data:', data);
        return;
      }

      // 创建或更新部署记录
      const deploymentData: DeploymentData = {
        project,
        status,
        duration: duration || 0,
        timestamp,
        sourceRepo,
        runId,
        deployType,
        serverHost,
        logs,
        errorMessage,
      };

      await this.createDeployment(deploymentData);

      logger.info(`Processed deployment webhook for project: ${project}`);
    } catch (error) {
      logger.error('Failed to handle deployment webhook:', error);
      throw error;
    }
  }
}
