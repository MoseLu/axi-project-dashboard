# WebSocket 故障排除指南

## 问题描述

WebSocket连接失败，错误信息显示"websocket error"，实时监控功能不可用。

## 错误分析

### 常见错误类型

1. **websocket error** - WebSocket握手失败
2. **xhr poll error** - 轮询连接失败
3. **timeout** - 连接超时
4. **ECONNREFUSED** - 连接被拒绝
5. **CORS error** - 跨域访问被拒绝

### 可能的原因

1. **服务器端问题**
   - Socket.IO服务器未启动
   - nginx配置错误
   - 防火墙阻止WebSocket连接

2. **网络问题**
   - 网络连接不稳定
   - 代理服务器配置问题
   - DNS解析问题

3. **配置问题**
   - WebSocket路径配置错误
   - CORS配置不正确
   - SSL/TLS证书问题

## 诊断步骤

### 1. 检查后端服务状态

```bash
# 检查后端服务是否运行
curl -I https://redamancy.com.cn/project-dashboard/api/health

# 检查WebSocket端点
curl -I https://redamancy.com.cn/project-dashboard/ws/socket.io/
```

### 2. 检查nginx配置

```bash
# 检查nginx配置语法
nginx -t

# 检查nginx错误日志
tail -f /var/log/nginx/websocket_error.log
tail -f /var/log/nginx/error.log
```

### 3. 检查Socket.IO服务器

```bash
# 检查后端日志
docker logs axi-project-dashboard-backend

# 检查Socket.IO服务状态
curl https://redamancy.com.cn/project-dashboard/websocket-test
```

### 4. 浏览器调试

在浏览器控制台中运行以下代码：

```javascript
// 测试WebSocket连接
const socket = io('wss://redamancy.com.cn', {
  path: '/project-dashboard/ws/socket.io',
  transports: ['polling', 'websocket'],
  withCredentials: true
});

socket.on('connect', () => {
  console.log('连接成功:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('连接错误:', error);
});

socket.on('disconnect', (reason) => {
  console.log('连接断开:', reason);
});
```

## 解决方案

### 1. 立即解决方案

#### 重启后端服务
```bash
# 重启后端容器
docker restart axi-project-dashboard-backend

# 或者重新部署
docker-compose down
docker-compose up -d
```

#### 检查nginx配置
确保nginx配置中包含正确的WebSocket代理设置：

```nginx
location /project-dashboard/ws/ {
    proxy_pass http://websocket;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 特定配置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 300s;
    proxy_buffering off;
}
```

### 2. 长期解决方案

#### 更新Socket.IO配置

在后端 `src/index.ts` 中确保Socket.IO配置正确：

```typescript
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

#### 前端降级策略

如果WebSocket不可用，前端应该：

1. 显示友好的错误信息
2. 提供手动重连按钮
3. 使用轮询作为备选方案
4. 确保其他功能正常工作

### 3. 监控和告警

#### 添加健康检查

```typescript
// 在Socket.IO服务中添加健康检查
app.get('/websocket-health', (req, res) => {
  const isHealthy = io.engine.clientsCount >= 0;
  res.json({
    healthy: isHealthy,
    clients: io.engine.clientsCount,
    uptime: process.uptime()
  });
});
```

#### 日志监控

确保记录以下信息：
- WebSocket连接/断开事件
- 错误详情和堆栈跟踪
- 连接尝试次数
- 客户端信息

## 预防措施

### 1. 配置检查清单

- [ ] Socket.IO服务器正确配置
- [ ] nginx WebSocket代理配置正确
- [ ] CORS设置允许WebSocket连接
- [ ] 防火墙允许WebSocket端口
- [ ] SSL证书有效（如果使用HTTPS）

### 2. 监控指标

- WebSocket连接数
- 连接成功率
- 平均连接时间
- 错误率

### 3. 自动化测试

定期运行WebSocket连接测试：

```bash
# 运行测试脚本
node test-websocket.js
```

## 联系支持

如果问题持续存在，请提供以下信息：

1. 错误日志截图
2. 浏览器控制台输出
3. 后端服务日志
4. nginx错误日志
5. 网络连接测试结果

## 相关文档

- [Socket.IO 官方文档](https://socket.io/docs/)
- [nginx WebSocket 代理配置](http://nginx.org/en/docs/http/websocket.html)
- [WebSocket 故障排除](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#troubleshooting)
