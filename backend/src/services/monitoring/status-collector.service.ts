import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/utils/logger';
import { Project } from '@/database/models/project';

const execAsync = promisify(exec);

export interface ProjectStatus {
  name: string;
  isRunning: boolean;
  port?: number | undefined;
  memoryUsage?: number | undefined;
  diskUsage?: number | undefined;
  cpuUsage?: number | undefined;
  uptime?: number | undefined;
  url?: string | undefined;
  lastHealthCheck?: Date | undefined;
}

export class StatusCollectorService {
  private static instance: StatusCollectorService;

  public static getInstance(): StatusCollectorService {
    if (!StatusCollectorService.instance) {
      StatusCollectorService.instance = new StatusCollectorService();
    }
    return StatusCollectorService.instance;
  }

  async collectAllProjectStatus(): Promise<ProjectStatus[]> {
    try {
      logger.info('🔍 开始收集项目状态...');
      
      const projects = await Project.findAll({
        where: { status: 'active' }
      });

      const statusPromises = projects.map(project => 
        this.collectProjectStatus(project)
      );

      const statuses = await Promise.all(statusPromises);
      logger.info(`✅ 成功收集 ${statuses.length} 个项目状态`);
      
      return statuses;
    } catch (error) {
      logger.error('❌ 收集项目状态失败:', error);
      throw error;
    }
  }

  async collectProjectStatus(project: Project): Promise<ProjectStatus> {
    try {
      const status: ProjectStatus = {
        name: project.name,
        isRunning: false,
        port: project.port || undefined,
        url: project.url || undefined
      };

      status.isRunning = await this.checkProjectRunning(project);
      
      if (status.isRunning) {
        const memoryUsage = await this.getProjectMemoryUsage(project);
        const diskUsage = await this.getProjectDiskUsage(project);
        const cpuUsage = await this.getProjectCpuUsage(project);
        const uptime = await this.getProjectUptime(project);
        
        status.memoryUsage = memoryUsage || undefined;
        status.diskUsage = diskUsage || undefined;
        status.cpuUsage = cpuUsage || undefined;
        status.uptime = uptime || undefined;
        status.lastHealthCheck = new Date();
      }

      return status;
    } catch (error) {
      logger.error(`❌ 收集项目 ${project.name} 状态失败:`, error);
      return {
        name: project.name,
        isRunning: false
      };
    }
  }

  private async checkProjectRunning(project: Project): Promise<boolean> {
    try {
      if (project.deploy_type === 'static') {
        const { stdout } = await execAsync(`ls -la ${project.deploy_path}`);
        return stdout.includes('index.html') || stdout.includes('dist');
      } else {
        const { stdout } = await execAsync(`ps aux | grep -v grep | grep "${project.name}"`);
        return stdout.length > 0;
      }
    } catch (error) {
      return false;
    }
  }

  private async getProjectMemoryUsage(project: Project): Promise<number | undefined> {
    try {
      if (project.deploy_type === 'backend') {
        const { stdout } = await execAsync(`ps aux | grep "${project.name}" | grep -v grep | awk '{print $6}'`);
        const memoryKB = parseInt(stdout.trim());
        return memoryKB ? Math.round(memoryKB / 1024) : undefined;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  private async getProjectDiskUsage(project: Project): Promise<number | undefined> {
    try {
      const { stdout } = await execAsync(`du -sm ${project.deploy_path} 2>/dev/null | awk '{print $1}'`);
      const diskMB = parseInt(stdout.trim());
      return diskMB || undefined;
    } catch (error) {
      return undefined;
    }
  }

  private async getProjectCpuUsage(project: Project): Promise<number | undefined> {
    try {
      if (project.deploy_type === 'backend') {
        const { stdout } = await execAsync(`ps aux | grep "${project.name}" | grep -v grep | awk '{print $3}'`);
        const cpuPercent = parseFloat(stdout.trim());
        return cpuPercent || undefined;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  private async getProjectUptime(project: Project): Promise<number | undefined> {
    try {
      if (project.deploy_type === 'backend') {
        const { stdout } = await execAsync(`ps -eo pid,etime,comm | grep "${project.name}" | grep -v grep | awk '{print $2}'`);
        return this.parseUptime(stdout.trim());
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  private parseUptime(uptimeStr: string): number | undefined {
    try {
      if (!uptimeStr) return undefined;
      
      const parts = uptimeStr.split('-');
      let days = 0;
      let timeStr = uptimeStr;
      
      if (parts.length > 1) {
        days = parseInt(parts[0] || '0');
        timeStr = parts[1] || uptimeStr;
      }
      
      const timeParts = timeStr.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0;
      
      return days * 86400 + hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
      return undefined;
    }
  }
}

export default StatusCollectorService;
