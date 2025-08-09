#!/bin/bash

# 🔧 axi-project-dashboard 502错误修复脚本
# 使用方法：chmod +x fix_502_error.sh && ./fix_502_error.sh

echo "🔧 开始修复 axi-project-dashboard 502错误..."
echo "========================================================"

# 确保在正确的目录
cd /srv/apps/axi-project-dashboard || {
    echo "❌ 无法进入项目目录"
    exit 1
}

echo "📋 1. 停止现有的PM2进程"
pm2 stop dashboard-backend 2>/dev/null || echo "进程未运行"
pm2 delete dashboard-backend 2>/dev/null || echo "进程不存在"

echo ""
echo "📋 2. 检查和安装依赖"
if [ ! -d "node_modules" ]; then
    echo "🔄 安装项目依赖..."
    npm install
else
    echo "✅ 依赖已存在"
fi

echo ""
echo "📋 3. 检查 backend 依赖"
cd backend
if [ ! -d "node_modules" ]; then
    echo "🔄 安装 backend 依赖..."
    npm install
else
    echo "✅ Backend 依赖已存在"
fi

echo ""
echo "📋 4. 编译 TypeScript 代码"
echo "🔄 编译中..."
npm run build || {
    echo "❌ TypeScript 编译失败"
    echo "尝试清理后重新编译..."
    npm run clean
    npm run build || {
        echo "❌ 编译仍然失败，请检查代码"
        exit 1
    }
}
echo "✅ TypeScript 编译成功"

cd ..

echo ""
echo "📋 5. 创建启动文件"
if [ ! -f "backend/start-server.js" ]; then
    echo "🔄 创建 start-server.js..."
    cat > backend/start-server.js << 'EOF'
#!/usr/bin/env node

/**
 * axi-project-dashboard 后端服务启动文件
 * 这个文件用于PM2启动编译后的应用
 */

// 设置模块路径别名，确保能正确解析 @/* 路径
require('module-alias/register');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 设置时区
if (process.env.TZ) {
  process.env.TZ = process.env.TZ;
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 启动应用
console.log('🚀 Starting axi-project-dashboard backend...');
console.log(`📊 Environment: ${process.env.NODE_ENV}`);
console.log(`🕐 Starting at: ${new Date().toISOString()}`);

try {
  // 加载编译后的应用
  require('./dist/index.js');
} catch (error) {
  console.error('❌ Failed to start application:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
EOF
    chmod +x backend/start-server.js
    echo "✅ start-server.js 创建成功"
else
    echo "✅ start-server.js 已存在"
fi

echo ""
echo "📋 6. 更新 package.json 模块别名配置"
# 检查是否已有 _moduleAliases 配置
if ! grep -q "_moduleAliases" backend/package.json; then
    echo "🔄 添加模块别名配置..."
    # 在最后一个 } 前添加 _moduleAliases 配置
    sed -i 's/}$/,\n  "_moduleAliases": {\n    "@": ".\/dist"\n  }\n}/' backend/package.json
    echo "✅ 模块别名配置添加成功"
else
    echo "✅ 模块别名配置已存在"
fi

echo ""
echo "📋 7. 测试启动应用"
echo "🔄 测试启动..."
timeout 10s node backend/start-server.js &
PID=$!
sleep 5

# 检查进程是否还在运行
if kill -0 $PID 2>/dev/null; then
    echo "✅ 应用启动成功"
    kill $PID 2>/dev/null
else
    echo "❌ 应用启动失败，请检查日志"
fi

echo ""
echo "📋 8. 启动 PM2 进程"
echo "🔄 启动 PM2..."
pm2 start ecosystem.config.js --update-env

echo ""
echo "📋 9. 检查进程状态"
sleep 3
pm2 list
echo ""
pm2 logs dashboard-backend --lines 10

echo ""
echo "📋 10. 测试健康检查"
echo "🔄 等待服务启动..."
sleep 5
echo "测试 http://localhost:8090/health"
curl -s -w "HTTP状态码: %{http_code}\n" http://localhost:8090/health

echo ""
echo "========================================================"
echo "🎉 修复完成！"
echo ""
echo "如果仍有问题，请检查："
echo "1. pm2 logs dashboard-backend"
echo "2. curl http://localhost:8090/health"
echo "3. 重新运行 ./debug_502.sh 进行诊断"
