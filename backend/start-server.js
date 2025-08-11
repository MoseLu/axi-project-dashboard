#!/usr/bin/env node

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 简单的内存存储
const deploymentStore = {
  deployments: [],
  metrics: {
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    averageDeploymentTime: 0
  }
};

// 添加部署记录的函数
function addDeployment(project, status, duration = 0) {
  const deployment = {
    id: Date.now(),
    project,
    status,
    duration,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  deploymentStore.deployments.unshift(deployment); // 添加到开头
  deploymentStore.deployments = deploymentStore.deployments.slice(0, 50); // 只保留最近50条
  
  // 更新指标
  deploymentStore.metrics.totalDeployments++;
  if (status === 'success') {
    deploymentStore.metrics.successfulDeployments++;
  } else {
    deploymentStore.metrics.failedDeployments++;
  }
  
  // 计算平均部署时间
  const successfulDeployments = deploymentStore.deployments.filter(d => d.status === 'success' && d.duration > 0);
  if (successfulDeployments.length > 0) {
    const totalTime = successfulDeployments.reduce((sum, d) => sum + d.duration, 0);
    deploymentStore.metrics.averageDeploymentTime = Math.round(totalTime / successfulDeployments.length);
  }
  
  console.log(`📊 部署记录已添加: ${project} - ${status}`);
}

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
    port: process.env.PORT || 8090,
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
      port: process.env.PORT || 8090
    }
  });
});

// 部署状态端点
app.get('/api/deployments', (req, res) => {
  res.json({
    success: true,
    message: 'Deployments retrieved successfully',
    data: deploymentStore.deployments
  });
});

// 项目列表端点
app.get('/api/projects', (req, res) => {
  const projects = [...new Set(deploymentStore.deployments.map(d => d.project))];
  res.json({
    success: true,
    message: 'Projects retrieved successfully',
    data: projects
  });
});

// 指标端点
app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    message: 'Metrics retrieved successfully',
    data: deploymentStore.metrics
  });
});

// 手动添加部署记录端点（用于测试）
app.post('/api/deployments', (req, res) => {
  try {
    const { project, status, duration } = req.body;
    
    if (!project || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project, status'
      });
    }
    
    addDeployment(project, status, duration || 0);
    
    res.json({
      success: true,
      message: 'Deployment record added successfully',
      data: { project, status, duration }
    });
  } catch (error) {
    console.error('添加部署记录时出错:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GitHub Webhook 端点
app.post('/api/webhooks/github', (req, res) => {
  console.log('GitHub webhook received:', {
    headers: req.headers,
    body: req.body
  });
  
  try {
    const { repository, workflow_run, action } = req.body;
    
    if (repository && workflow_run) {
      const project = repository.name;
      const status = workflow_run.conclusion === 'success' ? 'success' : 'failed';
      const duration = workflow_run.duration ? Math.round(workflow_run.duration / 1000) : 0; // 转换为秒
      
      addDeployment(project, status, duration);
      
      console.log(`📊 记录部署: ${project} - ${status} (${duration}s)`);
    }
  } catch (error) {
    console.error('处理 webhook 时出错:', error);
  }
  
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
const port = process.env.PORT || 8090;
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
