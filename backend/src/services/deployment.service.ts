import { Deployment, DeploymentCreationAttributes } from '@/database/models/deployment';
import { SocketService } from './socket.service';
import { logger } from '@/utils/logger';
import { Op } from 'sequelize';

export interface DeploymentData {
  project_name: string;
  repository: string;
  branch: string;
  commit_hash: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  duration: number;
  triggered_by?: string;
  trigger_type: 'push' | 'manual' | 'schedule';
  logs?: string;
  metadata?: any;
}

export interface DeploymentMetrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
}

export interface DeploymentQueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  project?: string;
  status?: string;
}

export interface PaginatedDeployments {
  data: Deployment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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
      const deploymentData: any = {
        project_name: data.project_name,
        repository: data.repository,
        branch: data.branch,
        commit_hash: data.commit_hash,
        status: data.status,
        duration: data.duration,
        trigger_type: data.trigger_type,
      };

      // 只添加非 undefined 的可选字段
      if (data.start_time !== undefined) deploymentData.start_time = data.start_time;
      if (data.end_time !== undefined) deploymentData.end_time = data.end_time;
      if (data.triggered_by !== undefined) deploymentData.triggered_by = data.triggered_by;
      if (data.logs !== undefined) deploymentData.logs = data.logs;
      if (data.metadata !== undefined) deploymentData.metadata = data.metadata;

      const deployment = await Deployment.create(deploymentData);

      logger.info(`Created deployment record: ${deployment.id} for project: ${data.project_name}`);

      // 通过 WebSocket 广播部署事件
      this.socketService.emitDeploymentStarted({
        id: deployment.id.toString(),
        projectId: data.project_name,
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
          projectId: deployment.project_name,
          status: deployment.status,
          duration: deployment.duration,
          timestamp: deployment.end_time || deployment.start_time || deployment.created_at,
        });
      } else if (status === 'failed') {
        this.socketService.emitDeploymentFailed({
          id: deployment.id.toString(),
          projectId: deployment.project_name,
          status: deployment.status,
          duration: deployment.duration,
          timestamp: deployment.end_time || deployment.start_time || deployment.created_at,
          errorMessage: deployment.metadata?.errorMessage || '',
        });
      } else {
        this.socketService.emitDeploymentUpdated({
          id: deployment.id.toString(),
          projectId: deployment.project_name,
          status: deployment.status,
          duration: deployment.duration,
          timestamp: deployment.end_time || deployment.start_time || deployment.created_at,
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
        order: [['created_at', 'DESC']],
        limit,
      });

      return deployments;
    } catch (error) {
      logger.error('Failed to get recent deployments:', error);
      throw error;
    }
  }

  /**
   * 获取分页部署记录，支持排序和筛选
   */
  public async getDeploymentsWithPagination(params: DeploymentQueryParams): Promise<PaginatedDeployments> {
    try {
      const { page, limit, sortBy, sortOrder, project, status } = params;
      const offset = (page - 1) * limit;

      // 构建查询条件
      const whereClause: any = {};
      if (project) {
        whereClause.project_name = project;
      }
      if (status) {
        whereClause.status = status;
      }

      // 验证排序字段
      const allowedSortFields = ['created_at', 'project_name', 'status', 'duration', 'start_time', 'end_time'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

      // 获取总数
      const total = await Deployment.count({ where: whereClause });

      // 获取分页数据
      const deployments = await Deployment.findAll({
        where: whereClause,
        order: [[validSortBy, validSortOrder]],
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: deployments,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get deployments with pagination:', error);
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
        where: { project_name: project },
        order: [['created_at', 'DESC']],
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
          created_at: {
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
        type,
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
        deployment_id,
        step_name,
        step_status,
        workflow_name,
        workflow_id,
        log_stream_id,
        level,
        message,
        metrics,
      } = data;

      // 根据通知类型处理不同的数据
      switch (type) {
        case 'step_started':
        case 'step_completed':
        case 'step_manual':
          await this.handleStepNotification(data);
          break;
          
        case 'deployment_completed':
          await this.handleDeploymentCompletion(data);
          break;
          
        case 'log_entry':
          await this.handleLogEntry(data);
          break;
          
        case 'metrics_update':
          await this.handleMetricsUpdate(data);
          break;
          
        default:
          // 兼容旧的部署通知格式
          if (!project || !status) {
            logger.warn('Invalid deployment webhook data:', data);
            return;
          }

          // 创建或更新部署记录
          const deploymentData: DeploymentData = {
            project_name: project,
            repository: sourceRepo || project,
            branch: 'main',
            commit_hash: runId || 'unknown',
            status: status === 'success' ? 'success' : status === 'failed' ? 'failed' : 'running',
            duration: duration || 0,
            trigger_type: 'push',
            logs,
            metadata: {
              deployType,
              serverHost,
              errorMessage,
              originalTimestamp: timestamp
            }
          };

          await this.createDeployment(deploymentData);
          logger.info(`Processed deployment webhook for project: ${project}`);
      }
    } catch (error) {
      logger.error('Failed to handle deployment webhook:', error);
      throw error;
    }
  }

  /**
   * 处理步骤通知
   */
  private async handleStepNotification(data: any): Promise<void> {
    const {
      project,
      deployment_id,
      step_name,
      step_status,
      timestamp,
      workflow_name,
      workflow_id,
      logs,
      duration,
      started_at,
      completed_at,
    } = data;

    logger.info(`Processing step notification: ${step_name} (${step_status}) for project: ${project}`);

    // 通过 WebSocket 广播步骤事件
    this.socketService.emitStepUpdate({
      projectId: project,
      deploymentId: deployment_id,
      stepName: step_name,
      status: step_status,
      timestamp,
      workflowName: workflow_name,
      workflowId: workflow_id,
      logs,
      duration,
      startedAt: started_at,
      completedAt: completed_at,
    });
  }

  /**
   * 处理部署完成通知
   */
  private async handleDeploymentCompletion(data: any): Promise<void> {
    const {
      project,
      deployment_id,
      status,
      timestamp,
      workflow_name,
      workflow_id,
      logs,
      duration,
      started_at,
      completed_at,
    } = data;

    logger.info(`Processing deployment completion: ${deployment_id} (${status}) for project: ${project}`);

    // 通过 WebSocket 广播部署完成事件
    this.socketService.emitDeploymentCompleted({
      id: deployment_id,
      projectId: project,
      status,
      duration,
      timestamp,
      workflowName: workflow_name,
      workflowId: workflow_id,
      logs,
      startedAt: started_at,
      completedAt: completed_at,
    });
  }

  /**
   * 处理日志条目
   */
  private async handleLogEntry(data: any): Promise<void> {
    const {
      project,
      deployment_id,
      log_stream_id,
      timestamp,
      level,
      message,
      source,
    } = data;

    logger.debug(`Processing log entry: ${level} for deployment: ${deployment_id}`);

    // 通过 WebSocket 广播日志事件
    this.socketService.emitLogEntry({
      projectId: project,
      deploymentId: deployment_id,
      logStreamId: log_stream_id,
      level,
      message,
      timestamp,
      source,
    });
  }

  /**
   * 处理指标更新
   */
  private async handleMetricsUpdate(data: any): Promise<void> {
    const {
      project,
      deployment_id,
      timestamp,
      metrics,
    } = data;

    logger.info(`Processing metrics update for deployment: ${deployment_id}`);

    // 通过 WebSocket 广播指标更新事件
    this.socketService.emitMetricsUpdate({
      projectId: project,
      deploymentId: deployment_id,
      metrics,
      timestamp,
    });
  }
}