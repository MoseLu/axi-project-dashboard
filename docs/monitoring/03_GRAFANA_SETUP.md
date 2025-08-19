# Grafana 可视化系统部署指南

## 概述

Grafana 是一个开源的数据可视化和监控平台，我们将使用它来创建丰富的监控仪表板，展示 Prometheus 收集的指标数据。

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Grafana 可视化栈                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Grafana     │  │ Dashboard   │  │ Alerting    │         │
│  │ :3000       │  │ Templates   │  │ Rules       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Prometheus  │  │ Elasticsearch│  │ Custom      │         │
│  │ Data Source │  │ Data Source │  │ Data Source │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 安装步骤

### 1. 下载 Grafana

```bash
cd /opt/monitoring
wget https://dl.grafana.com/enterprise/release/grafana-enterprise-10.2.0.linux-amd64.tar.gz
tar xzf grafana-enterprise-10.2.0.linux-amd64.tar.gz
sudo mv grafana-10.2.0 grafana
```

### 2. 配置 Grafana

创建配置文件 `/opt/monitoring/grafana/conf/defaults.ini`:

```ini
[server]
http_port = 3000
domain = redamancy.com.cn
root_url = https://redamancy.com.cn/grafana/
serve_from_sub_path = true

[database]
type = sqlite3
path = /opt/monitoring/grafana/data/grafana.db

[security]
admin_user = admin
admin_password = admin123
secret_key = your-secret-key-here

[users]
allow_sign_up = false
auto_assign_org_role = Viewer

[log]
mode = file
level = info
format = text
file = /opt/monitoring/grafana/logs/grafana.log

[paths]
data = /opt/monitoring/grafana/data
logs = /opt/monitoring/grafana/logs
plugins = /opt/monitoring/grafana/plugins
provisioning = /opt/monitoring/grafana/conf/provisioning

[alerting]
enabled = true
execute_alerts = true

[unified_alerting]
enabled = true
```

### 3. 创建数据源配置

创建目录和配置文件：

```bash
sudo mkdir -p /opt/monitoring/grafana/conf/provisioning/{datasources,dashboards,alerting}
```

创建数据源配置 `/opt/monitoring/grafana/conf/provisioning/datasources/prometheus.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: 15s
      queryTimeout: 60s
      httpMethod: POST
    secureJsonData: {}

  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://localhost:9200
    database: logs-*
    isDefault: false
    editable: true
    jsonData:
      timeField: @timestamp
      esVersion: 8.0.0
      maxConcurrentShardRequests: 5
      logMessageField: message
      logLevelField: level
    secureJsonData: {}
```

### 4. 创建仪表板配置

创建仪表板配置 `/opt/monitoring/grafana/conf/provisioning/dashboards/dashboards.yml`:

```yaml
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
      path: /opt/monitoring/grafana/conf/provisioning/dashboards
```

### 5. 创建 systemd 服务

创建文件 `/etc/systemd/system/grafana.service`:

```ini
[Unit]
Description=Grafana
Wants=network-online.target
After=network-online.target

[Service]
User=deploy
Group=deploy
Type=simple
ExecStart=/opt/monitoring/grafana/bin/grafana-server \
  --config=/opt/monitoring/grafana/conf/defaults.ini \
  --homepath=/opt/monitoring/grafana

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6. 启动服务

```bash
# 创建必要目录
sudo mkdir -p /opt/monitoring/grafana/{data,logs,plugins}

# 设置权限
sudo chown -R deploy:deploy /opt/monitoring/grafana

# 重新加载 systemd
sudo systemctl daemon-reload

# 启动 Grafana
sudo systemctl enable grafana
sudo systemctl start grafana

# 检查状态
sudo systemctl status grafana
```

## 仪表板配置

### 1. 系统监控仪表板

创建文件 `/opt/monitoring/grafana/conf/provisioning/dashboards/system-overview.json`:

```json
{
  "dashboard": {
    "id": null,
    "title": "系统概览",
    "tags": ["system", "overview"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU 使用率",
        "type": "stat",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU 使用率"
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
                {"color": "red", "value": 90}
              ]
            },
            "unit": "percent"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "内存使用率",
        "type": "stat",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "内存使用率"
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
        },
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "磁盘使用率",
        "type": "stat",
        "targets": [
          {
            "expr": "(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100",
            "legendFormat": "磁盘使用率"
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
        },
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "系统负载",
        "type": "timeseries",
        "targets": [
          {
            "expr": "node_load1",
            "legendFormat": "1分钟负载"
          },
          {
            "expr": "node_load5",
            "legendFormat": "5分钟负载"
          },
          {
            "expr": "node_load15",
            "legendFormat": "15分钟负载"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### 2. 应用监控仪表板

创建文件 `/opt/monitoring/grafana/conf/provisioning/dashboards/application-overview.json`:

```json
{
  "dashboard": {
    "id": null,
    "title": "应用监控",
    "tags": ["application", "monitoring"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP 请求率",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "响应时间",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95% 响应时间"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50% 响应时间"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s"
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "错误率",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "5xx 错误率"
          },
          {
            "expr": "rate(http_requests_total{status=~\"4..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "4xx 错误率"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent"
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### 3. 部署监控仪表板

创建文件 `/opt/monitoring/grafana/conf/provisioning/dashboards/deployment-overview.json`:

```json
{
  "dashboard": {
    "id": null,
    "title": "部署监控",
    "tags": ["deployment", "monitoring"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "部署状态",
        "type": "stat",
        "targets": [
          {
            "expr": "deployment_status{status=\"success\"}",
            "legendFormat": "成功部署"
          },
          {
            "expr": "deployment_status{status=\"failed\"}",
            "legendFormat": "失败部署"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "部署持续时间",
        "type": "timeseries",
        "targets": [
          {
            "expr": "deployment_duration_seconds",
            "legendFormat": "{{project}} 部署时间"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s"
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "部署成功率",
        "type": "gauge",
        "targets": [
          {
            "expr": "deployment_success_rate * 100",
            "legendFormat": "成功率"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        },
        "gridPos": {"h": 8, "w": 8, "x": 0, "y": 8}
      }
    ],
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "refresh": "1m"
  }
}
```

## 告警配置

### 1. 创建告警规则

创建文件 `/opt/monitoring/grafana/conf/provisioning/alerting/alerts.yml`:

```yaml
apiVersion: 1

groups:
  - name: system_alerts
    folder: System
    interval: 1m
    rules:
      - uid: high_cpu_usage
        title: 高 CPU 使用率
        condition: A
        for: 5m
        annotations:
          summary: "CPU 使用率过高"
          description: "{{ $labels.instance }} CPU 使用率超过 80%"
        labels:
          severity: warning
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
              intervalMs: 1000
              maxDataPoints: 43200

      - uid: high_memory_usage
        title: 高内存使用率
        condition: A
        for: 5m
        annotations:
          summary: "内存使用率过高"
          description: "{{ $labels.instance }} 内存使用率超过 85%"
        labels:
          severity: warning
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
              intervalMs: 1000
              maxDataPoints: 43200

  - name: application_alerts
    folder: Application
    interval: 1m
    rules:
      - uid: high_error_rate
        title: 高错误率
        condition: A
        for: 2m
        annotations:
          summary: "应用错误率过高"
          description: "{{ $labels.instance }} 错误率超过 5%"
        labels:
          severity: critical
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
              intervalMs: 1000
              maxDataPoints: 43200
```

### 2. 配置通知渠道

在 Grafana Web 界面中配置通知渠道：

1. 访问 `https://redamancy.com.cn/grafana`
2. 登录 (admin/admin123)
3. 进入 Alerting > Notification channels
4. 添加通知渠道：

**邮件通知**:
- Name: Email Alerts
- Type: Email
- Email addresses: admin@redamancy.com.cn

**钉钉通知**:
- Name: DingTalk Alerts
- Type: DingDing
- Webhook URL: https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN

## 集成到现有系统

### 1. 修改 Nginx 配置

在 Nginx 配置中添加 Grafana 代理：

```nginx
# /www/server/nginx/conf/conf.d/redamancy/00-main.conf
location /grafana/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 2. 创建 Grafana 服务

创建文件 `axi-project-dashboard/backend/src/services/grafana.service.ts`:

```typescript
import axios from 'axios';

export class GrafanaService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.GRAFANA_URL || 'http://localhost:3000';
    this.apiKey = process.env.GRAFANA_API_KEY || '';
  }

  async getDashboard(uid: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/dashboards/uid/${uid}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Grafana API error:', error);
      throw error;
    }
  }

  async getAlerts(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/alerts`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Grafana API error:', error);
      throw error;
    }
  }

  async createDashboard(dashboard: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/dashboards/db`, {
        dashboard,
        overwrite: true
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Grafana API error:', error);
      throw error;
    }
  }
}
```

## 验证安装

### 1. 检查服务状态

```bash
# 检查服务状态
sudo systemctl status grafana

# 检查端口监听
sudo netstat -tlnp | grep 3000

# 检查日志
sudo tail -f /opt/monitoring/grafana/logs/grafana.log
```

### 2. 访问 Web 界面

```bash
# 本地访问
curl http://localhost:3000

# 通过 Nginx 访问
curl https://redamancy.com.cn/grafana
```

### 3. 验证数据源

1. 访问 Grafana Web 界面
2. 登录 (admin/admin123)
3. 进入 Configuration > Data Sources
4. 检查 Prometheus 数据源是否正常连接

## 故障排除

### 常见问题

1. **服务启动失败**
   ```bash
   # 检查配置文件
   /opt/monitoring/grafana/bin/grafana-server --config=/opt/monitoring/grafana/conf/defaults.ini --check-config
   
   # 检查日志
   sudo journalctl -u grafana -f
   ```

2. **无法访问 Web 界面**
   ```bash
   # 检查防火墙
   sudo ufw status
   
   # 检查 Nginx 配置
   sudo nginx -t
   ```

3. **数据源连接失败**
   ```bash
   # 检查 Prometheus 是否运行
   curl http://localhost:9090/api/v1/targets
   
   # 检查网络连接
   telnet localhost 9090
   ```

## 下一步

完成 Grafana 部署后，继续配置：
1. [AlertManager 告警管理](./03_ALERTMANAGER_SETUP.md)
2. [ELK Stack 日志监控](./06_ELK_STACK_SETUP.md)
3. [自定义指标收集](./07_CUSTOM_METRICS.md)
