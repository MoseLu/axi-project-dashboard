#!/usr/bin/env node

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 中间件
app.use(helmet({
  contentSecurityPolicy: false  // 简化CSP配置
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
  console.log(`${new Date().toISOString()} [INFO]: ${req.method} ${req.path} - ${req.ip}`);
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
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8081,
    services: {
      http: 'up',
      database: 'unknown',
      redis: 'unknown'
    }
  });
});

// API 信息端点
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'axi-project-dashboard',
      description: 'Deployment progress visualization dashboard',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      port: process.env.PORT || 8081
    }
  });
});

// 部署状态端点（简化版本）
app.get('/api/deployments', (req, res) => {
  res.json({
    success: true,
    message: 'Deployments endpoint - Coming soon!',
    data: []
  });
});

// 项目列表端点（简化版本）
app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    message: 'Projects endpoint - Coming soon!',
    data: []
  });
});

// 指标端点（简化版本）
app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    message: 'Metrics endpoint - Coming soon!',
    data: {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      averageDeploymentTime: 0
    }
  });
});

// GitHub Webhook 端点（简化版本）
app.post('/api/webhooks/github', (req, res) => {
  console.log('GitHub webhook received:', {
    headers: req.headers,
    body: req.body
  });
  
  res.json({
    success: true,
    message: 'Webhook received successfully'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /api/info',
      'GET /api/deployments',
      'GET /api/projects',
      'GET /api/metrics',
      'POST /api/webhooks/github'
    ]
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
const port = process.env.PORT || 8081;
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${port}/api`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
