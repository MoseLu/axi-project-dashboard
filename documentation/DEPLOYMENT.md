# 📦 Dashboard 部署指南

## 🎯 部署方式总览

Dashboard 与 axi-deploy 核心业务完全分离，提供多种独立部署方式：

| 方式 | 触发条件 | 用途 | 命令/操作 |
|------|----------|------|-----------|
| **自动部署** | `dashboard/` 目录变化 | 日常开发 | `git push origin main` |
| **脚本部署** | 手动执行 | 独立部署 | `./scripts/deploy-dashboard.sh` |
| **手动工作流** | GitHub UI | 紧急部署 | Actions → Manual Deploy |
| **API 触发** | 程序调用 | 自动化集成 | `repository_dispatch` |

## 🚀 快速部署

### 1. **自动部署 (推荐)**

只修改 `dashboard/` 目录下的文件：

```bash
# 修改 Dashboard 代码
git add dashboard/
git commit -m "feat: update dashboard features"
git push origin main
```

**触发条件**：
```yaml
on:
  push:
    paths:
      - 'dashboard/**'  # 只有这个目录变化才触发
```

### 2. **脚本部署**

使用独立部署脚本：

```bash
# 基本部署
./scripts/deploy-dashboard.sh --token ghp_xxxxxxxxxxxx

# 强制重建
./scripts/deploy-dashboard.sh --token ghp_xxxxxxxxxxxx --force

# 跳过初始化
./scripts/deploy-dashboard.sh --token ghp_xxxxxxxxxxxx --skip-init

# 查看帮助
./scripts/deploy-dashboard.sh --help
```

### 3. **手动工作流**

1. 前往 [GitHub Actions](https://github.com/MoseLu/axi-deploy/actions)
2. 选择 "Manual Deploy Dashboard"
3. 点击 "Run workflow"
4. 选择选项：
   - `force_rebuild`: 强制重新构建
   - `skip_init`: 跳过服务器初始化

### 4. **API 触发**

```bash
# 使用 curl
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/MoseLu/axi-deploy/dispatches \
  -d '{
    "event_type": "deploy-dashboard",
    "client_payload": {
      "triggered_by": "api",
      "force_rebuild": false
    }
  }'

# 使用 GitHub CLI
gh api repos/MoseLu/axi-deploy/dispatches \
  --method POST \
  --field event_type=deploy-dashboard \
  --field client_payload='{"triggered_by":"cli"}'
```

## 🔧 部署配置

### **项目标识**
- 项目名称: `project-dashboard`
- 部署路径: `/srv/apps/axi-project-dashboard`
- 服务名称: `dashboard-backend`
- 端口配置: 8090 (API), 8091 (WebSocket)

### **配置文件**
- PM2 配置: `ecosystem.config.js`
- Nginx 配置: 集成在 `deploy.yml` 中
- 环境变量: 通过 axi-deploy 已有 Secrets

### **部署流程**
1. **检查触发条件** - 验证是否为 Dashboard 专用事件
2. **构建后端** - Node.js + TypeScript 编译
3. **构建前端** - React 生产构建
4. **准备部署包** - 打包所有必要文件
5. **上传构建产物** - 使用 GitHub Actions artifacts
6. **调用 axi-deploy** - 使用 `main-deployment.yml` 进行实际部署
7. **服务器部署** - PM2 进程管理 + Nginx 配置
8. **健康检查** - 验证服务运行状态

## 📋 部署验证

### **健康检查**
```bash
# API 健康检查
curl https://redamancy.com.cn/project-dashboard/api/health

# WebSocket 连接测试
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: test" \
     https://redamancy.com.cn/project-dashboard/ws/
```

### **服务状态检查**
```bash
# 检查 PM2 进程
ssh deploy@redamancy.com.cn "pm2 status dashboard-backend"

# 查看日志
ssh deploy@redamancy.com.cn "pm2 logs dashboard-backend --lines 50"

# 检查 Nginx 配置
ssh deploy@redamancy.com.cn "nginx -t"
```

### **功能验证**
1. 访问 Dashboard: https://redamancy.com.cn/project-dashboard
2. 检查 API 响应: https://redamancy.com.cn/project-dashboard/api/health
3. 验证 WebSocket 连接
4. 测试 GitHub Webhook 接收

## 🛠️ 故障排查

### **部署失败**
1. **检查工作流日志**:
   - 前往 GitHub Actions 查看详细错误
   - 重点关注 "检查触发条件" 步骤

2. **检查服务器状态**:
   ```bash
   ssh deploy@redamancy.com.cn "pm2 status"
   ssh deploy@redamancy.com.cn "df -h"  # 检查磁盘空间
   ssh deploy@redamancy.com.cn "free -m"  # 检查内存
   ```

3. **重新部署**:
   ```bash
   # 使用脚本强制重建
   ./scripts/deploy-dashboard.sh --token $TOKEN --force
   ```

### **服务异常**
1. **重启服务**:
   ```bash
   ssh deploy@redamancy.com.cn "pm2 restart dashboard-backend"
   ```

2. **重新加载配置**:
   ```bash
   ssh deploy@redamancy.com.cn "pm2 reload dashboard-backend"
   ```

3. **查看详细日志**:
   ```bash
   ssh deploy@redamancy.com.cn "pm2 logs dashboard-backend --raw"
   ```

### **网络问题**
1. **检查 Nginx 配置**:
   ```bash
   ssh deploy@redamancy.com.cn "nginx -t && systemctl reload nginx"
   ```

2. **检查端口占用**:
   ```bash
   ssh deploy@redamancy.com.cn "netstat -tlnp | grep :8090"
   ssh deploy@redamancy.com.cn "netstat -tlnp | grep :8091"
   ```

## 🔄 回滚操作

### **快速回滚**
```bash
# 停止当前服务
ssh deploy@redamancy.com.cn "pm2 stop dashboard-backend"

# 恢复备份（如果存在）
ssh deploy@redamancy.com.cn "
  if [ -d /srv/backups/project-dashboard-* ]; then
    LATEST_BACKUP=\$(ls -t /srv/backups/project-dashboard-* | head -1)
    sudo cp -r \$LATEST_BACKUP /srv/apps/axi-project-dashboard
    sudo chown -R deploy:deploy /srv/apps/axi-project-dashboard
  fi
"

# 重启服务
ssh deploy@redamancy.com.cn "cd /srv/apps/axi-project-dashboard && pm2 start ecosystem.config.js"
```

### **版本回滚**
1. 找到之前的成功构建
2. 重新触发部署使用该构建的 `run_id`
3. 或者通过 Git 回滚代码后重新部署

## 📊 监控指标

### **关键指标**
- 服务状态: PM2 进程运行状态
- 响应时间: API 健康检查延迟
- 错误率: 应用日志中的错误统计
- 资源使用: CPU、内存、磁盘使用率

### **日志位置**
- PM2 日志: `~/.pm2/logs/dashboard-backend-*.log`
- 应用日志: `/var/log/axi-deploy-dashboard/`
- Nginx 日志: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

通过这些部署方式和监控手段，确保 Dashboard 的稳定运行和快速故障恢复。
