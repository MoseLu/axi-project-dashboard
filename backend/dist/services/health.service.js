"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
class HealthCheckService {
    async getHealthStatus() {
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
    async checkDatabase() {
        const startTime = Date.now();
        try {
            if (mongoose_1.default.connection.readyState !== 1) {
                return {
                    status: 'unhealthy',
                    message: 'Database not connected',
                    responseTime: Date.now() - startTime
                };
            }
            await mongoose_1.default.connection.db.admin().ping();
            return {
                status: 'healthy',
                message: 'Database connection is healthy',
                responseTime: Date.now() - startTime,
                details: {
                    readyState: mongoose_1.default.connection.readyState,
                    host: mongoose_1.default.connection.host,
                    port: mongoose_1.default.connection.port,
                    name: mongoose_1.default.connection.name
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                message: `Database health check failed: ${error.message}`,
                responseTime: Date.now() - startTime
            };
        }
    }
    async checkRedis() {
        const startTime = Date.now();
        try {
            if (!redis_service_1.redisService.isHealthy()) {
                return {
                    status: 'unhealthy',
                    message: 'Redis not connected',
                    responseTime: Date.now() - startTime
                };
            }
            await redis_service_1.redisService.getClient().ping();
            return {
                status: 'healthy',
                message: 'Redis connection is healthy',
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', error);
            return {
                status: 'unhealthy',
                message: `Redis health check failed: ${error.message}`,
                responseTime: Date.now() - startTime
            };
        }
    }
    async checkMemory() {
        try {
            const usage = process.memoryUsage();
            const totalMemory = usage.rss + usage.heapUsed + usage.external;
            const memoryUsagePercentage = (totalMemory / (1024 * 1024 * 1024)) * 100;
            const isHealthy = memoryUsagePercentage < 80;
            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                message: isHealthy ? 'Memory usage is normal' : 'High memory usage detected',
                details: {
                    rss: Math.round(usage.rss / 1024 / 1024),
                    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
                    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
                    external: Math.round(usage.external / 1024 / 1024),
                    usagePercentage: Math.round(memoryUsagePercentage * 100) / 100
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Memory check failed: ${error.message}`
            };
        }
    }
    async checkDisk() {
        try {
            return {
                status: 'healthy',
                message: 'Disk usage is normal',
                details: {
                    note: 'Detailed disk usage monitoring not implemented'
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Disk check failed: ${error.message}`
            };
        }
    }
    extractResult(result) {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return {
                status: 'unhealthy',
                message: `Health check failed: ${result.reason}`
            };
        }
    }
    determineOverallStatus(services) {
        const serviceStatuses = Object.values(services).map(service => service.status);
        if (serviceStatuses.every(status => status === 'healthy')) {
            return 'healthy';
        }
        else if (serviceStatuses.some(status => status === 'healthy')) {
            return 'degraded';
        }
        else {
            return 'unhealthy';
        }
    }
    async initialize() {
        logger_1.logger.info('HealthCheckService initialized');
    }
    async isHealthy() {
        try {
            const health = await this.getHealthStatus();
            return health.status === 'healthy';
        }
        catch (error) {
            logger_1.logger.error('Health check service failed:', error);
            return false;
        }
    }
}
exports.HealthCheckService = HealthCheckService;
//# sourceMappingURL=health.service.js.map