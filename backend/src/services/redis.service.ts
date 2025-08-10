import { createClient } from 'redis';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

export class RedisService {
  private client: any;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: config.database.redis.uri,
      socket: {
        connectTimeout: 5000,  // 减少到5秒
        commandTimeout: 5000,  // 命令超时5秒
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('🔗 Connecting to Redis...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    this.client.on('error', (error: Error) => {
      this.isConnected = false;
      logger.error('❌ Redis connection error:', error);
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('⚠️ Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('🔄 Reconnecting to Redis...');
    });
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('✅ Redis disconnected successfully');
      }
    } catch (error) {
      logger.error('❌ Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    try {
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error(`❌ Error setting Redis key ${key}:`, error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`❌ Error getting Redis key ${key}:`, error);
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`❌ Error deleting Redis key ${key}:`, error);
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Error checking Redis key existence ${key}:`, error);
      throw error;
    }
  }

  public getClient(): any {
    return this.client;
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
const redisService = new RedisService();

export const connectRedis = async (): Promise<void> => {
  await redisService.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  await redisService.disconnect();
};

export { redisService };
