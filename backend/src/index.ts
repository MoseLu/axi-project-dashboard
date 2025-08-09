import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/config';
import { connectDatabase } from '@/database/connection';
import { connectRedis } from '@/services/redis.service';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { routes } from '@/routes';
import { SocketService } from '@/services/socket.service';
import { MetricsService } from '@/services/metrics.service';
import { HealthCheckService } from '@/services/health.service';
import { gracefulShutdown } from '@/utils/graceful-shutdown';

class Application {
  public app: express.Application;
  public server: http.Server;
  public io: SocketIOServer;
  private socketService: SocketService;
  private metricsService: MetricsService;
  private healthService: HealthCheckService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.socketService = new SocketService(this.io);
    this.metricsService = new MetricsService();
    this.healthService = new HealthCheckService();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeGracefulShutdown();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }));

    // CORS 配置
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // 压缩响应
    this.app.use(compression());

    // 请求体解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 限流中间件
    const limiter = rateLimit({
      windowMs: config.rateLimit.window * 60 * 1000, // 15 minutes
      max: config.rateLimit.maxRequests, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });

    // 指标收集
    this.app.use((req, res, next) => {
      this.metricsService.recordRequest(req.method, req.path);
      next();
    });
  }

  private initializeRoutes(): void {
    // API 路由
    this.app.use('/api', routes);

    // 健康检查端点
    this.app.get('/health', (req, res) => {
      const healthStatus = this.healthService.getHealthStatus();
      res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
    });

    // 指标端点
    this.app.get('/metrics', (req, res) => {
      res.set('Content-Type', 'text/plain');
      res.end(this.metricsService.getMetrics());
    });

    // API 文档
    if (config.nodeEnv === 'development') {
      const swaggerUi = require('swagger-ui-express');
      const swaggerSpec = require('@/config/swagger');
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    // 静态文件服务
    this.app.use('/static', express.static('public'));

    // 404 处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        timestamp: new Date().toISOString()
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeGracefulShutdown(): void {
    gracefulShutdown.setup(this.server, this.io);
  }

  public async start(): Promise<void> {
    try {
      // 连接数据库
      await connectDatabase();
      logger.info('Database connected successfully');

      // 连接 Redis
      await connectRedis();
      logger.info('Redis connected successfully');

      // 初始化 Socket 服务
      await this.socketService.initialize();
      logger.info('Socket service initialized');

      // 启动指标服务
      await this.metricsService.initialize();
      logger.info('Metrics service initialized');

      // 启动健康检查服务
      await this.healthService.initialize();
      logger.info('Health check service initialized');

      // 启动服务器
      this.server.listen(config.port, () => {
        logger.info(`🚀 Server is running on port ${config.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 API URL: http://localhost:${config.port}/api`);
        logger.info(`💻 WebSocket URL: ws://localhost:${config.websocketPort || config.port}`);
        
        if (config.env === 'development') {
          logger.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
        }
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// 创建并启动应用
const app = new Application();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 启动应用
app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

export default app;
