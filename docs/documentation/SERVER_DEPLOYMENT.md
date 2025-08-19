# 服务器部署指南

## 概述

本指南详细说明如何在服务器上正确部署 axi-project-dashboard，解决依赖问题并确保服务正常运行，特别针对工作流环境进行了优化。

## 部署前准备

### 1. 环境要求
- Node.js v18+ (推荐 v22.13.1)
- pnpm v8+
- PM2 v6+
- Git

### 2. 目录结构
```
/srv/apps/axi-project-dashboard/
├── backend/
├── frontend/
├── node_modules/
├── package.json
├── pnpm-workspace.yaml
├── ecosystem.config.js
├── start.sh
├── scripts/
│   ├── auto-fix-startup.js
│   ├── workflow-start.sh
│   ├── server-fix.js
│   └── check-dependencies.js
└── deploy.sh
```

## 部署步骤

### 1. 克隆项目
```bash
cd /srv/apps
git clone https://github.com/MoseLu/axi-project-dashboard.git
cd axi-project-dashboard
```

### 2. 安装依赖
```bash
# 安装 pnpm (如果没有)
npm install -g pnpm

# 安装项目依赖
pnpm install

# 修复服务器端依赖问题
pnpm fix:server

# 检查依赖完整性
pnpm check:deps
```

### 3. 构建项目
```bash
# 构建前后端
pnpm build
```

### 4. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量
nano backend/.env
```

### 5. 启动服务

#### 方法1: 工作流友好启动（推荐）
```bash
# 使用工作流友好的启动脚本
bash scripts/workflow-start.sh
```

#### 方法2: 自动修复启动
```bash
# 使用自动修复启动脚本
pnpm auto:start
```

#### 方法3: 传统启动
```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 或者使用启动脚本
bash start.sh
```

## 工作流优化

### 问题背景
在 CI/CD 工作流中，如果服务因为依赖问题无法启动，会导致工作流卡住无法完成。

### 解决方案

#### 1. 工作流友好启动脚本
```bash
# 使用专门为工作流优化的启动脚本
bash scripts/workflow-start.sh
```

**特点：**
- 自动检测和修复依赖问题
- 设置合理的超时时间
- 即使服务启动失败也会正常退出
- 提供详细的状态反馈

#### 2. 自动修复启动脚本
```bash
# 使用 Node.js 版本的自动修复启动
pnpm auto:start
```

**特点：**
- 智能依赖检测和修复
- 服务健康检查
- 优雅的错误处理

### 工作流配置示例

#### GitHub Actions
```yaml
- name: Start Service
  run: |
    cd /srv/apps/axi-project-dashboard
    bash scripts/workflow-start.sh
  timeout-minutes: 5
```

#### GitLab CI
```yaml
start_service:
  script:
    - cd /srv/apps/axi-project-dashboard
    - bash scripts/workflow-start.sh
  timeout: 5m
```

## 依赖问题解决

### 常见问题
1. **Cannot find module 'statuses'**
2. **Cannot find module 'on-finished'**
3. **Cannot find module 'ee-first'**

### 解决方案

#### 方法1: 使用修复脚本（推荐）
```bash
# 修复服务器端依赖
pnpm fix:server

# 检查依赖状态
pnpm check:deps
```

#### 方法2: 工作流友好启动
```bash
# 自动处理所有依赖问题
bash scripts/workflow-start.sh
```

#### 方法3: 手动安装
```bash
cd backend
pnpm add statuses on-finished ee-first finalhandler
cd ..
pnpm install --force
pnpm build
```

#### 方法4: 批量安装
```bash
# 安装所有缺失依赖
pnpm batch:install
```

## 服务管理

### PM2 命令
```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs dashboard-backend

# 重启服务
pm2 restart dashboard-backend

# 停止服务
pm2 stop dashboard-backend

# 删除服务
pm2 delete dashboard-backend
```

### 端口检查
```bash
# 检查端口占用
netstat -tlnp | grep :8080

# 检查服务状态
curl http://localhost:8080/health
```

## 故障排除

### 1. 依赖问题
```bash
# 检查依赖完整性
pnpm check:deps

# 如果发现问题，运行修复
pnpm fix:server
```

### 2. 构建问题
```bash
# 清理并重新构建
rm -rf backend/dist frontend/build
pnpm build
```

### 3. 启动问题
```bash
# 检查 PM2 状态
pm2 status

# 查看错误日志
pm2 logs dashboard-backend --err

# 重启服务
pm2 restart dashboard-backend
```

### 4. 工作流卡住问题
```bash
# 使用工作流友好启动脚本
bash scripts/workflow-start.sh

# 或者使用自动修复启动
pnpm auto:start
```

### 5. 端口冲突
```bash
# 检查端口占用
lsof -i :8080

# 修改端口配置
nano backend/.env
# 修改 PORT=8080 为其他端口
```

## 性能优化

### 1. 启动优化
```bash
# 快速启动（跳过数据库初始化）
pnpm dev:fast

# 智能启动（自动处理依赖问题）
pnpm dev:quick

# 工作流友好启动
bash scripts/workflow-start.sh
```

### 2. 监控启动
```bash
# 性能监控启动
pnpm dev:monitor
```

## 安全建议

1. **防火墙配置**
   ```bash
   # 只开放必要端口
   ufw allow 8080
   ufw allow 3000
   ```

2. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用环境变量文件
   - 定期更新密钥

3. **日志管理**
   ```bash
   # 配置日志轮转
   pm2 install pm2-logrotate
   ```

## 更新部署

### 1. 代码更新
```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
pnpm install

# 修复依赖问题
pnpm fix:server

# 重新构建
pnpm build

# 重启服务
pm2 restart dashboard-backend
```

### 2. 回滚
```bash
# 回滚到指定版本
git checkout <commit-hash>

# 重新部署
pnpm install
pnpm fix:server
pnpm build
pm2 restart dashboard-backend
```

## 监控和维护

### 1. 健康检查
```bash
# 检查服务健康状态
curl http://localhost:8080/health

# 检查 API 文档
curl http://localhost:8080/api-docs
```

### 2. 性能监控
```bash
# 查看 PM2 监控
pm2 monit

# 查看系统资源
htop
```

### 3. 日志分析
```bash
# 查看实时日志
pm2 logs dashboard-backend --lines 100

# 查看错误日志
pm2 logs dashboard-backend --err --lines 50
```

## 工作流最佳实践

### 1. 启动脚本选择
- **开发环境**: `pnpm dev:fast` 或 `pnpm dev:quick`
- **测试环境**: `bash scripts/workflow-start.sh`
- **生产环境**: `pnpm auto:start` 或 `pm2 start ecosystem.config.js`

### 2. 超时设置
- 设置合理的超时时间（建议 5-10 分钟）
- 使用工作流友好的启动脚本
- 监控启动日志

### 3. 错误处理
- 使用 `set -e` 确保错误时退出
- 提供详细的错误信息
- 实现优雅的降级策略

## 联系支持

如果遇到问题，请：
1. 检查本文档的故障排除部分
2. 查看项目 GitHub Issues
3. 联系运维团队

---

**注意**: 本指南基于当前项目版本编写，如有更新请参考最新的部署文档。
