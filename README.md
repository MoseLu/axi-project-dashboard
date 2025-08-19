# AXI Project Dashboard

一个现代化的项目部署监控仪表板，基于 Prometheus + Grafana + AlertManager 全链路监控系统。

## 🚀 项目特性

- **全链路监控**: Prometheus + Grafana + AlertManager 企业级监控
- **实时部署跟踪**: WebSocket 实时部署状态更新
- **智能告警**: 多维度告警规则和智能阈值
- **可视化仪表板**: 丰富的监控图表和业务指标
- **高可用架构**: 容器化部署，支持水平扩展
- **现代化前端**: React + TypeScript + Ant Design

## 📁 项目结构

```
axi-project-dashboard/
├── 📁 backend/                 # 后端服务
│   ├── src/                   # 源代码
│   ├── config/                # 配置文件
│   ├── scripts/               # 脚本文件
│   └── package.json           # 依赖配置
├── 📁 frontend/               # 前端应用
│   ├── src/                   # 源代码
│   ├── public/                # 静态资源
│   └── package.json           # 依赖配置
├── 📁 config/                 # 监控系统配置
│   ├── prometheus.yml         # Prometheus 配置
│   ├── alert_rules.yml        # 告警规则
│   ├── alertmanager.yml       # AlertManager 配置
│   ├── blackbox.yml           # 黑盒监控配置
│   └── grafana/               # Grafana 配置
├── 📁 scripts/                # 运维脚本
│   ├── deploy-monitoring.sh   # 监控系统部署
│   ├── test-monitoring.js     # 监控系统测试
│   └── utils/                 # 工具脚本
├── 📁 docs/                   # 项目文档
│   ├── monitoring/            # 监控系统文档
│   ├── deployment/            # 部署文档
│   └── api/                   # API 文档
├── 📁 deployment/             # 部署相关
│   ├── docker/                # Docker 配置
│   ├── kubernetes/            # K8s 配置
│   └── scripts/               # 部署脚本
├── 📁 tools/                  # 开发工具
│   ├── debug/                 # 调试工具
│   ├── test/                  # 测试工具
│   └── analysis/              # 分析工具
├── docker-compose.yml         # 开发环境
├── docker-compose.monitoring.yml # 监控系统
└── README.md                  # 项目说明
```

## 🏗️ 技术架构

### 监控系统架构
```
┌─────────────────────────────────────────────────────────────┐
│                    监控系统                                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Prometheus  │  │ Grafana     │  │ AlertManager│         │
│  │ :9090       │  │ :3000       │  │ :9093       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Node Exporter│  │ MySQL Exporter│  │ Redis Exporter│     │
│  │ :9100       │  │ :9104       │  │ :9121       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Nginx Exporter│  │ Blackbox Exporter│  │ 应用服务    │   │
│  │ :9113       │  │ :9115       │  │ :8090       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈
- **后端**: Node.js + Express + TypeScript + Socket.IO
- **前端**: React + TypeScript + Ant Design + Socket.IO Client
- **数据库**: MySQL + Redis
- **监控**: Prometheus + Grafana + AlertManager
- **容器化**: Docker + Docker Compose
- **部署**: PM2 + Nginx

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 开发环境启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd axi-project-dashboard

# 2. 安装依赖
pnpm install

# 3. 启动开发环境
pnpm dev

# 4. 启动监控系统
./scripts/deploy-monitoring.sh start
```

### 生产环境部署

```bash
# 1. 构建项目
pnpm build

# 2. 启动生产环境
docker-compose -f docker-compose.monitoring.yml up -d

# 3. 检查服务状态
./scripts/deploy-monitoring.sh status
```

## 📊 监控功能

### 系统级监控
- CPU、内存、磁盘使用率
- 系统负载、进程数量
- 网络连接、端口监听

### 应用级监控
- HTTP 请求率、响应时间
- 错误率、异常数量
- 数据库连接、缓存命中率

### 业务级监控
- 部署成功率、部署时间
- 用户访问量、页面加载时间
- 业务指标、关键路径监控

### 告警系统
- 多维度告警规则
- 智能阈值设置
- 多渠道通知（邮件、Webhook、钉钉）

## 🔧 配置说明

### 监控配置
- **Prometheus**: `config/prometheus.yml`
- **告警规则**: `config/alert_rules.yml`
- **AlertManager**: `config/alertmanager.yml`
- **Grafana**: `config/grafana/`

### 应用配置
- **后端配置**: `backend/config/`
- **前端配置**: `frontend/src/config/`
- **环境变量**: `.env` 文件

## 📈 访问地址

### 应用服务
- **前端界面**: http://localhost:8091
- **后端API**: http://localhost:8090
- **API文档**: http://localhost:8090/api-docs

### 监控系统
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin123)
- **AlertManager**: http://localhost:9093

### 监控指标
- **应用指标**: http://localhost:8090/metrics
- **系统指标**: http://localhost:9100/metrics

## 🛠️ 运维管理

### 服务管理
```bash
# 启动监控系统
./scripts/deploy-monitoring.sh start

# 停止监控系统
./scripts/deploy-monitoring.sh stop

# 重启监控系统
./scripts/deploy-monitoring.sh restart

# 查看服务状态
./scripts/deploy-monitoring.sh status

# 查看服务日志
./scripts/deploy-monitoring.sh logs

# 清理服务
./scripts/deploy-monitoring.sh cleanup
```

### 测试验证
```bash
# 运行监控系统测试
node scripts/test-monitoring.js

# 运行应用测试
pnpm test

# 运行端到端测试
pnpm test:e2e
```

## 📚 文档

- [监控系统升级指南](MONITORING_UPGRADE.md)
- [部署指南](docs/deployment/)
- [API文档](docs/api/)
- [监控系统文档](docs/monitoring/)

## 🔍 故障排除

### 常见问题
1. **服务无法启动**: 检查端口占用和依赖服务
2. **监控数据缺失**: 检查 Prometheus 配置和目标状态
3. **告警不触发**: 检查告警规则和通知配置
4. **性能问题**: 检查系统资源和监控配置

### 调试工具
- **服务诊断**: `tools/debug/`
- **网络诊断**: `tools/analysis/`
- **性能分析**: `tools/analysis/`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目维护者: admin@example.com
- 技术支持: support@example.com
- 紧急联系: emergency@example.com

---

**注意**: 本项目正在积极开发中，请定期查看更新。  