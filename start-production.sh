#!/bin/bash

set -e

echo "🚀 启动 axi-project-dashboard 项目 (生产环境)..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8090}

echo "📋 环境配置:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"

# 检查并安装依赖
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装根目录依赖..."
    pnpm install --prod || npm install --production
fi

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend
    pnpm install --prod || npm install --production
    cd ..
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend
    pnpm install --prod || npm install --production
    cd ..
fi

# 检查并创建 frontend-server.js
echo "🔍 检查 frontend-server.js 文件..."
if [ ! -f "frontend-server.js" ]; then
    echo "❌ frontend-server.js 不存在，正在创建..."
    cat > frontend-server.js << 'EOF'
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
  
  // 创建基本的静态文件
  console.log('📁 创建基本的静态文件...');
  const basicHtmlPath = path.join(staticPath, 'index.html');
  fs.mkdirSync(staticPath, { recursive: true });
  
  const basicHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>axi-project-dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        h1 {
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        p {
            font-size: 1.2em;
            margin-bottom: 10px;
        }
        .status {
            background: rgba(0, 255, 0, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 axi-project-dashboard</h1>
        <p>项目部署管理系统</p>
        <p>前端服务运行正常</p>
        <div class="status">
            ✅ 服务状态: 运行中<br>
            📊 后端API: <a href="/health" style="color: #fff;">健康检查</a><br>
            🌐 前端服务: 端口 ${PORT}
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(basicHtmlPath, basicHtml);
  console.log('✅ 基本静态文件创建完成');
}

// 提供静态文件服务
app.use(express.static(staticPath, {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'axi-project-dashboard-frontend',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT
  });
});

// 所有其他请求返回 index.html (SPA 支持)
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 前端服务启动成功！`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在关闭前端服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，正在关闭前端服务...');
  process.exit(0);
});
EOF
    echo "✅ frontend-server.js 创建完成"
fi

# 构建后端
echo "🔨 构建后端..."
if [ -f "backend/package.json" ]; then
    cd backend
    pnpm run build:simple || pnpm run build || npm run build
    cd ..
else
    echo "⚠️  backend/package.json 不存在，跳过构建"
fi

# 构建前端
echo "🔨 构建前端..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    pnpm run build || npm run build
    cd ..
else
    echo "⚠️  frontend/package.json 不存在，跳过构建"
fi

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop dashboard-backend 2>/dev/null || echo "停止 dashboard-backend 失败（可能不存在）"
pm2 stop dashboard-frontend 2>/dev/null || echo "停止 dashboard-frontend 失败（可能不存在）"
pm2 delete dashboard-backend 2>/dev/null || echo "删除 dashboard-backend 失败（可能不存在）"
pm2 delete dashboard-frontend 2>/dev/null || echo "删除 dashboard-frontend 失败（可能不存在）"

# 启动后端服务
echo "🚀 启动后端服务..."
if [ -f "backend/dist/index.js" ]; then
    pm2 start ecosystem.config.js --only dashboard-backend
else
    echo "❌ 后端构建文件不存在，尝试直接启动..."
    pm2 start --name dashboard-backend --cwd /srv/apps/axi-project-dashboard node -- backend/index.js
fi

# 启动前端服务
echo "🚀 启动前端服务..."
pm2 start ecosystem.config.js --only dashboard-frontend

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
pm2 list | grep -E "dashboard-"

echo "🎉 axi-project-dashboard 启动完成！"
echo "📊 服务信息:"
echo "- 后端API: http://localhost:8090"
echo "- 前端服务: http://localhost:3000"
echo "- PM2状态:"
pm2 list | grep -E "dashboard-"
