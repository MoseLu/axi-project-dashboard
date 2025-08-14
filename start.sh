#!/bin/bash

set -e

echo "🚀 启动 axi-project-dashboard 项目..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
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
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install --prod
fi

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend
    pnpm install --prod
    cd ..
fi

# 检查前端构建
if [ ! -d "frontend/dist" ]; then
    echo "🔨 构建前端..."
    cd frontend
    pnpm run build
    cd ..
fi

# 检查后端构建
if [ ! -d "backend/dist" ] && [ ! -f "backend/index.js" ]; then
    echo "🔨 构建后端..."
    cd backend
    pnpm run build
    cd ..
fi

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop dashboard-backend 2>/dev/null || true
pm2 delete dashboard-backend 2>/dev/null || true

# 启动后端服务
echo "🚀 启动后端服务..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    cd backend
    pm2 start index.js --name dashboard-backend --env production
    cd ..
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
pm2 status

# 检查端口监听
echo "🔍 检查端口监听..."
if netstat -tlnp 2>/dev/null | grep -q ":$PORT"; then
    echo "✅ 端口 $PORT 正在监听"
else
    echo "❌ 端口 $PORT 未监听"
    echo "📋 PM2 日志:"
    pm2 logs dashboard-backend --lines 10
    exit 1
fi

# 健康检查
echo "🏥 健康检查..."
for i in {1..6}; do
    echo "尝试 $i/6..."
    if curl -f "http://localhost:$PORT/health" >/dev/null 2>&1; then
        echo "✅ 健康检查成功"
        break
    else
        echo "❌ 健康检查失败"
        if [ $i -eq 6 ]; then
            echo "📋 PM2 日志:"
            pm2 logs dashboard-backend --lines 10
            exit 1
        fi
        sleep 5
    fi
done

echo "🎉 axi-project-dashboard 启动成功！"
echo "🌐 访问地址: http://localhost:$PORT"
echo "📊 PM2 状态:"
pm2 status
