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

# 启动服务
echo "🚀 启动服务..."
echo "📁 检查关键文件:"
echo "- ecosystem.config.js: $([ -f "ecosystem.config.js" ] && echo "存在" || echo "不存在")"
echo "- backend/start-simple.js: $([ -f "backend/start-simple.js" ] && echo "存在" || echo "不存在")"
echo "- frontend-server.js: $([ -f "frontend-server.js" ] && echo "存在" || echo "不存在")"

# 检查前端构建
if [ ! -d "frontend/dist" ]; then
    echo "🔨 构建前端..."
    cd frontend
    pnpm run build
    cd ..
fi

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

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查后端端口监听
echo "🔍 检查后端端口 8090 监听状态..."
for i in {1..15}; do
    if netstat -tlnp 2>/dev/null | grep -q ":8090"; then
        echo "✅ 后端端口 8090 正在监听"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ 后端端口 8090 未在30秒内开始监听"
        pm2 logs dashboard-backend --lines 10
        exit 1
    fi
    echo "⏳ 等待后端端口 8090 监听... ($i/15)"
    sleep 2
done

# 检查前端端口监听
echo "🔍 检查前端端口 3000 监听状态..."
for i in {1..15}; do
    if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        echo "✅ 前端端口 3000 正在监听"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ 前端端口 3000 未在30秒内开始监听"
        pm2 logs dashboard-frontend --lines 10
        exit 1
    fi
    echo "⏳ 等待前端端口 3000 监听... ($i/15)"
    sleep 2
done

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
