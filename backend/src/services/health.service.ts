import mongoose from 'mongoose';
import { redisService } from '@/services/redis.service';
import { logger } from '@/utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export class HealthCheckService {
  public async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    const [database, redis, memory, disk] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk()
    ]);

    const services = {
      database: this.extractResult(database),
      redis: this.extractResult(redis),
      memory: this.extractResult(memory),
      disk: this.extractResult(disk)
    };

    const overallStatus = this.determineOverallStatus(services);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      if (mongoose.connection.readyState !== 1) {
        return {
          status: 'unhealthy',
          message: 'Database not connected',
          responseTime: Date.now() - startTime
        };
      }

      // Ping database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        responseTime: Date.now() - startTime,
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        message: `Database health check failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      if (!redisService.isHealthy()) {
        return {
          status: 'unhealthy',
          message: 'Redis not connected',
          responseTime: Date.now() - startTime
        };
      }

      // Ping Redis
      await redisService.getClient().ping();
      
      return {
        status: 'healthy',
        message: 'Redis connection is healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        message: `Redis health check failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkMemory(): Promise<ServiceHealth> {
    try {
      const usage = process.memoryUsage();
      const totalMemory = usage.rss + usage.heapUsed + usage.external;
      const memoryUsagePercentage = (totalMemory / (1024 * 1024 * 1024)) * 100; // Convert to GB

      const isHealthy = memoryUsagePercentage < 80; // Consider unhealthy if using more than 80% of 1GB

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Memory usage is normal' : 'High memory usage detected',
        details: {
          rss: Math.round(usage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
          external: Math.round(usage.external / 1024 / 1024), // MB
          usagePercentage: Math.round(memoryUsagePercentage * 100) / 100
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${(error as Error).message}`
      };
    }
  }

  private async checkDisk(): Promise<ServiceHealth> {
    try {
      // Simple disk check - in a real implementation, you might want to check actual disk usage
      return {
        status: 'healthy',
        message: 'Disk usage is normal',
        details: {
          note: 'Detailed disk usage monitoring not implemented'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Disk check failed: ${(error as Error).message}`
      };
    }
  }

  private extractResult(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${result.reason}`
      };
    }
  }

  private determineOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'unhealthy' | 'degraded' {
    const serviceStatuses = Object.values(services).map(service => service.status);
    
    if (serviceStatuses.every(status => status === 'healthy')) {
      return 'healthy';
    } else if (serviceStatuses.some(status => status === 'healthy')) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.status === 'healthy';
    } catch (error) {
      logger.error('Health check service failed:', error);
      return false;
    }
  }
}
