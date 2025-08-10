"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.disconnectRedis = exports.connectRedis = exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: config_1.config.database.redis.uri,
            socket: {
                connectTimeout: 5000,
            },
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.logger.info('🔗 Connecting to Redis...');
        });
        this.client.on('ready', () => {
            this.isConnected = true;
            logger_1.logger.info('✅ Redis connected successfully');
        });
        this.client.on('error', (error) => {
            this.isConnected = false;
            logger_1.logger.error('❌ Redis connection error:', error);
        });
        this.client.on('end', () => {
            this.isConnected = false;
            logger_1.logger.warn('⚠️ Redis connection closed');
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('🔄 Reconnecting to Redis...');
        });
    }
    async connect() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
                this.isConnected = false;
                logger_1.logger.info('✅ Redis disconnected successfully');
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Error disconnecting from Redis:', error);
            throw error;
        }
    }
    async set(key, value, expireInSeconds) {
        try {
            if (expireInSeconds) {
                await this.client.setEx(key, expireInSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            logger_1.logger.error(`❌ Error setting Redis key ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger_1.logger.error(`❌ Error getting Redis key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            logger_1.logger.error(`❌ Error deleting Redis key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`❌ Error checking Redis key existence ${key}:`, error);
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
    isHealthy() {
        return this.isConnected;
    }
}
exports.RedisService = RedisService;
const redisService = new RedisService();
exports.redisService = redisService;
const connectRedis = async () => {
    await redisService.connect();
};
exports.connectRedis = connectRedis;
const disconnectRedis = async () => {
    await redisService.disconnect();
};
exports.disconnectRedis = disconnectRedis;
//# sourceMappingURL=redis.service.js.map