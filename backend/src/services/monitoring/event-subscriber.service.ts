import { redisService } from '@/services/redis.service';
import { logger } from '@/utils/logger';
import { DeploymentEvent, ProjectStatusEvent } from './event-publisher.service';
import { WebhookReceiverService } from './webhook-receiver.service';
import { StatusCollectorService } from './status-collector.service';

export class EventSubscriberService {
  private static instance: EventSubscriberService;
  private isSubscribed: boolean = false;
  private subscribers: Map<string, any> = new Map();
  private webhookService: WebhookReceiverService;
  private statusCollector: StatusCollectorService;

  private constructor() {
    this.webhookService = WebhookReceiverService.getInstance();
    this.statusCollector = StatusCollectorService.getInstance();
  }

  public static getInstance(): EventSubscriberService {
    if (!EventSubscriberService.instance) {
      EventSubscriberService.instance = new EventSubscriberService();
    }
    return EventSubscriberService.instance;
  }

  async start(): Promise<void> {
    if (this.isSubscribed) {
      logger.warn('⚠️ 事件订阅服务已在运行中');
      return;
    }

    try {
      logger.info('🚀 启动事件订阅服务...');
      
      // 订阅部署事件
      await this.subscribeToDeploymentEvents();
      
      // 订阅项目状态事件
      await this.subscribeToProjectStatusEvents();
      
      // 订阅系统事件
      await this.subscribeToSystemEvents();
      
      this.isSubscribed = true;
      logger.info('✅ 事件订阅服务启动完成');
    } catch (error) {
      logger.error('❌ 启动事件订阅服务失败:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('🛑 停止事件订阅服务...');
      
      // 取消所有订阅
      for (const [channel, subscriber] of this.subscribers) {
        await subscriber.unsubscribe(channel);
        logger.info(`📤 取消订阅: ${channel}`);
      }
      
      this.subscribers.clear();
      this.isSubscribed = false;
      logger.info('✅ 事件订阅服务已停止');
    } catch (error) {
      logger.error('❌ 停止事件订阅服务失败:', error);
      throw error;
    }
  }

  private async subscribeToDeploymentEvents(): Promise<void> {
    const channel = 'deployment:events';
    const subscriber = redisService.getClient().duplicate();
    
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      this.handleDeploymentEvent(message);
    });
    
    this.subscribers.set(channel, subscriber);
    logger.info(`📥 订阅部署事件: ${channel}`);
  }

  private async subscribeToProjectStatusEvents(): Promise<void> {
    const channel = 'project:status:events';
    const subscriber = redisService.getClient().duplicate();
    
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      this.handleProjectStatusEvent(message);
    });
    
    this.subscribers.set(channel, subscriber);
    logger.info(`📥 订阅项目状态事件: ${channel}`);
  }

  private async subscribeToSystemEvents(): Promise<void> {
    const channel = 'system:events';
    const subscriber = redisService.getClient().duplicate();
    
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      this.handleSystemEvent(message);
    });
    
    this.subscribers.set(channel, subscriber);
    logger.info(`📥 订阅系统事件: ${channel}`);
  }

  private async handleDeploymentEvent(message: string): Promise<void> {
    try {
      const event: DeploymentEvent = JSON.parse(message);
      logger.info(`📥 收到部署事件: ${event.type} - ${event.project}`);

      // 转换为 WebhookPayload 格式
      const webhookPayload = {
        project: event.project,
        repository: event.repository,
        branch: event.branch,
        commit_hash: event.commit_hash,
        status: event.status,
        triggered_by: event.triggered_by,
        trigger_type: event.trigger_type,
        step_details: event.metadata.step_name ? {
          [event.metadata.step_name]: event.metadata.step_status
        } : undefined
      };

      // 处理部署事件
      await this.webhookService.handleWebhookEvent(webhookPayload);
      
      logger.info(`✅ 部署事件处理完成: ${event.project}`);
    } catch (error) {
      logger.error('❌ 处理部署事件失败:', error);
    }
  }

  private async handleProjectStatusEvent(message: string): Promise<void> {
    try {
      const event: ProjectStatusEvent = JSON.parse(message);
      logger.info(`📥 收到项目状态事件: ${event.project} - ${event.status.isRunning ? '运行中' : '已停止'}`);

      // 更新项目状态到数据库
      // 这里可以添加数据库更新逻辑
      
      logger.info(`✅ 项目状态事件处理完成: ${event.project}`);
    } catch (error) {
      logger.error('❌ 处理项目状态事件失败:', error);
    }
  }

  private async handleSystemEvent(message: string): Promise<void> {
    try {
      const event = JSON.parse(message);
      logger.info(`📥 收到系统事件: ${event.type}`);

      // 处理系统事件
      switch (event.type) {
        case 'health.check':
          // 触发健康检查
          break;
        case 'metrics.collect':
          // 触发指标收集
          break;
        default:
          logger.info(`📋 未知系统事件类型: ${event.type}`);
      }
      
      logger.info(`✅ 系统事件处理完成: ${event.type}`);
    } catch (error) {
      logger.error('❌ 处理系统事件失败:', error);
    }
  }

  isRunning(): boolean {
    return this.isSubscribed;
  }

  getSubscribedChannels(): string[] {
    return Array.from(this.subscribers.keys());
  }
}

export default EventSubscriberService;
