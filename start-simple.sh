#!/bin/bash

# AXI Project Dashboard 简化启动脚本
# 用于快速启动已构建的项目

set -e

echo "🚀 启动 AXI Project Dashboard..."

# 创建必要目录
mkdir -p logs
mkdir -p backend/logs
mkdir -p uploads/avatars

# 停止现有服务
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 启动服务
echo "📦 启动 PM2 服务..."
pm2 start ecosystem.config.js --env production

# 保存配置
pm2 save

echo "✅ AXI Project Dashboard 启动完成！"
echo "📊 服务状态:"
pm2 status

echo "🌐 访问地址:"
echo "前端: http://localhost:3000"
echo "后端API: http://localhost:8090"
echo "健康检查: http://localhost:8090/health"
