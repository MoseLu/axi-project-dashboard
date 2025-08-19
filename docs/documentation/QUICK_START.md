# 🚀 axi-project-dashboard 快速开始指南

## 📋 概述

本指南将帮助您快速部署 axi-project-dashboard 到云服务器，通过 https://redamancy.com.cn/project-dashboard 访问。

**📖 相关文档**：
- [业务分离说明](./SEPARATION.md) - Dashboard 与 axi-deploy 核心业务分离机制
- [详细部署指南](./DEPLOYMENT.md) - 完整的部署方式和故障排查
- [系统架构](./ARCHITECTURE.md) - 技术架构和设计说明

## ⚡ 快速部署

### 1. 配置项目密钥

确保 axi-project-dashboard 仓库已配置以下 5 个必要的 Secrets：
```bash
SERVER_HOST=redamancy.com.cn
SERVER_USER=deploy  
SERVER_KEY=<SSH 私钥内容>
SERVER_PORT=22
DEPLOY_CENTER_PAT=<GitHub Personal Access Token>
```

这些密钥与 axi-deploy 使用相同的配置。

### 2. 触发部署

axi-project-dashboard 作为独立项目，有简单的部署方式：

#### **方式一：推送代码自动触发 (推荐)**
```bash
# 推送任何代码变更都会触发部署
git add .
git commit -m "feat: update dashboard features"
git push origin main
```

#### **方式二：手动工作流触发**
1. 前往 [GitHub Actions](https://github.com/MoseLu/axi-project-dashboard/actions) 页面
2. 选择 "Deploy axi-project-dashboard" 工作流
3. 点击 "Run workflow" 手动触发

### 3. 验证 Dashboard 部署

部署完成后验证 Dashboard 服务：

```bash
# 检查部署状态
curl https://redamancy.com.cn/project-dashboard/api/health

# 检查 PM2 进程状态（可选）
ssh deploy@redamancy.com.cn "pm2 status"

# 查看应用日志（可选）
ssh deploy@redamancy.com.cn "pm2 logs dashboard-backend"
```

## 🌐 访问系统

部署完成后，您可以通过以下地址访问系统：

- **主界面**: https://redamancy.com.cn/project-dashboard
- **API 接口**: https://redamancy.com.cn/project-dashboard/api
- **WebSocket**: wss://redamancy.com.cn/project-dashboard/ws
- **健康检查**: https://redamancy.com.cn/project-dashboard/health

### 默认登录信息

初次访问时会自动创建管理员账户：
- **用户名**: admin
- **密码**: 默认为 admin123（首次登录后请修改）

## ⚙️ GitHub 集成配置

### 1. 配置 Webhook

在 axi-deploy 仓库中配置 Webhook：

1. 进入仓库 Settings > Webhooks
2. 点击 "Add webhook"
3. 配置如下：
   - **Payload URL**: `https://redamancy.com.cn/project-dashboard/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: GitHub Secrets 中设置的 `GITHUB_WEBHOOK_SECRET`
   - **Events**: 选择 "Workflow runs" 和 "Workflow jobs"

### 2. 自动监控配置

Dashboard 会自动监控所有使用 axi-deploy 的项目部署，包括：

- **自身监控**: Dashboard 本身的部署也会被监控
- **业务项目**: 所有使用 axi-deploy 工作流的业务仓库

确保您的业务仓库使用了标准的 axi-deploy 工作流：

```yaml
# .github/workflows/deploy.yml
name: Deploy with axi-deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build project
        run: |
          npm install
          npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.event.repository.name }}
          path: dist/

  deploy:
    needs: build
    uses: MoseLu/axi-deploy/.github/workflows/main-deployment.yml@master
    with:
      project: ${{ github.event.repository.name }}
      source_repo: ${{ github.repository }}
      run_id: ${{ github.run_id }}
      deploy_type: static
      deploy_secrets: |
        {
          "SERVER_HOST": "${{ secrets.SERVER_HOST }}",
          "SERVER_USER": "${{ secrets.SERVER_USER }}",
          "SERVER_KEY": "${{ secrets.SERVER_KEY }}",
          "SERVER_PORT": "${{ secrets.SERVER_PORT }}",
          "DEPLOY_CENTER_PAT": "${{ secrets.DEPLOY_CENTER_PAT }}"
        }
```

## 🔧 基础配置

### 1. 添加项目

登录系统后，点击 "项目管理" > "添加项目"：

```json
{
  "name": "my-project",
  "displayName": "我的项目",
  "repository": {
    "owner": "your-org",
    "name": "my-project",
    "branch": "main"
  },
  "deploymentConfig": {
    "deployType": "static",
    "retryConfig": {
      "enabled": true,
      "maxAttempts": 3,
      "timeoutMinutes": 15
    }
  }
}
```

### 2. 配置用户权限

在 "用户管理" 中添加团队成员：

- **管理员**: 完整系统访问权限
- **维护者**: 项目管理和部署权限
- **开发者**: 查看部署状态和日志
- **查看者**: 只读访问权限

### 3. 设置通知渠道

在 "系统设置" > "通知配置" 中设置：

```yaml
# Slack 通知
slack:
  enabled: true
  webhook_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  channels:
    - "#deployments"
    - "#alerts"

# 邮件通知
email:
  enabled: true
  smtp_host: "smtp.gmail.com"
  smtp_port: 587
  from_address: "noreply@your-company.com"

# 企业微信通知
wechat:
  enabled: true
  corp_id: "your-corp-id"
  agent_id: "your-agent-id"
```

## 📊 监控配置

### 1. Grafana 仪表板

访问 http://localhost:3001，使用默认凭据登录：
- 用户名: admin
- 密码: admin123

导入预配置的仪表板：
1. 点击 "+" > "Import"
2. 上传 `config/grafana/dashboards/axi-deploy-dashboard.json`

### 2. Prometheus 目标

检查 Prometheus 目标状态：
1. 访问 http://localhost:9090
2. 前往 Status > Targets
3. 确认所有目标状态为 "UP"

### 3. 告警规则

告警规则已预配置，包括：
- 高错误率告警
- 部署失败率告警
- 系统资源告警
- 服务不可用告警

## 🧪 功能测试

### 1. 触发测试部署

在配置好的业务仓库中推送代码：

```bash
# 在业务仓库中
git add .
git commit -m "test: trigger deployment"
git push origin main
```

### 2. 监控部署进度

1. 在仪表板首页查看部署状态
2. 点击部署详情查看步骤进度
3. 观察实时日志输出

### 3. 测试通知功能

部署完成后检查配置的通知渠道是否收到消息。

## 🔍 故障排除

### 常见问题

#### 1. 服务启动失败

```bash
# 查看服务日志
docker-compose logs backend
docker-compose logs frontend

# 检查端口占用
netstat -tlnp | grep -E ":(3000|8080|27017|6379)"

# 重启服务
docker-compose restart backend frontend
```

#### 2. 数据库连接问题

```bash
# 检查 MongoDB 状态
docker-compose exec mongodb mongo --eval "db.runCommand({connectionStatus : 1})"

# 检查 Redis 状态
docker-compose exec redis redis-cli ping
```

#### 3. GitHub 集成问题

```bash
# 检查 GitHub Token 权限
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# 测试 Webhook 连接
curl -X POST http://localhost:8080/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### 4. 前端访问问题

```bash
# 检查 Nginx 配置
docker-compose exec nginx nginx -t

# 重新构建前端
docker-compose build frontend
docker-compose up -d frontend
```

### 性能优化

#### 1. 数据库优化

```javascript
// MongoDB 创建索引
db.deployments.createIndex({ projectId: 1, startedAt: -1 });
db.deployments.createIndex({ status: 1, updatedAt: -1 });
```

#### 2. 缓存配置

```bash
# 增加 Redis 内存限制
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 📚 进阶配置

### 1. HTTPS 配置

编辑 `config/nginx.conf`，取消注释 HTTPS 相关配置，并提供 SSL 证书。

### 2. 集群部署

使用 Kubernetes 进行集群部署：

```bash
# 应用 Kubernetes 配置
kubectl apply -f kubernetes/

# 检查部署状态
kubectl get pods -n axi-deploy
```

### 3. 自定义主题

修改 `frontend/src/styles/themes.ts` 自定义界面主题。

### 4. 插件开发

参考 `docs/PLUGIN_DEVELOPMENT.md` 开发自定义插件。

## 🎉 完成！

恭喜！您已经成功部署了 axi-deploy Dashboard。现在您可以：

1. ✅ 实时监控所有项目的部署状态
2. ✅ 查看详细的部署步骤和日志
3. ✅ 接收部署成功/失败通知
4. ✅ 分析部署性能和趋势
5. ✅ 管理团队用户和权限

## 📞 获取帮助

- 📖 详细文档: [docs/README.md](./README.md)
- 🏗️ 架构设计: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- 🔧 API 参考: [docs/API_REFERENCE.md](./API_REFERENCE.md)
- 🐛 问题报告: [GitHub Issues](https://github.com/your-org/axi-deploy/issues)
- 💬 讨论交流: [GitHub Discussions](https://github.com/your-org/axi-deploy/discussions)

---

**版本**: v1.0.0  
**最后更新**: 2024年12月  
**维护者**: 运维团队
