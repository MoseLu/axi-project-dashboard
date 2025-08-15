#!/usr/bin/env node

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

console.log('🚀 启动 axi-project-dashboard 简化后端服务...');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 获取端口配置
const PORT = process.env.PORT || 8090;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`📊 环境: ${NODE_ENV}`);
console.log(`🔌 端口: ${PORT}`);

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'axi-project-dashboard-backend',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT,
    version: '1.0.0'
  });
});

// API 状态端点
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'axi-project-dashboard Backend API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: '/health',
      apiStatus: '/api/status'
    }
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`✅ 后端服务启动成功！`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔗 API状态: http://localhost:${PORT}/api/status`);
  console.log(`🔌 端口监听: ${PORT}`);
  
  // 验证端口监听
  const net = require('net');
  const testServer = net.createServer();
  testServer.listen(PORT, () => {
    console.log(`✅ 端口 ${PORT} 监听验证成功`);
    testServer.close();
  });
  testServer.on('error', (err) => {
    console.log(`❌ 端口 ${PORT} 监听验证失败: ${err.message}`);
  });
  
  // 发送心跳信号
  setInterval(() => {
    console.log(`💓 心跳信号 - ${new Date().toISOString()} - 服务运行正常 - 端口: ${PORT}`);
  }, 30000); // 每30秒发送一次心跳
});

// 添加错误处理
server.on('error', (err) => {
  console.error(`❌ 服务器启动失败: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
    process.exit(1);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在关闭后端服务...');
  server.close(() => {
    console.log('✅ 后端服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，正在关闭后端服务...');
  server.close(() => {
    console.log('✅ 后端服务已关闭');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  server.close(() => {
    console.log('✅ 后端服务已关闭');
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  server.close(() => {
    console.log('✅ 后端服务已关闭');
    process.exit(1);
  });
});

console.log('🎉 简化后端服务初始化完成，等待连接...');
