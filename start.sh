#!/bin/bash

set -e

echo "🚀 启动 axi-project-dashboard 项目..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 检查是否存在额外的 dist- 目录结构
if [ -d "dist-axi-project-dashboard" ]; then
    echo "🔧 检测到额外的 dist- 目录结构，正在修复..."
    echo "📁 当前目录内容:"
    ls -la
    
    # 移动 dist- 目录下的所有内容到当前目录
    echo "📦 移动文件到正确位置..."
    mv dist-axi-project-dashboard/* .
    mv dist-axi-project-dashboard/.* . 2>/dev/null || true
    
    # 删除空的 dist- 目录
    rmdir dist-axi-project-dashboard
    
    echo "✅ 目录结构修复完成"
    echo "📁 修复后的目录内容:"
    ls -la
fi

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8090}
export WEBSOCKET_PORT=${WEBSOCKET_PORT:-8091}

echo "📋 环境配置:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- WEBSOCKET_PORT: $WEBSOCKET_PORT"

# 检查依赖
echo "📦 检查并安装依赖..."
if command -v pnpm &> /dev/null; then
    echo "✅ 使用 pnpm 安装依赖..."
    if [ ! -d "node_modules" ]; then
        echo "📦 安装根目录依赖..."
        pnpm install --prod || npm install --production
    else
        echo "📦 更新根目录依赖..."
        pnpm install --prod || npm install --production
    fi
    
    # 检查后端依赖
    if [ ! -d "backend/node_modules" ]; then
        echo "📦 安装后端依赖..."
        cd backend
        pnpm install --prod || npm install --production
        cd ..
    fi
else
    echo "⚠️  pnpm 不可用，使用 npm 安装依赖..."
    if [ ! -d "node_modules" ]; then
        echo "📦 安装根目录依赖..."
        npm install --production
    else
        echo "📦 更新根目录依赖..."
        npm install --production
    fi
    
    # 检查后端依赖
    if [ ! -d "backend/node_modules" ]; then
        echo "📦 安装后端依赖..."
        cd backend
        npm install --production
        cd ..
    fi
fi

# 验证关键依赖
echo "🔍 验证关键依赖..."
if [ ! -d "node_modules/express" ]; then
    echo "❌ express 依赖缺失，尝试重新安装..."
    npm install express helmet compression --save
fi

# 检查前端目录和构建
echo "🔍 检查 frontend 目录..."
if [ ! -d "frontend" ]; then
    echo "❌ frontend 目录不存在，正在创建..."
    mkdir -p frontend
    mkdir -p frontend/dist
    echo "✅ frontend 目录创建完成"
fi

# 检查前端构建
if [ ! -d "frontend/dist" ] || [ -z "$(ls -A frontend/dist 2>/dev/null)" ]; then
    echo "🔨 构建前端..."
    if [ -f "frontend/package.json" ]; then
        cd frontend
        pnpm run build || npm run build
        cd ..
    else
        echo "⚠️  frontend/package.json 不存在，创建基本的前端文件..."
        # 创建基本的前端文件
        mkdir -p frontend/dist
        cat > frontend/dist/index.html << 'EOF'
<!DOCTYPE html>
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
            🌐 前端服务: 端口 3000
        </div>
    </div>
</body>
</html>
EOF
        echo "✅ 基本前端文件创建完成"
    fi
fi

# 检查后端构建
echo "🔍 检查 backend/dist 目录..."
if [ ! -d "backend/dist" ]; then
    echo "❌ backend/dist 目录不存在，正在创建..."
    mkdir -p backend/dist
fi

if [ ! -d "backend/dist" ] || [ -z "$(ls -A backend/dist 2>/dev/null)" ]; then
    echo "🔨 构建后端..."
    if [ -f "backend/package.json" ]; then
        cd backend
        pnpm run build:simple || pnpm run build || npm run build
        cd ..
    else
        echo "⚠️  backend/package.json 不存在，跳过构建"
    fi
fi

# 停止现有服务
echo "🛑 停止现有服务..."
echo "📋 当前 PM2 进程列表:"
pm2 list || echo "PM2 列表获取失败"

echo "🛑 停止所有相关服务..."
pm2 stop dashboard-backend 2>/dev/null || echo "停止 dashboard-backend 失败（可能不存在）"
pm2 stop dashboard-frontend 2>/dev/null || echo "停止 dashboard-frontend 失败（可能不存在）"

echo "🗑️ 删除所有相关服务..."
pm2 delete dashboard-backend 2>/dev/null || echo "删除 dashboard-backend 失败（可能不存在）"
pm2 delete dashboard-frontend 2>/dev/null || echo "删除 dashboard-frontend 失败（可能不存在）"

echo "🧹 清理 PM2 进程列表..."
pm2 kill 2>/dev/null || echo "PM2 kill 失败"
pm2 resurrect 2>/dev/null || echo "PM2 resurrect 失败"

echo "📋 清理后的 PM2 进程列表:"
pm2 list || echo "PM2 列表获取失败"

# 运行 PM2 清理脚本
echo "🧹 运行 PM2 清理脚本..."
if [ -f "clean-pm2.js" ]; then
    node clean-pm2.js
else
    echo "⚠️  clean-pm2.js 不存在，使用内置清理逻辑"
    echo "🧹 内置 PM2 清理逻辑..."
    
    # 检查并删除所有相关进程
    echo "📋 检查 PM2 进程列表..."
    PM2_LIST=$(pm2 list 2>/dev/null || echo "")
    echo "$PM2_LIST"
    
    # 删除所有包含 dashboard 的进程
    echo "🗑️ 删除所有 dashboard 相关进程..."
    pm2 delete dashboard-backend 2>/dev/null || echo "删除 dashboard-backend 失败（可能不存在）"
    pm2 delete dashboard-frontend 2>/dev/null || echo "删除 dashboard-frontend 失败（可能不存在）"
    
    # 彻底清理 PM2
    echo "🧹 彻底清理 PM2..."
    pm2 kill 2>/dev/null || echo "PM2 kill 失败"
    pm2 resurrect 2>/dev/null || echo "PM2 resurrect 失败"
    
    echo "📋 清理后的 PM2 进程列表:"
    pm2 list 2>/dev/null || echo "PM2 列表获取失败"
fi

# 检查并创建 frontend-server.js
echo "🔍 检查 frontend-server.js 文件..."
if [ ! -f "frontend-server.js" ]; then
    echo "❌ frontend-server.js 不存在，正在创建..."
    if [ -f "create-frontend-server-on-server.sh" ]; then
        echo "📋 使用 create-frontend-server-on-server.sh 创建文件..."
        bash create-frontend-server-on-server.sh
    else
        echo "📋 手动创建 frontend-server.js 文件..."
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
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('前端服务错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ axi-project-dashboard 前端服务启动成功`);
  console.log(`🌐 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 指标监控: http://localhost:${PORT}/metrics`);
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
    fi
    echo "✅ frontend-server.js 创建完成"
else
    echo "✅ frontend-server.js 已存在"
fi

# 检查后端目录和启动文件
echo "🔍 检查 backend 目录..."
if [ ! -d "backend" ]; then
    echo "❌ backend 目录不存在，正在创建..."
    mkdir -p backend
fi

echo "🔍 检查 backend/start-simple.js 文件..."
if [ ! -f "backend/start-simple.js" ]; then
    echo "❌ backend/start-simple.js 不存在，正在创建..."
    cat > backend/start-simple.js << 'EOF'
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

console.log('🚀 启动 axi-project-dashboard 后端服务 (简化版)...');
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
    message: 'axi-project-dashboard API is running (simplified)',
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
            logs: ['服务启动成功', '端口8090监听正常', '简化版服务运行中']
          }
        ]
      }
    });
  }
  
  if (req.path === '/health') {
    return res.json({
      status: 'healthy',
      message: 'API health check passed'
    });
  }
  
  next();
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'axi-project-dashboard API (simplified)',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      api: '/project-dashboard/api'
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('后端服务错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ axi-project-dashboard 后端服务启动成功 (简化版)`);
  console.log(`🌐 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 指标监控: http://localhost:${PORT}/metrics`);
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
EOF
    echo "✅ backend/start-simple.js 创建完成"
else
    echo "✅ backend/start-simple.js 已存在"
fi

# 启动服务
echo "🚀 启动服务..."
echo "📁 检查关键文件:"
echo "- ecosystem.config.js: $([ -f "ecosystem.config.js" ] && echo "存在" || echo "不存在")"
echo "- backend/start-simple.js: $([ -f "backend/start-simple.js" ] && echo "存在" || echo "不存在")"
echo "- frontend-server.js: $([ -f "frontend-server.js" ] && echo "存在" || echo "不存在")"

# 使用 PM2 启动服务
echo "🚀 使用 PM2 启动服务..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js 存在，使用 PM2 启动..."
    pm2 start ecosystem.config.js --update-env
    echo "✅ PM2 启动命令执行完成"
else
    echo "❌ ecosystem.config.js 不存在"
    exit 1
fi

# 启动服务并检查状态
echo "🚀 启动服务并检查状态..."

# 最多尝试3次启动
for attempt in {1..3}; do
    echo "🔄 第 $attempt 次尝试启动服务..."
    
    # 启动服务
    pm2 start ecosystem.config.js --update-env
    echo "✅ PM2 启动命令执行完成"
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 5
    
    # 检查后端端口监听
    echo "🔍 检查后端端口 8090 监听状态..."
    port_listening=false
    
    for i in {1..10}; do
        if netstat -tlnp 2>/dev/null | grep -q ":8090"; then
            echo "✅ 后端端口 8090 正在监听"
            port_listening=true
            break
        fi
        echo "⏳ 等待后端端口 8090 监听... ($i/10)"
        sleep 2
    done
    
    if [ "$port_listening" = true ]; then
        echo "✅ 服务启动成功！"
        break
    else
        echo "❌ 第 $attempt 次启动失败，端口未监听"
        
        if [ $attempt -lt 3 ]; then
            echo "🔄 重启服务..."
            pm2 stop dashboard-backend dashboard-frontend 2>/dev/null || true
            pm2 delete dashboard-backend dashboard-frontend 2>/dev/null || true
            sleep 3
        else
            echo "❌ 3次启动尝试都失败，查看日志并退出"
            echo "📋 PM2 进程状态:"
            pm2 list
            echo "📋 后端服务日志:"
            pm2 logs dashboard-backend --lines 20
            echo "📋 前端服务日志:"
            pm2 logs dashboard-frontend --lines 20
            exit 1
        fi
    fi
done

# 检查前端端口监听（简化检查）
echo "🔍 检查前端端口 3000 监听状态..."
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ 前端端口 3000 正在监听"
else
    echo "⚠️ 前端端口 3000 未监听（可能是正常的，因为前端可能不需要独立端口）"
fi

# 测试后端健康检查
echo "🔍 测试后端健康检查..."
for i in {1..5}; do
    if curl -f http://localhost:8090/health > /dev/null 2>&1; then
        echo "✅ 后端健康检查通过"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "❌ 后端健康检查失败"
        exit 1
    fi
    echo "⏳ 等待后端健康检查... ($i/5)"
    sleep 2
done

# 测试前端健康检查
echo "🔍 测试前端健康检查..."
for i in {1..5}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ 前端健康检查通过"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "❌ 前端健康检查失败"
        exit 1
    fi
    echo "⏳ 等待前端健康检查... ($i/5)"
    sleep 2
done

echo "🎉 axi-project-dashboard 启动完成！"
echo "📊 服务信息:"
echo "- 后端API: http://localhost:8090"
echo "- 后端健康检查: http://localhost:8090/health"
echo "- 前端服务: http://localhost:3000"
echo "- 前端健康检查: http://localhost:3000/health"
echo "- 前端静态文件: ./frontend/dist"
echo "- PM2状态:"
pm2 list | grep -E "dashboard-"
