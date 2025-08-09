#!/bin/bash

# =================================
# axi-deploy Dashboard 服务器初始化扩展脚本
# 这个脚本会被 axi-deploy 的 server-init.yml 工作流调用
# 用于安装 Dashboard 特定的依赖和配置
# =================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[DASHBOARD-INIT]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[DASHBOARD-INIT]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[DASHBOARD-INIT]${NC} $1"
}

log_error() {
    echo -e "${RED}[DASHBOARD-INIT]${NC} $1"
}

# 安装 Node.js (如果未安装)
install_nodejs() {
    log_info "检查 Node.js 安装状态..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否符合要求 (需要 18+)
        MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            log_success "Node.js 版本符合要求"
            return 0
        else
            log_warning "Node.js 版本过低，需要升级到 18+"
        fi
    fi
    
    log_info "安装 Node.js 18..."
    
    # 安装 NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log_success "Node.js 安装完成: $node_version"
    log_success "npm 版本: $npm_version"
}

# 安装 PM2 (如果未安装)
install_pm2() {
    log_info "检查 PM2 安装状态..."
    
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        log_success "PM2 已安装: $PM2_VERSION"
        return 0
    fi
    
    log_info "安装 PM2..."
    npm install -g pm2
    
    # 设置 PM2 开机自启 (如果是首次安装)
    pm2 startup || true
    
    log_success "PM2 安装完成"
}

# 安装 MongoDB (如果未安装)
install_mongodb() {
    log_info "检查 MongoDB 安装状态..."
    
    if command -v mongod &> /dev/null; then
        log_success "MongoDB 已安装"
        
        # 确保 MongoDB 服务正在运行
        if ! systemctl is-active --quiet mongod; then
            log_info "启动 MongoDB 服务..."
            sudo systemctl start mongod
            sudo systemctl enable mongod
        fi
        return 0
    fi
    
    log_info "安装 MongoDB..."
    
    # 导入 MongoDB GPG 密钥
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    
    # 添加 MongoDB repository
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # 安装 MongoDB
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    
    # 启动并设置开机自启
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    log_success "MongoDB 安装完成"
}

# 安装 Redis (如果未安装)
install_redis() {
    log_info "检查 Redis 安装状态..."
    
    if command -v redis-server &> /dev/null; then
        log_success "Redis 已安装"
        
        # 确保 Redis 服务正在运行
        if ! systemctl is-active --quiet redis; then
            log_info "启动 Redis 服务..."
            sudo systemctl start redis
            sudo systemctl enable redis
        fi
        return 0
    fi
    
    log_info "安装 Redis..."
    
    sudo apt-get update
    sudo apt-get install -y redis-server
    
    # 配置 Redis
    sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    
    # 启动并设置开机自启
    sudo systemctl restart redis
    sudo systemctl enable redis
    
    log_success "Redis 安装完成"
}

# 创建 Dashboard 专用目录和权限
setup_dashboard_directories() {
    log_info "设置 Dashboard 目录结构..."
    
    # 创建日志目录
    sudo mkdir -p /var/log/axi-deploy-dashboard
    sudo chown deploy:deploy /var/log/axi-deploy-dashboard
    
    # 创建备份目录
    sudo mkdir -p /srv/backups
    sudo chown deploy:deploy /srv/backups
    
    # 确保 apps 目录存在并有正确权限
    sudo mkdir -p /srv/apps
    sudo chown deploy:deploy /srv/apps
    
    log_success "Dashboard 目录创建完成"
}

# 配置 PM2 logrotate (避免日志文件过大)
setup_pm2_logrotate() {
    log_info "配置 PM2 日志轮转..."
    
    # 安装 PM2 logrotate 模块
    pm2 install pm2-logrotate || true
    
    # 配置 logrotate 参数
    pm2 set pm2-logrotate:max_size 10M || true
    pm2 set pm2-logrotate:retain 7 || true
    pm2 set pm2-logrotate:compress true || true
    
    log_success "PM2 日志轮转配置完成"
}

# 优化系统参数
optimize_system() {
    log_info "优化系统参数..."
    
    # 增加文件描述符限制
    if ! grep -q "deploy.*nofile" /etc/security/limits.conf; then
        echo "deploy soft nofile 65536" | sudo tee -a /etc/security/limits.conf
        echo "deploy hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    fi
    
    # 优化网络参数
    if ! grep -q "net.core.somaxconn" /etc/sysctl.conf; then
        echo "net.core.somaxconn = 1024" | sudo tee -a /etc/sysctl.conf
        echo "net.ipv4.tcp_max_syn_backlog = 1024" | sudo tee -a /etc/sysctl.conf
        echo "net.ipv4.ip_local_port_range = 1024 65535" | sudo tee -a /etc/sysctl.conf
        sudo sysctl -p
    fi
    
    log_success "系统优化完成"
}

# 主函数
main() {
    log_info "开始初始化 axi-deploy Dashboard 专用环境..."
    
    # 更新系统包
    log_info "更新系统包..."
    sudo apt-get update
    
    # 安装必要软件
    install_nodejs
    install_pm2
    install_mongodb
    install_redis
    
    # 设置目录和权限
    setup_dashboard_directories
    
    # 配置优化
    setup_pm2_logrotate
    optimize_system
    
    log_success "axi-deploy Dashboard 环境初始化完成！"
    echo
    echo "📋 服务状态:"
    echo "  Node.js: $(node --version)"
    echo "  npm: $(npm --version)"
    echo "  PM2: $(pm2 --version)"
    echo "  MongoDB: $(systemctl is-active mongod)"
    echo "  Redis: $(systemctl is-active redis)"
    echo
    echo "📂 目录结构:"
    echo "  应用目录: /srv/apps/axi-project-dashboard"
    echo "  日志目录: /var/log/axi-deploy-dashboard"
    echo "  备份目录: /srv/backups"
}

# 检查是否以 deploy 用户运行
if [ "$USER" != "deploy" ]; then
    log_warning "建议以 deploy 用户运行此脚本"
fi

# 运行主函数
main "$@"
