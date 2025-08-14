#!/bin/bash

echo "🧪 测试 axi-project-dashboard 启动修复..."

# 检查关键文件是否存在
echo "📁 检查关键文件:"
echo "- start.sh: $([ -f "start.sh" ] && echo "✅ 存在" || echo "❌ 不存在")"
echo "- ecosystem.config.js: $([ -f "ecosystem.config.js" ] && echo "✅ 存在" || echo "❌ 不存在")"
echo "- frontend-server.js: $([ -f "frontend-server.js" ] && echo "✅ 存在" || echo "❌ 不存在")"
echo "- backend/start-simple.js: $([ -f "backend/start-simple.js" ] && echo "✅ 存在" || echo "❌ 不存在")"

# 检查目录结构
echo "📁 检查目录结构:"
echo "- frontend: $([ -d "frontend" ] && echo "✅ 存在" || echo "❌ 不存在")"
echo "- frontend/dist: $([ -d "frontend/dist" ] && echo "✅ 存在" || echo "❌ 不存在")"
echo "- backend: $([ -d "backend" ] && echo "✅ 存在" || echo "❌ 不存在")"
echo "- backend/dist: $([ -d "backend/dist" ] && echo "✅ 存在" || echo "❌ 不存在")"

# 检查 PM2 是否安装
echo "🔍 检查 PM2:"
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 已安装: $(pm2 --version)"
else
    echo "❌ PM2 未安装"
fi

# 检查端口占用
echo "🔍 检查端口占用:"
echo "- 端口 8090: $(netstat -tlnp 2>/dev/null | grep -q ":8090" && echo "❌ 被占用" || echo "✅ 可用")"
echo "- 端口 3000: $(netstat -tlnp 2>/dev/null | grep -q ":3000" && echo "❌ 被占用" || echo "✅ 可用")"

# 检查依赖
echo "📦 检查依赖:"
echo "- node_modules: $([ -d "node_modules" ] && echo "✅ 存在" || echo "❌ 不存在")"
echo "- backend/node_modules: $([ -d "backend/node_modules" ] && echo "✅ 存在" || echo "❌ 不存在")"

echo "🧪 测试完成！"
echo "💡 如果所有检查都通过，可以运行: bash start.sh"
