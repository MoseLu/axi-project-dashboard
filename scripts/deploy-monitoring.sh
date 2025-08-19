#!/bin/bash

# 监控系统部署脚本
# 用于部署 Prometheus + Grafana + AlertManager 监控系统

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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 检查端口是否被占用
check_ports() {
    local ports=("9090" "3000" "9093" "9100" "9104" "9121" "9113" "9115")
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            log_warning "端口 $port 已被占用"
        else
            log_info "端口 $port 可用"
        fi
    done
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p config/grafana/provisioning/datasources
    mkdir -p config/grafana/provisioning/dashboards
    mkdir -p config/grafana/dashboards
    mkdir -p logs
    
    log_success "目录创建完成"
}

# 创建Grafana数据源配置
create_grafana_datasource() {
    log_info "创建 Grafana 数据源配置..."
    
    cat > config/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    log_success "Grafana 数据源配置创建完成"
}

# 创建Grafana仪表板配置
create_grafana_dashboard_config() {
    log_info "创建 Grafana 仪表板配置..."
    
    cat > config/grafana/provisioning/dashboards/dashboards.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    log_success "Grafana 仪表板配置创建完成"
}

# 创建系统概览仪表板
create_system_dashboard() {
    log_info "创建系统概览仪表板..."
    
    cat > config/grafana/dashboards/system-overview.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "系统概览",
    "tags": ["system", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU 使用率",
        "type": "stat",
        "targets": [
          {
            "expr": "system_cpu_usage_percent",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 60},
                {"color": "red", "value": 80}
              ]
            },
            "unit": "percent"
          }
        }
      },
      {
        "id": 2,
        "title": "内存使用率",
        "type": "stat",
        "targets": [
          {
            "expr": "system_memory_usage_percent",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 85}
              ]
            },
            "unit": "percent"
          }
        }
      },
      {
        "id": 3,
        "title": "磁盘使用率",
        "type": "stat",
        "targets": [
          {
            "expr": "system_disk_usage_percent",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 80},
                {"color": "red", "value": 90}
              ]
            },
            "unit": "percent"
          }
        }
      },
      {
        "id": 4,
        "title": "WebSocket 连接数",
        "type": "stat",
        "targets": [
          {
            "expr": "websocket_active_connections",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    log_success "系统概览仪表板创建完成"
}

# 启动监控系统
start_monitoring() {
    log_info "启动监控系统..."
    
    # 构建应用镜像
    log_info "构建应用镜像..."
    docker-compose -f docker-compose.monitoring.yml build app
    
    # 启动所有服务
    log_info "启动所有服务..."
    docker-compose -f docker-compose.monitoring.yml up -d
    
    log_success "监控系统启动完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    local services=("prometheus" "grafana" "alertmanager" "node-exporter" "mysql-exporter" "redis-exporter" "nginx-exporter" "blackbox-exporter")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.monitoring.yml ps $service | grep -q "Up"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务运行异常"
        fi
    done
}

# 显示访问信息
show_access_info() {
    log_success "监控系统部署完成！"
    echo ""
    echo "访问地址："
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3000 (用户名: admin, 密码: admin123)"
    echo "  - AlertManager: http://localhost:9093"
    echo ""
    echo "应用服务："
    echo "  - axi-project-dashboard: http://localhost:8090"
    echo "  - 前端界面: http://localhost:8091"
    echo ""
    echo "监控指标："
    echo "  - 应用指标: http://localhost:8090/metrics"
    echo "  - 系统指标: http://localhost:9100/metrics"
    echo ""
}

# 主函数
main() {
    log_info "开始部署监控系统..."
    
    # 检查环境
    check_docker
    check_ports
    
    # 创建配置
    create_directories
    create_grafana_datasource
    create_grafana_dashboard_config
    create_system_dashboard
    
    # 启动服务
    start_monitoring
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查状态
    check_services
    
    # 显示信息
    show_access_info
}

# 清理函数
cleanup() {
    log_info "清理监控系统..."
    docker-compose -f docker-compose.monitoring.yml down -v
    log_success "清理完成"
}

# 脚本参数处理
case "$1" in
    "start")
        main
        ;;
    "stop")
        docker-compose -f docker-compose.monitoring.yml down
        log_success "监控系统已停止"
        ;;
    "restart")
        docker-compose -f docker-compose.monitoring.yml restart
        log_success "监控系统已重启"
        ;;
    "status")
        docker-compose -f docker-compose.monitoring.yml ps
        ;;
    "logs")
        docker-compose -f docker-compose.monitoring.yml logs -f
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs|cleanup}"
        echo ""
        echo "命令说明："
        echo "  start   - 启动监控系统"
        echo "  stop    - 停止监控系统"
        echo "  restart - 重启监控系统"
        echo "  status  - 查看服务状态"
        echo "  logs    - 查看服务日志"
        echo "  cleanup - 清理监控系统"
        exit 1
        ;;
esac
