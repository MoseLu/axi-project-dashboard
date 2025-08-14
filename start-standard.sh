#!/bin/bash

set -e

echo "🚀 启动 axi-project-dashboard 项目 (标准版)..."

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

# 构建项目
echo "🔨 构建项目..."
pnpm run build || npm run build

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop dashboard-backend 2>/dev/null || echo "停止 dashboard-backend 失败（可能不存在）"
pm2 stop dashboard-frontend 2>/dev/null || echo "停止 dashboard-frontend 失败（可能不存在）"
pm2 delete dashboard-backend 2>/dev/null || echo "删除 dashboard-backend 失败（可能不存在）"
pm2 delete dashboard-frontend 2>/dev/null || echo "删除 dashboard-frontend 失败（可能不存在）"

# 直接使用项目标准启动命令
echo "🚀 使用项目标准启动命令..."
echo "📋 启动后端服务..."
pm2 start --name dashboard-backend --cwd /srv/apps/axi-project-dashboard --env production pnpm -- start

echo "📋 启动前端服务..."
pm2 start --name dashboard-frontend --cwd /srv/apps/axi-project-dashboard --env production pnpm -- run dev:fast

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
pm2 list | grep -E "dashboard-"

echo "🎉 axi-project-dashboard 启动完成！"
echo "📊 服务信息:"
echo "- 后端API: http://localhost:8090"
echo "- 前端服务: http://localhost:3000"
echo "- PM2状态:"
pm2 list | grep -E "dashboard-"
