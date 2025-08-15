#!/bin/bash

echo "🔧 开始修复部署数据..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 backend 目录中运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install || npm install
fi

# 运行数据修复脚本
echo "🔄 运行数据修复脚本..."
pnpm run fix:deployment-data || npm run fix:deployment-data

echo "✅ 数据修复完成"
