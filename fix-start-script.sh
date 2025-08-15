#!/bin/bash

echo "🔧 修复启动脚本逻辑..."

# 检查当前 start.sh 是否包含旧的逻辑
if grep -q "等待后端端口.*监听.*(.*/15)" start.sh; then
    echo "❌ 检测到旧版本的启动逻辑，正在修复..."
    
    # 备份原文件
    cp start.sh start.sh.backup
    
    # 使用 sed 快速修复
    sed -i 's/for i in {1\.\.15}; do/for i in {1..10}; do/g' start.sh
    sed -i 's/等待后端端口 8090 监听\.\.\. (\([0-9]*\)\/15)/等待后端端口 8090 监听... (\1\/10)/g' start.sh
    sed -i 's/等待后端端口 3000 监听\.\.\. (\([0-9]*\)\/15)/等待后端端口 3000 监听... (\1\/10)/g' start.sh
    
    echo "✅ 启动脚本已修复"
else
    echo "✅ 启动脚本逻辑正确"
fi

# 检查是否包含重试逻辑
if grep -q "第.*次尝试启动服务" start.sh; then
    echo "✅ 重试逻辑已存在"
else
    echo "⚠️ 重试逻辑缺失，需要重新部署"
fi

echo "🔧 修复完成"
