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
    echo "🔧 Auto-fixing dependencies..."
    
    # 检查关键依赖
    local critical_deps=("statuses" "on-finished" "ee-first" "finalhandler")
    local missing_deps=()
    
    for dep in "${critical_deps[@]}"; do
        if [ ! -d "backend/node_modules/$dep" ]; then
            echo "❌ Missing dependency: $dep"
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "📦 Installing missing dependencies: ${missing_deps[*]}"
        cd backend
        pnpm add "${missing_deps[@]}"
        cd ..
        pnpm install --force
        echo "✅ Dependencies fixed successfully"
    else
        echo "✅ All dependencies are present"
    fi
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
        pm2 start ecosystem.config.js
        
        # 显示服务状态
        pm2 status
        
        # 等待服务启动
        sleep 5
        
        # 再次检查状态
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
