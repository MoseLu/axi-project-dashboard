import { redisService } from '@/services/redis.service';
import { logger } from '@/utils/logger';

export interface DeploymentMetrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
  deploymentsToday: number;
  deploymentsThisWeek: number;
  deploymentsThisMonth: number;
}

export interface ProjectMetrics {
  projectId: string;
  deploymentCount: number;
  successRate: number;
  averageDeploymentTime: number;
  lastDeployment: Date | null;
}

export class MetricsService {
  private readonly METRICS_PREFIX = 'metrics:';
  private readonly DEPLOYMENT_COUNT_KEY = `${this.METRICS_PREFIX}deployment_count`;
  private readonly SUCCESS_COUNT_KEY = `${this.METRICS_PREFIX}success_count`;
  private readonly FAILURE_COUNT_KEY = `${this.METRICS_PREFIX}failure_count`;

  public async incrementDeploymentCount(): Promise<void> {
    try {
      await redisService.getClient().incr(this.DEPLOYMENT_COUNT_KEY);
      logger.debug('Incremented deployment count');
    } catch (error) {
      logger.error('Error incrementing deployment count:', error);
    }
  }

  public async incrementSuccessCount(): Promise<void> {
    try {
      await redisService.getClient().incr(this.SUCCESS_COUNT_KEY);
      logger.debug('Incremented success count');
    } catch (error) {
      logger.error('Error incrementing success count:', error);
    }
  }

  public async incrementFailureCount(): Promise<void> {
    try {
      await redisService.getClient().incr(this.FAILURE_COUNT_KEY);
      logger.debug('Incremented failure count');
    } catch (error) {
      logger.error('Error incrementing failure count:', error);
    }
  }

  public async getDeploymentMetrics(): Promise<DeploymentMetrics> {
    try {
      const [total, success, failure] = await Promise.all([
        redisService.get(this.DEPLOYMENT_COUNT_KEY),
        redisService.get(this.SUCCESS_COUNT_KEY),
        redisService.get(this.FAILURE_COUNT_KEY)
      ]);

      const totalDeployments = parseInt(total || '0', 10);
      const successfulDeployments = parseInt(success || '0', 10);
      const failedDeployments = parseInt(failure || '0', 10);

      return {
        totalDeployments,
        successfulDeployments,
        failedDeployments,
        averageDeploymentTime: 0, // TODO: Implement actual calculation
        deploymentsToday: 0, // TODO: Implement daily metrics
        deploymentsThisWeek: 0, // TODO: Implement weekly metrics
        deploymentsThisMonth: 0 // TODO: Implement monthly metrics
      };
    } catch (error) {
      logger.error('Error getting deployment metrics:', error);
      return {
        totalDeployments: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        averageDeploymentTime: 0,
        deploymentsToday: 0,
        deploymentsThisWeek: 0,
        deploymentsThisMonth: 0
      };
    }
  }

  public async recordDeploymentTime(projectId: string, duration: number): Promise<void> {
    try {
      const key = `${this.METRICS_PREFIX}deployment_time:${projectId}`;
      await redisService.getClient().lPush(key, duration.toString());
      // Keep only last 100 deployment times
      await redisService.getClient().lTrim(key, 0, 99);
      logger.debug(`Recorded deployment time for project ${projectId}: ${duration}ms`);
    } catch (error) {
      logger.error('Error recording deployment time:', error);
    }
  }

  public async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      const timeKey = `${this.METRICS_PREFIX}deployment_time:${projectId}`;
      const deploymentTimes = await redisService.getClient().lRange(timeKey, 0, -1);
      
      const deploymentCount = deploymentTimes.length;
      const averageTime = deploymentCount > 0 
        ? deploymentTimes.reduce((sum: number, time: string) => sum + parseInt(time, 10), 0) / deploymentCount 
        : 0;

      return {
        projectId,
        deploymentCount,
        successRate: 0, // TODO: Calculate based on project-specific success/failure counts
        averageDeploymentTime: averageTime,
        lastDeployment: null // TODO: Store and retrieve last deployment timestamp
      };
    } catch (error) {
      logger.error(`Error getting project metrics for ${projectId}:`, error);
      return {
        projectId,
        deploymentCount: 0,
        successRate: 0,
        averageDeploymentTime: 0,
        lastDeployment: null
      };
    }
  }

  public async resetMetrics(): Promise<void> {
    try {
      const keys = await redisService.getClient().keys(`${this.METRICS_PREFIX}*`);
      if (keys.length > 0) {
        await redisService.getClient().del(keys);
        logger.info('Metrics reset successfully');
      }
    } catch (error) {
      logger.error('Error resetting metrics:', error);
    }
  }

  public async recordRequest(method: string, path: string): Promise<void> {
    try {
      const key = `${this.METRICS_PREFIX}requests:${method}:${path}`;
      await redisService.getClient().incr(key);
      logger.debug(`Recorded request: ${method} ${path}`);
    } catch (error) {
      logger.error('Error recording request:', error);
    }
  }

  public async recordSocketConnection(): Promise<void> {
    try {
      await redisService.getClient().incr(`${this.METRICS_PREFIX}socket_connections`);
      logger.debug('Socket connection recorded');
    } catch (error) {
      logger.error('Error recording socket connection:', error);
    }
  }

  public async recordSocketDisconnection(): Promise<void> {
    try {
      await redisService.getClient().incr(`${this.METRICS_PREFIX}socket_disconnections`);
      logger.debug('Socket disconnection recorded');
    } catch (error) {
      logger.error('Error recording socket disconnection:', error);
    }
  }

  public async initialize(): Promise<void> {
    logger.info('MetricsService initialized');
  }

  public async close(): Promise<void> {
    logger.info('MetricsService closed');
  }

  public async getMetrics(): Promise<DeploymentMetrics> {
    return this.getDeploymentMetrics();
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await redisService.getClient().ping();
      return true;
    } catch (error) {
      logger.error('MetricsService health check failed:', error);
      return false;
    }
  }
}
