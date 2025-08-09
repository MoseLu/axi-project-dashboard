# 🏗️ axi-deploy Dashboard 系统架构文档

## 📋 概述

axi-deploy Dashboard 是一个轻量级的部署进度可视化仪表板，通过 https://redamancy.com.cn/project-dashboard 提供实时监控和状态跟踪。本项目遵循 axi-deploy 自身的部署流程，实现简洁高效的监控解决方案。

## 🎯 核心目标

- **简洁性**: 轻量级架构，易于部署和维护
- **实时性**: WebSocket 实时通信，秒级状态更新
- **集成性**: 与 axi-deploy 工作流深度集成
- **易用性**: 直观的用户界面和流畅的操作体验

## 🏛️ 系统架构

### 简化架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Webhooks                 │
│         (axi-deploy 工作流状态变化自动推送)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx (redamancy.com.cn)                      │
│    /project-dashboard/* → 静态文件 + API 代理               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   前端 (React + Ant Design)                 │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   仪表板首页     │   项目列表页面   │   部署详情页面   │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              后端服务 (Node.js + PM2)                       │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   API 路由      │   WebSocket     │   GitHub 集成    │    │
│  │   (8080端口)    │   (8081端口)    │   (Webhook)     │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   本地数据存储                               │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   MongoDB       │   Redis         │   文件日志       │    │
│  │   (主数据)      │   (缓存)        │   (PM2 日志)     │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 技术栈详解

### 前端技术栈

#### 核心框架
- **React 18**: 利用并发特性提升用户体验
- **TypeScript**: 类型安全和更好的开发体验
- **Ant Design 5**: 企业级 UI 组件库

#### 状态管理
- **Redux Toolkit**: 简化的 Redux 状态管理
- **Zustand**: 轻量级状态管理补充

#### 实时通信
- **Socket.io Client**: WebSocket 实时通信
- **React Query**: 服务端状态管理和缓存

#### 数据可视化
- **ECharts**: 高性能图表库
- **React Window**: 虚拟滚动优化大数据展示

#### 构建工具
- **Create React App**: 零配置构建工具
- **Webpack**: 模块打包器
- **Babel**: JavaScript 编译器

### 后端技术栈

#### 核心框架
- **Node.js 18+**: 高性能 JavaScript 运行时
- **Express.js**: 轻量级 Web 框架
- **TypeScript**: 类型安全的 JavaScript

#### 实时通信
- **Socket.io**: 实时双向通信
- **WebSocket**: 低延迟数据传输

#### 数据库
- **MongoDB**: 文档数据库，存储业务数据
- **Redis**: 缓存和消息队列
- **InfluxDB**: 时序数据库，存储监控指标
- **Elasticsearch**: 搜索引擎，日志分析

#### 认证授权
- **JWT**: 无状态身份验证
- **bcryptjs**: 密码加密
- **Passport.js**: 认证中间件

#### 监控告警
- **Prometheus**: 指标收集和监控
- **Grafana**: 可视化监控面板
- **Winston**: 日志管理

### 基础设施

#### 容器化
- **Docker**: 应用容器化
- **Docker Compose**: 多容器应用编排

#### 反向代理
- **Nginx**: 高性能 Web 服务器和反向代理

#### 监控运维
- **Prometheus + Grafana**: 系统监控
- **ELK Stack**: 日志分析
- **Node Exporter**: 系统指标收集

## 📊 数据流架构

### 实时数据流

```
GitHub Actions → Webhook → API Gateway → Message Queue → WebSocket → Frontend
      │                                      │
      └─────── Database ←─────────────────────┘
```

### 详细数据流程

1. **事件产生**: GitHub Actions 工作流状态变化
2. **Webhook 接收**: axi-deploy Dashboard 接收 GitHub Webhook 事件
3. **数据处理**: 解析事件数据，更新数据库
4. **实时推送**: 通过 WebSocket 推送更新到前端
5. **UI 更新**: 前端实时更新界面状态

### 数据层次结构

```
Application Data (MongoDB)
├── Users & Permissions
├── Projects & Repositories  
├── Deployments & Steps
├── Notifications & Alerts
└── Audit Logs

Cache Layer (Redis)
├── Session Data
├── API Response Cache
├── Real-time Event Queue
└── Rate Limiting Data

Time Series Data (InfluxDB)
├── Performance Metrics
├── System Health Data
├── Deployment Statistics
└── Usage Analytics

Search & Logs (Elasticsearch)
├── Application Logs
├── Deployment Logs
├── Error Logs
└── Audit Trail
```

## 🔄 实时通信架构

### WebSocket 连接管理

```typescript
interface SocketManager {
  // 连接管理
  connections: Map<string, SocketConnection>;
  userSockets: Map<string, Set<string>>;
  
  // 房间管理
  projectRooms: Map<string, Set<string>>;
  deploymentRooms: Map<string, Set<string>>;
  
  // 事件处理
  eventHandlers: Map<SocketEventType, EventHandler>;
  
  // 消息队列
  messageQueue: EventQueue;
}
```

### 事件类型定义

```typescript
enum SocketEventType {
  // 部署事件
  DEPLOYMENT_STARTED = 'deployment:started',
  DEPLOYMENT_UPDATED = 'deployment:updated',
  DEPLOYMENT_COMPLETED = 'deployment:completed',
  DEPLOYMENT_FAILED = 'deployment:failed',
  
  // 步骤事件
  STEP_STARTED = 'step:started',
  STEP_UPDATED = 'step:updated',
  STEP_COMPLETED = 'step:completed',
  STEP_FAILED = 'step:failed',
  STEP_RETRYING = 'step:retrying',
  
  // 系统事件
  SYSTEM_ALERT = 'system:alert',
  METRICS_UPDATE = 'metrics:update',
  USER_CONNECTED = 'user:connected',
  USER_DISCONNECTED = 'user:disconnected'
}
```

### 消息路由策略

- **项目级别**: 订阅特定项目的所有部署事件
- **部署级别**: 订阅特定部署的详细步骤和日志
- **用户级别**: 个人通知和权限相关事件
- **系统级别**: 全局系统状态和告警

## 🔐 安全架构

### 认证流程

```
1. 用户登录 → 验证凭据 → 生成 JWT Token
2. 客户端存储 Token → 每次请求携带 Token
3. 服务端验证 Token → 检查权限 → 返回数据
4. Token 过期 → 自动刷新或重新登录
```

### 权限模型

```typescript
interface Permission {
  resource: string;    // 资源类型 (project, deployment, user)
  action: string;      // 操作类型 (read, write, delete, admin)
  scope: string;       // 权限范围 (own, team, global)
}

enum UserRole {
  ADMIN = 'admin',           // 系统管理员
  MAINTAINER = 'maintainer', // 项目维护者
  DEVELOPER = 'developer',   // 开发者
  VIEWER = 'viewer'          // 只读用户
}
```

### 安全防护措施

1. **输入验证**: 所有用户输入严格验证和清理
2. **SQL注入防护**: 使用参数化查询和ORM
3. **XSS防护**: CSP策略和输出编码
4. **CSRF防护**: CSRF Token验证
5. **限流控制**: API请求频率限制
6. **HTTPS强制**: 所有通信加密传输

## 📈 性能优化策略

### 前端优化

#### 代码分割和懒加载
```typescript
// 路由级别代码分割
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const ProjectList = React.lazy(() => import('@/pages/ProjectList'));

// 组件级别懒加载
const Chart = React.lazy(() => import('@/components/Chart'));
```

#### 虚拟滚动
```typescript
// 大数据列表虚拟滚动
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={80}
    itemData={items}
  >
    {Row}
  </List>
);
```

#### 状态优化
```typescript
// 选择性状态订阅
const deployment = useAppSelector(
  state => selectDeploymentById(state, deploymentId),
  shallowEqual
);

// 计算属性缓存
const statistics = useMemo(() => 
  calculateStatistics(deployments), 
  [deployments]
);
```

### 后端优化

#### 数据库优化
```typescript
// 索引策略
db.deployments.createIndex({ projectId: 1, startedAt: -1 });
db.deployments.createIndex({ status: 1, updatedAt: -1 });

// 聚合查询优化
pipeline = [
  { $match: { projectId: ObjectId(projectId) } },
  { $sort: { startedAt: -1 } },
  { $limit: 50 },
  { $lookup: { ... } }
];
```

#### 缓存策略
```typescript
// 多层缓存
class CacheService {
  // L1: 内存缓存 (最热数据)
  memoryCache = new Map();
  
  // L2: Redis缓存 (热数据)
  redisCache = new Redis();
  
  // L3: 数据库 (冷数据)
  async get(key: string) {
    let data = this.memoryCache.get(key);
    if (!data) {
      data = await this.redisCache.get(key);
      if (data) this.memoryCache.set(key, data);
    }
    if (!data) {
      data = await this.database.find(key);
      if (data) {
        this.redisCache.setex(key, 300, data);
        this.memoryCache.set(key, data);
      }
    }
    return data;
  }
}
```

#### 连接池优化
```typescript
// MongoDB 连接池
mongoose.connect(mongoUri, {
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000
});

// Redis 连接池
const redis = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
});
```

### 网络优化

#### HTTP/2 和压缩
```nginx
# Nginx 配置
http2_max_field_size 16k;
http2_max_header_size 32k;

gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript;
```

#### CDN 和静态资源
```nginx
# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}
```

## 🔍 监控和观测

### 应用性能监控 (APM)

#### 关键指标
- **响应时间**: API 响应时间分布
- **吞吐量**: 每秒请求数 (RPS)
- **错误率**: 4xx/5xx 错误百分比
- **可用性**: 服务可用时间百分比

#### 监控配置
```yaml
# Prometheus 配置
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'axi-deploy-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 日志聚合

#### 日志层级
```typescript
enum LogLevel {
  ERROR = 'error',   // 错误信息
  WARN = 'warn',     // 警告信息  
  INFO = 'info',     // 一般信息
  DEBUG = 'debug',   // 调试信息
  TRACE = 'trace'    // 跟踪信息
}
```

#### 结构化日志
```typescript
logger.info('Deployment started', {
  deploymentId,
  projectId,
  userId,
  timestamp: new Date().toISOString(),
  metadata: {
    gitCommit: commit.sha,
    environment: envId,
    triggerType: 'webhook'
  }
});
```

### 告警规则

#### Prometheus 告警规则
```yaml
groups:
  - name: axi-deploy-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: DeploymentFailureRate
        expr: rate(deployments_failed_total[1h]) / rate(deployments_total[1h]) > 0.2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High deployment failure rate"
```

## 🚀 部署架构

### 容器化部署

#### Docker 镜像优化
```dockerfile
# 多阶段构建减少镜像大小
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
COPY --from=builder /app .
CMD ["node", "dist/index.js"]
```

#### Docker Compose 编排
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes 部署

#### 资源配置
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axi-deploy-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: axi-deploy-backend
  template:
    metadata:
      labels:
        app: axi-deploy-backend
    spec:
      containers:
      - name: backend
        image: axi-deploy-backend:latest
        ports:
        - containerPort: 8080
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 高可用配置

#### 负载均衡
```nginx
upstream backend_servers {
    least_conn;
    server backend-1:8080 max_fails=3 fail_timeout=30s;
    server backend-2:8080 max_fails=3 fail_timeout=30s;
    server backend-3:8080 max_fails=3 fail_timeout=30s;
}
```

#### 数据库集群
```yaml
# MongoDB 副本集
mongodb:
  replicaCount: 3
  configuration: |
    storage:
      wiredTiger:
        engineConfig:
          cacheSizeGB: 2
    replication:
      replSetName: rs0
    net:
      maxIncomingConnections: 1000
```

## 📋 总结

axi-deploy Dashboard 采用现代化的微服务架构，通过以下关键特性确保系统的高性能和可扩展性：

### 核心优势

1. **实时性能**: WebSocket + 事件驱动架构提供毫秒级更新
2. **高可扩展**: 微服务架构支持水平扩展
3. **高可用性**: 多副本部署 + 故障自动恢复
4. **安全可靠**: 多层安全防护 + 完整审计
5. **易于维护**: 容器化部署 + 完善监控

### 技术亮点

- **前端**: React 18 + TypeScript + 虚拟滚动优化
- **后端**: Node.js + Express + Socket.io 实时通信
- **数据库**: MongoDB + Redis + InfluxDB + Elasticsearch 多数据源
- **监控**: Prometheus + Grafana + ELK 全链路监控
- **部署**: Docker + Kubernetes + Nginx 云原生部署

### 性能指标

- **响应时间**: API 平均响应时间 < 100ms
- **并发能力**: 支持 1000+ 并发用户
- **数据处理**: 每秒处理 10000+ 事件
- **可用性**: 99.9% 系统可用性
- **扩展性**: 支持水平扩展到数百个节点

这个架构设计确保了 axi-deploy Dashboard 能够满足大规模企业级部署监控的需求，为运维团队提供强大而可靠的部署管理平台。
