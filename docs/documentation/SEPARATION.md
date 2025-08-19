# 🚧 Dashboard 与 axi-deploy 核心业务分离说明

## 📋 分离原则

Dashboard 虽然位于 `axi-deploy` 仓库的 `dashboard/` 目录下，但与 axi-deploy 部署中心的核心业务**完全分离**。

## 🎯 核心分离点

### 1. **工作流触发分离**
- Dashboard 更新 ≠ axi-deploy 核心业务更新
- 使用独立的 `repository_dispatch` 事件类型
- 严格的触发条件检查，避免误触发

### 2. **部署流程分离**
- Dashboard 有自己独立的构建和部署流程
- 使用专用的项目名称 `project-dashboard`
- 部署到独立的服务器路径 `/srv/apps/axi-project-dashboard`

### 3. **配置分离**
- Dashboard 有独立的 PM2 配置
- 独立的 Nginx 配置段
- 独立的日志和监控

## 🔄 独立触发机制

### **Path-based 触发 (推荐)**
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'dashboard/**'  # 只有 dashboard 目录变化才触发
```

### **Repository Dispatch 触发**
```bash
# 外部脚本独立触发
./scripts/deploy-dashboard.sh --token ghp_xxxxxxxxxxxx
```

### **手动触发**
```yaml
# GitHub Actions 页面手动触发
workflow_dispatch
```

## 🛡️ 冲突避免机制

### **严格的触发条件检查**
```yaml
check-trigger:
  steps:
    - name: 检查触发条件
      run: |
        # 只有明确的 Dashboard 相关事件才会执行部署
        if [ "${{ github.event.action }}" = "deploy-dashboard" ]; then
          echo "✅ Dashboard 专用部署事件"
        else
          echo "❌ 非 Dashboard 事件，跳过部署"
          exit 0
        fi
```

### **独立的事件类型**
```yaml
repository_dispatch:
  types:
    - deploy-dashboard  # 专用事件类型
```

## 📊 部署矩阵

| 组件 | 触发条件 | 部署目标 | 配置文件 | 服务名称 |
|------|----------|----------|----------|----------|
| **axi-deploy 核心** | 核心工作流变化 | `/srv/apps/` 各业务项目 | 各项目独立配置 | 各项目独立服务 |
| **Dashboard** | `dashboard/**` 变化 | `/srv/apps/axi-project-dashboard` | `ecosystem.config.js` | `dashboard-backend` |

## 🔧 独立管理命令

### **1. 独立部署 Dashboard**
```bash
# 使用专用脚本
./scripts/deploy-dashboard.sh --token ghp_xxxxxxxxxxxx

# 强制重建
./scripts/deploy-dashboard.sh --token ghp_xxxxxxxxxxxx --force

# 跳过初始化
./scripts/deploy-dashboard.sh --token ghp_xxxxxxxxxxxx --skip-init
```

### **2. 独立手动触发**
```bash
# 使用 GitHub CLI
gh workflow run "Manual Deploy Dashboard" \
  --repo MoseLu/axi-deploy \
  --field force_rebuild=true

# 使用 API
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/MoseLu/axi-deploy/dispatches \
  -d '{"event_type":"deploy-dashboard","client_payload":{"triggered_by":"manual"}}'
```

### **3. 独立状态检查**
```bash
# 检查 Dashboard 服务状态
ssh deploy@redamancy.com.cn "pm2 status dashboard-backend"

# 检查 Dashboard 健康状态
curl https://redamancy.com.cn/project-dashboard/api/health

# 查看 Dashboard 日志
ssh deploy@redamancy.com.cn "pm2 logs dashboard-backend"
```

## 📁 目录结构分离

```
axi-deploy/
├── .github/workflows/
│   ├── main-deployment.yml       # axi-deploy 核心工作流
│   ├── server-init.yml           # 服务器初始化（支持项目特定初始化）
│   └── ...                       # 其他 axi-deploy 核心工作流
├── dashboard/                     # 🔒 Dashboard 独立目录
│   ├── .github/workflows/
│   │   ├── deploy.yml            # Dashboard 专用部署工作流
│   │   └── manual-deploy.yml     # Dashboard 手动部署工作流
│   ├── backend/                  # Dashboard 后端代码
│   ├── frontend/                 # Dashboard 前端代码
│   ├── docs/                     # Dashboard 文档
│   └── ...
├── scripts/
│   ├── deploy-dashboard.sh       # Dashboard 独立部署脚本
│   └── ...                       # 其他 axi-deploy 脚本
└── docs/                         # axi-deploy 核心文档
```

## ⚠️ 重要注意事项

### **DO ✅**
- 只修改 `dashboard/` 目录下的文件来更新 Dashboard
- 使用专用的部署脚本 `scripts/deploy-dashboard.sh`
- 通过 `repository_dispatch` 事件独立触发部署
- 使用独立的项目名称 `project-dashboard`

### **DON'T ❌**
- 不要在 axi-deploy 核心工作流中混入 Dashboard 逻辑
- 不要让 Dashboard 更新影响其他项目的部署
- 不要在业务项目部署时意外触发 Dashboard 更新
- 不要共享配置文件和服务名称

## 🔍 故障排查

### **如果 Dashboard 部署意外触发**
1. 检查 `paths` 配置是否正确限制了触发范围
2. 检查 `repository_dispatch` 事件类型是否匹配
3. 查看工作流日志中的触发条件检查结果

### **如果 Dashboard 部署失败**
1. 使用独立脚本重新部署：`./scripts/deploy-dashboard.sh`
2. 检查 Dashboard 专用的服务器初始化是否成功
3. 查看 PM2 服务状态：`pm2 status dashboard-backend`

### **如果业务部署受影响**
1. 确认 Dashboard 工作流没有污染核心工作流
2. 检查服务器资源是否被 Dashboard 过度占用
3. 验证 Nginx 配置没有冲突

## 🎯 设计目标

通过这种分离设计，确保：

1. **Dashboard 更新** 不会影响 axi-deploy 核心业务
2. **业务项目部署** 不会触发 Dashboard 重建
3. **独立维护** Dashboard 功能和性能
4. **清晰的边界** 避免责任和功能混淆

这样既能享受 axi-deploy 基础设施的便利，又能保持完全的业务独立性。
