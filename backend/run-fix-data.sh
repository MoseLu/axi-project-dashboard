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
echo "尝试使用 TypeScript 版本..."
if pnpm run fix:deployment-data 2>/dev/null || npm run fix:deployment-data 2>/dev/null; then
    echo "✅ TypeScript 版本运行成功"
else
    echo "⚠️ TypeScript 版本失败，尝试使用 JavaScript 版本..."
    if pnpm run fix:deployment-data:js 2>/dev/null || npm run fix:deployment-data:js 2>/dev/null; then
        echo "✅ JavaScript 版本运行成功"
    else
            echo "❌ 两种版本都失败了"
    echo "尝试直接运行 JavaScript 文件..."
    node fix-deployment-data.js
    fi
fi

echo "✅ 数据修复完成"
