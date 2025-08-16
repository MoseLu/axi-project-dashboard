import { Project } from '@/database/models/project';
import { logger } from '@/utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

export interface SystemMetrics {
  memory_usage: number; // MB
  disk_usage: number; // MB
  cpu_usage: number; // percentage
  uptime: number; // seconds
}

export interface ServiceStatus {
  is_running: boolean;
  port?: number;
  pid?: number;
  memory_usage?: number;
  cpu_usage?: number;
}

export interface DatabaseStatus {
  mysql_status?: 'running' | 'stopped' | 'error';
  redis_status?: 'running' | 'stopped' | 'error';
  mysql_backup_exists?: boolean;
  mysql_backup_size?: number;
  mysql_backup_last?: Date;
}

export class ProjectMonitorService {
  /**
   * 获取系统资源使用情况
   */
  public async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // 获取内存使用情况
      const { stdout: memoryInfo } = await execAsync('free -m');
      const memoryLines = memoryInfo.split('\n');
      const memLine = memoryLines[1]?.split(/\s+/);
      if (!memLine || memLine.length < 3) {
        throw new Error('Invalid memory info format');
      }
      const totalMemory = parseInt(memLine[1] || '0');
      const usedMemory = parseInt(memLine[2] || '0');
      const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

      // 获取磁盘使用情况
      const { stdout: diskInfo } = await execAsync('df -m /');
      const diskLines = diskInfo.split('\n');
      const diskLine = diskLines[1]?.split(/\s+/);
      if (!diskLine || diskLine.length < 3) {
        throw new Error('Invalid disk info format');
      }
      const totalDisk = parseInt(diskLine[1] || '0');
      const usedDisk = parseInt(diskLine[2] || '0');

      // 获取CPU使用情况
      const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      const cpuUsage = parseFloat(cpuInfo.trim());

      // 获取系统运行时间
      const { stdout: uptimeInfo } = await execAsync('cat /proc/uptime');
      const uptime = parseInt(uptimeInfo.split(' ')[0] || '0');

      return {
        memory_usage: usedMemory,
        disk_usage: usedDisk,
        cpu_usage: cpuUsage,
        uptime,
      };
    } catch (error) {
      logger.error('Failed to get system metrics:', error);
      return {
        memory_usage: 0,
        disk_usage: 0,
        cpu_usage: 0,
        uptime: 0,
      };
    }
  }

  /**
   * 检查服务运行状态
   */
  public async checkServiceStatus(projectName: string, port?: number): Promise<ServiceStatus> {
    try {
      // 检查进程是否存在
      const { stdout: processInfo } = await execAsync(`pgrep -f "${projectName}"`);
      const pids = processInfo.trim().split('\n').filter(pid => pid);
      
      if (pids.length === 0) {
        return { is_running: false };
      }

      const pid = pids[0];
      
      // 获取进程资源使用情况
      const { stdout: psInfo } = await execAsync(`ps -p ${pid} -o pid,ppid,pcpu,pmem,etime --no-headers`);
      const psData = psInfo.trim().split(/\s+/);
      
      if (psData.length < 4) {
        throw new Error('Invalid process info format');
      }
      
      const cpuUsage = parseFloat(psData[2] || '0');
      const memoryUsage = parseFloat(psData[3] || '0');

      // 检查端口是否在监听
      let portStatus = false;
      if (port) {
        try {
          const { stdout: portInfo } = await execAsync(`netstat -tlnp | grep :${port}`);
          portStatus = portInfo.length > 0;
        } catch {
          portStatus = false;
        }
      }

      return {
        is_running: true,
        port: portStatus ? port : 0,
        pid: parseInt(pid || '0'),
        memory_usage: memoryUsage || 0,
        cpu_usage: cpuUsage || 0,
      } as any;
    } catch (error) {
      logger.error(`Failed to check service status for ${projectName}:`, error);
      return { is_running: false };
    }
  }

  /**
   * 检查数据库状态
   */
  public async checkDatabaseStatus(project: Project): Promise<DatabaseStatus> {
    const status: DatabaseStatus = {};

    try {
      // 检查MySQL状态
      if (project.has_mysql) {
        try {
          const { stdout: mysqlStatus } = await execAsync('systemctl is-active mysql');
          status.mysql_status = mysqlStatus.trim() === 'active' ? 'running' : 'stopped';
          
          // 检查MySQL备份
          if (project.mysql_backup_enabled && project.mysql_backup_path) {
            try {
              const { stdout: backupInfo } = await execAsync(`ls -la "${project.mysql_backup_path}"`);
              const backupFiles = backupInfo.split('\n').filter(line => line.includes('.sql'));
              status.mysql_backup_exists = backupFiles.length > 0;
              
              if (backupFiles.length > 0) {
                const latestBackup = backupFiles[backupFiles.length - 1];
                if (latestBackup) {
                  const backupSize = latestBackup.split(/\s+/)[4];
                  status.mysql_backup_size = parseInt(backupSize || '0');
                }
                
                // 获取最后备份时间
                const { stdout: backupTime } = await execAsync(`stat -c %Y "${project.mysql_backup_path}"`);
                status.mysql_backup_last = new Date(parseInt(backupTime) * 1000);
              }
            } catch (error) {
              logger.warn(`Failed to check MySQL backup for ${project.name}:`, error);
            }
          }
        } catch (error) {
          status.mysql_status = 'error';
          logger.error(`Failed to check MySQL status for ${project.name}:`, error);
        }
      }

      // 检查Redis状态
      if (project.has_redis) {
        try {
          const { stdout: redisStatus } = await execAsync('systemctl is-active redis');
          status.redis_status = redisStatus.trim() === 'active' ? 'running' : 'stopped';
        } catch (error) {
          status.redis_status = 'error';
          logger.error(`Failed to check Redis status for ${project.name}:`, error);
        }
      }

      return status;
    } catch (error) {
      logger.error(`Failed to check database status for ${project.name}:`, error);
      return status;
    }
  }

  /**
   * 健康检查
   */
  public async healthCheck(project: Project): Promise<boolean> {
    if (!project.health_check_url) {
      return project.is_running;
    }

    try {
      const response = await axios.get(project.health_check_url, {
        timeout: 10000,
        validateStatus: (status) => status < 500, // 接受2xx, 3xx, 4xx状态码
      });
      return response.status < 500;
    } catch (error) {
      logger.warn(`Health check failed for ${project.name}:`, error);
      return false;
    }
  }

  /**
   * 更新项目状态
   */
  public async updateProjectStatus(project: Project): Promise<void> {
    try {
      // 检查服务状态
      const serviceStatus = await this.checkServiceStatus(project.name, project.port);
      
      // 检查数据库状态
      const databaseStatus = await this.checkDatabaseStatus(project);
      
      // 健康检查
      const isHealthy = await this.healthCheck(project);
      
      // 获取系统资源使用情况
      const systemMetrics = await this.getSystemMetrics();
      
      // 更新项目状态
      await project.update({
        is_running: serviceStatus.is_running && isHealthy,
        port: serviceStatus.port || 0,
        memory_usage: serviceStatus.memory_usage || 0,
        cpu_usage: serviceStatus.cpu_usage || 0,
        uptime: serviceStatus.is_running ? systemMetrics.uptime : 0,
        last_health_check: new Date(),
        mysql_status: databaseStatus.mysql_status || undefined,
        redis_status: databaseStatus.redis_status || undefined,
        mysql_backup_last: databaseStatus.mysql_backup_last,
      } as any);

      logger.info(`Updated status for project ${project.name}: running=${serviceStatus.is_running}, healthy=${isHealthy}`);
    } catch (error) {
      logger.error(`Failed to update status for project ${project.name}:`, error);
    }
  }

  /**
   * 批量更新所有项目状态
   */
  public async updateAllProjectStatuses(): Promise<void> {
    try {
      const projects = await Project.findAll({
        where: { status: 'active' },
      });

      logger.info(`Updating status for ${projects.length} active projects`);

      for (const project of projects) {
        await this.updateProjectStatus(project);
      }

      logger.info('Completed updating all project statuses');
    } catch (error) {
      logger.error('Failed to update all project statuses:', error);
    }
  }

  /**
   * 启动项目监控定时任务
   */
  public startMonitoring(intervalMinutes: number = 5): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    logger.info(`Starting project monitoring with ${intervalMinutes} minute interval`);
    
    // 立即执行一次
    this.updateAllProjectStatuses();
    
    // 设置定时任务
    setInterval(() => {
      this.updateAllProjectStatuses();
    }, intervalMs);
  }

  /**
   * 获取项目详细状态
   */
  public async getProjectStatus(projectName: string): Promise<any> {
    try {
      const project = await Project.findOne({
        where: { name: projectName },
      });

      if (!project) {
        throw new Error(`Project ${projectName} not found`);
      }

      const serviceStatus = await this.checkServiceStatus(project.name, project.port);
      const databaseStatus = await this.checkDatabaseStatus(project);
      const systemMetrics = await this.getSystemMetrics();
      const isHealthy = await this.healthCheck(project);

      return {
        project: project.toJSON(),
        service: serviceStatus,
        database: databaseStatus,
        system: systemMetrics,
        health: {
          is_healthy: isHealthy,
          last_check: new Date(),
        },
      };
    } catch (error) {
      logger.error(`Failed to get project status for ${projectName}:`, error);
      throw error;
    }
  }
}
