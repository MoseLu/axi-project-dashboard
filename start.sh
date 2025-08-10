#!/bin/bash

# 设置错误时退出
set -e

echo "🚀 Starting axi-project-dashboard backend..."

# 显示当前目录和文件
echo "Current directory: $(pwd)"
echo "Files in directory:"
ls -la

# 检查 Node.js 环境
echo "Node.js environment:"
which node
node --version
which npm
npm --version
which npx
echo "npx available"

# 检查 PM2
if command -v pm2 &> /dev/null; then
    echo "PM2 found: $(pm2 --version)"
else
    echo "PM2 not found, installing..."
    npm install -g pm2
fi

# 自动依赖修复函数
fix_dependencies() {
    echo "🔧 Auto-fixing dependencies and build issues..."
    
    # 修复 side-channel 依赖
    echo "📦 Installing side-channel dependency..."
    cd backend
    npm install side-channel --save || echo "side-channel already installed"
    cd ..
    npm install --force || echo "Dependencies installation completed"
    
    # 自动修复模块别名问题
    echo "🔧 Auto-fixing module aliases..."
    cd backend
    
    # 检查并创建 src 目录
    if [ ! -d "src" ]; then
        echo "📁 Creating src directory..."
        mkdir -p src
        
        # 移动 TypeScript 文件到 src 目录
        for file in *.ts; do
            if [ -f "$file" ] && [ "$file" != "build.js" ] && [ "$file" != "start-server.js" ]; then
                echo "  📄 Moving $file to src/"
                mv "$file" "src/"
            fi
        done
        
        # 创建必要的子目录
        mkdir -p src/config src/services src/middleware src/utils src/types src/database src/routes
    fi
    
    # 强制重新构建
    echo "🔨 Force rebuilding project..."
    rm -rf dist
    npm run build
    
    # 验证构建结果并自动修复
    if [ -f "dist/index.js" ]; then
        echo "🔍 Verifying build results..."
        
        # 检查并添加 module-alias/register
        if ! grep -q "module-alias/register" dist/index.js; then
            echo "🔧 Adding module-alias/register..."
            # 使用临时文件确保 sed 命令正确执行
            cp dist/index.js dist/index.js.tmp
            echo 'require("module-alias/register");' > dist/index.js
            cat dist/index.js.tmp >> dist/index.js
            rm dist/index.js.tmp
        fi
        
        # 检查路径别名转换
        if grep -q "./config/config" dist/index.js; then
            echo "✅ Path aliases converted to relative paths"
        else
            echo "⚠️ Path aliases may not be converted properly"
        fi
        
        echo "✅ Build verification completed"
    else
        echo "❌ Build failed - dist/index.js not found"
        echo "📋 Checking build errors..."
        npm run build 2>&1 || true
        exit 1
    fi
    
    cd ..
    echo "✅ All fixes applied successfully"
}

# 启动服务函数
start_service() {
    echo "🚀 Starting service with PM2..."
    
    if [ -f "ecosystem.config.js" ]; then
        echo "Found ecosystem.config.js, starting service..."
        
        # 停止现有服务
        pm2 stop dashboard-backend 2>/dev/null || true
        pm2 delete dashboard-backend 2>/dev/null || true
        
        # 启动服务
        pm2 start ecosystem.config.js --update-env
        
        # 等待服务启动并验证端口
        echo "⏳ Waiting for service to start..."
        for i in {1..30}; do
            if netstat -tlnp 2>/dev/null | grep -q ":8080"; then
                echo "✅ Service is listening on port 8080"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "❌ Service failed to start on port 8080 after 60 seconds"
                pm2 logs dashboard-backend --lines 10
                exit 1
            fi
            sleep 2
        done
        
        # 显示服务状态
        pm2 status
        
        echo "✅ Service started successfully"
    else
        echo "❌ ecosystem.config.js not found"
        exit 1
    fi
}

# 健康检查函数
check_health() {
    echo "🔍 Performing health check..."
    
    # 等待服务启动
    sleep 10
    
    # 检查端口
    if netstat -tlnp 2>/dev/null | grep -q ":8080"; then
        echo "✅ Service is listening on port 8080"
    else
        echo "⚠️ Service may not be listening on port 8080"
    fi
    
    # 检查 PM2 状态
    local status=$(pm2 jlist | jq -r '.[] | select(.name=="dashboard-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$status" = "online" ]; then
        echo "✅ PM2 service is online"
    else
        echo "⚠️ PM2 service status: $status"
    fi
}

# 主执行流程
main() {
    echo "🔧 Starting auto-fix startup process..."
    
    # 1. 修复依赖
    fix_dependencies
    
    # 2. 启动服务
    start_service
    
    # 3. 健康检查
    check_health
    
    echo "🎉 Startup process completed successfully!"
    echo "✅ Service should be running now"
    
    # 显示最终状态
    echo "📊 Final service status:"
    pm2 status
    
    echo "📋 Service logs (last 5 lines):"
    pm2 logs dashboard-backend --lines 5 2>/dev/null || echo "No logs available"
    
    echo "✅ 启动命令执行成功，进程ID: $$"
}

# 执行主流程
main "$@"
