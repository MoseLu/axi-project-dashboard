#!/bin/bash

# AXI Project Dashboard 启动脚本
# 用于生产环境部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查运行环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 未安装，请运行: npm install -g pm2"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请运行: npm install -g pnpm"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p logs
    mkdir -p backend/logs
    mkdir -p uploads
    mkdir -p uploads/avatars
    
    log_success "目录创建完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 安装根目录依赖
    pnpm install --prod
    
    # 安装后端依赖
    cd backend
    pnpm install --prod
    cd ..
    
    log_success "依赖安装完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 构建后端
    log_info "构建后端..."
    cd backend
    pnpm run build
    cd ..
    
    # 构建前端
    log_info "构建前端..."
    cd frontend
    pnpm run build
    cd ..
    
    log_success "项目构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 停止现有服务
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # 启动服务
    pm2 start ecosystem.config.js --env production
    
    # 保存 PM2 配置
    pm2 save
    
    # 设置 PM2 开机自启
    pm2 startup
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 5
    
    # 检查后端健康状态
    if curl -f http://localhost:8090/health > /dev/null 2>&1; then
        log_success "后端服务健康检查通过"
    else
        log_error "后端服务健康检查失败"
        exit 1
    fi
    
    # 检查前端健康状态
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "前端服务健康检查通过"
    else
        log_error "前端服务健康检查失败"
        exit 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 显示状态
show_status() {
    log_info "服务状态:"
    pm2 status
    
    log_info "访问地址:"
    echo "前端: http://localhost:3000"
    echo "后端API: http://localhost:8090"
    echo "健康检查: http://localhost:8090/health"
}

# 主函数
main() {
    log_info "开始部署 AXI Project Dashboard..."
    
    check_environment
    create_directories
    install_dependencies
    build_project
    start_services
    health_check
    show_status
    
    log_success "AXI Project Dashboard 部署完成！"
}

# 执行主函数
main "$@"
