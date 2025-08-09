"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
class MetricsService {
    constructor() {
        this.METRICS_PREFIX = 'metrics:';
        this.DEPLOYMENT_COUNT_KEY = `${this.METRICS_PREFIX}deployment_count`;
        this.SUCCESS_COUNT_KEY = `${this.METRICS_PREFIX}success_count`;
        this.FAILURE_COUNT_KEY = `${this.METRICS_PREFIX}failure_count`;
    }
    async incrementDeploymentCount() {
        try {
            await redis_service_1.redisService.getClient().incr(this.DEPLOYMENT_COUNT_KEY);
            logger_1.logger.debug('Incremented deployment count');
        }
        catch (error) {
            logger_1.logger.error('Error incrementing deployment count:', error);
        }
    }
    async incrementSuccessCount() {
        try {
            await redis_service_1.redisService.getClient().incr(this.SUCCESS_COUNT_KEY);
            logger_1.logger.debug('Incremented success count');
        }
        catch (error) {
            logger_1.logger.error('Error incrementing success count:', error);
        }
    }
    async incrementFailureCount() {
        try {
            await redis_service_1.redisService.getClient().incr(this.FAILURE_COUNT_KEY);
            logger_1.logger.debug('Incremented failure count');
        }
        catch (error) {
            logger_1.logger.error('Error incrementing failure count:', error);
        }
    }
    async getDeploymentMetrics() {
        try {
            const [total, success, failure] = await Promise.all([
                redis_service_1.redisService.get(this.DEPLOYMENT_COUNT_KEY),
                redis_service_1.redisService.get(this.SUCCESS_COUNT_KEY),
                redis_service_1.redisService.get(this.FAILURE_COUNT_KEY)
            ]);
            const totalDeployments = parseInt(total || '0', 10);
            const successfulDeployments = parseInt(success || '0', 10);
            const failedDeployments = parseInt(failure || '0', 10);
            return {
                totalDeployments,
                successfulDeployments,
                failedDeployments,
                averageDeploymentTime: 0,
                deploymentsToday: 0,
                deploymentsThisWeek: 0,
                deploymentsThisMonth: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting deployment metrics:', error);
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
    async recordDeploymentTime(projectId, duration) {
        try {
            const key = `${this.METRICS_PREFIX}deployment_time:${projectId}`;
            await redis_service_1.redisService.getClient().lPush(key, duration.toString());
            await redis_service_1.redisService.getClient().lTrim(key, 0, 99);
            logger_1.logger.debug(`Recorded deployment time for project ${projectId}: ${duration}ms`);
        }
        catch (error) {
            logger_1.logger.error('Error recording deployment time:', error);
        }
    }
    async getProjectMetrics(projectId) {
        try {
            const timeKey = `${this.METRICS_PREFIX}deployment_time:${projectId}`;
            const deploymentTimes = await redis_service_1.redisService.getClient().lRange(timeKey, 0, -1);
            const deploymentCount = deploymentTimes.length;
            const averageTime = deploymentCount > 0
                ? deploymentTimes.reduce((sum, time) => sum + parseInt(time, 10), 0) / deploymentCount
                : 0;
            return {
                projectId,
                deploymentCount,
                successRate: 0,
                averageDeploymentTime: averageTime,
                lastDeployment: null
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting project metrics for ${projectId}:`, error);
            return {
                projectId,
                deploymentCount: 0,
                successRate: 0,
                averageDeploymentTime: 0,
                lastDeployment: null
            };
        }
    }
    async resetMetrics() {
        try {
            const keys = await redis_service_1.redisService.getClient().keys(`${this.METRICS_PREFIX}*`);
            if (keys.length > 0) {
                await redis_service_1.redisService.getClient().del(keys);
                logger_1.logger.info('Metrics reset successfully');
            }
        }
        catch (error) {
            logger_1.logger.error('Error resetting metrics:', error);
        }
    }
    async recordRequest(method, path) {
        try {
            const key = `${this.METRICS_PREFIX}requests:${method}:${path}`;
            await redis_service_1.redisService.getClient().incr(key);
            logger_1.logger.debug(`Recorded request: ${method} ${path}`);
        }
        catch (error) {
            logger_1.logger.error('Error recording request:', error);
        }
    }
    async recordSocketConnection() {
        try {
            await redis_service_1.redisService.getClient().incr(`${this.METRICS_PREFIX}socket_connections`);
            logger_1.logger.debug('Socket connection recorded');
        }
        catch (error) {
            logger_1.logger.error('Error recording socket connection:', error);
        }
    }
    async recordSocketDisconnection() {
        try {
            await redis_service_1.redisService.getClient().incr(`${this.METRICS_PREFIX}socket_disconnections`);
            logger_1.logger.debug('Socket disconnection recorded');
        }
        catch (error) {
            logger_1.logger.error('Error recording socket disconnection:', error);
        }
    }
    async initialize() {
        logger_1.logger.info('MetricsService initialized');
    }
    async close() {
        logger_1.logger.info('MetricsService closed');
    }
    async getMetrics() {
        return this.getDeploymentMetrics();
    }
    async isHealthy() {
        try {
            await redis_service_1.redisService.getClient().ping();
            return true;
        }
        catch (error) {
            logger_1.logger.error('MetricsService health check failed:', error);
            return false;
        }
    }
}
exports.MetricsService = MetricsService;
//# sourceMappingURL=metrics.service.js.map