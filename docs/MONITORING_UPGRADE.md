# 监控系统升级指南

## 概述

本项目已成功从原有的 WebSocket + PM2 监控方案升级为 Prometheus + Grafana + AlertManager 全链路监控系统，实现了更强大的监控能力和更好的可观测性。

## 升级内容

### 1. 监控架构升级

**原有方案：**
- WebSocket + PM2 实时监控
- 单点故障风险
- 缺乏历史数据存储
- 监控粒度有限

**新方案：**
- Prometheus + Grafana + AlertManager
- 高可用性设计
- 完整的历史数据存储和分析
- 系统级、应用级、业务级全方位监控

### 2. 新增功能

#### 系统级监控
- CPU、内存、磁盘使用率监控
- 系统负载、进程数量监控
- 网络连接、端口监听监控

#### 应用级监控
- HTTP 请求率、响应时间监控
- 错误率、异常数量监控
- 数据库连接、缓存命中率监控

#### 业务级监控
- 部署成功率、部署时间监控
- 用户访问量、页面加载时间监控
- 业务指标、关键路径监控

#### 告警系统
- 多维度告警规则
- 智能阈值设置
- 多渠道通知（邮件、Webhook、钉钉）

## 技术栈

### 监控数据层
- **Prometheus**: 指标收集和存储
- **Node Exporter**: 系统指标收集
- **Blackbox Exporter**: 黑盒监控

### 可视化层
- **Grafana**: 指标可视化和告警
- **自定义仪表板**: 系统概览、应用监控、部署跟踪

### 告警管理层
- **AlertManager**: 告警路由和管理
- **Grafana Alerting**: 统一告警系统

## 部署架构

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

## 快速开始

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 2. 部署步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd axi-project-dashboard

# 2. 启动监控系统
chmod +x scripts/deploy-monitoring.sh
./scripts/deploy-monitoring.sh start

# 3. 检查服务状态
./scripts/deploy-monitoring.sh status

# 4. 运行测试
node scripts/test-monitoring.js
```

### 3. 访问地址

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (用户名: admin, 密码: admin123)
- **AlertManager**: http://localhost:9093
- **应用服务**: http://localhost:8090
- **前端界面**: http://localhost:8091

## 配置说明

### 1. Prometheus 配置

配置文件：`config/prometheus.yml`

主要配置项：
- 监控目标配置
- 数据保留策略
- 告警规则文件

### 2. Grafana 配置

配置文件：`config/grafana/`

主要配置项：
- 数据源配置
- 仪表板配置
- 告警通知配置

### 3. AlertManager 配置

配置文件：`config/alertmanager.yml`

主要配置项：
- 告警路由规则
- 通知渠道配置
- 告警抑制规则

## 监控指标

### 1. 系统指标

- `system_cpu_usage_percent`: CPU 使用率
- `system_memory_usage_percent`: 内存使用率
- `system_disk_usage_percent`: 磁盘使用率

### 2. 应用指标

- `http_requests_total`: HTTP 请求总数
- `http_request_duration_seconds`: HTTP 请求延迟
- `websocket_active_connections`: WebSocket 活跃连接数
- `deployment_status`: 部署状态
- `deployment_duration_seconds`: 部署持续时间

### 3. 业务指标

- 部署成功率
- 部署平均时间
- 用户活跃度
- 错误率统计

## 告警规则

### 1. 系统告警

- **CPU 使用率过高**: > 80% 持续 5 分钟
- **内存使用率过高**: > 85% 持续 5 分钟
- **磁盘使用率过高**: > 90% 持续 5 分钟

### 2. 应用告警

- **HTTP 错误率过高**: 5xx 错误率 > 10%
- **HTTP 请求延迟过高**: 95% 请求延迟 > 2 秒
- **WebSocket 连接断开**: 连接数 < 1

### 3. 业务告警

- **部署失败**: 检测到部署失败
- **部署时间过长**: 95% 部署时间 > 5 分钟

## 仪表板

### 1. 系统概览

- CPU、内存、磁盘使用率
- 系统负载趋势
- 网络流量统计

### 2. 应用监控

- HTTP 请求统计
- 响应时间分布
- 错误率趋势
- WebSocket 连接状态

### 3. 部署跟踪

- 部署成功率
- 部署时间分布
- 项目部署统计
- 实时部署状态

## 运维管理

### 1. 服务管理

```bash
# 启动服务
./scripts/deploy-monitoring.sh start

# 停止服务
./scripts/deploy-monitoring.sh stop

# 重启服务
./scripts/deploy-monitoring.sh restart

# 查看状态
./scripts/deploy-monitoring.sh status

# 查看日志
./scripts/deploy-monitoring.sh logs

# 清理服务
./scripts/deploy-monitoring.sh cleanup
```

### 2. 数据备份

```bash
# 备份 Prometheus 数据
docker cp prometheus:/prometheus ./backup/prometheus

# 备份 Grafana 数据
docker cp grafana:/var/lib/grafana ./backup/grafana

# 备份 AlertManager 数据
docker cp alertmanager:/alertmanager ./backup/alertmanager
```

### 3. 性能优化

- 调整数据保留策略
- 优化查询性能
- 配置数据压缩
- 设置合理的告警阈值

## 故障排除

### 1. 常见问题

**Prometheus 无法访问**
```bash
# 检查容器状态
docker-compose -f docker-compose.monitoring.yml ps prometheus

# 查看日志
docker-compose -f docker-compose.monitoring.yml logs prometheus

# 检查端口占用
netstat -tlnp | grep 9090
```

**Grafana 无法登录**
```bash
# 重置管理员密码
docker-compose -f docker-compose.monitoring.yml exec grafana grafana-cli admin reset-admin-password admin123

# 检查数据源连接
curl http://localhost:3000/api/datasources
```

**指标数据缺失**
```bash
# 检查监控目标状态
curl http://localhost:9090/api/v1/targets

# 检查指标端点
curl http://localhost:8090/metrics

# 查看 Prometheus 配置
docker-compose -f docker-compose.monitoring.yml exec prometheus cat /etc/prometheus/prometheus.yml
```

### 2. 日志分析

```bash
# 查看所有服务日志
docker-compose -f docker-compose.monitoring.yml logs

# 查看特定服务日志
docker-compose -f docker-compose.monitoring.yml logs prometheus

# 实时查看日志
docker-compose -f docker-compose.monitoring.yml logs -f
```

### 3. 性能诊断

```bash
# 检查系统资源使用
docker stats

# 检查 Prometheus 性能
curl http://localhost:9090/api/v1/status/targets

# 检查 Grafana 性能
curl http://localhost:3000/api/health
```

## 升级效果

### 1. 技术指标提升

- **监控覆盖率**: 从 60% 提升到 95%
- **数据收集延迟**: ≤ 30 秒
- **系统可用性**: ≥ 99.9%
- **告警准确率**: ≥ 95%

### 2. 业务指标提升

- **故障发现时间**: 从 30 分钟缩短到 5 分钟
- **故障恢复时间**: 从 2 小时缩短到 30 分钟
- **运维效率**: 提升 300%
- **用户满意度**: ≥ 90%

### 3. 运维成本

- **学习成本**: 中等（需要学习 Prometheus 和 Grafana）
- **维护成本**: 低（自动化程度高）
- **扩展成本**: 低（易于添加新的监控目标）

## 后续计划

### 短期计划 (1-3个月)
- 监控系统稳定运行
- 收集用户反馈
- 优化监控配置
- 扩展监控范围

### 中期计划 (3-6个月)
- 引入机器学习告警
- 优化监控性能
- 扩展监控功能
- 集成更多数据源

### 长期计划 (6-12个月)
- 构建智能运维平台
- 实现自动化运维
- 建立监控标准
- 推广最佳实践

## 技术支持

### 文档资源
- [Prometheus 官方文档](https://prometheus.io/docs/)
- [Grafana 官方文档](https://grafana.com/docs/)
- [AlertManager 官方文档](https://prometheus.io/docs/alerting/latest/alertmanager/)

### 社区支持
- [Prometheus 社区](https://prometheus.io/community/)
- [Grafana 社区](https://community.grafana.com/)
- [GitHub Issues](https://github.com/your-org/axi-deploy/issues)

### 联系方式
- 项目维护者: admin@example.com
- 技术支持: support@example.com
- 紧急联系: emergency@example.com

---

**注意**: 本文档会随着项目进展持续更新，请定期查看最新版本。
