# 🔄 实时监控机制

## 📋 概述

axi-deploy 向 axi-project-dashboard 提交部署信息的方式已经优化，现在支持详细的步骤级监控。

## 🔧 当前提交机制

### 1. 部署完成后的详细提交

**提交时机**: 部署流程完成后，通过 `deployment-summary.yml` 工作流统一提交

**提交内容**:
- 整体部署状态（成功/失败）
- 每个步骤的执行结果
- 部署耗时和详细信息
- 错误信息和日志

**提交格式**:
```json
{
  "project": "项目名称",
  "repository": "源仓库",
  "branch": "main",
  "commit_hash": "latest",
  "status": "success|failed",
  "triggered_by": "axi-deploy",
  "trigger_type": "manual",
  "deploy_type": "backend|static",
  "deploy_path": "部署路径",
  "test_url": "测试URL",
  "message": "部署消息",
  "timestamp": "2024-01-01T00:00:00Z",
  "step_details": {
    "validate_artifact": "success",
    "parse_secrets": "success",
    "server_init": "skipped",
    "deploy_project": "success",
    "configure_nginx": "success",
    "start_service": "skipped",
    "test_website_static": "skipped",
    "test_website_backend": "success"
  }
}
```

### 2. 步骤详情处理

**Webhook 接收**: `POST /api/webhook/deployment`

**处理逻辑**:
1. 创建或更新部署记录
2. 解析步骤详情
3. 为每个步骤创建 DeploymentStep 记录
4. 更新项目统计信息

**步骤类型映射**:
- `验证构建产物` → validation
- `解析部署密钥` → validation
- `服务器初始化` → configuration
- `部署项目` → deployment
- `配置Nginx` → configuration
- `启动服务` → service
- `测试网站` → testing

## 📊 实时监控界面

### 1. 项目状态概览

显示所有项目的运行状态：
- 项目名称和类型
- 运行状态（运行中/已停止）
- 端口信息（后端项目）

### 2. 最近部署记录

显示最近的部署记录，包括：
- 部署状态和时间
- 仓库和分支信息
- 部署耗时
- 详细的步骤执行情况

### 3. 步骤可视化

使用 Ant Design Steps 组件显示：
- 每个步骤的状态图标
- 步骤执行时间
- 错误信息（如果有）

## 🔄 数据更新频率

- **自动刷新**: 每30秒自动刷新数据
- **手动刷新**: 支持手动刷新按钮
- **实时通知**: WebSocket 支持（待实现）

## 🚀 未来优化方向

### 1. 实时步骤通知

**目标**: 每个步骤执行时立即通知

**实现方案**:
```yaml
# 在每个部署步骤中添加通知
- name: 通知步骤开始
  uses: ./.github/workflows/webhook-notification.yml
  with:
    step_status: "running"

- name: 执行部署步骤
  # 实际部署逻辑

- name: 通知步骤完成
  uses: ./.github/workflows/webhook-notification.yml
  with:
    step_status: "success"
```

### 2. WebSocket 实时推送

**目标**: 实现真正的实时监控

**实现方案**:
- 在 axi-project-dashboard 中实现 WebSocket 服务
- axi-deploy 通过 WebSocket 推送步骤更新
- 前端实时接收和显示更新

### 3. 部署进度条

**目标**: 显示整体部署进度

**实现方案**:
- 计算已完成步骤的百分比
- 显示预计剩余时间
- 支持暂停和恢复功能

## 📈 监控效果

### 当前效果
✅ 部署完成后可以看到详细的步骤执行情况
✅ 支持步骤状态的可视化展示
✅ 提供部署历史记录查询
✅ 支持项目运行状态监控

### 预期效果（优化后）
✅ 实时查看部署进度
✅ 步骤执行时立即看到状态变化
✅ 支持部署过程的暂停和恢复
✅ 提供更详细的错误诊断信息

## 🔧 配置说明

### 1. Webhook URL 配置

确保 axi-deploy 中的 webhook URL 正确配置：
```
https://redamancy.com.cn/project-dashboard/api/webhook/deployment
```

### 2. 数据库表结构

确保以下表已正确创建：
- `deployments`: 部署记录表
- `deployment_steps`: 部署步骤表
- `projects`: 项目信息表

### 3. 权限配置

确保 webhook 接收服务有足够的权限：
- 创建和更新部署记录
- 创建和更新步骤记录
- 更新项目统计信息

## 📝 总结

当前的实时监控机制已经能够提供详细的部署信息，包括每个步骤的执行情况。虽然还不是真正的"实时"（需要等待部署完成），但已经能够满足大部分监控需求。

通过后续的优化，可以实现真正的实时监控，让用户能够实时跟踪部署进度，提供更好的用户体验。
