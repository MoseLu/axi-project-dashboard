# 监控系统集成指南

## 概述

本指南详细说明如何将新的监控系统集成到现有的 `axi-project-dashboard` 项目中，实现平滑过渡和功能增强。

## 集成策略

### 渐进式集成
- 保持现有 WebSocket + PM2 监控系统运行
- 并行部署新的 Prometheus + Grafana 系统
- 逐步迁移监控功能
- 最终切换到新系统

### 兼容性保证
- 保持现有 API 接口不变
- 确保前端界面兼容
- 维护现有数据格式
- 提供数据迁移工具

## 后端集成

### 1. 添加 Prometheus 指标收集

修改 `axi-project-dashboard/backend/src/index.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prometheusMiddleware } from './middleware/prometheus.middleware';
import { metricsRouter } from './routes/metrics.routes';

const app = express();
const server = createServer(app);

// 添加 Prometheus 中间件
app.use(prometheusMiddleware);

// 添加指标路由
app.use('/metrics', metricsRouter);

// ... 其他现有代码
```

### 2. 创建 Prometheus 中间件

创建文件 `axi-project-dashboard/backend/src/middleware/prometheus.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// 定义指标
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route']
});

const activeConnections = new Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections'
});

const deploymentStatus = new Gauge({
  name: 'deployment_status',
  help: 'Deployment status (1=success, 0=failed)',
  labelNames: ['project', 'status']
});

export const prometheusMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path
    }, duration);
  });
  
  next();
};

export const metrics = {
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
  deploymentStatus
};
```

### 3. 创建指标路由

创建文件 `axi-project-dashboard/backend/src/routes/metrics.routes.ts`:

```typescript
import { Router } from 'express';
import { register } from 'prom-client';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

export { router as metricsRouter };
```

### 4. 集成 WebSocket 监控

修改 `axi-project-dashboard/backend/src/services/socket.service.ts`:

```typescript
import { Server } from 'socket.io';
import { metrics } from '../middleware/prometheus.middleware';

export class SocketService {
  private io: Server;
  private connectionCount = 0;

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.connectionCount++;
      metrics.activeConnections.set(this.connectionCount);

      socket.on('disconnect', () => {
        this.connectionCount--;
        metrics.activeConnections.set(this.connectionCount);
      });

      // ... 其他现有事件处理
    });
  }

  // ... 其他现有方法
}
```

### 5. 集成部署监控

修改 `axi-project-dashboard/backend/src/services/deployment.service.ts`:

```typescript
import { metrics } from '../middleware/prometheus.middleware';

export class DeploymentService {
  // ... 现有代码

  async updateDeploymentStatus(project: string, status: 'success' | 'failed') {
    // 更新 Prometheus 指标
    metrics.deploymentStatus.set({
      project,
      status
    }, status === 'success' ? 1 : 0);

    // ... 现有数据库更新逻辑
  }

  async recordDeploymentDuration(project: string, duration: number) {
    // 记录部署持续时间
    // 这里可以添加自定义指标
  }
}
```

## 前端集成

### 1. 添加监控数据获取

修改 `axi-project-dashboard/frontend/src/hooks/useDashboardData.ts`:

```typescript
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const useDashboardData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 获取现有数据
      const dashboardData = await api.get('/api/dashboard');
      
      // 获取 Prometheus 指标数据
      const metricsData = await api.get('/api/metrics');
      
      // 合并数据
      setData({
        ...dashboardData,
        metrics: metricsData
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchData };
};
```

### 2. 创建指标展示组件

创建文件 `axi-project-dashboard/frontend/src/components/monitoring/MetricsDisplay.tsx`:

```typescript
import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { useDashboardData } from '../../hooks/useDashboardData';

export const MetricsDisplay: React.FC = () => {
  const { data, loading } = useDashboardData();

  if (loading || !data?.metrics) {
    return <div>加载中...</div>;
  }

  const { metrics } = data;

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card>
          <Statistic
            title="CPU 使用率"
            value={metrics.cpu?.value?.[1] || 0}
            suffix="%"
            precision={2}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="内存使用率"
            value={metrics.memory?.value?.[1] || 0}
            suffix="%"
            precision={2}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="磁盘使用率"
            value={metrics.disk?.value?.[1] || 0}
            suffix="%"
            precision={2}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="活跃连接"
            value={metrics.connections?.value?.[1] || 0}
          />
        </Card>
      </Col>
    </Row>
  );
};
```

### 3. 集成到主仪表板

修改 `axi-project-dashboard/frontend/src/pages/Dashboard.tsx`:

```typescript
import React from 'react';
import { Layout, Row, Col } from 'antd';
import { RealTimeDeploymentMonitor } from '../components/RealTimeDeploymentMonitor';
import { MetricsDisplay } from '../components/monitoring/MetricsDisplay';

const { Content } = Layout;

export const Dashboard: React.FC = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <MetricsDisplay />
          </Col>
          <Col span={24}>
            <RealTimeDeploymentMonitor />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};
```

## 数据迁移

### 1. 创建迁移脚本

创建文件 `axi-project-dashboard/backend/scripts/migrate-monitoring-data.ts`:

```typescript
import { Sequelize } from 'sequelize';
import { Deployment } from '../src/database/models/deployment';
import { metrics } from '../src/middleware/prometheus.middleware';

export async function migrateDeploymentData() {
  try {
    // 获取历史部署数据
    const deployments = await Deployment.findAll({
      where: {
        status: ['success', 'failed']
      },
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    // 转换为 Prometheus 指标
    for (const deployment of deployments) {
      metrics.deploymentStatus.set({
        project: deployment.project,
        status: deployment.status
      }, deployment.status === 'success' ? 1 : 0);
    }

    console.log(`迁移了 ${deployments.length} 条部署记录`);
  } catch (error) {
    console.error('数据迁移失败:', error);
  }
}

// 运行迁移
if (require.main === module) {
  migrateDeploymentData();
}
```

### 2. 创建数据同步服务

创建文件 `axi-project-dashboard/backend/src/services/data-sync.service.ts`:

```typescript
import { Deployment } from '../database/models/deployment';
import { metrics } from '../middleware/prometheus.middleware';

export class DataSyncService {
  private syncInterval: NodeJS.Timeout | null = null;

  startSync() {
    this.syncInterval = setInterval(() => {
      this.syncDeploymentData();
    }, 60000); // 每分钟同步一次
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncDeploymentData() {
    try {
      const recentDeployments = await Deployment.findAll({
        where: {
          updatedAt: {
            [Sequelize.Op.gte]: new Date(Date.now() - 60000) // 最近1分钟
          }
        }
      });

      for (const deployment of recentDeployments) {
        metrics.deploymentStatus.set({
          project: deployment.project,
          status: deployment.status
        }, deployment.status === 'success' ? 1 : 0);
      }
    } catch (error) {
      console.error('数据同步失败:', error);
    }
  }
}
```

## 配置管理

### 1. 环境变量配置

更新 `axi-project-dashboard/backend/src/config/config.ts`:

```typescript
export const config = {
  // ... 现有配置

  // 监控配置
  monitoring: {
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      path: process.env.PROMETHEUS_PATH || '/metrics'
    },
    grafana: {
      enabled: process.env.GRAFANA_ENABLED === 'true',
      url: process.env.GRAFANA_URL || 'http://localhost:3000',
      apiKey: process.env.GRAFANA_API_KEY
    },
    alerting: {
      enabled: process.env.ALERTING_ENABLED === 'true',
      email: process.env.ALERT_EMAIL,
      webhook: process.env.ALERT_WEBHOOK
    }
  }
};
```

### 2. 配置文件

创建文件 `axi-project-dashboard/backend/config/monitoring.yml`:

```yaml
prometheus:
  enabled: true
  port: 9090
  path: /metrics
  retention:
    time: 30d
    size: 10GB

grafana:
  enabled: true
  url: http://localhost:3000
  dashboards:
    - name: system-overview
      title: 系统概览
      uid: system-overview
    - name: application-monitoring
      title: 应用监控
      uid: app-monitoring
    - name: deployment-tracking
      title: 部署跟踪
      uid: deployment-tracking

alerting:
  enabled: true
  rules:
    - name: high_cpu_usage
      condition: cpu_usage > 80
      duration: 5m
      severity: warning
    - name: high_memory_usage
      condition: memory_usage > 85
      duration: 5m
      severity: warning
    - name: deployment_failed
      condition: deployment_status == 0
      duration: 1m
      severity: critical
```

## 测试验证

### 1. 单元测试

创建文件 `axi-project-dashboard/backend/src/__tests__/monitoring.test.ts`:

```typescript
import request from 'supertest';
import { app } from '../index';
import { metrics } from '../middleware/prometheus.middleware';

describe('Monitoring Integration', () => {
  test('should expose metrics endpoint', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);

    expect(response.text).toContain('http_requests_total');
    expect(response.text).toContain('http_request_duration_seconds');
  });

  test('should record HTTP request metrics', async () => {
    await request(app)
      .get('/api/health')
      .expect(200);

    const metricsText = await request(app)
      .get('/metrics')
      .expect(200);

    expect(metricsText.text).toContain('http_requests_total{method="GET",route="/api/health",status="200"}');
  });
});
```

### 2. 集成测试

创建文件 `axi-project-dashboard/backend/src/__tests__/integration/monitoring.integration.test.ts`:

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prometheusMiddleware } from '../../middleware/prometheus.middleware';
import { SocketService } from '../../services/socket.service';

describe('Monitoring Integration Tests', () => {
  let server: any;
  let io: Server;
  let socketService: SocketService;

  beforeAll(() => {
    server = createServer();
    io = new Server(server);
    socketService = new SocketService(server);
  });

  afterAll(() => {
    server.close();
  });

  test('should track WebSocket connections', async () => {
    // 模拟 WebSocket 连接
    const client = io.connect();
    
    // 等待连接建立
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 检查指标
    const metricsText = await request(app)
      .get('/metrics')
      .expect(200);

    expect(metricsText.text).toContain('websocket_active_connections 1');
    
    // 断开连接
    client.disconnect();
  });
});
```

## 部署配置

### 1. Docker 配置

更新 `axi-project-dashboard/backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 暴露监控端口
EXPOSE 8090 9090

CMD ["npm", "start"]
```

### 2. Docker Compose 配置

创建文件 `axi-project-dashboard/docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123

  app:
    build: .
    ports:
      - "8090:8090"
      - "8091:8091"
    environment:
      - NODE_ENV=production
      - PROMETHEUS_ENABLED=true
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

## 监控和维护

### 1. 健康检查

创建文件 `axi-project-dashboard/backend/src/routes/health.routes.ts`:

```typescript
import { Router } from 'express';
import { metrics } from '../middleware/prometheus.middleware';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await sequelize.authenticate();
    
    // 检查 Prometheus 指标收集
    const metricsData = await register.metrics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        prometheus: 'ok',
        websocket: 'ok'
      },
      metrics: {
        activeConnections: metrics.activeConnections.get(),
        totalRequests: metrics.httpRequestsTotal.get()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export { router as healthRouter };
```

### 2. 日志记录

更新 `axi-project-dashboard/backend/src/utils/logger.ts`:

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'axi-dashboard' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 添加 Prometheus 指标记录
logger.on('data', (info) => {
  if (info.level === 'error') {
    // 记录错误指标
    metrics.httpRequestsTotal.inc({
      method: 'LOG',
      route: 'error',
      status: '500'
    });
  }
});
```

## 故障排除

### 常见问题

1. **指标不显示**
   - 检查 Prometheus 配置
   - 验证指标端点可访问
   - 检查防火墙设置

2. **数据不同步**
   - 检查数据同步服务状态
   - 验证数据库连接
   - 检查时间戳格式

3. **告警不触发**
   - 检查告警规则配置
   - 验证通知渠道设置
   - 检查指标数据质量

### 调试命令

```bash
# 检查指标端点
curl http://localhost:8090/metrics

# 检查 Prometheus 目标
curl http://localhost:9090/api/v1/targets

# 检查 Grafana 数据源
curl http://localhost:3000/api/datasources

# 查看应用日志
tail -f logs/combined.log
```

## 下一步

完成基础集成后，继续：
1. [ELK Stack 日志监控](./06_ELK_STACK_SETUP.md)
2. [自定义指标收集](./07_CUSTOM_METRICS.md)
3. [告警规则优化](./08_ALERT_OPTIMIZATION.md)
