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

// 认证端点
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 登录请求:', req.body);
  
  // 简化的登录逻辑（仅用于测试）
  const { username, password } = req.body;
  
  if (username && password) {
    // 模拟成功登录
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: 1,
          username: username,
          email: `${username}@example.com`,
          role: 'admin'
        },
        token: 'mock-jwt-token-' + Date.now(),
        expiresIn: 3600
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log('🚪 登出请求');
  res.json({
    success: true,
    message: '登出成功'
  });
});

app.post('/api/auth/register', (req, res) => {
  console.log('📝 注册请求:', req.body);
  
  const { username, email, password } = req.body;
  
  if (username && email && password) {
    res.json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: Date.now(),
          username: username,
          email: email,
          role: 'user'
        }
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: '用户名、邮箱和密码不能为空'
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  console.log('👤 获取用户信息请求');
  
  // 模拟用户信息
  res.json({
    success: true,
    data: {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
  });
});

// 部署相关端点
app.get('/api/deployments', (req, res) => {
  console.log('📦 获取部署列表请求');
  
  res.json({
    success: true,
    data: {
      deployments: [
        {
          id: 1,
          project: 'axi-project-dashboard',
          status: 'running',
          startTime: new Date().toISOString(),
          endTime: null,
          logs: ['服务启动成功', '端口8090监听正常', '简化版服务运行中']
        }
      ]
    }
  });
});

app.post('/api/deployments', (req, res) => {
  console.log('🚀 创建部署请求:', req.body);
  
  res.json({
    success: true,
    message: '部署创建成功',
    data: {
      deployment: {
        id: Date.now(),
        project: req.body.project || 'unknown',
        status: 'pending',
        startTime: new Date().toISOString()
      }
    }
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
      apiStatus: '/api/status',
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me'
      },
      deployments: {
        list: 'GET /api/deployments',
        create: 'POST /api/deployments'
      }
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
