"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("@/config/config");
const connection_1 = require("@/database/connection");
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
const error_middleware_1 = require("@/middleware/error.middleware");
const routes_1 = require("@/routes");
const socket_service_1 = require("@/services/socket.service");
const metrics_service_1 = require("@/services/metrics.service");
const health_service_1 = require("@/services/health.service");
const graceful_shutdown_1 = require("@/utils/graceful-shutdown");
class Application {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config_1.config.cors.origin || '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.socketService = new socket_service_1.SocketService(this.io);
        this.metricsService = new metrics_service_1.MetricsService();
        this.healthService = new health_service_1.HealthCheckService();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeGracefulShutdown();
    }
    initializeMiddlewares() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            }
        }));
        this.app.use((0, cors_1.default)({
            origin: config_1.config.cors.origin || '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: config_1.config.rateLimit.window * 60 * 1000,
            max: config_1.config.rateLimit.maxRequests,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);
        this.app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            next();
        });
        this.app.use((req, res, next) => {
            this.metricsService.recordRequest(req.method, req.path);
            next();
        });
    }
    initializeRoutes() {
        this.app.use('/api', routes_1.routes);
        this.app.get('/health', async (req, res) => {
            try {
                const healthStatus = await this.healthService.getHealthStatus();
                res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
            }
            catch (error) {
                logger_1.logger.error('Health check failed:', error);
                res.status(503).json({
                    status: 'unhealthy',
                    message: 'Health check failed',
                    timestamp: new Date().toISOString()
                });
            }
        });
        this.app.get('/metrics', async (req, res) => {
            try {
                const metrics = await this.metricsService.getMetrics();
                res.json(metrics);
            }
            catch (error) {
                logger_1.logger.error('Failed to get metrics:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get metrics'
                });
            }
        });
        if (config_1.config.env === 'development') {
            const swaggerUi = require('swagger-ui-express');
            const swaggerSpec = require('@/config/swagger');
            this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        }
        this.app.use('/static', express_1.default.static('public'));
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found',
                timestamp: new Date().toISOString()
            });
        });
    }
    initializeErrorHandling() {
        this.app.use(error_middleware_1.errorHandler);
    }
    initializeGracefulShutdown() {
        graceful_shutdown_1.gracefulShutdown.setup(this.server, this.io);
    }
    async start() {
        try {
            const dbConnection = await (0, connection_1.connectDatabase)();
            logger_1.logger.info('Database connected successfully');
            await (0, redis_service_1.connectRedis)();
            logger_1.logger.info('Redis connected successfully');
            await this.socketService.initialize();
            logger_1.logger.info('Socket service initialized');
            await this.metricsService.initialize();
            logger_1.logger.info('Metrics service initialized');
            await this.healthService.initialize();
            logger_1.logger.info('Health check service initialized');
            this.server.listen(config_1.config.port, () => {
                logger_1.logger.info(`🚀 Server is running on port ${config_1.config.port}`);
                logger_1.logger.info(`📊 Environment: ${config_1.config.env}`);
                logger_1.logger.info(`🔗 API URL: http://localhost:${config_1.config.port}/api`);
                logger_1.logger.info(`💻 WebSocket URL: ws://localhost:${config_1.config.websocketPort || config_1.config.port}`);
                if (config_1.config.env === 'development') {
                    logger_1.logger.info(`📚 API Docs: http://localhost:${config_1.config.port}/api-docs`);
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}
const app = new Application();
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
app.start().catch((error) => {
    logger_1.logger.error('Failed to start application:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map