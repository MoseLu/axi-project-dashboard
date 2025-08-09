import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { disconnectDatabase } from '@/database/connection';
import { disconnectRedis } from '@/services/redis.service';
import { logger } from '@/utils/logger';

export interface ShutdownOptions {
  timeout?: number;
  signals?: string[];
}

export class GracefulShutdown {
  private server?: Server;
  private socketServer?: SocketIOServer;
  private isShuttingDown: boolean = false;
  private timeout: number;
  private signals: string[];

  constructor(options: ShutdownOptions = {}) {
    this.timeout = options.timeout || 10000; // 10 seconds default
    this.signals = options.signals || ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  }

  public setup(server: Server, socketServer?: SocketIOServer): void {
    this.server = server;
    if (socketServer) {
      this.socketServer = socketServer;
    }

    // Listen for shutdown signals
    this.signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
  }

  private async shutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;

    const shutdownTimeout = setTimeout(() => {
      logger.error(`Forceful shutdown after ${this.timeout}ms timeout`);
      process.exit(1);
    }, this.timeout);

    try {
      logger.info('Starting graceful shutdown process...');

      // Step 1: Stop accepting new connections
      if (this.server) {
        logger.info('Closing HTTP server...');
        await new Promise<void>((resolve) => {
          this.server!.close(() => {
            logger.info('✅ HTTP server closed');
            resolve();
          });
        });
      }

      // Step 2: Close Socket.IO connections
      if (this.socketServer) {
        logger.info('Closing Socket.IO server...');
        await new Promise<void>((resolve) => {
          this.socketServer!.close(() => {
            logger.info('✅ Socket.IO server closed');
            resolve();
          });
        });
      }

      // Step 3: Close database connections
      logger.info('Closing database connections...');
      await Promise.all([
        this.closeDatabaseConnection(),
        this.closeRedisConnection()
      ]);

      // Step 4: Final cleanup
      logger.info('Performing final cleanup...');
      clearTimeout(shutdownTimeout);

      logger.info('✅ Graceful shutdown completed successfully');
      process.exit(exitCode);

    } catch (error) {
      logger.error('❌ Error during graceful shutdown:', error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  private async closeDatabaseConnection(): Promise<void> {
    try {
      await disconnectDatabase();
      logger.info('✅ MySQL connection closed');
    } catch (error) {
      logger.error('❌ Error closing MySQL connection:', error);
      throw error;
    }
  }

  private async closeRedisConnection(): Promise<void> {
    try {
      await disconnectRedis();
      logger.info('✅ Redis connection closed');
    } catch (error) {
      logger.error('❌ Error closing Redis connection:', error);
      throw error;
    }
  }
}

// Create singleton instance
const gracefulShutdown = new GracefulShutdown();

export { gracefulShutdown };
