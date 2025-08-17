import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from '@/config/config';
import { connectDatabase } from '@/database/connection';
import { testConnection, syncDatabase } from '@/database/sequelize';
import { connectRedis } from '@/services/redis.service';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { routes } from '@/routes';
import { SocketService } from '@/services/socket.service';
import { MetricsService } from '@/services/metrics.service';
import { HealthCheckService } from '@/services/health.service';
import { DeploymentService } from '@/services/deployment.service';
import { GracefulShutdown } from '@/utils/graceful-shutdown';
import initializeDatabase from '@/scripts/init-database';
import { ProjectService } from '@/services/project.service';
import { ProjectMonitorService } from '@/services/project-monitor.service';
import { SchedulerService } from '@/services/monitoring/scheduler.service';

class Application {
  public app: express.Application;
  public server: http.Server;
  public io: SocketIOServer;
  private socketService: SocketService;
  private metricsService: MetricsService;
  private healthService: HealthCheckService;
  private deploymentService: DeploymentService;
  private gracefulShutdown: GracefulShutdown;
  private projectService: ProjectService;
  private projectMonitorService: ProjectMonitorService;
  private schedulerService: SchedulerService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.socketService = new SocketService(this.io);
    this.metricsService = new MetricsService();
    this.healthService = new HealthCheckService();
    this.projectMonitorService = new ProjectMonitorService();
    this.deploymentService = new DeploymentService(this.socketService);
    this.projectService = new ProjectService(this.projectMonitorService);
    this.schedulerService = SchedulerService.getInstance();
    this.gracefulShutdown = new GracefulShutdown();

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
      origin: config.cors.origin || '*',
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
    // 将 DeploymentService 注入到请求对象中
    this.app.use('/project-dashboard/api', (req, res, next) => {
      (req as any).deploymentService = this.deploymentService;
      (req as any).projectService = this.projectService;
      (req as any).projectMonitorService = this.projectMonitorService;
      (req as any).socketService = this.socketService;
      next();
    }, routes);

    // 健康检查端点 - 简化版本，确保总是可用
    this.app.get('/health', async (req, res) => {
      try {
        // 尝试使用健康检查服务，如果不可用则返回基本状态
        if (this.healthService) {
          const healthStatus = await this.healthService.getHealthStatus();
          res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
        } else {
          // 基本健康检查
          res.status(200).json({
            status: 'healthy',
            message: 'axi-project-dashboard API is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            services: {
              http: 'up',
              database: 'unknown',
              redis: 'unknown'
            }
          });
        }
      } catch (error) {
        logger.error('Health check failed:', error);
        // 即使出错也返回200，表明HTTP服务本身是正常的
        res.status(200).json({
          status: 'partial',
          message: 'HTTP server is running, but some services may be unavailable',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // 指标端点
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.metricsService.getMetrics();
        res.json(metrics);
      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get metrics'
        });
      }
    });

    // API 文档
    if (config.env === 'development') {
      const swaggerUi = require('swagger-ui-express');
      const swaggerSpec = require('@/config/swagger');
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    // 静态文件服务
    this.app.use('/static', express.static('public'));
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    this.gracefulShutdown.setup(this.server, this.io);
  }

  public async start(): Promise<void> {
    // 首先启动基本的HTTP服务器，确保健康检查可用
    this.server.listen(config.port, () => {
      logger.info(`🚀 Server is running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.env}`);
      logger.info(`🔗 API URL: http://localhost:${config.port}/api`);
      logger.info(`💻 WebSocket URL: ws://localhost:${config.websocketPort || config.port}`);
      
      if (config.env === 'development') {
        logger.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
      }
    });

    // 异步初始化其他服务，不阻塞HTTP服务器启动
    setImmediate(() => {
      this.initializeServices();
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // 检查是否跳过数据库初始化
      const skipDbInit = process.env.SKIP_DB_INIT === 'true' || !process.env.MYSQL_HOST;
      
      // 数据库连接（模仿 axi-star-cloud 策略：连接数据库但不自动初始化）
      if (!skipDbInit) {
        try {
          logger.info('🔧 连接数据库（模仿 axi-star-cloud 策略：连接数据库但不自动初始化）...');
          
          // 连接 MySQL（用于兼容性）
          const dbConnection = await connectDatabase();
          logger.info('✅ MySQL connected successfully');
          
          // 初始化 Sequelize
          await testConnection();
          await syncDatabase();
          logger.info('✅ Sequelize database initialized successfully');
          
          logger.info('💡 数据库连接策略：连接数据库但不自动初始化，初始化在部署时完成');
        } catch (error) {
          logger.warn('⚠️ Database connection failed, continuing without database:', error);
        }
      } else {
        logger.info('⏭️ Skipping database connection (SKIP_DB_INIT=true or no MYSQL_HOST)');
      }

      // 连接 Redis
      if (process.env.REDIS_URI) {
        try {
          await connectRedis();
          logger.info('✅ Redis connected successfully');
        } catch (error) {
          logger.warn('⚠️ Redis connection failed, continuing without Redis:', error);
        }
      } else {
        logger.info('⏭️ Skipping Redis connection (no REDIS_URI)');
      }

      // 初始化 Socket 服务
      try {
        await this.socketService.initialize();
        logger.info('✅ Socket service initialized');
      } catch (error) {
        logger.warn('⚠️ Socket service initialization failed:', error);
      }

      // 启动指标服务
      try {
        await this.metricsService.initialize();
        logger.info('✅ Metrics service initialized');
      } catch (error) {
        logger.warn('⚠️ Metrics service initialization failed:', error);
      }

      // 启动健康检查服务
      try {
        await this.healthService.initialize();
        logger.info('✅ Health check service initialized');
      } catch (error) {
        logger.warn('⚠️ Health check service initialization failed:', error);
      }

      // 启动项目监控服务
      try {
        this.projectMonitorService.startMonitoring(5); // 每5分钟检查一次
        logger.info('✅ Project monitor service initialized');
      } catch (error) {
        logger.warn('⚠️ Project monitor service initialization failed:', error);
      }

      // 启动定时任务服务
      try {
        this.schedulerService.start();
        logger.info('✅ Scheduler service initialized');
      } catch (error) {
        logger.warn('⚠️ Scheduler service initialization failed:', error);
      }

      // 同步项目部署统计
      try {
        await this.projectService.syncProjectDeploymentStats();
        logger.info('✅ Project deployment stats synced');
      } catch (error) {
        logger.warn('⚠️ Project deployment stats sync failed:', error);
      }

      logger.info('🎉 All services initialization completed');

    } catch (error) {
      logger.error('❌ Service initialization error:', error);
      // 不退出进程，让基本的HTTP服务继续运行
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
