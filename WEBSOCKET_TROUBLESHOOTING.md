# WebSocket 连接问题故障排除指南

## 问题描述

如果您看到以下错误信息，说明WebSocket连接失败：

```
WebSocket connection to 'wss://redamancy.com.cn/project-dashboard/ws/socket.io/?EIO=4&transport=websocket' failed
```

## 原因分析

WebSocket连接失败通常由以下原因造成：

1. **后端服务未启动** - 后端服务没有在8081端口运行
2. **网络连接问题** - 网络连接不稳定或防火墙阻止
3. **配置问题** - 前端和后端WebSocket配置不匹配
4. **代理问题** - nginx代理配置不正确

## 解决方案

### 1. 启动后端服务

#### 方法一：使用启动脚本（推荐）

```powershell
# 在 axi-project-dashboard 根目录下运行
.\start-backend.ps1
```

#### 方法二：手动启动

```powershell
# 进入后端目录
cd backend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev:fast
```

### 2. 检查服务状态

确认后端服务正在运行：

```powershell
# 检查8081端口是否被占用
netstat -ano | findstr :8081

# 检查Node.js进程
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### 3. 测试WebSocket连接

在浏览器控制台中测试：

```javascript
// 测试WebSocket连接
const socket = io('ws://localhost:8081/project-dashboard/ws', {
  path: '/project-dashboard/ws/socket.io',
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('WebSocket连接成功');
});

socket.on('connect_error', (error) => {
  console.error('WebSocket连接失败:', error);
});
```

### 4. 环境配置检查

确保前端环境配置正确：

- 开发环境：`http://localhost:8081`
- 生产环境：`https://redamancy.com.cn`

### 5. 网络和防火墙检查

- 确保8081端口没有被防火墙阻止
- 检查网络连接是否正常
- 如果使用代理，确保代理配置正确

## 常见错误及解决方案

### 错误1：ECONNREFUSED
```
Error: connect ECONNREFUSED 127.0.0.1:8081
```

**解决方案**：启动后端服务

### 错误2：Timeout
```
Error: timeout
```

**解决方案**：
- 检查网络连接
- 增加连接超时时间
- 检查防火墙设置

### 错误3：WebSocket Error
```
Error: websocket error
```

**解决方案**：
- 检查WebSocket路径配置
- 确认nginx代理配置正确
- 检查SSL证书（生产环境）

## 开发环境配置

### 前端配置 (frontend/src/config/env.ts)

```typescript
// 开发环境
return {
  baseUrl: 'http://localhost:8081',
  apiPrefix: '/project-dashboard/api',
  isProduction: false,
  isDevelopment: true,
  wsPath: '/project-dashboard/ws',
  wsPort: 8081
};
```

### 后端配置 (backend/src/config/config.ts)

```typescript
// 开发环境端口配置
port: 8081,
websocketPort: 8081,
```

## 生产环境配置

### nginx配置

确保nginx正确代理WebSocket连接：

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

## 调试技巧

### 1. 启用详细日志

在浏览器控制台中启用Socket.IO调试：

```javascript
localStorage.debug = '*';
```

### 2. 检查网络请求

在浏览器开发者工具的Network标签页中：
- 查看WebSocket连接状态
- 检查是否有404或500错误
- 查看请求头和响应头

### 3. 后端日志

查看后端服务日志：
- 检查是否有错误信息
- 确认WebSocket服务是否正常启动
- 查看连接和断开日志

## 联系支持

如果问题仍然存在，请：

1. 收集错误日志和截图
2. 提供环境信息（操作系统、Node.js版本等）
3. 描述重现步骤
4. 联系技术支持团队

## 相关文件

- `frontend/src/hooks/useSocket.ts` - WebSocket连接逻辑
- `frontend/src/config/env.ts` - 环境配置
- `backend/src/index.ts` - 后端服务启动
- `backend/src/config/config.ts` - 后端配置
- `config/nginx.conf` - nginx代理配置
