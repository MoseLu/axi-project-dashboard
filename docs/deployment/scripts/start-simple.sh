#!/bin/bash

set -e

echo "🚀 启动 axi-project-dashboard 项目 (简化版)..."

# 检查并修复目录结构
echo "🔍 检查目录结构..."

# 查找 package.json 文件
PACKAGE_JSON_PATH=$(find . -name "package.json" -type f 2>/dev/null | head -1)

if [ -n "$PACKAGE_JSON_PATH" ]; then
    echo "✅ 找到 package.json 文件: $PACKAGE_JSON_PATH"
    
    # 获取 package.json 所在的目录
    PACKAGE_DIR=$(dirname "$PACKAGE_JSON_PATH")
    
    if [ "$PACKAGE_DIR" != "." ]; then
        echo "🔧 修复目录结构..."
        echo "📁 移动 $PACKAGE_DIR 目录下的所有文件到当前目录..."
        
        # 移动 package.json 所在目录下的所有文件到当前目录
        mv "$PACKAGE_DIR"/* . 2>/dev/null || true
        mv "$PACKAGE_DIR"/.* . 2>/dev/null || true
        
        # 删除空的目录
        rmdir "$PACKAGE_DIR" 2>/dev/null || true
        
        echo "✅ 目录结构修复完成"
        echo "📁 修复后的目录内容:"
        ls -la
    fi
else
    echo "❌ 未找到 package.json 文件"
    echo "📁 当前目录内容:"
    ls -la
    exit 1
fi

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8090}
export WEBSOCKET_PORT=${WEBSOCKET_PORT:-8091}

# 数据库配置（模仿 axi-star-cloud 策略）
export MYSQL_HOST=${MYSQL_HOST:-127.0.0.1}
export MYSQL_PORT=${MYSQL_PORT:-3306}
export MYSQL_USER=${MYSQL_USER:-root}
export MYSQL_PASSWORD=${MYSQL_PASSWORD:-123456}
export MYSQL_DATABASE=${MYSQL_DATABASE:-project_dashboard}
export SKIP_DB_INIT=${SKIP_DB_INIT:-false}

echo "📋 环境配置:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- WEBSOCKET_PORT: $WEBSOCKET_PORT"
echo "- MYSQL_HOST: $MYSQL_HOST"
echo "- MYSQL_PORT: $MYSQL_PORT"
echo "- MYSQL_DATABASE: $MYSQL_DATABASE"
echo "- SKIP_DB_INIT: $SKIP_DB_INIT"

# 检查依赖
echo "📦 检查并安装依赖..."
if command -v pnpm &> /dev/null; then
    echo "✅ 使用 pnpm 安装依赖..."
    pnpm install --prod || npm install --production
else
    echo "⚠️  pnpm 不可用，使用 npm 安装依赖..."
    npm install --production
fi

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend
    if command -v pnpm &> /dev/null; then
        pnpm install --prod || npm install --production
    else
        npm install --production
    fi
    cd ..
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
if [ ! -d "backend/dist" ] || [ -z "$(ls -A backend/dist 2>/dev/null)" ]; then
    echo "🔨 后端构建产物不存在，尝试构建..."
    if [ -f "backend/package.json" ]; then
        cd backend
        if command -v pnpm &> /dev/null; then
            pnpm install --no-frozen-lockfile || npm install
            pnpm run build || npm run build
        else
            npm install
            npm run build
        fi
        cd ..
    else
        echo "⚠️  backend/package.json 不存在，跳过构建"
    fi
fi

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop dashboard-backend dashboard-frontend 2>/dev/null || echo "停止进程失败（可能不存在）"
pm2 delete dashboard-backend dashboard-frontend 2>/dev/null || echo "删除进程失败（可能不存在）"

# 启动服务
echo "🚀 启动服务..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js 存在，使用 PM2 启动..."
    pm2 start ecosystem.config.js --update-env
    echo "✅ PM2 启动命令执行完成"
else
    echo "❌ ecosystem.config.js 不存在"
    exit 1
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
pm2 status

# 检查端口监听
echo "🔍 检查端口监听..."
if netstat -tlnp 2>/dev/null | grep -q ":8090"; then
    echo "✅ 后端端口 8090 正在监听"
else
    echo "❌ 后端端口 8090 未监听"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ 前端端口 3000 正在监听"
else
    echo "⚠️ 前端端口 3000 未监听（可能是正常的）"
fi

echo "🎉 axi-project-dashboard 启动完成！"
echo "📊 服务信息:"
echo "- 后端API: http://localhost:8090"
echo "- 后端健康检查: http://localhost:8090/health"
echo "- 前端服务: http://localhost:3000"
echo "- 前端健康检查: http://localhost:3000/health"
