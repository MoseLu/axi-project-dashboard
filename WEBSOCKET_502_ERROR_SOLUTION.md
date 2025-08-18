# WebSocket 502错误解决方案

## 问题描述

WebSocket连接遇到502 Bad Gateway错误，表明nginx无法连接到后端Socket.IO服务器。

## 项目架构说明

**重要**: 本项目使用**PM2进程管理器**而不是Docker容器来运行服务。nginx配置中的upstream指向的是PM2管理的Node.js进程。

## 诊断结果

```
检查: https://redamancy.com.cn/project-dashboard/api/health
❌ 失败 (404)

检查: https://redamancy.com.cn/project-dashboard/ws/socket.io/
❌ 失败 (502)

检查: https://redamancy.com.cn/project-dashboard/websocket-test
✅ 成功 (200)

检查: https://redamancy.com.cn/health
✅ 成功 (200)
```

## 问题分析

1. **502错误**：nginx无法连接到后端Socket.IO服务器
2. **404错误**：后端API路由可能没有正确配置
3. **基本服务正常**：HTTP服务工作正常

## 根本原因

后端Socket.IO服务器可能：
- PM2进程没有启动
- 配置错误
- 端口不匹配
- 进程崩溃

## 解决方案

### 1. 立即解决方案

#### 检查PM2服务状态
```bash
# 检查PM2进程状态
pm2 list

# 检查PM2日志
pm2 logs dashboard-backend

# 检查进程是否在运行
ps aux | grep dashboard-backend
```

#### 重启PM2服务
```bash
# 重启后端服务
pm2 restart dashboard-backend

# 或者重启所有服务
pm2 restart all

# 重新加载配置
pm2 reload ecosystem.config.js
```

#### 检查端口配置
```bash
# 检查8090端口是否被占用
netstat -tlnp | grep 8090

# 检查PM2进程端口
pm2 show dashboard-backend
```

### 2. 配置检查

#### 检查nginx配置
确保nginx配置中的upstream指向正确的后端服务：

```nginx
upstream websocket {
    server 127.0.0.1:8090;  # 确保这个地址正确
    keepalive 16;
}

location /project-dashboard/ws/ {
    proxy_pass http://websocket;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... 其他配置
}
```

#### 检查后端Socket.IO配置
确保后端正确配置了Socket.IO：

```typescript
// backend/src/index.ts
this.io = new SocketIOServer(this.server, {
  cors: {
    origin: config.cors.origin || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  path: '/project-dashboard/ws/socket.io'
});
```

### 3. 网络和系统检查

#### 检查系统服务
```bash
# 检查nginx服务状态
systemctl status nginx

# 检查PM2服务状态
pm2 status

# 检查系统资源
free -h
df -h
```

#### 检查防火墙
```bash
# 检查防火墙规则
iptables -L | grep 8090

# 检查SELinux（如果使用）
sestatus
```

### 4. 日志分析

#### nginx错误日志
```bash
# 查看nginx错误日志
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/websocket_error.log
```

#### PM2应用日志
```bash
# 查看PM2日志
pm2 logs dashboard-backend --lines 50

# 查看应用日志
tail -f /var/log/axi-deploy-dashboard/backend-error.log
```

### 5. 临时解决方案

如果后端服务暂时无法修复，可以：

1. **禁用WebSocket功能**：修改前端配置，禁用实时功能
2. **使用轮询替代**：实现基于HTTP的轮询机制
3. **显示维护信息**：告知用户实时功能暂时不可用

## 预防措施

### 1. 监控设置
```bash
# 设置健康检查脚本
#!/bin/bash
curl -f http://localhost:8090/health || echo "Backend health check failed"
```

### 2. 自动重启
```bash
# 在ecosystem.config.js中配置重启策略
{
  name: 'dashboard-backend',
  restart_delay: 5000,
  max_restarts: 3,
  min_uptime: '30s'
}
```

### 3. 日志轮转
```bash
# 配置日志轮转，防止日志文件过大
logrotate /etc/logrotate.d/nginx
logrotate /etc/logrotate.d/pm2
```

## 联系支持

如果问题持续存在，请提供以下信息：

1. **PM2进程状态**：`pm2 list`
2. **后端日志**：`pm2 logs dashboard-backend`
3. **nginx错误日志**：`tail -100 /var/log/nginx/error.log`
4. **系统资源**：`free -h && df -h`
5. **端口监听**：`netstat -tlnp | grep 8090`

## 相关文件

- `backend/src/index.ts` - 后端Socket.IO配置
- `config/nginx.conf` - nginx代理配置
- `ecosystem.config.js` - PM2服务配置
- `frontend/src/hooks/useSocket.ts` - 前端WebSocket连接逻辑
- `diagnose-pm2-services.js` - PM2服务诊断脚本

## 快速诊断命令

```bash
# 运行PM2服务诊断
node diagnose-pm2-services.js

# 检查服务状态
pm2 status

# 检查端口监听
netstat -tlnp | grep -E "(8090|3000)"

# 检查nginx配置
nginx -t

# 重启所有服务
pm2 restart all
```
