"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.GracefulShutdown = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
class GracefulShutdown {
    constructor(options = {}) {
        this.isShuttingDown = false;
        this.timeout = options.timeout || 10000;
        this.signals = options.signals || ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    }
    setup(server, socketServer) {
        this.server = server;
        if (socketServer) {
            this.socketServer = socketServer;
        }
        this.signals.forEach(signal => {
            process.on(signal, () => {
                logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
                this.shutdown();
            });
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            this.shutdown(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.shutdown(1);
        });
    }
    async shutdown(exitCode = 0) {
        if (this.isShuttingDown) {
            logger_1.logger.warn('Shutdown already in progress...');
            return;
        }
        this.isShuttingDown = true;
        const shutdownTimeout = setTimeout(() => {
            logger_1.logger.error(`Forceful shutdown after ${this.timeout}ms timeout`);
            process.exit(1);
        }, this.timeout);
        try {
            logger_1.logger.info('Starting graceful shutdown process...');
            if (this.server) {
                logger_1.logger.info('Closing HTTP server...');
                await new Promise((resolve) => {
                    this.server.close(() => {
                        logger_1.logger.info('✅ HTTP server closed');
                        resolve();
                    });
                });
            }
            if (this.socketServer) {
                logger_1.logger.info('Closing Socket.IO server...');
                await new Promise((resolve) => {
                    this.socketServer.close(() => {
                        logger_1.logger.info('✅ Socket.IO server closed');
                        resolve();
                    });
                });
            }
            logger_1.logger.info('Closing database connections...');
            await Promise.all([
                this.closeMongoConnection(),
                this.closeRedisConnection()
            ]);
            logger_1.logger.info('Performing final cleanup...');
            clearTimeout(shutdownTimeout);
            logger_1.logger.info('✅ Graceful shutdown completed successfully');
            process.exit(exitCode);
        }
        catch (error) {
            logger_1.logger.error('❌ Error during graceful shutdown:', error);
            clearTimeout(shutdownTimeout);
            process.exit(1);
        }
    }
    async closeMongoConnection() {
        try {
            if (mongoose_1.default.connection.readyState !== 0) {
                await mongoose_1.default.connection.close();
                logger_1.logger.info('✅ MongoDB connection closed');
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Error closing MongoDB connection:', error);
            throw error;
        }
    }
    async closeRedisConnection() {
        try {
            await (0, redis_service_1.disconnectRedis)();
            logger_1.logger.info('✅ Redis connection closed');
        }
        catch (error) {
            logger_1.logger.error('❌ Error closing Redis connection:', error);
            throw error;
        }
    }
}
exports.GracefulShutdown = GracefulShutdown;
const gracefulShutdown = new GracefulShutdown();
exports.gracefulShutdown = gracefulShutdown;
//# sourceMappingURL=graceful-shutdown.js.map