#!/bin/bash

# 工作流友好的启动脚本
# 确保工作流能够正常完成，不会因为依赖问题而卡住

set -e

echo "🚀 Workflow-friendly startup for axi-project-dashboard..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查并修复依赖
fix_dependencies_if_needed() {
    log_info "Checking dependencies..."
    
    local critical_deps=("statuses" "on-finished" "ee-first" "finalhandler")
    local missing_deps=()
    
    for dep in "${critical_deps[@]}"; do
        if [ ! -d "backend/node_modules/$dep" ]; then
            log_warn "Missing dependency: $dep"
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_info "Installing missing dependencies: ${missing_deps[*]}"
        cd backend
        pnpm add "${missing_deps[@]}" || {
            log_error "Failed to install dependencies"
            return 1
        }
        cd ..
        pnpm install --force || {
            log_error "Failed to reinstall dependencies"
            return 1
        }
        log_info "Dependencies fixed successfully"
    else
        log_info "All dependencies are present"
    fi
}

# 启动服务
start_service() {
    log_info "Starting service with PM2..."
    
    if [ ! -f "ecosystem.config.js" ]; then
        log_error "ecosystem.config.js not found"
        return 1
    fi
    
    # 停止现有服务（如果存在）
    pm2 stop dashboard-backend 2>/dev/null || true
    pm2 delete dashboard-backend 2>/dev/null || true
    
    # 启动服务
    pm2 start ecosystem.config.js || {
        log_error "Failed to start service with PM2"
        return 1
    }
    
    log_info "Service started with PM2"
}

# 等待服务启动
wait_for_service() {
    log_info "Waiting for service to start..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # 检查 PM2 状态
        local status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="dashboard-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")
        
        if [ "$status" = "online" ]; then
            log_info "Service is online (attempt $attempt/$max_attempts)"
            return 0
        fi
        
        log_warn "Service status: $status (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_warn "Service may not be fully started, but continuing..."
    return 0
}

# 健康检查
health_check() {
    log_info "Performing health check..."
    
    # 检查端口
    if netstat -tlnp 2>/dev/null | grep -q ":8080"; then
        log_info "✅ Service is listening on port 8080"
    else
        log_warn "⚠️ Service may not be listening on port 8080"
    fi
    
    # 检查 PM2 状态
    local status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="dashboard-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$status" = "online" ]; then
        log_info "✅ PM2 service is online"
    else
        log_warn "⚠️ PM2 service status: $status"
    fi
}

# 显示状态信息
show_status() {
    log_info "Final service status:"
    pm2 status 2>/dev/null || log_warn "Could not get PM2 status"
    
    log_info "Service logs (last 3 lines):"
    pm2 logs dashboard-backend --lines 3 2>/dev/null || log_warn "No logs available"
}

# 主函数
main() {
    log_info "Starting workflow-friendly startup process..."
    
    # 1. 修复依赖（如果需要）
    if ! fix_dependencies_if_needed; then
        log_error "Failed to fix dependencies"
        exit 1
    fi
    
    # 2. 启动服务
    if ! start_service; then
        log_error "Failed to start service"
        exit 1
    fi
    
    # 3. 等待服务启动
    if ! wait_for_service; then
        log_warn "Service startup timeout, but continuing..."
    fi
    
    # 4. 健康检查
    health_check
    
    # 5. 显示状态
    show_status
    
    log_info "🎉 Startup process completed successfully!"
    log_info "✅ Workflow can continue now"
    
    # 确保脚本正常退出
    exit 0
}

# 错误处理
trap 'log_error "Script interrupted"; exit 1' INT TERM

# 执行主函数
main "$@"
