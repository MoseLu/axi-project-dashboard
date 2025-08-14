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
if [ ! -d "backend/dist" ]; then
    echo "🔨 构建后端..."
    cd backend
    pnpm run build:simple || pnpm run build
    cd ..
fi

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop dashboard-backend dashboard-frontend 2>/dev/null || true
pm2 delete dashboard-backend dashboard-frontend 2>/dev/null || true

# 启动服务
echo "🚀 启动服务..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    # 分别启动前端和后端
    echo "🚀 启动后端服务..."
    cd backend
    pm2 start start-server.js --name dashboard-backend --env production
    cd ..
    
    echo "🚀 启动前端服务..."
    pm2 start frontend-server.js --name dashboard-frontend --env production
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
if pm2 list | grep -q "dashboard-backend"; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    pm2 logs dashboard-backend --lines 10
    exit 1
fi

if pm2 list | grep -q "dashboard-frontend"; then
    echo "✅ 前端服务启动成功"
else
    echo "❌ 前端服务启动失败"
    pm2 logs dashboard-frontend --lines 10
    exit 1
fi

# 检查后端端口监听
echo "🔍 检查后端端口 $PORT 监听状态..."
for i in {1..15}; do
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT"; then
        echo "✅ 后端端口 $PORT 正在监听"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ 后端端口 $PORT 未在30秒内开始监听"
        pm2 logs dashboard-backend --lines 10
        exit 1
    fi
    echo "⏳ 等待后端端口 $PORT 监听... ($i/15)"
    sleep 2
done

# 检查前端端口监听
FRONTEND_PORT=3000
echo "🔍 检查前端端口 $FRONTEND_PORT 监听状态..."
for i in {1..10}; do
    if netstat -tlnp 2>/dev/null | grep -q ":$FRONTEND_PORT"; then
        echo "✅ 前端端口 $FRONTEND_PORT 正在监听"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ 前端端口 $FRONTEND_PORT 未在20秒内开始监听"
        pm2 logs dashboard-frontend --lines 10
        exit 1
    fi
    echo "⏳ 等待前端端口 $FRONTEND_PORT 监听... ($i/10)"
    sleep 2
done

# 测试后端健康检查
echo "🔍 测试后端健康检查..."
for i in {1..5}; do
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
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

# 测试前端服务
echo "🔍 测试前端服务..."
for i in {1..3}; do
    if curl -f http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo "✅ 前端服务测试通过"
        break
    fi
    if [ $i -eq 3 ]; then
        echo "❌ 前端服务测试失败"
        exit 1
    fi
    echo "⏳ 等待前端服务测试... ($i/3)"
    sleep 2
done

echo "🎉 axi-project-dashboard 启动完成！"
echo "📊 服务信息:"
echo "- 后端API: http://localhost:$PORT"
echo "- 后端健康检查: http://localhost:$PORT/health"
echo "- 前端服务: http://localhost:$FRONTEND_PORT"
echo "- 前端静态文件: ./frontend/dist"
echo "- PM2状态:"
pm2 list | grep -E "(dashboard-backend|dashboard-frontend)"
