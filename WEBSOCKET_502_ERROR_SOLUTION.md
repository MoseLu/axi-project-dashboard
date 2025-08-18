# WebSocket 502错误解决方案

## 问题描述

WebSocket连接遇到502 Bad Gateway错误，表明nginx无法连接到后端Socket.IO服务器。

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
- 没有启动
- 配置错误
- 端口不匹配
- Docker容器问题

## 解决方案

### 1. 立即解决方案

#### 检查后端服务状态
```bash
# 检查Docker容器状态
docker ps | grep axi-project-dashboard

# 检查后端容器日志
docker logs axi-project-dashboard-backend

# 检查容器是否在运行
docker exec -it axi-project-dashboard-backend ps aux
```

#### 重启后端服务
```bash
# 重启后端容器
docker restart axi-project-dashboard-backend

# 或者重新构建和启动
docker-compose down
docker-compose up -d
```

#### 检查端口配置
```bash
# 检查8090端口是否被占用
netstat -tlnp | grep 8090

# 检查容器端口映射
docker port axi-project-dashboard-backend
```

### 2. 配置检查

#### 检查nginx配置
确保nginx配置中的upstream指向正确的后端服务：

```nginx
upstream websocket {
    server backend:8090;  # 确保这个地址正确
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

### 3. 网络和Docker检查

#### 检查Docker网络
```bash
# 检查Docker网络
docker network ls
docker network inspect axi-project-dashboard_default

# 检查容器间连通性
docker exec -it axi-project-dashboard-backend ping nginx
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

#### 后端应用日志
```bash
# 查看后端日志
docker logs -f axi-project-dashboard-backend

# 查看应用日志
docker exec -it axi-project-dashboard-backend tail -f /app/logs/app.log
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
curl -f https://redamancy.com.cn/project-dashboard/api/health || echo "Backend health check failed"
```

### 2. 自动重启
```bash
# 在docker-compose.yml中添加重启策略
services:
  backend:
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8090/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. 日志轮转
```bash
# 配置日志轮转，防止日志文件过大
logrotate /etc/logrotate.d/nginx
logrotate /etc/logrotate.d/backend
```

## 联系支持

如果问题持续存在，请提供以下信息：

1. **Docker容器状态**：`docker ps -a`
2. **后端日志**：`docker logs axi-project-dashboard-backend`
3. **nginx错误日志**：`tail -100 /var/log/nginx/error.log`
4. **网络配置**：`docker network inspect axi-project-dashboard_default`
5. **系统资源**：`docker stats`

## 相关文件

- `backend/src/index.ts` - 后端Socket.IO配置
- `config/nginx.conf` - nginx代理配置
- `docker-compose.yml` - Docker服务配置
- `frontend/src/hooks/useSocket.ts` - 前端WebSocket连接逻辑
