# 🔗 Webhook 集成指南

## 📋 概述

配置 `axi-deploy` 向 `axi-project-dashboard` 发送 Webhook 事件，实现实时部署状态监控。

## 🔧 配置步骤

### 1. Webhook URL

Dashboard 的 Webhook 接收地址：
```
https://redamancy.com.cn/project-dashboard/api/webhook/deployment
```

### 2. 修改 axi-deploy 工作流

在 `.github/workflows/main-deployment.yml` 中添加：

```yaml
- name: 发送部署状态到 Dashboard
  if: always()
  run: |
    curl -X POST \
      -H "Content-Type: application/json" \
      -d "{
        \"project\": \"${{ inputs.project }}\",
        \"repository\": \"${{ inputs.source_repo }}\",
        \"branch\": \"main\",
        \"commit_hash\": \"${{ github.sha }}\",
        \"status\": \"${{ job.status }}\",
        \"triggered_by\": \"${{ github.actor }}\",
        \"trigger_type\": \"${{ github.event_name }}\"
      }" \
      https://redamancy.com.cn/project-dashboard/api/webhook/deployment
```

## 📊 Webhook 事件类型

### 部署状态事件
```json
{
  "project": "axi-star-cloud",
  "repository": "MoseLu/axi-star-cloud",
  "branch": "main",
  "commit_hash": "abc123...",
  "status": "success",
  "triggered_by": "username",
  "trigger_type": "push"
}
```

### 部署步骤事件
```json
{
  "project": "axi-star-cloud",
  "step_name": "deploy-project",
  "step_status": "success",
  "step_order": 1,
  "logs": "部署日志内容..."
}
```

## 🛠️ 测试 Webhook

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "project": "test-project",
    "repository": "owner/test-repo",
    "branch": "main",
    "commit_hash": "test123",
    "status": "success",
    "triggered_by": "test-user",
    "trigger_type": "manual"
  }' \
  https://redamancy.com.cn/project-dashboard/api/webhook/deployment
```

## 📈 监控效果

配置完成后，您将能够：
1. 实时查看部署状态
2. 详细步骤追踪
3. 项目运行监控
4. 历史数据分析
