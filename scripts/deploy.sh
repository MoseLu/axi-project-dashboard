#!/bin/bash

# =================================
# axi-deploy Dashboard 部署脚本
# =================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"

# 默认值
ENVIRONMENT="production"
SKIP_BACKUP=false
SKIP_BUILD=false
SKIP_TESTS=false
VERBOSE=false

# 帮助信息
show_help() {
    cat << EOF
axi-deploy Dashboard 部署脚本

用法: $0 [选项] <环境>

选项:
    -h, --help          显示帮助信息
    -v, --verbose       详细输出
    --skip-backup       跳过备份
    --skip-build        跳过构建
    --skip-tests        跳过测试
    --env-file FILE     指定环境变量文件 (默认: .env)

环境:
    development         开发环境
    staging            测试环境
    production         生产环境 (默认)

示例:
    $0 production
    $0 --skip-backup staging
    $0 --verbose --skip-tests development

EOF
}

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

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    local deps=("docker" "docker-compose" "curl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep 未安装或不在 PATH 中"
            exit 1
        fi
        log_debug "$dep 检查通过"
    done
    
    log_success "依赖检查完成"
}

# 检查环境文件
check_env_file() {
    log_info "检查环境配置..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境文件不存在: $ENV_FILE"
        log_info "请参考 env.example 创建 .env 文件"
        exit 1
    fi
    
    # 检查必需的环境变量
    local required_vars=("MONGODB_URI" "REDIS_URI" "JWT_SECRET" "GITHUB_TOKEN")
    
    source "$ENV_FILE"
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "必需的环境变量未设置: $var"
            exit 1
        fi
        log_debug "$var 检查通过"
    done
    
    log_success "环境配置检查完成"
}

# 创建备份
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        log_info "跳过备份"
        return
    fi
    
    log_info "创建备份..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库
    if docker-compose ps | grep -q mongodb; then
        log_info "备份 MongoDB 数据..."
        docker-compose exec -T mongodb mongodump --archive | gzip > "$BACKUP_DIR/mongodb_$(date +%Y%m%d_%H%M%S).gz"
        log_debug "MongoDB 备份完成"
    fi
    
    # 备份配置文件
    log_info "备份配置文件..."
    cp "$ENV_FILE" "$BACKUP_DIR/"
    cp "$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/"
    
    # 备份用户上传文件
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        log_info "备份用户文件..."
        tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$PROJECT_ROOT" uploads/
        log_debug "用户文件备份完成"
    fi
    
    log_success "备份创建完成: $BACKUP_DIR"
}

# 构建镜像
build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "跳过构建"
        return
    fi
    
    log_info "构建 Docker 镜像..."
    
    # 设置构建参数
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # 构建镜像
    docker-compose build --parallel --progress=plain
    
    log_success "镜像构建完成"
}

# 运行测试
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_info "跳过测试"
        return
    fi
    
    log_info "运行测试..."
    
    # 后端测试
    log_info "运行后端测试..."
    docker-compose run --rm backend npm test
    
    # 前端测试
    log_info "运行前端测试..."
    docker-compose run --rm frontend npm test -- --coverage --watchAll=false
    
    log_success "测试完成"
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    
    docker-compose down --remove-orphans
    
    log_success "服务已停止"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 启动数据库服务
    log_info "启动数据库服务..."
    docker-compose up -d mongodb redis elasticsearch influxdb
    
    # 等待数据库就绪
    log_info "等待数据库就绪..."
    sleep 30
    
    # 启动应用服务
    log_info "启动应用服务..."
    docker-compose up -d backend frontend
    
    # 启动监控服务
    log_info "启动监控服务..."
    docker-compose up -d prometheus grafana nginx
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查尝试 $attempt/$max_attempts..."
        
        # 检查后端服务
        if curl -s -f http://localhost:8080/health > /dev/null; then
            log_success "后端服务健康检查通过"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "健康检查失败，服务可能未正常启动"
            show_logs
            exit 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # 检查前端服务
    if curl -s -f http://localhost:3000 > /dev/null; then
        log_success "前端服务健康检查通过"
    else
        log_warning "前端服务健康检查失败"
    fi
    
    log_success "健康检查完成"
}

# 显示服务日志
show_logs() {
    log_info "显示服务日志..."
    docker-compose logs --tail=50
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo
    echo "服务访问地址:"
    echo "  前端界面:     http://localhost:3000"
    echo "  后端API:      http://localhost:8080"
    echo "  监控面板:     http://localhost:3001"
    echo "  Prometheus:   http://localhost:9090"
    echo
    echo "服务状态:"
    docker-compose ps
    echo
    echo "有用的命令:"
    echo "  查看日志:     docker-compose logs -f [service]"
    echo "  重启服务:     docker-compose restart [service]"
    echo "  停止服务:     docker-compose down"
    echo "  更新服务:     $0 $ENVIRONMENT"
}

# 清理函数
cleanup() {
    log_info "执行清理..."
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    log_success "清理完成"
}

# 错误处理
handle_error() {
    local exit_code=$?
    log_error "部署失败！退出码: $exit_code"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "生产环境部署失败，考虑回滚..."
        # 这里可以添加自动回滚逻辑
    fi
    
    show_logs
    exit $exit_code
}

# 主函数
main() {
    log_info "开始部署 axi-deploy Dashboard"
    log_info "环境: $ENVIRONMENT"
    log_info "项目目录: $PROJECT_ROOT"
    
    # 设置错误处理
    trap handle_error ERR
    
    # 执行部署步骤
    check_dependencies
    check_env_file
    create_backup
    build_images
    run_tests
    stop_services
    start_services
    health_check
    show_deployment_info
    
    # 清理
    if [ "$ENVIRONMENT" = "production" ]; then
        cleanup
    fi
    
    log_success "部署完成！"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 验证环境
case $ENVIRONMENT in
    development|staging|production)
        ;;
    *)
        log_error "无效的环境: $ENVIRONMENT"
        show_help
        exit 1
        ;;
esac

# 运行主函数
main "$@"
