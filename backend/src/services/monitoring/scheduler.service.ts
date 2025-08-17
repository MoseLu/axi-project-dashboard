import { logger } from '@/utils/logger';
import { StatusCollectorService } from './status-collector.service';
import { Project } from '@/database/models/project';

export class SchedulerService {
  private static instance: SchedulerService;
  private statusCollector: StatusCollectorService;
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.statusCollector = StatusCollectorService.getInstance();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  start(): void {
    logger.info('🚀 启动定时任务服务...');
    this.startStatusCollection();
    logger.info('✅ 定时任务服务启动完成');
  }

  stop(): void {
    logger.info('🛑 停止定时任务服务...');
    
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
    
    logger.info('✅ 定时任务服务已停止');
  }

  private startStatusCollection(): void {
    logger.info('📊 启动状态收集任务（30秒间隔）');
    
    this.collectAndUpdateStatus();
    
    this.statusUpdateInterval = setInterval(() => {
      this.collectAndUpdateStatus();
    }, 30 * 1000);
  }

  private async collectAndUpdateStatus(): Promise<void> {
    try {
      logger.info('🔍 开始收集项目状态...');
      
      const projectStatuses = await this.statusCollector.collectAllProjectStatus();
      
      for (const status of projectStatuses) {
        await this.updateProjectStatus(status);
      }
      
      logger.info(`✅ 成功更新 ${projectStatuses.length} 个项目状态`);
    } catch (error) {
      logger.error('❌ 收集和更新项目状态失败:', error);
    }
  }

  private async updateProjectStatus(status: any): Promise<void> {
    try {
      const project = await Project.findOne({
        where: { name: status.name }
      });

      if (!project) {
        return;
      }

      const updateData: any = {
        is_running: status.isRunning,
        last_health_check: status.lastHealthCheck || new Date()
      };

      if (status.isRunning) {
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
      } else {
        updateData.memory_usage = null;
        updateData.disk_usage = null;
        updateData.cpu_usage = null;
        updateData.uptime = null;
      }

      await project.update(updateData);
    } catch (error) {
      logger.error(`❌ 更新项目 ${status.name} 状态失败:`, error);
    }
  }

  async triggerStatusCollection(): Promise<void> {
    logger.info('🔄 手动触发状态收集...');
    await this.collectAndUpdateStatus();
  }

  getStatus(): { statusCollection: boolean } {
    return {
      statusCollection: this.statusUpdateInterval !== null
    };
  }
}

export default SchedulerService;
