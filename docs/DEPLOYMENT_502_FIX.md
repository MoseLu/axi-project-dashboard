# axi-project-dashboard 502错误修复指南

## 问题描述

在生产环境中，WebSocket连接出现502错误，具体表现为：
- WebSocket连接尝试失败
- 轮询连接返回502 Bad Gateway
- 最大连接尝试次数达到限制

## 根本原因分析

502错误通常表示nginx代理无法连接到后端服务，主要原因包括：

1. **PM2工作目录配置错误**：Windows环境下使用了Linux路径
2. **端口冲突**：后端服务端口被其他进程占用
3. **nginx upstream配置不匹配**：Docker容器名称与本地环境不匹配
4. **服务未正确启动**：后端或前端服务未正常运行

## 解决方案

### 1. 修复PM2配置

**问题**：`ecosystem.config.js`中的工作目录配置错误
```javascript
// 错误配置（Windows环境）
cwd: process.env.PM2_CWD || '/srv/apps/axi-project-dashboard',

// 正确配置（生产环境）
cwd: process.env.PM2_CWD || '/srv/apps/axi-project-dashboard',
```

### 2. 检查端口占用

```bash
# 检查端口8090占用情况
netstat -an | findstr :8090

# 检查端口3000占用情况  
netstat -an | findstr :3000

# 如果端口被占用，终止进程
taskkill /PID <进程ID> /F
```

### 3. 重启服务

```bash
# 停止所有服务
pm2 stop all

# 删除所有服务
pm2 delete all

# 重新启动服务
pm2 start ecosystem.config.js

# 检查服务状态
pm2 status
```

### 4. 验证服务健康状态

```bash
# 测试后端健康检查
curl http://localhost:8090/health

# 测试前端健康检查
curl http://localhost:3000/health
```

### 5. 测试WebSocket连接

使用提供的测试脚本：
```bash
node test-websocket-local.js
```

## 环境配置

### 本地开发环境
- 后端端口：8090
- 前端端口：3000
- WebSocket路径：`/ws/socket.io`
- nginx配置：使用`localhost:8090`

### 生产环境
- 后端端口：8090
- 前端端口：3000
- WebSocket路径：`/project-dashboard/ws/socket.io`
- nginx配置：使用`backend:8090`（Docker容器）

## 预防措施

1. **定期检查服务状态**：
   ```bash
   pm2 status
   pm2 logs
   ```

2. **监控端口占用**：
   ```bash
   netstat -an | findstr :8090
   netstat -an | findstr :3000
   ```

3. **健康检查**：
   - 定期访问`/health`端点
   - 监控WebSocket连接状态

4. **日志监控**：
   - PM2日志：`pm2 logs`
   - nginx错误日志：`tail -f /var/log/nginx/error.log`

## 故障排除工具

项目提供了以下诊断工具：

1. **fix-deployment-502.js**：自动诊断和修复502错误
2. **test-websocket-local.js**：测试WebSocket连接
3. **nginx-local.conf**：本地环境nginx配置

## 常见问题

### Q: 为什么会出现502错误？
A: 502错误表示nginx无法连接到后端服务，通常是因为：
- 后端服务未启动
- 端口被占用
- nginx配置错误
- 网络连接问题

### Q: 如何确认服务正常运行？
A: 检查以下指标：
- PM2状态显示服务为"online"
- 端口正确监听
- 健康检查端点返回200状态码
- WebSocket连接测试成功

### Q: 生产环境和开发环境配置有什么区别？
A: 主要区别：
- 工作目录路径
- nginx upstream配置
- WebSocket URL构建
- 环境变量设置

## 联系支持

如果问题仍然存在，请：
1. 收集完整的错误日志
2. 运行诊断工具
3. 检查系统资源使用情况
4. 联系技术支持团队

---

**最后更新**：2025-08-18
**版本**：1.0.0
