import { logger } from '@/utils/logger';
import { redisService } from './redis.service';

export interface PortRegistration {
  projectId: string;
  projectName: string;
  port: number;
  status: 'allocated' | 'in-use' | 'released';
  allocatedAt: Date;
  lastUsedAt?: Date;
  deploymentId?: string;
  metadata?: {
    branch?: string;
    commit?: string;
    environment?: string;
    [key: string]: any;
  };
}

export interface PortAllocationRequest {
  projectId: string;
  projectName: string;
  preferredPort?: number;
  deploymentId?: string;
  metadata?: {
    branch?: string;
    commit?: string;
    environment?: string;
    [key: string]: any;
  };
}

export class PortRegistryService {
  private readonly REDIS_KEY_PREFIX = 'port_registry:';
  private readonly PORT_RANGE_START = 3000;
  private readonly PORT_RANGE_END = 9999;
  private readonly ALLOCATED_PORTS_KEY = 'allocated_ports';

  constructor() {}

  /**
   * 分配端口给项目
   */
  public async allocatePort(request: PortAllocationRequest): Promise<PortRegistration> {
    try {
      const { projectId, projectName, preferredPort, deploymentId, metadata } = request;
      
      // 检查项目是否已有分配的端口
      const existingRegistration = await this.getProjectPort(projectId);
      if (existingRegistration && existingRegistration.status === 'in-use') {
        logger.info(`Project ${projectId} already has allocated port: ${existingRegistration.port}`);
        return existingRegistration;
      }

      // 确定要分配的端口
      let port: number;
      if (preferredPort && await this.isPortAvailable(preferredPort)) {
        port = preferredPort;
      } else {
        port = await this.findAvailablePort();
      }

      if (!port) {
        throw new Error('No available ports in the configured range');
      }

      // 创建端口注册记录
      const registration: PortRegistration = {
        projectId,
        projectName,
        port,
        status: 'allocated',
        allocatedAt: new Date(),
        deploymentId,
        metadata
      };

      // 保存到Redis
      await this.savePortRegistration(registration);
      
      // 更新已分配端口列表
      await this.addToAllocatedPorts(port);

      logger.info(`Port ${port} allocated to project ${projectId} (${projectName})`);
      return registration;
    } catch (error) {
      logger.error('Failed to allocate port:', error);
      throw error;
    }
  }

  /**
   * 标记端口为使用中
   */
  public async markPortInUse(projectId: string, deploymentId?: string): Promise<PortRegistration | null> {
    try {
      const registration = await this.getProjectPort(projectId);
      if (!registration) {
        return null;
      }

      registration.status = 'in-use';
      registration.lastUsedAt = new Date();
      if (deploymentId) {
        registration.deploymentId = deploymentId;
      }

      await this.savePortRegistration(registration);
      logger.info(`Port ${registration.port} marked as in-use for project ${projectId}`);
      return registration;
    } catch (error) {
      logger.error('Failed to mark port as in-use:', error);
      throw error;
    }
  }

  /**
   * 释放端口
   */
  public async releasePort(projectId: string): Promise<PortRegistration | null> {
    try {
      const registration = await this.getProjectPort(projectId);
      if (!registration) {
        return null;
      }

      registration.status = 'released';
      registration.lastUsedAt = new Date();

      await this.savePortRegistration(registration);
      
      // 从已分配端口列表中移除
      await this.removeFromAllocatedPorts(registration.port);

      logger.info(`Port ${registration.port} released for project ${projectId}`);
      return registration;
    } catch (error) {
      logger.error('Failed to release port:', error);
      throw error;
    }
  }

  /**
   * 获取项目的端口信息
   */
  public async getProjectPort(projectId: string): Promise<PortRegistration | null> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}project:${projectId}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get project port:', error);
      return null;
    }
  }

  /**
   * 获取端口的所有项目信息
   */
  public async getPortProject(port: number): Promise<PortRegistration | null> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}port:${port}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get port project:', error);
      return null;
    }
  }

  /**
   * 获取所有端口注册信息
   */
  public async getAllPortRegistrations(): Promise<PortRegistration[]> {
    try {
      const pattern = `${this.REDIS_KEY_PREFIX}project:*`;
      const keys = await redisService.keys(pattern);
      
      const registrations: PortRegistration[] = [];
      for (const key of keys) {
        const data = await redisService.get(key);
        if (data) {
          registrations.push(JSON.parse(data));
        }
      }

      return registrations.sort((a, b) => a.allocatedAt.getTime() - b.allocatedAt.getTime());
    } catch (error) {
      logger.error('Failed to get all port registrations:', error);
      return [];
    }
  }

  /**
   * 获取已分配的端口列表
   */
  public async getAllocatedPorts(): Promise<number[]> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}${this.ALLOCATED_PORTS_KEY}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Failed to get allocated ports:', error);
      return [];
    }
  }

  /**
   * 检查端口是否可用
   */
  public async isPortAvailable(port: number): Promise<boolean> {
    try {
      const allocatedPorts = await this.getAllocatedPorts();
      return !allocatedPorts.includes(port);
    } catch (error) {
      logger.error('Failed to check port availability:', error);
      return false;
    }
  }

  /**
   * 查找可用端口
   */
  private async findAvailablePort(): Promise<number | null> {
    try {
      const allocatedPorts = await this.getAllocatedPorts();
      
      for (let port = this.PORT_RANGE_START; port <= this.PORT_RANGE_END; port++) {
        if (!allocatedPorts.includes(port)) {
          return port;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to find available port:', error);
      return null;
    }
  }

  /**
   * 保存端口注册信息
   */
  private async savePortRegistration(registration: PortRegistration): Promise<void> {
    try {
      const projectKey = `${this.REDIS_KEY_PREFIX}project:${registration.projectId}`;
      const portKey = `${this.REDIS_KEY_PREFIX}port:${registration.port}`;
      
      const data = JSON.stringify(registration);
      
      // 保存到Redis，设置过期时间（24小时）
      await redisService.setex(projectKey, 86400, data);
      await redisService.setex(portKey, 86400, data);
    } catch (error) {
      logger.error('Failed to save port registration:', error);
      throw error;
    }
  }

  /**
   * 添加到已分配端口列表
   */
  private async addToAllocatedPorts(port: number): Promise<void> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}${this.ALLOCATED_PORTS_KEY}`;
      const allocatedPorts = await this.getAllocatedPorts();
      
      if (!allocatedPorts.includes(port)) {
        allocatedPorts.push(port);
        await redisService.setex(key, 86400, JSON.stringify(allocatedPorts));
      }
    } catch (error) {
      logger.error('Failed to add to allocated ports:', error);
      throw error;
    }
  }

  /**
   * 从已分配端口列表移除
   */
  private async removeFromAllocatedPorts(port: number): Promise<void> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}${this.ALLOCATED_PORTS_KEY}`;
      const allocatedPorts = await this.getAllocatedPorts();
      
      const filteredPorts = allocatedPorts.filter(p => p !== port);
      await redisService.setex(key, 86400, JSON.stringify(filteredPorts));
    } catch (error) {
      logger.error('Failed to remove from allocated ports:', error);
      throw error;
    }
  }

  /**
   * 清理过期的端口注册
   */
  public async cleanupExpiredRegistrations(): Promise<void> {
    try {
      const registrations = await this.getAllPortRegistrations();
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      for (const registration of registrations) {
        if (registration.status === 'released' && registration.lastUsedAt && registration.lastUsedAt < oneHourAgo) {
          await this.removeFromAllocatedPorts(registration.port);
          logger.info(`Cleaned up expired port registration for project ${registration.projectId}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired registrations:', error);
    }
  }
}

// 创建单例实例
export const portRegistryService = new PortRegistryService();
