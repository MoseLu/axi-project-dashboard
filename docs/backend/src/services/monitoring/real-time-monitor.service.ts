import { logger } from '@/utils/logger';
import { EventSubscriberService } from './event-subscriber.service';
import { EventPublisherService, ProjectStatusEvent } from './event-publisher.service';
import { StatusCollectorService } from './status-collector.service';
import { SchedulerService } from './scheduler.service';
import { Project } from '@/database/models/project';

export class RealTimeMonitorService {
  private static instance: RealTimeMonitorService;
  private eventSubscriber: EventSubscriberService;
  private eventPublisher: EventPublisherService;
  private statusCollector: StatusCollectorService;
  private scheduler: SchedulerService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  private constructor() {
    this.eventSubscriber = EventSubscriberService.getInstance();
    this.eventPublisher = EventPublisherService.getInstance();
    this.statusCollector = StatusCollectorService.getInstance();
    this.scheduler = SchedulerService.getInstance();
  }

  public static getInstance(): RealTimeMonitorService {
    if (!RealTimeMonitorService.instance) {
      RealTimeMonitorService.instance = new RealTimeMonitorService();
    }
    return RealTimeMonitorService.instance;
  }

  async start(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('⚠️ 实时监控服务已在运行中');
      return;
    }

    try {
      logger.info('🚀 启动实时监控服务...');

      // 启动事件订阅服务
      await this.eventSubscriber.start();

      // 启动定时任务服务
      this.scheduler.start();

      // 启动全天候项目状态监控
      await this.startContinuousMonitoring();

      this.isMonitoring = true;
      logger.info('✅ 实时监控服务启动完成');
    } catch (error) {
      logger.error('❌ 启动实时监控服务失败:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('🛑 停止实时监控服务...');

      // 停止事件订阅服务
      await this.eventSubscriber.stop();

      // 停止定时任务服务
      this.scheduler.stop();

      // 停止全天候监控
      this.stopContinuousMonitoring();

      this.isMonitoring = false;
      logger.info('✅ 实时监控服务已停止');
    } catch (error) {
      logger.error('❌ 停止实时监控服务失败:', error);
      throw error;
    }
  }

  private async startContinuousMonitoring(): Promise<void> {
    logger.info('🔍 启动全天候项目状态监控（60秒间隔）...');

    // 立即执行一次监控
    await this.monitorAllProjects();

    // 设置定时监控
    this.monitoringInterval = setInterval(async () => {
      await this.monitorAllProjects();
    }, 60 * 1000); // 60秒间隔
  }

  private stopContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('🛑 全天候项目状态监控已停止');
    }
  }

  private async monitorAllProjects(): Promise<void> {
    try {
      logger.info('🔍 开始全天候项目状态监控...');

      // 获取所有活跃项目
      const projects = await Project.findAll({
        where: { status: 'active' }
      });

      logger.info(`📊 监控 ${projects.length} 个活跃项目`);

      // 并行监控所有项目
      const monitoringPromises = projects.map(project => 
        this.monitorProject(project)
      );

      await Promise.allSettled(monitoringPromises);

      logger.info('✅ 全天候项目状态监控完成');
    } catch (error) {
      logger.error('❌ 全天候项目状态监控失败:', error);
    }
  }

  private async monitorProject(project: Project): Promise<void> {
    try {
      // 收集项目状态
      const status = await this.statusCollector.collectProjectStatus(project);

      // 发布项目状态事件
      const statusData: ProjectStatusEvent['status'] = {
        isRunning: status.isRunning,
        lastHealthCheck: status.lastHealthCheck || new Date()
      };

      if (status.port !== undefined) statusData.port = status.port;
      if (status.memoryUsage !== undefined) statusData.memoryUsage = status.memoryUsage;
      if (status.diskUsage !== undefined) statusData.diskUsage = status.diskUsage;
      if (status.cpuUsage !== undefined) statusData.cpuUsage = status.cpuUsage;
      if (status.uptime !== undefined) statusData.uptime = status.uptime;
      if (status.url !== undefined) statusData.url = status.url;

      const event: ProjectStatusEvent = {
        id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'project.status.updated',
        project: project.name,
        status: statusData,
        timestamp: new Date()
      };

      await this.eventPublisher.publishProjectStatusEvent(event);

      // 如果项目状态发生变化，记录日志
      if (project.is_running !== status.isRunning) {
        logger.info(`🔄 项目状态变化: ${project.name} - ${status.isRunning ? '启动' : '停止'}`);
      }

      // 更新数据库中的项目状态
      const updateData: any = {
        is_running: status.isRunning,
        last_health_check: status.lastHealthCheck || new Date()
      };

      if (status.memoryUsage !== undefined) {
        updateData.memory_usage = status.memoryUsage;
      }
      if (status.diskUsage !== undefined) {
        updateData.disk_usage = status.diskUsage;
      }
      if (status.cpuUsage !== undefined) {
        updateData.cpu_usage = status.cpuUsage;
      }
      if (status.uptime !== undefined) {
        updateData.uptime = status.uptime;
      }

      await project.update(updateData);

    } catch (error) {
      logger.error(`❌ 监控项目 ${project.name} 失败:`, error);
    }
  }

  async triggerManualMonitoring(): Promise<void> {
    logger.info('🔄 手动触发项目状态监控...');
    await this.monitorAllProjects();
  }

  async getMonitoringStatus(): Promise<{
    isMonitoring: boolean;
    eventSubscriberRunning: boolean;
    schedulerRunning: boolean;
    subscribedChannels: string[];
    lastCheck: Date;
  }> {
    return {
      isMonitoring: this.isMonitoring,
      eventSubscriberRunning: this.eventSubscriber.isRunning(),
      schedulerRunning: this.scheduler.getStatus().statusCollection,
      subscribedChannels: this.eventSubscriber.getSubscribedChannels(),
      lastCheck: new Date()
    };
  }
}

export default RealTimeMonitorService;
