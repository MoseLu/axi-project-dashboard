import { redisService } from '@/services/redis.service';
import { logger } from '@/utils/logger';

export interface DeploymentEvent {
  id: string;
  type: 'deployment.started' | 'deployment.updated' | 'deployment.completed' | 'deployment.failed';
  project: string;
  repository: string;
  branch: string;
  commit_hash: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  triggered_by?: string;
  trigger_type: 'push' | 'manual' | 'schedule';
  timestamp: Date;
  metadata: {
    job_name?: string;
    step_name?: string;
    step_status?: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    step_duration?: number;
    step_logs?: string;
    error_message?: string;
    retry_count?: number;
    [key: string]: any;
  };
}

export interface ProjectStatusEvent {
  id: string;
  type: 'project.status.updated';
  project: string;
  status: {
    isRunning: boolean;
    port?: number;
    memoryUsage?: number;
    diskUsage?: number;
    cpuUsage?: number;
    uptime?: number;
    url?: string;
    lastHealthCheck: Date;
  };
  timestamp: Date;
}

export class EventPublisherService {
  private static instance: EventPublisherService;

  public static getInstance(): EventPublisherService {
    if (!EventPublisherService.instance) {
      EventPublisherService.instance = new EventPublisherService();
    }
    return EventPublisherService.instance;
  }

  async publishDeploymentEvent(event: DeploymentEvent): Promise<void> {
    try {
      const channel = 'deployment:events';
      const message = JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString()
      });

      await redisService.getClient().publish(channel, message);
      logger.info(`📤 发布部署事件: ${event.type} - ${event.project}`);
    } catch (error) {
      logger.error('❌ 发布部署事件失败:', error);
      throw error;
    }
  }

  async publishProjectStatusEvent(event: ProjectStatusEvent): Promise<void> {
    try {
      const channel = 'project:status:events';
      const message = JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString()
      });

      await redisService.getClient().publish(channel, message);
      logger.info(`📤 发布项目状态事件: ${event.project} - ${event.status.isRunning ? '运行中' : '已停止'}`);
    } catch (error) {
      logger.error('❌ 发布项目状态事件失败:', error);
      throw error;
    }
  }

  async publishSystemEvent(type: string, data: any): Promise<void> {
    try {
      const channel = 'system:events';
      const message = JSON.stringify({
        id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: new Date().toISOString()
      });

      await redisService.getClient().publish(channel, message);
      logger.info(`📤 发布系统事件: ${type}`);
    } catch (error) {
      logger.error('❌ 发布系统事件失败:', error);
      throw error;
    }
  }
}

export default EventPublisherService;
