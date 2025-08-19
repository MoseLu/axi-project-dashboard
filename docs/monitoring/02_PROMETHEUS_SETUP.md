# Prometheus 监控系统部署指南

## 概述

Prometheus 是一个开源的监控和告警系统，用于收集和存储时间序列数据。我们将使用它来监控系统指标、应用性能和业务指标。

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Prometheus 监控栈                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Prometheus  │  │ AlertManager│  │ Node Exporter│         │
│  │ :9090       │  │ :9093       │  │ :9100       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Pushgateway │  │ Blackbox    │  │ Custom      │         │
│  │ :9091       │  │ Exporter    │  │ Exporter    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 安装步骤

### 1. 创建监控目录

```bash
# 创建监控相关目录
sudo mkdir -p /opt/monitoring/{prometheus,alertmanager,node_exporter}
sudo mkdir -p /opt/monitoring/prometheus/{data,config,rules}
sudo mkdir -p /opt/monitoring/alertmanager/{data,config}

# 设置权限
sudo chown -R deploy:deploy /opt/monitoring
```

### 2. 下载 Prometheus

```bash
cd /opt/monitoring
wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz
tar xzf prometheus-2.48.0.linux-amd64.tar.gz
sudo mv prometheus-2.48.0.linux-amd64 prometheus
```

### 3. 配置 Prometheus

创建配置文件 `/opt/monitoring/prometheus/config/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

scrape_configs:
  # Prometheus 自身监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter 系统指标
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # 业务应用监控
  - job_name: 'axi-dashboard'
    static_configs:
      - targets: ['localhost:8090']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'axi-star-cloud'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Nginx 监控
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  # MySQL 监控
  - job_name: 'mysql'
    static_configs:
      - targets: ['localhost:9104']

  # Redis 监控
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  # 黑盒监控 (HTTP/HTTPS 可用性)
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://redamancy.com.cn
        - https://redamancy.com.cn/axi-docs
        - https://redamancy.com.cn/project-dashboard
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9115
```

### 4. 创建告警规则

创建文件 `/opt/monitoring/prometheus/rules/alerts.yml`:

```yaml
groups:
  - name: system_alerts
    rules:
      # CPU 使用率告警
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高 CPU 使用率"
          description: "{{ $labels.instance }} CPU 使用率超过 80%"

      # 内存使用率告警
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高内存使用率"
          description: "{{ $labels.instance }} 内存使用率超过 85%"

      # 磁盘使用率告警
      - alert: HighDiskUsage
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高磁盘使用率"
          description: "{{ $labels.instance }} 磁盘使用率超过 85%"

  - name: application_alerts
    rules:
      # 应用响应时间告警
      - alert: HighResponseTime
        expr: http_request_duration_seconds{quantile="0.95"} > 2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "应用响应时间过高"
          description: "{{ $labels.instance }} 95% 响应时间超过 2 秒"

      # 应用错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "应用错误率过高"
          description: "{{ $labels.instance }} 错误率超过 5%"

  - name: deployment_alerts
    rules:
      # 部署失败告警
      - alert: DeploymentFailed
        expr: deployment_status{status="failed"} > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "部署失败"
          description: "{{ $labels.project }} 部署失败"

      # 服务不可用告警
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务不可用"
          description: "{{ $labels.instance }} 服务不可用"
```

### 5. 创建 systemd 服务

创建文件 `/etc/systemd/system/prometheus.service`:

```ini
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=deploy
Group=deploy
Type=simple
ExecStart=/opt/monitoring/prometheus/prometheus \
  --config.file=/opt/monitoring/prometheus/config/prometheus.yml \
  --storage.tsdb.path=/opt/monitoring/prometheus/data \
  --web.console.templates=/opt/monitoring/prometheus/consoles \
  --web.console.libraries=/opt/monitoring/prometheus/console_libraries \
  --web.listen-address=0.0.0.0:9090 \
  --web.enable-lifecycle \
  --storage.tsdb.retention.time=30d \
  --storage.tsdb.retention.size=10GB

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6. 启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动 Prometheus
sudo systemctl enable prometheus
sudo systemctl start prometheus

# 检查状态
sudo systemctl status prometheus
```

## 验证安装

### 1. 检查服务状态

```bash
# 检查服务状态
sudo systemctl status prometheus

# 检查端口监听
sudo netstat -tlnp | grep 9090

# 检查进程
ps aux | grep prometheus
```

### 2. 访问 Web 界面

```bash
# 本地访问
curl http://localhost:9090

# 检查目标状态
curl http://localhost:9090/api/v1/targets
```

### 3. 检查指标

```bash
# 检查系统指标
curl http://localhost:9090/api/v1/query?query=up

# 检查 CPU 使用率
curl http://localhost:9090/api/v1/query?query=100%20-%20(avg%20by(instance)%20(irate(node_cpu_seconds_total{mode%3D%22idle%22}[5m]))%20*%20100)
```

## 集成到现有系统

### 1. 修改 axi-project-dashboard 配置

在 `axi-project-dashboard/backend/src/config/config.ts` 中添加 Prometheus 配置:

```typescript
export const prometheusConfig = {
  url: process.env.PROMETHEUS_URL || 'http://localhost:9090',
  api: {
    query: '/api/v1/query',
    queryRange: '/api/v1/query_range',
    targets: '/api/v1/targets',
    alerts: '/api/v1/alerts'
  }
};
```

### 2. 创建 Prometheus 服务

创建文件 `axi-project-dashboard/backend/src/services/prometheus.service.ts`:

```typescript
import axios from 'axios';
import { prometheusConfig } from '../config/config';

export class PrometheusService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = prometheusConfig.url;
  }

  async query(promql: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}${prometheusConfig.api.query}`, {
        params: { query: promql }
      });
      return response.data;
    } catch (error) {
      console.error('Prometheus query error:', error);
      throw error;
    }
  }

  async getSystemMetrics(): Promise<any> {
    const metrics = {
      cpu: await this.query('100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
      memory: await this.query('(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100'),
      disk: await this.query('(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100'),
      load: await this.query('node_load1')
    };
    return metrics;
  }

  async getApplicationMetrics(): Promise<any> {
    const metrics = {
      responseTime: await this.query('http_request_duration_seconds{quantile="0.95"}'),
      errorRate: await this.query('rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100'),
      requestsPerSecond: await this.query('rate(http_requests_total[5m])')
    };
    return metrics;
  }
}
```

## 监控指标说明

### 系统指标
- `node_cpu_seconds_total`: CPU 使用时间
- `node_memory_MemTotal_bytes`: 总内存
- `node_memory_MemAvailable_bytes`: 可用内存
- `node_filesystem_size_bytes`: 文件系统大小
- `node_filesystem_free_bytes`: 文件系统可用空间
- `node_load1`: 系统负载

### 应用指标
- `http_requests_total`: HTTP 请求总数
- `http_request_duration_seconds`: HTTP 请求持续时间
- `process_cpu_seconds_total`: 进程 CPU 使用时间
- `process_resident_memory_bytes`: 进程内存使用

### 业务指标
- `deployment_status`: 部署状态
- `deployment_duration_seconds`: 部署持续时间
- `deployment_success_rate`: 部署成功率

## 故障排除

### 常见问题

1. **服务启动失败**
   ```bash
   # 检查配置文件语法
   /opt/monitoring/prometheus/prometheus --config.file=/opt/monitoring/prometheus/config/prometheus.yml --check-config
   
   # 检查日志
   sudo journalctl -u prometheus -f
   ```

2. **目标无法抓取**
   ```bash
   # 检查网络连接
   curl http://localhost:9100/metrics
   
   # 检查防火墙
   sudo ufw status
   ```

3. **存储空间不足**
   ```bash
   # 检查数据目录大小
   du -sh /opt/monitoring/prometheus/data
   
   # 清理旧数据
   /opt/monitoring/prometheus/prometheus --storage.tsdb.retention.time=7d
   ```

## 下一步

完成 Prometheus 部署后，继续配置：
1. [AlertManager 告警管理](./03_ALERTMANAGER_SETUP.md)
2. [Grafana 可视化](./04_GRAFANA_SETUP.md)
3. [Node Exporter 系统监控](./05_NODE_EXPORTER_SETUP.md)
