# 监控系统使用指南

## 快速开始

### 1. 部署监控系统

```bash
# 进入项目目录
cd axi-project-dashboard

# 部署监控系统
pnpm run monitoring:deploy
```

### 2. 访问监控界面

部署完成后，可以通过以下地址访问各个监控界面：

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (用户名: admin, 密码: admin123)
- **AlertManager**: http://localhost:9093
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601

### 3. 管理监控系统

```bash
# 查看服务状态
pnpm run monitoring:status

# 查看服务日志
pnpm run monitoring:logs

# 测试监控系统
pnpm run monitoring:test

# 停止监控系统
pnpm run monitoring:stop
```

## 监控指标

### HTTP 请求指标
- `http_requests_total`: HTTP 请求总数
- `http_request_duration_seconds`: HTTP 请求响应时间

### WebSocket 指标
- `websocket_active_connections`: 活跃 WebSocket 连接数

### 部署指标
- `deployment_status`: 部署状态 (1=成功, 0=失败)
- `deployment_duration_seconds`: 部署持续时间

### 系统指标
- `system_metrics`: 系统资源使用情况

## 告警规则

系统预配置了以下告警规则：

### 系统告警
- CPU 使用率 > 80% (持续5分钟)
- 内存使用率 > 85% (持续5分钟)
- 磁盘使用率 > 90% (持续5分钟)

### 应用告警
- HTTP 5xx 错误率 > 5% (持续2分钟)
- HTTP 请求延迟 > 2秒 (95%分位数)
- WebSocket 连接数 > 100

### 部署告警
- 部署失败
- 部署成功率 < 80%
- 部署时间 > 5分钟

## 日志分析

### Kibana 查询示例

```kql
# 查看错误日志
log_type: application AND level: error

# 查看特定应用的日志
fields.log_type: application AND fields.app_name: axi-dashboard

# 查看最近的部署日志
message: "deployment" AND @timestamp: [now-1h TO now]
```

## 故障排除

### 常见问题

1. **Prometheus 无法访问**
   - 检查 Docker 服务是否运行
   - 检查端口 9090 是否被占用
   - 查看 Prometheus 容器日志

2. **Grafana 无法登录**
   - 默认用户名: admin, 密码: admin123
   - 如果忘记密码，可以重置管理员密码

3. **指标不显示**
   - 检查应用指标端点: http://localhost:8090/metrics
   - 检查 Prometheus 目标状态
   - 确认应用正在运行

### 获取帮助

如果遇到问题，可以：

1. 查看服务日志: `pnpm run monitoring:logs`
2. 检查服务状态: `pnpm run monitoring:status`
3. 运行测试: `pnpm run monitoring:test`
4. 查看详细文档: `docs/MONITORING_UPGRADE.md`

## 配置说明

### 修改告警规则
编辑 `config/alert_rules.yml` 文件

### 修改通知渠道
编辑 `config/alertmanager.yml` 文件

### 修改监控目标
编辑 `config/prometheus.yml` 文件

## 性能优化

### 资源要求
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间
- 稳定的网络连接

### 优化建议
- 根据实际需求调整数据保留时间
- 优化查询性能
- 配置适当的告警阈值
