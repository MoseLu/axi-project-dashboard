#!/bin/bash

echo "🚀 在服务器上创建 frontend-server.js 文件..."

cat > /srv/apps/axi-project-dashboard/frontend-server.js << 'EOF'
#!/usr/bin/env node

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

// 创建 Express 应用
const app = express();

// 获取端口配置
const PORT = process.env.FRONTEND_PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 启动 axi-project-dashboard 前端服务...');
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 静态文件服务
const staticPath = path.join(__dirname, 'frontend', 'dist');
console.log(`📁 静态文件路径: ${staticPath}`);

// 检查静态文件目录是否存在
const fs = require('fs');
if (!fs.existsSync(staticPath)) {
  console.error(`❌ 静态文件目录不存在: ${staticPath}`);
  console.log('📁 当前目录内容:');
  try {
    const files = fs.readdirSync(__dirname);
    console.log(files);
    
    if (fs.existsSync(path.join(__dirname, 'frontend'))) {
      console.log('📁 frontend 目录内容:');
      const frontendFiles = fs.readdirSync(path.join(__dirname, 'frontend'));
      console.log(frontendFiles);
    }
  } catch (error) {
    console.error('读取目录失败:', error.message);
  }
  process.exit(1);
}

app.use(express.static(staticPath, {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard frontend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      http: 'up',
      static: 'up'
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

// SPA 路由处理 - 所有未匹配的路由都返回 index.html
app.get('*', (req, res) => {
  // 如果是 API 请求，返回 404
  if (req.path.startsWith('/api') || req.path.startsWith('/project-dashboard/api')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found on frontend server',
      timestamp: new Date().toISOString()
    });
  }
  
  // 对于其他请求，返回 index.html（SPA 路由）
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Frontend not built properly',
      timestamp: new Date().toISOString()
    });
  }
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
app.listen(PORT, () => {
  console.log(`✅ Frontend server is running on port ${PORT}`);
  console.log(`🔗 Frontend URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`📁 Static files: ${staticPath}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
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
EOF

chmod +x /srv/apps/axi-project-dashboard/frontend-server.js
echo "✅ frontend-server.js 文件创建完成！"
echo "📁 文件位置: /srv/apps/axi-project-dashboard/frontend-server.js"
echo "🔍 验证文件:"
ls -la /srv/apps/axi-project-dashboard/frontend-server.js
