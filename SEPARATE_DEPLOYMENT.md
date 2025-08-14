# 🏗️ 前后端分离部署架构

## 📋 架构概述

本项目采用前后端分离的部署架构：

- **前端**: 静态文件服务器 (端口 3000)
- **后端**: API 服务器 (端口 8090)

## 🚀 服务配置

### 后端服务 (dashboard-backend)
- **端口**: 8090
- **脚本**: `./backend/start-server.js`
- **功能**: API 接口、健康检查、WebSocket
- **日志**: `/var/log/axi-deploy-dashboard/backend-*.log`

### 前端服务 (dashboard-frontend)
- **端口**: 3000
- **脚本**: `./frontend-server.js`
- **功能**: 静态文件服务、SPA 路由处理
- **日志**: `/var/log/axi-deploy-dashboard/frontend-*.log`

## 🔧 启动流程

### 1. 构建阶段
```bash
# 构建前端
cd frontend
pnpm run build
cd ..

# 构建后端
cd backend
pnpm run build:simple  # 使用简化构建
cd ..
```

### 2. 启动阶段
```bash
# 使用 PM2 启动所有服务
pm2 start ecosystem.config.js

# 或分别启动
pm2 start backend/start-server.js --name dashboard-backend
pm2 start frontend-server.js --name dashboard-frontend
```

### 3. 验证阶段
```bash
# 检查后端健康
curl http://localhost:8090/health

# 检查前端服务
curl http://localhost:3000

# 查看服务状态
pm2 list
```

## 🌐 访问地址

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:8090
- **健康检查**: http://localhost:8090/health
- **指标监控**: http://localhost:8090/metrics

## 📊 监控和日志

### PM2 管理
```bash
# 查看所有服务
pm2 list

# 查看日志
pm2 logs dashboard-backend
pm2 logs dashboard-frontend

# 重启服务
pm2 restart dashboard-backend
pm2 restart dashboard-frontend

# 停止服务
pm2 stop dashboard-backend dashboard-frontend
```

### 日志文件
- 后端日志: `/var/log/axi-deploy-dashboard/backend-*.log`
- 前端日志: `/var/log/axi-deploy-dashboard/frontend-*.log`

## 🔍 故障排查

### 后端服务问题
1. 检查端口 8090 是否被占用
2. 查看后端日志: `pm2 logs dashboard-backend`
3. 验证健康检查: `curl http://localhost:8090/health`

### 前端服务问题
1. 检查端口 3000 是否被占用
2. 查看前端日志: `pm2 logs dashboard-frontend`
3. 验证静态文件: `ls -la frontend/dist/`

### 构建问题
1. 前端构建失败: 检查 `frontend/` 目录和依赖
2. 后端构建失败: 使用 `pnpm run build:simple` 简化构建

## 🎯 优势

1. **职责分离**: 前端专注静态文件服务，后端专注 API 处理
2. **独立扩展**: 可以独立扩展前端或后端服务
3. **故障隔离**: 一个服务故障不影响另一个服务
4. **资源优化**: 前端服务资源占用更少
5. **部署灵活**: 可以独立部署前端或后端

## 🔄 部署流程

1. **构建**: 分别构建前端和后端
2. **部署**: 将构建产物部署到服务器
3. **启动**: 使用 PM2 启动两个服务
4. **验证**: 检查服务状态和健康检查
5. **监控**: 持续监控服务运行状态
