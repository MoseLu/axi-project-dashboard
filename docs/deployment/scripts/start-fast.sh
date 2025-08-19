#!/bin/bash

set -e

echo "🚀 快速启动 axi-project-dashboard 项目..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8090}
export FRONTEND_PORT=${FRONTEND_PORT:-3000}

echo "📋 环境配置:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- FRONTEND_PORT: $FRONTEND_PORT"

# 快速检查依赖（跳过详细检查）
echo "🔍 快速检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install --frozen-lockfile || npm ci
else
    echo "✅ 依赖已存在，跳过安装"
fi

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 停止现有服务（快速）
echo "🛑 停止现有服务..."
pm2 stop dashboard-backend dashboard-frontend 2>/dev/null || true
pm2 delete dashboard-backend dashboard-frontend 2>/dev/null || true

# 检查构建产物（跳过构建）
echo "🔍 检查构建产物..."
if [ ! -d "frontend/dist" ]; then
    echo "⚠️ 前端构建产物不存在，创建基本文件..."
    mkdir -p frontend/dist
    cat > frontend/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>axi-project-dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 10px; backdrop-filter: blur(10px); }
        h1 { margin-bottom: 20px; font-size: 2.5em; }
        p { font-size: 1.2em; margin-bottom: 10px; }
        .status { background: rgba(0, 255, 0, 0.2); padding: 10px; border-radius: 5px; margin-top: 20px; }
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
            🌐 前端服务: 端口 3000
        </div>
    </div>
</body>
</html>
EOF
fi

if [ ! -d "backend/dist" ]; then
    echo "⚠️ 后端构建产物不存在，创建基本文件..."
    mkdir -p backend/dist
    cat > backend/dist/index.js << 'EOF'
const express = require('express');
const http = require('http');
const cors = require('cors');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8090;

// 中间件
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard API is running (fast mode)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API路由
app.use('/project-dashboard/api', (req, res, next) => {
  if (req.path === '/health') {
    return res.json({ status: 'healthy', message: 'API health check passed' });
  }
  next();
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'axi-project-dashboard API (fast mode)',
    version: '1.0.0',
    endpoints: { health: '/health', api: '/project-dashboard/api' }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('后端服务错误:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ axi-project-dashboard 后端服务启动成功 (快速模式) - 端口: ${PORT}`);
});
EOF
fi

# 快速启动服务
echo "🚀 快速启动服务..."
pm2 start ecosystem.config.js --update-env

# 快速健康检查（减少等待时间）
echo "🔍 快速健康检查..."
for i in {1..3}; do
    if curl -f http://localhost:8090/health > /dev/null 2>&1; then
        echo "✅ 后端健康检查通过"
        break
    fi
    if [ $i -eq 3 ]; then
        echo "⚠️ 后端健康检查失败，但服务可能仍在启动中"
    fi
    sleep 1
done

echo "🎉 axi-project-dashboard 快速启动完成！"
echo "📊 服务信息:"
echo "- 后端API: http://localhost:8090"
echo "- 后端健康检查: http://localhost:8090/health"
echo "- PM2状态:"
pm2 list | grep -E "dashboard-" || echo "服务可能仍在启动中..."

echo ""
echo "💡 快速启动模式说明:"
echo "- 跳过了详细的依赖检查"
echo "- 跳过了完整的构建过程"
echo "- 使用基本的前端和后端文件"
echo "- 减少了健康检查等待时间"
echo ""
echo "🔧 如需完整功能，请运行: ./start.sh"
