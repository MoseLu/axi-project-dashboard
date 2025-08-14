#!/usr/bin/env node

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 获取端口配置
const PORT = process.env.PORT || 8090;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 启动 axi-project-dashboard 后端服务...');
console.log(`📊 环境: ${NODE_ENV}`);
console.log(`🔌 端口: ${PORT}`);

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
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
});

// 指标端点
app.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

// API 路由
app.use('/project-dashboard/api', (req, res, next) => {
  // 模拟部署服务
  if (req.path === '/deployments') {
    return res.json({
      success: true,
      data: {
        deployments: [
          {
            id: '1',
            project: 'axi-project-dashboard',
            status: 'running',
            startTime: new Date().toISOString(),
            endTime: null,
            logs: ['服务启动成功', '端口8090监听正常']
          }
        ]
      }
    });
  }
  
  if (req.path === '/health') {
    return res.json({
      success: true,
      data: {
        status: 'healthy',
        services: {
          http: 'up',
          database: 'unknown',
          redis: 'unknown'
        }
      }
    });
  }
  
  next();
});

// 静态文件服务
app.use('/static', express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/project-dashboard/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  
  if (NODE_ENV === 'development') {
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
