import { Project } from '@/database/models/project';
import { Deployment } from '@/database/models/deployment';
import { ProjectMonitorService } from './project-monitor.service';
import { logger } from '@/utils/logger';
import { Op } from 'sequelize';

export interface ProjectData {
  name: string;
  display_name: string;
  description?: string;
  repository: string;
  branch: string;
  deploy_type: 'static' | 'backend';
  status: 'active' | 'inactive' | 'maintenance';
  
  // 部署配置
  deploy_path: string;
  nginx_config?: string;
  start_command?: string;
  environment_variables?: string;
  
  // 数据库配置
  has_mysql: boolean;
  mysql_backup_enabled: boolean;
  mysql_backup_schedule?: string;
  mysql_backup_path?: string;
  
  has_redis: boolean;
  redis_port?: number;
  
  // 监控配置
  health_check_url?: string;
  health_check_interval: number;
  auto_restart: boolean;
  restart_threshold: number;
  
  // 运行配置
  port?: number;
  url?: string;
}

export interface ProjectStats {
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  success_rate: number;
  average_deployment_time: number;
  last_deployment?: Date;
  uptime_percentage: number;
}

export class ProjectService {
  private monitorService: ProjectMonitorService;

  constructor(monitorService: ProjectMonitorService) {
    this.monitorService = monitorService;
  }

  /**
   * 创建新项目
   */
  public async createProject(data: ProjectData): Promise<Project> {
    try {
      const project = await Project.create({
        ...data,
        environment_variables: data.environment_variables ? JSON.stringify(data.environment_variables) : undefined,
      });

      logger.info(`Created project: ${project.name}`);
      return project;
    } catch (error) {
      logger.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * 更新项目信息
   */
  public async updateProject(projectName: string, data: Partial<ProjectData>): Promise<Project | null> {
    try {
      const project = await Project.findOne({
        where: { name: projectName },
      });

      if (!project) {
        logger.warn(`Project not found: ${projectName}`);
        return null;
      }

      const updateData: any = { ...data };
      
      if (data.environment_variables !== undefined) {
        updateData.environment_variables = typeof data.environment_variables === 'string' 
          ? data.environment_variables 
          : JSON.stringify(data.environment_variables);
      }

      await project.update(updateData);

      logger.info(`Updated project: ${projectName}`);
      return project;
    } catch (error) {
      logger.error(`Failed to update project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 删除项目
   */
  public async deleteProject(projectName: string): Promise<boolean> {
    try {
      const project = await Project.findOne({
        where: { name: projectName },
      });

      if (!project) {
        logger.warn(`Project not found: ${projectName}`);
        return false;
      }

      await project.destroy();
      logger.info(`Deleted project: ${projectName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目列表
   */
  public async getProjects(params: {
    page?: number;
    limit?: number;
    status?: string;
    deploy_type?: string;
  } = {}): Promise<{ data: Project[]; pagination: any }> {
    try {
      const { page = 1, limit = 20, status, deploy_type } = params;
      const offset = (page - 1) * limit;

      const whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }
      if (deploy_type) {
        whereClause.deploy_type = deploy_type;
      }

      const total = await Project.count({ where: whereClause });
      const projects = await Project.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: projects,
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
      logger.error('Failed to get projects:', error);
      throw error;
    }
  }

  /**
   * 获取项目详情
   */
  public async getProject(projectName: string): Promise<Project | null> {
    try {
      const project = await Project.findOne({
        where: { name: projectName },
      });

      return project;
    } catch (error) {
      logger.error(`Failed to get project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目统计信息
   */
  public async getProjectStats(projectName: string): Promise<ProjectStats> {
    try {
      const project = await Project.findOne({
        where: { name: projectName },
      });

      if (!project) {
        throw new Error(`Project ${projectName} not found`);
      }

      // 获取部署统计
      const [totalDeployments, successfulDeployments, failedDeployments, averageTimeResult] = await Promise.all([
        Deployment.count({ where: { project_name: projectName } }),
        Deployment.count({ where: { project_name: projectName, status: 'success' } }),
        Deployment.count({ where: { project_name: projectName, status: 'failed' } }),
        Deployment.findOne({
          attributes: [[Deployment.sequelize!.fn('AVG', Deployment.sequelize!.col('duration')), 'averageTime']],
          where: { 
            project_name: projectName,
            status: { [Op.in]: ['success', 'failed'] } 
          },
        }),
      ]);

      // 获取最后部署时间
      const lastDeployment = await Deployment.findOne({
        where: { project_name: projectName },
        order: [['created_at', 'DESC']],
        attributes: ['created_at'],
      });

      const averageDeploymentTime = averageTimeResult
        ? Math.round(parseFloat(averageTimeResult.get('averageTime') as string) || 0)
        : 0;

      const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;

      // 计算运行时间百分比（基于最后健康检查时间）
      let uptimePercentage = 0;
      if (project.last_health_check && project.is_running) {
        const now = new Date();
        const lastCheck = new Date(project.last_health_check);
        const timeDiff = now.getTime() - lastCheck.getTime();
        const healthCheckInterval = project.health_check_interval * 1000; // 转换为毫秒
        
        // 如果最后检查时间在健康检查间隔内，认为是运行的
        if (timeDiff <= healthCheckInterval) {
          uptimePercentage = 100;
        } else {
          // 根据健康检查间隔计算运行时间百分比
          uptimePercentage = Math.max(0, 100 - (timeDiff / healthCheckInterval) * 100);
        }
      }

      return {
        total_deployments: totalDeployments,
        successful_deployments: successfulDeployments,
        failed_deployments: failedDeployments,
        success_rate: successRate,
        average_deployment_time: averageDeploymentTime,
        last_deployment: lastDeployment?.created_at,
        uptime_percentage: uptimePercentage,
      };
    } catch (error) {
      logger.error(`Failed to get project stats for ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目详细状态
   */
  public async getProjectStatus(projectName: string): Promise<any> {
    try {
      const project = await this.getProject(projectName);
      if (!project) {
        throw new Error(`Project ${projectName} not found`);
      }

      const stats = await this.getProjectStats(projectName);
      const detailedStatus = await this.monitorService.getProjectStatus(projectName);

      return {
        project: project.toJSON(),
        stats,
        status: detailedStatus,
      };
    } catch (error) {
      logger.error(`Failed to get project status for ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 更新项目运行状态
   */
  public async updateProjectStatus(projectName: string): Promise<void> {
    try {
      const project = await this.getProject(projectName);
      if (!project) {
        throw new Error(`Project ${projectName} not found`);
      }

      await this.monitorService.updateProjectStatus(project);
    } catch (error) {
      logger.error(`Failed to update project status for ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 启动项目
   */
  public async startProject(projectName: string): Promise<boolean> {
    try {
      const project = await this.getProject(projectName);
      if (!project) {
        throw new Error(`Project ${projectName} not found`);
      }

      if (project.deploy_type === 'backend' && project.start_command) {
        // 执行启动命令
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        await execAsync(project.start_command);
        logger.info(`Started project: ${projectName}`);
        return true;
      } else {
        logger.warn(`Cannot start project ${projectName}: no start command configured`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to start project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 停止项目
   */
  public async stopProject(projectName: string): Promise<boolean> {
    try {
      const project = await this.getProject(projectName);
      if (!project) {
        throw new Error(`Project ${projectName} not found`);
      }

      // 查找并停止项目进程
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      try {
        await execAsync(`pkill -f "${projectName}"`);
        logger.info(`Stopped project: ${projectName}`);
        return true;
      } catch (error) {
        logger.warn(`No running process found for project: ${projectName}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to stop project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 重启项目
   */
  public async restartProject(projectName: string): Promise<boolean> {
    try {
      await this.stopProject(projectName);
      // 等待一段时间确保进程完全停止
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await this.startProject(projectName);
    } catch (error) {
      logger.error(`Failed to restart project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * 获取所有项目的概览信息
   */
  public async getProjectsOverview(): Promise<any[]> {
    try {
      const projects = await Project.findAll({
        where: { status: 'active' },
        order: [['display_name', 'ASC']],
      });

      const overview = await Promise.all(projects.map(async (project) => {
        const stats = await this.getProjectStats(project.name);
        return {
          ...project.toJSON(),
          stats,
        };
      }));

      return overview;
    } catch (error) {
      logger.error('Failed to get projects overview:', error);
      throw error;
    }
  }

  /**
   * 同步项目部署统计
   */
  public async syncProjectDeploymentStats(): Promise<void> {
    try {
      const projects = await Project.findAll();

      for (const project of projects) {
        const stats = await this.getProjectStats(project.name);
        
        await project.update({
          total_deployments: stats.total_deployments,
          successful_deployments: stats.successful_deployments,
          failed_deployments: stats.failed_deployments,
          last_deployment: stats.last_deployment,
          average_deployment_time: stats.average_deployment_time,
        });
      }

      logger.info(`Synced deployment stats for ${projects.length} projects`);
    } catch (error) {
      logger.error('Failed to sync project deployment stats:', error);
      throw error;
    }
  }
}
